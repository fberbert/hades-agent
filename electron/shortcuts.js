const { globalShortcut, app } = require('electron');
const windowManager = require('./windows/windowManager');
const jsonStore = require('./store/jsonStore');
const appState = require('./appState');
const { formatShortcutResult } = require('./platform/shortcuts');

/**
 * Toggles the command window and associated chat window.
 */
function toggleCommandWindow() {
  const { BrowserWindow } = require('electron');
  console.log('');
  console.log('=== [SHORTCUTS] ============ TOGGLE COMMAND START ============');
  
  const win = windowManager.get('command') || windowManager.createCommandWindow();
  const chatWin = windowManager.get('chat');
  
  const logWinState = (label, w) => {
    if (!w || w.isDestroyed()) {
      console.log(`  [${label}] NULL or DESTROYED`);
      return;
    }
    const bounds = w.getBounds();
    console.log(`  [${label}] visible=${w.isVisible()} focused=${w.isFocused()} alwaysOnTop=${w.isAlwaysOnTop()} minimized=${w.isMinimized()} bounds=[${bounds.x},${bounds.y},${bounds.width}x${bounds.height}]`);
  };

  console.log('[SHORTCUTS] --- INITIAL STATE ---');
  logWinState('COMMAND', win);
  logWinState('CHAT', chatWin);
  console.log(`[SHORTCUTS] chatHasMessages=${appState.chatHasMessages} isChatPinned=${appState.isChatPinned}`);
  console.log(`[SHORTCUTS] Currently focused window: ${BrowserWindow.getFocusedWindow()?.getTitle?.() || 'NONE (external app)'}`);
  
  if (!win) {
    console.error('[SHORTCUTS] Command window is null or undefined. ABORTING.');
    return;
  }
  
  if (win.isVisible()) {
    console.log('[SHORTCUTS] === ACTION: HIDE ALL ===');
    windowManager.hideAllWindows();
  } else {
    console.log('[SHORTCUTS] === ACTION: SHOW WINDOWS ===');
    windowManager.hideAllExcept(['command', 'chat']);

    // Step 1: show chat FIRST (below command bar) if active session exists
    if (chatWin && !chatWin.isDestroyed() && appState.chatHasMessages) {
      console.log('[SHORTCUTS] --- STEP 1: SHOW CHAT ---');
      console.log('[SHORTCUTS] calling chatWin.show()');
      chatWin.show();
      logWinState('CHAT after show()', chatWin);
    } else {
      console.log(`[SHORTCUTS] --- STEP 1: SKIP CHAT (exists=${!!chatWin} destroyed=${chatWin?.isDestroyed?.()} hasMessages=${appState.chatHasMessages}) ---`);
    }

    // Step 2: show command window ON TOP of chat and focus it
    console.log('[SHORTCUTS] --- STEP 2: SHOW COMMAND ---');
    console.log('[SHORTCUTS] calling win.show()');
    win.show();
    logWinState('COMMAND after show()', win);
    console.log('[SHORTCUTS] calling win.focus()');
    win.focus();
    logWinState('COMMAND after focus()', win);
    win.webContents.send('focus-input');

    // Deferred state check — see what happened after OS compositor settles
    setTimeout(() => {
      if (win.isDestroyed()) return;
      console.log('[SHORTCUTS] --- DEFERRED CHECK (50ms) ---');
      logWinState('COMMAND', win);
      logWinState('CHAT', chatWin);
      console.log(`[SHORTCUTS] Currently focused window: ${BrowserWindow.getFocusedWindow()?.getTitle?.() || 'NONE (external app)'}`);
    }, 50);

    setTimeout(() => {
      if (win.isDestroyed()) return;
      console.log('[SHORTCUTS] --- DEFERRED CHECK (300ms) ---');
      logWinState('COMMAND', win);
      logWinState('CHAT', chatWin);
      console.log(`[SHORTCUTS] Currently focused window: ${BrowserWindow.getFocusedWindow()?.getTitle?.() || 'NONE (external app)'}`);
    }, 300);
  }
  
  console.log('=== [SHORTCUTS] ============ TOGGLE COMMAND END ==============');
  console.log('');
}

