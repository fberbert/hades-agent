import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SPEECH_MODEL,
  buildSpeechRequest,
  synthesizeSpeechDataUrl,
} from '../../electron/services/openaiSpeechService';

describe('openaiSpeechService', () => {
  it('uses gpt-4o-mini-tts with mp3 output by default', () => {
    expect(buildSpeechRequest({ text: 'Olá' })).toEqual({
      model: 'gpt-4o-mini-tts',
      voice: 'coral',
      input: 'Olá',
      response_format: 'mp3',
      speed: 1.25,
    });
    expect(DEFAULT_SPEECH_MODEL).toBe('gpt-4o-mini-tts');
  });

  it('accepts native OpenAI speech speed without changing playback speed', () => {
    expect(buildSpeechRequest({ text: 'Olá', speed: 1.25 })).toMatchObject({
      input: 'Olá',
      speed: 1.25,
    });
  });

  it('returns a playable data URL from OpenAI speech audio', async () => {
    const create = vi.fn().mockResolvedValue({
      arrayBuffer: async () => Buffer.from('audio-bytes').buffer,
    });
    const client = {
      audio: {
        speech: {
          create,
        },
      },
    };

    const result = await synthesizeSpeechDataUrl('Resposta falada', { client });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini-tts',
      voice: 'coral',
      input: 'Resposta falada',
      response_format: 'mp3',
      speed: 1.25,
    }));
    expect(result).toMatchObject({
      audioDataUrl: expect.stringMatching(/^data:audio\/mpeg;base64,/),
      model: 'gpt-4o-mini-tts',
      voice: 'coral',
      format: 'mp3',
      speed: 1.25,
    });
  });
});
