const DEFAULT_PROVIDER = 'openai';

const MODEL_CATALOG = [
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    family: 'text',
    tier: 'cheapest',
    defaultFor: ['minichat', 'dreaming'],
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    family: 'text',
    tier: 'balanced-cheap',
    defaultFor: [],
  },
  {
    id: 'gpt-4o-mini-transcribe',
    name: 'GPT-4o Mini Transcribe',
    provider: 'openai',
    family: 'transcription',
    tier: 'cheapest',
    defaultFor: ['stt'],
  },
  {
    id: 'gpt-4o-transcribe',
    name: 'GPT-4o Transcribe',
    provider: 'openai',
    family: 'transcription',
    tier: 'quality',
    defaultFor: [],
  },
  {
    id: 'gpt-realtime-mini',
    name: 'GPT Realtime Mini',
    provider: 'openai',
    family: 'realtime',
    tier: 'cheapest',
    defaultFor: ['realtime'],
  },
];

function listModelsForProvider(provider) {
  return MODEL_CATALOG.filter(model => model.provider === provider);
}

function getModelById(id) {
  return MODEL_CATALOG.find(model => model.id === id);
}

function getDefaultModels() {
  return {
    minichatModel: 'gpt-5-nano',
    sttModel: 'gpt-4o-mini-transcribe',
    dreamingModel: 'gpt-5-nano',
    realtimeModel: 'gpt-realtime-mini',
  };
}

module.exports = {
  DEFAULT_PROVIDER,
  MODEL_CATALOG,
  listModelsForProvider,
  getModelById,
  getDefaultModels,
};