/**
 * Toggles the settings window.
 */
function toggleSettingsWindow() {
  console.log('[SHORTCUTS] Toggle Settings pressed!');
  const win = windowManager.get('settings') || windowManager.createSettingsWindow();
  if (!win) {
    console.error('[SHORTCUTS] Settings window is null or undefined.');
    return;
  }
  
  if (win.isVisible()) {
    console.log('[SHORTCUTS] Settings window is visible. Hiding...');
    win.hide();
  } else {
    console.log('[SHORTCUTS] Settings window is hidden. Showing...');
    windowManager.hideAllExcept(['settings']);
    win.show();
    win.focus();
  }
}

function registerShortcut(name, key, handler) {
  try {
    const registered = globalShortcut.register(key, handler);
    const result = formatShortcutResult(name, key, registered);
    console.log(`[SHORTCUTS] Toggle ${name} shortcut (${key}): ${registered ? 'OK' : 'FAILED'}`);
    return result;
  } catch (err) {
    const result = formatShortcutResult(name, key, false, err);
    console.error(`[SHORTCUTS] Toggle ${name} shortcut (${key}): EXCEPTION - ${result.error}`);
    return result;
  }
}

/**
 * Registers global keyboard shortcuts for the application.
 * Handles toggling main windows and starting features via hotkeys.
 */
function registerGlobalShortcuts(retryCount = 0) {
  // Wipe all active global shortcut registrations to prevent clashing and leaks when updating
  globalShortcut.unregisterAll();

  const settings = jsonStore.getSettings();
  const shortcuts = settings.shortcuts || {
    toggleCommand: 'Alt+D',
    toggleSettings: 'Alt+S',
    toggleSusurro: 'Alt+B',
    toggleVoice: 'Alt+V'
  };

  let allRegistered = true;

  // Toggle Command Bar & Chat
  const commandResult = registerShortcut('Command', shortcuts.toggleCommand || 'Alt+D', toggleCommandWindow);
  if (!commandResult.registered) allRegistered = false;

  // Toggle Settings
  const settingsResult = registerShortcut('Settings', shortcuts.toggleSettings || 'Alt+S', toggleSettingsWindow);
  if (!settingsResult.registered) allRegistered = false;

  // Toggle Susurro (Live Transcription)
  const susurroResult = registerShortcut('Susurro', shortcuts.toggleSusurro || 'Alt+B', () => {
    const win = windowManager.get('susurro') || windowManager.createSusurroWindow();
    if (win.isVisible()) {
      win.hide();
    } else {
      windowManager.hideAllExcept(['susurro', 'suggestions']);
      win.show();
      win.focus();
      // Sinaliza o frontend para iniciar a conexão imediatamente
      win.webContents.send('start-susurro');
    }
  });
  if (!susurroResult.registered) allRegistered = false;

  // Trigger Voice Command
  const voiceResult = registerShortcut('Voice', shortcuts.toggleVoice || 'Alt+V', () => {
    const win = windowManager.get('voice') || windowManager.createVoiceWindow();
    if (win.isVisible()) {
      win.hide();
    } else {
      windowManager.hideAllExcept(['voice']);
      win.show();
      win.focus();
      // Envia o evento para começar a gravar imediatamente após abrir
      win.webContents.send('start-voice');
    }
  });
  if (!voiceResult.registered) allRegistered = false;

  // Retry if any shortcut failed (zombie process may still be releasing)
  if (allRegistered) {
    console.log('[SHORTCUTS] ✓ All shortcuts registered successfully.');
  } else if (retryCount < 3) {
    const delay = (retryCount + 1) * 1500;
    console.warn(`[SHORTCUTS] ⚠ Some shortcuts failed to register. Retrying in ${delay}ms (attempt ${retryCount + 1}/3)...`);
    setTimeout(() => registerGlobalShortcuts(retryCount + 1), delay);
  } else {
    console.error('[SHORTCUTS] ✗ CRITICAL: Shortcuts failed after 3 retries. A zombie Electron process may be holding them.');
  }
}

module.exports = registerGlobalShortcuts;
