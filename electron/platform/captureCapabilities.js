const { getFeatureCapabilities } = require('./capabilities');

function getCaptureCapabilities(capabilities = getFeatureCapabilities()) {
  return {
    screen: capabilities.features.desktopCapture,
    systemAudio: capabilities.features.systemAudioCapture,
    displayServer: capabilities.platform.displayServer,
    platform: capabilities.platform.platform,
  };
}

function buildCaptureError(code, message, details = {}) {
  return {
    success: false,
    error: message,
    code,
    details,
  };
}

module.exports = {
  getCaptureCapabilities,
  buildCaptureError,
};
