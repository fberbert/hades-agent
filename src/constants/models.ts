/**
 * AI Model definitions and configuration.
 */

export type AIModelType = 'chat' | 'transcribe' | 'realtime';

export const DEFAULT_MODEL = 'gpt-5-nano';

export const DEFAULT_OPENAI_MODELS = {
  minichatModel: 'gpt-5-nano',
  sttModel: 'gpt-4o-mini-transcribe',
  fullTranscriptionModel: 'gpt-4o-mini-transcribe',
  realtimeModel: 'gpt-realtime-mini',
  dreamingModel: 'gpt-5-nano'
} as const;

export const MODELS = [
  {
    id: 'gpt-5-nano',
    name: 'GPT-5 Nano',
    provider: 'openai',
    type: 'chat',
    tag: 'Default'
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    type: 'chat',
    tag: 'Quality'
  },
  {
    id: 'gpt-4o-mini-transcribe',
    name: 'GPT-4o Mini Transcribe',
    provider: 'openai',
    type: 'transcribe',
    tag: 'STT'
  },
  {
    id: 'gpt-realtime-mini',
    name: 'GPT Realtime Mini',
    provider: 'openai',
    type: 'realtime',
    tag: 'Realtime'
  }
] as const;

export type AIModel = (typeof MODELS)[number]['id'];
export type ModelDefinition = (typeof MODELS)[number];

export const getModelById = (modelId?: string): ModelDefinition | undefined => {
  return MODELS.find(model => model.id === modelId);
};

export const getModelsByType = (type: AIModelType): ModelDefinition[] => {
  return MODELS.filter(model => model.type === type);
};

export const getChatModels = (): ModelDefinition[] => {
  return getModelsByType('chat');
};

export const isModelType = (
  modelId: string | undefined,
  type: AIModelType
): boolean => {
  return getModelById(modelId)?.type === type;
};

export const getDefaultChatModel = (): string => {
  return DEFAULT_OPENAI_MODELS.minichatModel;
};

/**
 * Maps frontend-friendly model IDs to provider API model names.
 * Current OpenAI IDs are passed through unchanged.
 */
export const mapModelIdToApiName = (modelId: string): string => {
  return modelId;
};
