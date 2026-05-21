const { getFeatureCapabilities } = require('./capabilities');

function canUseContentProtection(platform = process.platform) {
  return platform === 'win32' || platform === 'darwin';
}

function applyContentProtection(win, enabled, options = {}) {
  const platform = options.platform || process.platform;
  const logger = options.logger || console;

  if (!win || typeof win.setContentProtection !== 'function') {
    return { success: false, supported: false, reason: 'window-missing-setContentProtection' };
  }

  if (!canUseContentProtection(platform)) {
    logger.info?.(`[WINDOW_FEATURES] Content protection unsupported on ${platform}; requested=${enabled}`);
    return { success: false, supported: false, reason: 'platform-unsupported' };
  }

  const result = win.setContentProtection(Boolean(enabled));
  return { success: Boolean(result), supported: true, reason: result ? 'applied' : 'electron-returned-false' };
}

function getWindowFeatureSummary() {
  return getFeatureCapabilities().features;
}

function getWindowVisualOptions(platform = process.platform) {
  if (platform === 'linux') {
    return {
      transparent: false,
      hasShadow: true,
      backgroundColor: '#120707',
    };
  }

  return {
    transparent: true,
    hasShadow: false,
    backgroundColor: '#00000000',
  };
}

module.exports = {
  canUseContentProtection,
  applyContentProtection,
  getWindowFeatureSummary,
  getWindowVisualOptions,
};
