import { describe, expect, it, vi } from 'vitest';
import aiServiceModule from '../../electron/services/aiService';

vi.mock('electron', () => ({
  app: {
    getPath: () => `/tmp/hades-ai-service-test-${process.pid}`,
  },
}));

const { AIService } = aiServiceModule;

function createLogger() {
  return {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  };
}

function createJsonStore(general) {
  return {
    getSettings: () => ({ general }),
  };
}

describe('AIService', () => {
  it('generates Susurro suggestions through OpenAI Responses when OpenAI is active', async () => {
    const runOpenAIResponse = vi.fn().mockResolvedValue({ text: 'Pergunte sobre o prazo.' });
    const service = new AIService({
      jsonStore: createJsonStore({
        openaiApiKey: 'sk-test',
        minichatModel: 'gpt-5-mini',
      }),
      logger: createLogger(),
      runOpenAIResponse,
    });

    const result = await service.generateSuggestion({
      transcription: 'O cliente perguntou quando o pedido chega.',
      personaPrompt: 'Ajude como consultor de vendas.',
    });

    expect(result).toBe('Pergunte sobre o prazo.');
    expect(runOpenAIResponse).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'user',
          content: expect.stringContaining('Transcription Chunk: O cliente perguntou quando o pedido chega.'),
        },
      ],
    }));
    expect(runOpenAIResponse.mock.calls[0][0].input[0].content).toContain('Persona: Ajude como consultor de vendas.');
  });

  it('generates PT-BR session titles through OpenAI Responses with the cheap default model', async () => {
    const runOpenAIResponse = vi.fn().mockResolvedValue({
      text: '"Corrigindo Login"\nExplicação extra',
    });
    const service = new AIService({
      jsonStore: createJsonStore({
        openaiApiKey: 'sk-test',
      }),
      logger: createLogger(),
      runOpenAIResponse,
    });

    const result = await service.generateSessionTitle('preciso corrigir o bug de login no app');

    expect(result).toBe('Corrigindo Login');
    expect(runOpenAIResponse).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5-nano',
      systemPrompt: expect.stringContaining('O TÍTULO DEVE SER GERADO EM PORTUGUÊS (PT-BR)'),
      input: [{ role: 'user', content: 'preciso corrigir o bug de login no app' }],
    }));
  });

  it('falls back to a local session title when OpenAI title generation fails', async () => {
    const runOpenAIResponse = vi.fn().mockRejectedValue(new Error('offline'));
    const service = new AIService({
      jsonStore: createJsonStore({
        openaiApiKey: 'sk-test',
      }),
      logger: createLogger(),
      runOpenAIResponse,
    });

    const result = await service.generateSessionTitle('uma mensagem inicial longa para testar o fallback local');

    expect(result).toBe('uma mensagem inicial longa para testar o...');
  });
});
