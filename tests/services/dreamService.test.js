import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import dreamServiceModule from '../../electron/services/dreamService';

vi.mock('electron', () => ({
  app: {
    getPath: () => `/tmp/hades-dream-service-test-${process.pid}`,
  },
}));

const { DreamService } = dreamServiceModule;

let tempDirs = [];

function createTempMemoryDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hades-dream-test-'));
  tempDirs.push(dir);
  return dir;
}

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

afterEach(() => {
  tempDirs.forEach(dir => fs.rmSync(dir, { recursive: true, force: true }));
  tempDirs = [];
});

describe('DreamService', () => {
  it('uses OpenAI Responses for dream analysis when OpenAI is active', async () => {
    const memoryDir = createTempMemoryDir();
    const sessions = [
      { file: 'session-1.json', data: { messages: [{ text: 'Prefiro respostas curtas.' }] } },
    ];
    const sessionLogger = {
      getUnprocessedSessions: vi.fn(() => sessions),
      markSessionAsProcessed: vi.fn(),
    };
    const runOpenAIResponse = vi.fn().mockResolvedValue({
      text: '- Prefere respostas curtas\n- Usa o app em PT-BR',
    });
    const service = new DreamService({
      memoryDir,
      sessionLogger,
      jsonStore: createJsonStore({
        openaiApiKey: 'sk-test',
        dreamingEnabled: true,
        dreamingModel: 'gpt-5-mini',
      }),
      logger: createLogger(),
      runOpenAIResponse,
    });

    await service.runDreamCycle();

    expect(runOpenAIResponse).toHaveBeenCalledWith(expect.objectContaining({
      model: 'gpt-5-mini',
      input: [
        {
          role: 'user',
          content: expect.stringContaining('Prefiro respostas curtas.'),
        },
      ],
    }));
    expect(sessionLogger.markSessionAsProcessed).toHaveBeenCalledWith('session-1.json');

    const learnings = JSON.parse(fs.readFileSync(path.join(memoryDir, 'learnings.json'), 'utf-8'));
    expect(learnings).toHaveLength(1);
    expect(learnings[0]).toMatchObject({
      processedSessions: 1,
      insights: ['- Prefere respostas curtas', '- Usa o app em PT-BR'],
    });
  });

});
