import { describe, expect, it } from 'vitest';
import { buildVoiceMessageOptions, getTranscribedCommand } from '../../src/utils/voiceCommand';

describe('voiceCommand', () => {
  it('extracts only successful transcription text', () => {
    expect(getTranscribedCommand({ success: true, data: '  qual é o status?  ' })).toBe('qual é o status?');
    expect(getTranscribedCommand({ success: false, error: 'falhou' })).toBe('');
    expect(getTranscribedCommand({ success: true, data: null })).toBe('');
  });

  it('marks voice commands with voice source for response settings', () => {
    expect(buildVoiceMessageOptions()).toEqual({ source: 'voice' });
  });
});
