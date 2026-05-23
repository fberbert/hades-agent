import { describe, expect, it } from 'vitest';
import {
  getOpenAIKey,
  createOpenAIClient,
} from '../../electron/services/openaiClient';

describe('openaiClient', () => {
  it('prefers explicit settings key over env', () => {
    const key = getOpenAIKey(
      { general: { openaiApiKey: 'sk-settings' } },
      { OPENAI_API_KEY: 'sk-env' }
    );

    expect(key).toBe('sk-settings');
  });

  it('falls back to OPENAI_API_KEY env', () => {
    const key = getOpenAIKey(
      { general: { openaiApiKey: '' } },
      { OPENAI_API_KEY: 'sk-env' }
    );

    expect(key).toBe('sk-env');
  });

  it('throws a clear error when no key exists', () => {
    expect(() => createOpenAIClient({ settings: { general: {} }, env: {} }))
      .toThrow('OpenAI API Key não configurada.');
  });
});
