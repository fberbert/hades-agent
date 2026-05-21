const { detectPlatform } = require('./capabilities');

function shouldEnableGlobalShortcutsPortal(info = detectPlatform()) {
  return info.isLinux && info.displayServer === 'wayland';
}

function applyShortcutRuntimeFlags(app, info = detectPlatform()) {
  if (shouldEnableGlobalShortcutsPortal(info)) {
    app.commandLine.appendSwitch('enable-features', 'GlobalShortcutsPortal');
    return { enabledPortal: true };
  }

  return { enabledPortal: false };
}

function formatShortcutResult(name, key, registered, error) {
  return {
    name,
    key,
    registered: Boolean(registered),
    error: error ? String(error.message || error) : '',
  };
}

module.exports = {
  shouldEnableGlobalShortcutsPortal,
  applyShortcutRuntimeFlags,
  formatShortcutResult,
};
