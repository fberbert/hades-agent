const { getDefaultModels, getModelById } = require('./modelCatalog');

function normalizeOpenAIModel(model, fallback, family) {
  const catalogModel = getModelById(model);
  if (!catalogModel || catalogModel.provider !== 'openai') {
    return fallback;
  }

  if (family && catalogModel.family !== family) {
    return fallback;
  }

  return model || fallback;
}

function normalizeProviderSettings(settings = {}) {
  const defaults = getDefaultModels();
  const savedGeneral = settings.general || {};
  const savedResponse = settings.response || {};
  const general = {
    openaiApiKey: savedGeneral.openaiApiKey,
    minichatModel: savedGeneral.minichatModel,
    sttModel: savedGeneral.sttModel,
    fullTranscriptionModel: savedGeneral.fullTranscriptionModel,
    realtimeModel: savedGeneral.realtimeModel,
    stealthMode: savedGeneral.stealthMode,
    dreamingEnabled: savedGeneral.dreamingEnabled,
    dreamingModel: savedGeneral.dreamingModel,
  };

  return {
    ...settings,
    response: {
      audioForVoiceInput: savedResponse.audioForVoiceInput ?? true,
      alwaysAudio: savedResponse.alwaysAudio ?? false,
    },
    general: {
      ...general,
      openaiApiKey: general.openaiApiKey || '',
      minichatModel: normalizeOpenAIModel(general.minichatModel, defaults.minichatModel, 'text'),
      sttModel: normalizeOpenAIModel(general.sttModel, defaults.sttModel, 'transcription'),
      dreamingModel: normalizeOpenAIModel(general.dreamingModel, defaults.dreamingModel, 'text'),
      realtimeModel: normalizeOpenAIModel(general.realtimeModel, defaults.realtimeModel, 'realtime'),
    },
  };
}

function getActiveProviderConfig(settings = {}) {
  const normalized = normalizeProviderSettings(settings);
  const general = normalized.general;

  return {
    provider: 'openai',
    apiKey: general.openaiApiKey,
    minichatModel: general.minichatModel,
  };
}

module.exports = {
  normalizeOpenAIModel,
  normalizeProviderSettings,
  getActiveProviderConfig,
};
