import { describe, expect, it } from 'vitest';
import { parsePulseAudioSources } from '../../electron/platform/linuxAudioSources';

describe('linux audio sources', () => {
  it('parses PulseAudio monitor and input sources', () => {
    const output = `
Source #42
	State: RUNNING
	Name: alsa_output.pci-0000_00_1f.3.analog-stereo.monitor
	Description: Monitor of Built-in Audio Analog Stereo
	Driver: module-alsa-card.c
Source #43
	State: IDLE
	Name: alsa_input.pci-0000_00_1f.3.analog-stereo
	Description: Built-in Audio Analog Stereo
	Driver: module-alsa-card.c
`;

    expect(parsePulseAudioSources(output)).toEqual([
      {
        name: 'alsa_output.pci-0000_00_1f.3.analog-stereo.monitor',
        description: 'Monitor of Built-in Audio Analog Stereo',
        isMonitor: true,
      },
      {
        name: 'alsa_input.pci-0000_00_1f.3.analog-stereo',
        description: 'Built-in Audio Analog Stereo',
        isMonitor: false,
      },
    ]);
  });
});
