import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { getTrayIconPath } from '../../electron/platform/icons';

describe('tray icon resolver', () => {
  it('uses ico on Windows', () => {
    expect(getTrayIconPath('/repo/electron', 'win32')).toBe(
      path.join('/repo/electron', '../public/icon/hades-tray-icon.ico')
    );
  });

  it('uses png outside Windows', () => {
    expect(getTrayIconPath('/repo/electron', 'linux')).toBe(
      path.join('/repo/electron', '../public/icon/hades-tray-icon-128.png')
    );
  });
});
