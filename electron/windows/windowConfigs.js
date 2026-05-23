const { screen, app } = require('electron');
const path = require('node:path');
const { getWindowVisualOptions } = require('../platform/windowFeatures');

/**
 * Window Configurations for the Hades Application.
 * This acts as the Single Source of Truth for window dimensions, properties, and paths.
 */

const isPackaged = app.isPackaged;
const baseUrl = isPackaged
  ? `file://${path.join(__dirname, '../../dist/index.html')}`
  : 'http://localhost:3000';

const preloadPath = path.join(__dirname, '../../preload.js');
const visualOptions = getWindowVisualOptions();

function getTargetWorkArea() {
  const point = screen.getCursorScreenPoint();
  return screen.getDisplayNearestPoint(point).workArea;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function positionWindow(win, width, height, options = {}) {
  const area = getTargetWorkArea();
  const margin = options.margin ?? 20;
  const x = options.x ?? area.x + Math.floor((area.width - width) / 2);
  const y = options.y ?? area.y + Math.floor((area.height - height) / 2);
  const maxX = area.x + Math.max(margin, area.width - width - margin);
  const maxY = area.y + Math.max(margin, area.height - height - margin);

  win.setPosition(
    clamp(x, area.x + margin, maxX),
    clamp(y, area.y + margin, maxY)
  );
}

const windowConfigs = {
  command: {
    width: 730,
    height: 480,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    show: false,
    resizable: true,
    movable: true,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=command`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      const area = getTargetWorkArea();
      positionWindow(win, 730, 480, { y: area.y + 40 });
    }
  },
  chat: {
    width: 480,
    height: 490,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    show: false,
    resizable: true,
    minWidth: 400,
    minHeight: 400,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=chat`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      const area = getTargetWorkArea();
      positionWindow(win, 480, 490, { y: area.y + 180 });
    }
  },
  voice: {
    width: 480,
    height: 420,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    show: false,
    resizable: false,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=voice`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      positionWindow(win, 480, 420);
    }
  },
  susurroSetup: {
    width: 440,
    height: 520,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    show: false,
    resizable: false,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=susurro-setup`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      positionWindow(win, 440, 520);
    }
  },
  susurro: {
    width: 520,
    height: 680,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: false,
    show: false,
    resizable: true,
    minWidth: 360,
    minHeight: 400,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=susurro`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      positionWindow(win, 520, 680);
    }
  },
  suggestions: {
    width: 600,
    height: 60,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    show: false,
    resizable: false,
    focusable: false,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=suggestions`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    onInit: (win) => {
      const area = getTargetWorkArea();
      positionWindow(win, 600, 60, { y: area.y + 20 });
    }
  },
  notification: {
    width: 400,
    height: 100,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    focusable: false,
    url: `file://${path.join(__dirname, '../../public/notification.html')}`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
    onInit: (win) => {
      const area = getTargetWorkArea();
      positionWindow(win, 400, 100, { y: area.y + 50 });
    }
  },
  splash: {
    width: 900,
    height: 180,
    frame: false,
    transparent: visualOptions.transparent,
    alwaysOnTop: true,
    resizable: false,
    focusable: false,
    hasShadow: visualOptions.hasShadow,
    show: false,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=splash`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
    onInit: (win) => {
      positionWindow(win, 900, 180);
      win.setAlwaysOnTop(true, 'screen-saver');
      win.once('ready-to-show', () => {
        console.log('[WINDOW_CONFIGS] Splash window ready-to-show, showing now');
        win.show();
      });
    }
  },
  settings: {
    width: 820,
    height: 600,
    frame: false,
    transparent: visualOptions.transparent,
    hasShadow: visualOptions.hasShadow,
    alwaysOnTop: false,
    show: false,
    resizable: false,
    backgroundColor: visualOptions.backgroundColor,
    url: `${baseUrl}?window=settings`,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      backgroundThrottling: false,
    },
    onInit: (win) => {
      if (process.platform === 'win32') win.setBackgroundMaterial('mica');
      positionWindow(win, 820, 600);
    }
  }
};

module.exports = windowConfigs;
