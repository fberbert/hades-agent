const logger = require('../services/logger');

function sanitizeDetail(detail) {
  if (detail == null) return '';
  if (typeof detail === 'string') return detail.slice(0, 500);

  try {
    return JSON.stringify(detail).slice(0, 1000);
  } catch {
    return String(detail).slice(0, 500);
  }
}

function registerRendererDiagnosticsHandlers(ipcMain) {
  ipcMain.on('renderer-diagnostic', (event, source, message, detail) => {
    logger.info(source || 'Renderer', `${message || 'event'} ${sanitizeDetail(detail)}`.trim());
  });
}

module.exports = registerRendererDiagnosticsHandlers;
