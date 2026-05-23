import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  audioDataUrlToArrayBuffer,
  DEFAULT_SPEECH_PLAYBACK_RATE,
  parseAudioDataUrl,
  playAudioDataUrlWithWebAudio,
  speakWithSystemVoice,
} from '../../src/utils/speechPlayback';

describe('speechPlayback', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('parses base64 audio data URLs', () => {
    expect(parseAudioDataUrl('data:audio/mpeg;base64,YXVkaW8=')).toEqual({
      mimeType: 'audio/mpeg',
      base64: 'YXVkaW8=',
    });
  });

  it('rejects non-audio data URL payloads', () => {
    expect(() => parseAudioDataUrl('not-a-data-url')).toThrow('Formato de áudio inválido.');
  });

  it('converts audio data URLs to ArrayBuffer bytes for Web Audio playback', () => {
    const buffer = audioDataUrlToArrayBuffer('data:audio/mpeg;base64,YXVkaW8=');

    expect(new TextDecoder().decode(buffer)).toBe('audio');
  });

  it('plays OpenAI audio at 1x by default with Web Audio', async () => {
    const source = {
      buffer: null,
      playbackRate: { value: 1 },
      connect: vi.fn(),
      start: vi.fn(),
    };
    const context = {
      state: 'running',
      destination: {},
      decodeAudioData: vi.fn().mockResolvedValue({ duration: 2.5 }),
      createBufferSource: vi.fn(() => source),
      resume: vi.fn(),
    };
    const AudioContextMock = vi.fn(function AudioContext() {
      return context;
    });
    vi.stubGlobal('AudioContext', AudioContextMock);

    const playback = await playAudioDataUrlWithWebAudio('data:audio/mpeg;base64,YXVkaW8=');

    expect(source.playbackRate.value).toBe(DEFAULT_SPEECH_PLAYBACK_RATE);
    expect(playback.playbackRate).toBe(DEFAULT_SPEECH_PLAYBACK_RATE);
    expect(source.start).toHaveBeenCalledWith(0);
  });

  it('uses 1x for system speech fallback', () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', {
      cancel: vi.fn(),
      speak,
    });
    vi.stubGlobal('SpeechSynthesisUtterance', class {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;

      constructor(text: string) {
        this.text = text;
      }
    });

    expect(speakWithSystemVoice('resposta')).toBe(true);
    expect(speak).toHaveBeenCalledWith(expect.objectContaining({
      rate: DEFAULT_SPEECH_PLAYBACK_RATE,
    }));
  });
});
