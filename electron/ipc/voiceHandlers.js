const { ipcMain } = require('electron');
const aiService = require('../services/aiService');
const { synthesizeSpeechDataUrl } = require('../services/openaiSpeechService');
const logger = require('../services/logger');

/**
 * Registers IPC handlers for Voice Command features.
 */
function registerVoiceHandlers() {
  ipcMain.handle('transcribe-audio', async (event, base64Audio) => {
    try {
      logger.info('IPC', 'Received transcribe-audio request');
      
      if (!base64Audio) {
        return { success: false, error: 'No audio data received' };
      }

      const transcription = await aiService.transcribeAudio(base64Audio, 'audio/wav');
      
      if (transcription) {
        return { success: true, data: transcription };
      } else {
        return { success: false, error: 'Transcription failed or returned empty' };
      }
    } catch (error) {
      logger.error('IPC', 'transcribe-audio error', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('synthesize-speech', async (event, text, options = {}) => {
    try {
      logger.info('IPC', `Received synthesize-speech request chars=${String(text || '').length}`);

      const speech = await synthesizeSpeechDataUrl(text, options);
      logger.info(
        'IPC',
        `synthesize-speech success model=${speech.model} voice=${speech.voice} format=${speech.format} dataUrlChars=${speech.audioDataUrl.length}`
      );
      return { success: true, data: speech };
    } catch (error) {
      logger.error('IPC', 'synthesize-speech error', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = registerVoiceHandlers;
