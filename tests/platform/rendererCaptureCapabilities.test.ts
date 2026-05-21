import { describe, expect, it } from 'vitest';
import { getSystemAudioBlockReason } from '../../src/utils/captureCapabilities';

describe('renderer capture capability helpers', () => {
  it('returns a Linux system audio caveat when system audio is unsupported', () => {
    expect(
      getSystemAudioBlockReason({
        systemAudio: {
          supported: false,
          caveat: 'Linux system audio requires PipeWire.',
        },
      })
    ).toBe('Linux system audio requires PipeWire.');
  });

  it('returns a default message when unsupported without a caveat', () => {
    expect(
      getSystemAudioBlockReason({
        systemAudio: {
          supported: false,
          caveat: '',
        },
      })
    ).toBe('System audio capture is unsupported on this platform');
  });

  it('does not block when system audio is supported', () => {
    expect(
      getSystemAudioBlockReason({
        systemAudio: {
          supported: true,
          caveat: 'ignored',
        },
      })
    ).toBe('');
  });
});
