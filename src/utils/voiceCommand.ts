export function getTranscribedCommand(result: any): string {
  if (!result?.success) return '';
  return typeof result.data === 'string' ? result.data.trim() : '';
}

export function buildVoiceMessageOptions() {
  return { source: 'voice' as const };
}
