const { getFeatureCapabilities } = require('./capabilities');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    wait(ms).then(() => {
      throw new Error(`${label} timed out after ${ms}ms`);
    }),
  ]);
}

async function inspectWindow(name, win) {
  if (!win || win.isDestroyed()) {
    return { name, exists: false };
  }

  return {
    name,
    exists: true,
    visible: win.isVisible(),
    focused: win.isFocused(),
    bounds: win.getBounds(),
    url: win.webContents.getURL(),
    title: win.getTitle(),
  };
}

async function runLinuxRuntimeSmoke({ app, windowManager, logger = console }) {
  if (process.env.HADES_LINUX_RUNTIME_SMOKE !== '1') return;

  const caps = getFeatureCapabilities();
  logger.log(`[LINUX_SMOKE] start platform=${caps.platform.platform} display=${caps.platform.displayServer}`);

  const checks = [
    ['command', () => windowManager.createWindow('command')],
    ['chat', () => windowManager.createWindow('chat')],
    ['settings', () => windowManager.createWindow('settings')],
    ['susurro', () => windowManager.createWindow('susurro')],
  ];

  for (const [name, create] of checks) {
    logger.log(`[LINUX_SMOKE] opening ${name}`);
    try {
      await withTimeout((async () => {
        const win = create();
        logger.log(`[LINUX_SMOKE] created ${name}`);
        win.show();
        logger.log(`[LINUX_SMOKE] shown ${name}`);
        win.focus();
        logger.log(`[LINUX_SMOKE] focused ${name}`);
        await wait(700);
        const state = await inspectWindow(name, win);
        logger.log(`[LINUX_SMOKE] ${JSON.stringify(state)}`);
        if (!win.isDestroyed()) win.hide();
        logger.log(`[LINUX_SMOKE] hidden ${name}`);
      })(), 5000, name);
    } catch (error) {
      logger.error(`[LINUX_SMOKE] ${name} failed`, error);
      app.exit(1);
      return;
    }
  }

  logger.log('[LINUX_SMOKE] complete');

  setTimeout(() => {
    app.exit(0);
  }, 500);
}

module.exports = {
  runLinuxRuntimeSmoke,
  inspectWindow,
};
