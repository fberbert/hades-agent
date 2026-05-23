import { ResponseSettings } from '../types/electron';

type ResponseSource = 'text' | 'voice' | 'task';

export function shouldSpeakResponse(
  settings: ResponseSettings | undefined,
  options: { source?: ResponseSource } = {}
) {
  const responseSettings = {
    audioForVoiceInput: settings?.audioForVoiceInput ?? true,
    alwaysAudio: settings?.alwaysAudio ?? false,
  };

  if (responseSettings.alwaysAudio) return true;
  return responseSettings.audioForVoiceInput && options.source === 'voice';
}
