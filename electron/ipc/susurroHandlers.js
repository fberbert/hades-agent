const { ipcMain } = require('electron');
const store = require('../store/jsonStore');
const aiService = require('../services/aiService');
const translationService = require('../services/translationService');
const windowManager = require('../windows/windowManager');
const logger = require('../services/logger');
const { getOpenAIKey } = require('../services/openaiClient');
const { OpenAIRealtimeTranscriptionSession } = require('../services/openaiRealtimeTranscriptionService');

/**
 * Registers IPC handlers for the Susurro (Transcription & Suggestions) feature.
 */
function registerSusurroHandlers() {
  let activeRealtimeSession = null;
  let activeRealtimeSessionOwner = null;

  const sendToSender = (event, channel, payload) => {
    try {
      if (!event?.sender || event.sender.isDestroyed?.()) {
        return false;
      }

      event.sender.send(channel, payload);
      return true;
    } catch (error) {
      logger.debug?.('IPC', `Unable to send ${channel} to Susurro renderer`, error);
      return false;
    }
  };

  const emitSusurroStatus = (event, status) => {
    sendToSender(event, 'susurro-live-status', status);
  };

  const emitSusurroDelta = (event, delta) => {
    sendToSender(event, 'susurro-live-delta', delta);
  };

  const stopActiveRealtimeSession = (session = activeRealtimeSession) => {
    if (activeRealtimeSession && activeRealtimeSession === session) {
      activeRealtimeSession.stop();
      activeRealtimeSession = null;
      activeRealtimeSessionOwner = null;
    }
  };

  const isSenderDestroyed = (sender) => {
    try {
      return !sender || Boolean(sender.isDestroyed?.());
    } catch (error) {
      logger.debug?.('IPC', 'Unable to inspect Susurro renderer sender state', error);
      return true;
    }
  };

  const isRealtimeSessionOwner = (event) => {
    const sender = event?.sender;

    if (!activeRealtimeSession || isSenderDestroyed(sender) || isSenderDestroyed(activeRealtimeSessionOwner)) {
      return false;
    }

    return sender === activeRealtimeSessionOwner;
  };

  // --- Suggestions Window ---
  ipcMain.on('toggle-suggestions-window', (event, show) => {
    const win = windowManager.get('suggestions') || windowManager.createSuggestionsWindow();
    if (show) {
      win.showInactive();
    } else {
      win.hide();
    }
  });

  ipcMain.handle('generate-suggestion', async (event, data) => {
    try {
      const suggestion = await aiService.generateSuggestion(data);
      if (suggestion) {
        const win = windowManager.get('suggestions');
        if (win) win.webContents.send('new-suggestion', suggestion);
        return { success: true, data: suggestion };
      }
      return { success: false, error: 'No suggestion generated' };
    } catch (error) {
      logger.error('IPC', 'generate-suggestion error', error);
      return { success: false, error: error.message };
    }
  });

  // --- Persistence ---
  ipcMain.handle('save-susurro-message', (event, msg) => {
    try {
      const history = store.getSusurroHistory();
      history.push(msg);
      store.saveSusurroHistory(history);
      return { success: true, data: true };
    } catch (error) {
      logger.error('IPC', 'save-susurro-message error', error);
      return { success: false, error: error.message };
    }
  });

  // --- Translation (SSOT from TranslationService) ---
  ipcMain.handle('susurro-translate', async (event, text, targetLang) => {
    try {
      const translation = await translationService.translate(text, targetLang);
      return { success: true, data: translation };
    } catch (error) {
      logger.error('IPC', 'susurro-translate error', error);
      return { success: false, error: error.message, data: text }; // Return original text in data as fallback
    }
  });

  ipcMain.handle('susurro-translate-incremental', async (event, text, previousText, targetLang) => {
    try {
      const translation = await translationService.translateIncremental(text, previousText, targetLang);
      return { success: true, data: translation };
    } catch (error) {
      logger.error('IPC', 'susurro-translate-incremental error', error);
      return { success: false, error: error.message };
    }
  });
  
  // --- Real-time Transcription ---
  ipcMain.on('toggle-mic', (event, enabled) => {
    logger.info('IPC', `Microphone toggled: ${enabled}`);
  });

  ipcMain.on('toggle-audio', (event, enabled) => {
    logger.info('IPC', `System audio toggled: ${enabled}`);
  });

  ipcMain.on('susurro-send-chunk', (event, chunk, seq) => {
    if (!activeRealtimeSession) {
      logger.debug?.('IPC', 'Ignoring susurro audio chunk because realtime session is not active.');
      return;
    }

    if (!isRealtimeSessionOwner(event)) {
      logger.debug?.('IPC', 'Ignoring susurro audio chunk because sender does not own the active realtime session.');
      return;
    }

    activeRealtimeSession.appendAudio(chunk, seq);
  });

  ipcMain.handle('susurro-start-live', async (event, personaPrompt) => {
    let session = null;

    try {
      stopActiveRealtimeSession();

      const settings = store.getSettings();
      const apiKey = getOpenAIKey(settings);
      session = new OpenAIRealtimeTranscriptionSession({
        apiKey,
        logger,
        onStatus: (status) => emitSusurroStatus(event, status),
        onDelta: (delta) => emitSusurroDelta(event, delta),
        onError: (message) => {
          logger.error('SusurroRealtime', message);
          emitSusurroStatus(event, 'error');
          stopActiveRealtimeSession(session);
        },
      });
      activeRealtimeSession = session;
      activeRealtimeSessionOwner = event?.sender || null;

      await session.start({
        personaPrompt: personaPrompt || '',
        model: settings?.general?.fullTranscriptionModel || settings?.general?.sttModel,
        language: 'pt',
      });

      return { success: true, data: true };
    } catch (error) {
      if (session) {
        stopActiveRealtimeSession(session);
      }
      logger.error('IPC', 'susurro-start-live error', error);
      emitSusurroStatus(event, 'error');
      return { success: false, data: false, error: error.message };
    }
  });

  ipcMain.handle('susurro-stop-live', async (event) => {
    if (!activeRealtimeSession) {
      return { success: true, data: true };
    }

    if (!isRealtimeSessionOwner(event)) {
      logger.debug?.('IPC', 'Ignoring susurro stop request because sender does not own the active realtime session.');
      return { success: true, data: true };
    }

    stopActiveRealtimeSession();
    return { success: true, data: true };
  });
}

module.exports = registerSusurroHandlers;
