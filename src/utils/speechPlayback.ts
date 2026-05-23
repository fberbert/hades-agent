export const DEFAULT_SPEECH_PLAYBACK_RATE = 1;

export function parseAudioDataUrl(dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) {
    throw new Error('Formato de áudio inválido.');
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
}

export function audioDataUrlToObjectUrl(dataUrl: string) {
  const { mimeType, base64 } = parseAudioDataUrl(dataUrl);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
}

export function audioDataUrlToArrayBuffer(dataUrl: string) {
  const { base64 } = parseAudioDataUrl(dataUrl);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes.buffer;
}

export async function playAudioDataUrlWithWebAudio(
  dataUrl: string,
  options: { playbackRate?: number } = {}
) {
  const AudioContextCtor = globalThis.AudioContext || (globalThis as any).webkitAudioContext;
  if (!AudioContextCtor) {
    throw new Error('Web Audio API indisponível.');
  }

  const playbackRate = options.playbackRate || DEFAULT_SPEECH_PLAYBACK_RATE;
  const context = new AudioContextCtor();
  const audioBuffer = await context.decodeAudioData(audioDataUrlToArrayBuffer(dataUrl).slice(0));
  const source = context.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = playbackRate;
  source.connect(context.destination);

  if (context.state === 'suspended') {
    await context.resume();
  }

  source.start(0);

  return {
    context,
    source,
    duration: audioBuffer.duration,
    playbackRate,
  };
}

export function speakWithSystemVoice(text: string) {
  const synth = globalThis.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
    return false;
  }

  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'pt-BR';
  utterance.rate = DEFAULT_SPEECH_PLAYBACK_RATE;
  utterance.pitch = 1;
  utterance.volume = 1;
  synth.speak(utterance);
  return true;
}
