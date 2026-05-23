import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROVIDER,
  MODEL_CATALOG,
  getDefaultModels,
  getModelById,
  listModelsForProvider,
} from '../../electron/services/modelCatalog';

describe('modelCatalog', () => {
  it('uses OpenAI as the default provider', () => {
    expect(DEFAULT_PROVIDER).toBe('openai');
  });

  it('selects cheap OpenAI defaults', () => {
    expect(getDefaultModels()).toEqual({
      minichatModel: 'gpt-5-nano',
      sttModel: 'gpt-4o-mini-transcribe',
      dreamingModel: 'gpt-5-nano',
      realtimeModel: 'gpt-realtime-mini',
    });
  });

  it('lists only models from the requested provider', () => {
    const openaiModels = listModelsForProvider('openai');
    expect(openaiModels.length).toBeGreaterThan(0);
    expect(openaiModels.every(model => model.provider === 'openai')).toBe(true);
  });

  it('does not expose legacy non-OpenAI models', () => {
    expect(MODEL_CATALOG.every(model => model.provider === 'openai')).toBe(true);
    expect(getModelById('gemini-2.5-flash')).toBeUndefined();
  });

  it('finds a model by id', () => {
    expect(getModelById('gpt-4o-mini-transcribe')).toMatchObject({
      id: 'gpt-4o-mini-transcribe',
      provider: 'openai',
      family: 'transcription',
    });
  });

  it('exports the catalog list for callers that need model metadata', () => {
    expect(MODEL_CATALOG.some(model => model.id === 'gpt-5-nano')).toBe(true);
  });
});
