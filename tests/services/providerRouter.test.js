import { describe, expect, it } from 'vitest';
import {
  getActiveProviderConfig,
  normalizeProviderSettings,
} from '../../electron/services/providerRouter';

describe('providerRouter', () => {
  it('normalizes missing OpenAI settings to cheap defaults', () => {
    const normalized = normalizeProviderSettings({
      general: {
        apiKey: 'legacy-key',
        tavilyApiKey: 'legacy-key',
      },
    });

    expect(normalized.general.openaiApiKey).toBe('');
    expect(normalized.general.apiKey).toBeUndefined();
    expect(normalized.general.tavilyApiKey).toBeUndefined();
    expect(normalized.general.minichatModel).toBe('gpt-5-nano');
    expect(normalized.general.sttModel).toBe('gpt-4o-mini-transcribe');
    expect(normalized.general.dreamingModel).toBe('gpt-5-nano');
    expect(normalized.general.realtimeModel).toBe('gpt-realtime-mini');
    expect(normalized.response).toEqual({
      audioForVoiceInput: true,
      alwaysAudio: false,
    });
  });

  it('returns OpenAI provider config when OpenAI is selected', () => {
    const config = getActiveProviderConfig({
      general: {
        openaiApiKey: 'sk-test',
        minichatModel: 'gpt-5-nano',
      },
    });

    expect(config).toEqual({
      provider: 'openai',
      apiKey: 'sk-test',
      minichatModel: 'gpt-5-nano',
    });
  });

  it('forces legacy Gemini provider settings back to OpenAI', () => {
    const config = getActiveProviderConfig({
      general: {
        openaiApiKey: 'sk-test',
        minichatModel: 'gemini-2.5-flash',
      },
    });

    expect(config).toEqual({
      provider: 'openai',
      apiKey: 'sk-test',
      minichatModel: 'gpt-5-nano',
    });
  });

  it('replaces legacy Gemini models when OpenAI becomes the provider default', () => {
    const normalized = normalizeProviderSettings({
      general: {
        minichatModel: 'gemini-2.5-flash',
        sttModel: 'gemini-2.5-flash',
        dreamingModel: 'gemini-2.5-flash',
      },
    });

    expect(normalized.general.minichatModel).toBe('gpt-5-nano');
    expect(normalized.general.sttModel).toBe('gpt-4o-mini-transcribe');
    expect(normalized.general.dreamingModel).toBe('gpt-5-nano');
  });

  it('removes legacy Gemini and Tavily keys from normalized settings', () => {
    const normalized = normalizeProviderSettings({
      general: {
        apiKey: 'legacy-key',
        tavilyApiKey: 'legacy-key',
      },
    });

    expect(normalized.general.apiKey).toBeUndefined();
    expect(normalized.general.tavilyApiKey).toBeUndefined();
  });
});
