const os = require('node:os');

function detectDisplayServer(env = process.env) {
  const sessionType = (env.XDG_SESSION_TYPE || '').toLowerCase();
  if (sessionType === 'wayland') return 'wayland';
  if (sessionType === 'x11') return 'x11';
  if (env.WAYLAND_DISPLAY) return 'wayland';
  if (env.DISPLAY) return 'x11';
  return 'unknown';
}

function detectPlatform(runtime = process, env = process.env) {
  const platform = runtime.platform;
  const displayServer = platform === 'linux' ? detectDisplayServer(env) : 'not-linux';

  return {
    platform,
    isLinux: platform === 'linux',
    isWindows: platform === 'win32',
    isMac: platform === 'darwin',
    displayServer,
    desktopSession: env.XDG_CURRENT_DESKTOP || env.DESKTOP_SESSION || '',
    arch: runtime.arch,
    release: os.release(),
  };
}

function getFeatureCapabilities(info = detectPlatform()) {
  return {
    platform: info,
    features: {
      contentProtection: {
        supported: info.isWindows || info.isMac,
        level: info.isWindows ? 'exclude-from-capture' : info.isMac ? 'prevent-capture' : 'unsupported',
      },
      micaBackground: {
        supported: info.isWindows,
      },
      globalShortcuts: {
        supported: true,
        needsWaylandPortal: info.isLinux && info.displayServer === 'wayland',
      },
      trayPngIcon: {
        supported: info.isLinux || info.isMac,
      },
      desktopCapture: {
        supported: true,
        caveat: info.isLinux ? 'Linux capture depends on PipeWire/desktop portal and may expose fewer sources.' : '',
      },
      systemAudioCapture: {
        supported: !info.isLinux,
        caveat: info.isLinux ? 'Linux system audio requires a dedicated PipeWire/PulseAudio path or portal-compatible desktop capture.' : '',
      },
    },
  };
}

module.exports = {
  detectDisplayServer,
  detectPlatform,
  getFeatureCapabilities,
};
