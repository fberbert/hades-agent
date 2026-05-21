const { Tray, Menu, app } = require('electron');
const windowManager = require('./windows/windowManager');
const appState = require('./appState');
const { getTrayIconPath } = require('./platform/icons');

/** @type {Tray|null} */
let trayInstance = null;

/**
 * Creates the system tray icon and its associated context menu.
 * @returns {Tray}
 */
function createTray() {
  const iconPath = getTrayIconPath(__dirname);
  trayInstance = new Tray(iconPath);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Hades (Alt+D)',
      click: () => {
        const win = windowManager.get('command') || windowManager.createCommandWindow();
        win.show();
        win.focus();
      }
    },
    {
      label: 'Abrir Chat',
      click: () => windowManager.createChatWindow()
    },
    {
      label: 'Configurações',
      click: () => {
        const win = windowManager.get('settings') || windowManager.createSettingsWindow();
        win.show();
        win.focus();
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        appState.isQuitting = true;
        app.quit();
      }
    }
  ]);

  trayInstance.setToolTip('Hades Agent');
  trayInstance.setContextMenu(contextMenu);

  return trayInstance;
}

module.exports = createTray;
