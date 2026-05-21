const path = require('node:path');

function getTrayIconPath(baseDir, platform = process.platform) {
  if (platform === 'win32') {
    return path.join(baseDir, '../public/icon/hades-tray-icon.ico');
  }

  return path.join(baseDir, '../public/icon/hades-tray-icon-128.png');
}

module.exports = {
  getTrayIconPath,
};
