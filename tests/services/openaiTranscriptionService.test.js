import { describe, expect, it, vi } from 'vitest';
import {
  bufferFromBase64,
  transcribeWavBase64,
} from '../../electron/services/openaiTranscriptionService';

describe('openaiTranscriptionService', () => {
  it('converts base64 audio to a Buffer', () => {
    const buffer = bufferFromBase64(Buffer.from('RIFF-test').toString('base64'));

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.toString()).toBe('RIFF-test');
  });

  it('uses gpt-4o-mini-transcribe by default', async () => {
    const create = vi.fn().mockResolvedValue({ text: 'ola mundo' });
    const createOpenAIClient = () => ({
      audio: {
        transcriptions: {
          create,
        },
      },
    });

    const result = await transcribeWavBase64('UklGRg==', {
      createOpenAIClient,
      model: undefined,
    });

    expect(result.text).toBe('ola mundo');
    expect(result.model).toBe('gpt-4o-mini-transcribe');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-4o-mini-transcribe',
      language: 'pt',
    }));
  });
});
