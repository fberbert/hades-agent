import { describe, expect, it, vi } from 'vitest';
import {
  canUseContentProtection,
  applyContentProtection,
  getWindowVisualOptions,
} from '../../electron/platform/windowFeatures';

describe('window feature adapter', () => {
  it('does not support content protection on Linux', () => {
    expect(canUseContentProtection('linux')).toBe(false);
  });

  it('supports content protection on Windows', () => {
    expect(canUseContentProtection('win32')).toBe(true);
  });

  it('does not call setContentProtection on unsupported platforms', () => {
    const win = { setContentProtection: vi.fn(() => true) };
    const result = applyContentProtection(win, true, {
      platform: 'linux',
      logger: { info: vi.fn() },
    });

    expect(result.supported).toBe(false);
    expect(result.reason).toBe('platform-unsupported');
    expect(win.setContentProtection).not.toHaveBeenCalled();
  });

  it('calls setContentProtection on Windows', () => {
    const win = { setContentProtection: vi.fn(() => true) };
    const result = applyContentProtection(win, true, {
      platform: 'win32',
      logger: { info: vi.fn() },
    });

    expect(result.success).toBe(true);
    expect(result.supported).toBe(true);
    expect(win.setContentProtection).toHaveBeenCalledWith(true);
  });

  it('uses opaque windows on Linux for reliable compositor rendering', () => {
    expect(getWindowVisualOptions('linux')).toEqual({
      transparent: false,
      hasShadow: true,
      backgroundColor: '#120707',
    });
  });

  it('keeps transparent windows outside Linux', () => {
    expect(getWindowVisualOptions('win32')).toEqual({
      transparent: true,
      hasShadow: false,
      backgroundColor: '#00000000',
    });
  });
});
