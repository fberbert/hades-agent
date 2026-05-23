import { describe, expect, it } from 'vitest';
import { shouldSpeakResponse } from '../../src/utils/responseMode';

describe('responseMode', () => {
  it('speaks only voice-originated messages with default settings', () => {
    expect(shouldSpeakResponse({ audioForVoiceInput: true, alwaysAudio: false }, { source: 'voice' })).toBe(true);
    expect(shouldSpeakResponse({ audioForVoiceInput: true, alwaysAudio: false }, { source: 'text' })).toBe(false);
  });

  it('speaks every response when always audio is enabled', () => {
    expect(shouldSpeakResponse({ audioForVoiceInput: false, alwaysAudio: true }, { source: 'text' })).toBe(true);
    expect(shouldSpeakResponse({ audioForVoiceInput: false, alwaysAudio: true }, { source: 'voice' })).toBe(true);
  });

  it('can disable audio responses completely while text remains handled by MiniChat', () => {
    expect(shouldSpeakResponse({ audioForVoiceInput: false, alwaysAudio: false }, { source: 'voice' })).toBe(false);
  });
});
