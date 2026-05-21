import { describe, expect, it } from 'vitest';
import {
  detectDisplayServer,
  detectPlatform,
  getFeatureCapabilities,
} from '../../electron/platform/capabilities';

describe('platform capabilities', () => {
  it('detects Wayland from XDG_SESSION_TYPE', () => {
    expect(detectDisplayServer({ XDG_SESSION_TYPE: 'wayland' })).toBe('wayland');
  });

  it('detects X11 from DISPLAY', () => {
    expect(detectDisplayServer({ DISPLAY: ':0' })).toBe('x11');
  });

  it('marks Linux content protection as unsupported', () => {
    const info = detectPlatform({ platform: 'linux', arch: 'x64' }, { XDG_SESSION_TYPE: 'wayland' });
    const caps = getFeatureCapabilities(info);

    expect(caps.features.contentProtection.supported).toBe(false);
    expect(caps.features.globalShortcuts.needsWaylandPortal).toBe(true);
    expect(caps.features.systemAudioCapture.supported).toBe(false);
  });

  it('marks Windows content protection and system audio as supported', () => {
    const info = detectPlatform({ platform: 'win32', arch: 'x64' }, {});
    const caps = getFeatureCapabilities(info);

    expect(caps.features.contentProtection.supported).toBe(true);
    expect(caps.features.contentProtection.level).toBe('exclude-from-capture');
    expect(caps.features.systemAudioCapture.supported).toBe(true);
  });
});
