type SystemAudioCapability = {
  supported: boolean;
  caveat?: string;
};

type CaptureCapabilities = {
  systemAudio?: SystemAudioCapability;
} | null;

export function getSystemAudioBlockReason(capabilities: CaptureCapabilities): string {
  if (capabilities?.systemAudio?.supported === false) {
    return capabilities.systemAudio.caveat || 'System audio capture is unsupported on this platform';
  }

  return '';
}
