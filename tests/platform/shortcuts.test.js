import { describe, expect, it, vi } from 'vitest';
import {
  shouldEnableGlobalShortcutsPortal,
  applyShortcutRuntimeFlags,
  formatShortcutResult,
} from '../../electron/platform/shortcuts';

describe('shortcut platform helper', () => {
  it('enables portal for Linux Wayland', () => {
    expect(shouldEnableGlobalShortcutsPortal({ isLinux: true, displayServer: 'wayland' })).toBe(true);
  });

  it('does not enable portal for Linux X11', () => {
    expect(shouldEnableGlobalShortcutsPortal({ isLinux: true, displayServer: 'x11' })).toBe(false);
  });

  it('appends GlobalShortcutsPortal when needed', () => {
    const appendSwitch = vi.fn();
    const result = applyShortcutRuntimeFlags(
      { commandLine: { appendSwitch } },
      { isLinux: true, displayServer: 'wayland' }
    );

    expect(result.enabledPortal).toBe(true);
    expect(appendSwitch).toHaveBeenCalledWith('enable-features', 'GlobalShortcutsPortal');
  });

  it('formats failed shortcut registration', () => {
    expect(formatShortcutResult('Command', 'Alt+D', false, new Error('busy'))).toEqual({
      name: 'Command',
      key: 'Alt+D',
      registered: false,
      error: 'busy',
    });
  });
});
