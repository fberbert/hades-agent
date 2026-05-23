const { ipcMain } = require('electron');
const jsonStore = require('../store/jsonStore');
const logger = require('../services/logger');
const { getActiveProviderConfig } = require('../services/providerRouter');
const { generateMiniChatResponse } = require('../services/openaiResponsesService');

function registerAIHandlers() {
  ipcMain.handle('assistant-generate-response', async (_event, payload = {}) => {
    try {
      const settings = jsonStore.getSettings();
      const providerConfig = getActiveProviderConfig(settings);

      const result = await generateMiniChatResponse({
        message: payload.message,
        history: payload.history || [],
        settings,
        systemPrompt: payload.systemPrompt || '',
        enableWebSearch: Boolean(payload.enableWebSearch),
        model: payload.model || providerConfig.minichatModel,
      });

      return { success: true, data: result };
    } catch (error) {
      logger.error('IPC', 'assistant-generate-response error', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = registerAIHandlers;
