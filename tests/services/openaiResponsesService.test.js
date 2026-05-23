import { describe, expect, it, vi } from 'vitest';
import {
  buildMiniChatInput,
  buildResponseTools,
  extractResponseText,
  runOpenAIResponse,
} from '../../electron/services/openaiResponsesService';

describe('openaiResponsesService', () => {
  it('uses gpt-5-nano by default with an injected client', async () => {
    const create = vi.fn().mockResolvedValue({
      output_text: 'Resposta pelo output_text',
      usage: { total_tokens: 17 },
    });
    const client = { responses: { create } };

    const result = await runOpenAIResponse({
      client,
      input: [{ role: 'user', content: 'oi' }],
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5-nano',
      input: [{ role: 'user', content: 'oi' }],
    }));
    expect(result).toMatchObject({
      text: 'Resposta pelo output_text',
      model: 'gpt-5-nano',
      totalTokens: 17,
    });
  });

  it('prefers output_text when extracting response text', () => {
    const text = extractResponseText({
      output_text: 'texto principal',
      output: [
        {
          type: 'message',
          content: [{ type: 'output_text', text: 'texto secundário' }],
        },
      ],
    });

    expect(text).toBe('texto principal');
  });

  it('falls back to output content text when output_text is missing', () => {
    const text = extractResponseText({
      output: [
        {
          type: 'message',
          content: [
            { type: 'output_text', text: 'parte 1' },
            { type: 'text', text: ' parte 2' },
          ],
        },
      ],
    });

    expect(text).toBe('parte 1 parte 2');
  });

  it('includes web_search only when enabled', () => {
    expect(buildResponseTools({ enableWebSearch: false })).toEqual([]);
    expect(buildResponseTools({ enableWebSearch: true })).toEqual([
      { type: 'web_search_preview' },
    ]);
  });

  it('maps MiniChat messages and appends the current message once', () => {
    const input = buildMiniChatInput({
      message: 'nova pergunta',
      history: [
        { sender: 'user', text: 'oi' },
        { sender: 'ia', text: 'olá' },
        { sender: 'user', text: 'nova pergunta' },
      ],
    });

    expect(input).toEqual([
      { role: 'user', content: 'oi' },
      { role: 'assistant', content: 'olá' },
      { role: 'user', content: 'nova pergunta' },
    ]);
  });
});
