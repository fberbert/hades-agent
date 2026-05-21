import { describe, expect, it } from 'vitest';
import {
  buildCaptureError,
  getCaptureCapabilities,
} from '../../electron/platform/captureCapabilities';

describe('capture capabilities', () => {
  it('exposes linux system audio as unsupported through injected platform data', () => {
    const caps = getCaptureCapabilities({
      platform: {
        platform: 'linux',
        isLinux: true,
        isWindows: false,
        isMac: false,
        displayServer: 'wayland',
      },
      features: {
        desktopCapture: { supported: true, caveat: 'screen caveat' },
        systemAudioCapture: { supported: false, caveat: 'audio caveat' },
      },
    });

    expect(caps.platform).toBe('linux');
    expect(caps.displayServer).toBe('wayland');
    expect(caps.screen.supported).toBe(true);
    expect(caps.systemAudio.supported).toBe(false);
    expect(caps.systemAudio.caveat).toBe('audio caveat');
  });

  it('builds structured capture errors', () => {
    expect(buildCaptureError('LINUX_SYSTEM_AUDIO_UNSUPPORTED', 'unsupported', { platform: 'linux' })).toEqual({
      success: false,
      error: 'unsupported',
      code: 'LINUX_SYSTEM_AUDIO_UNSUPPORTED',
      details: { platform: 'linux' },
    });
  });
});
