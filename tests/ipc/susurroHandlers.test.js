import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

const handleMap = new Map();
const onMap = new Map();
const require = createRequire(import.meta.url);
const logger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};
const storeMock = {
  getSettings: vi.fn(() => ({
    general: {
      openaiApiKey: 'sk-settings',
      fullTranscriptionModel: 'gpt-4o-mini-transcribe',
      sttModel: 'fallback-model',
    },
  })),
  getSusurroHistory: vi.fn(() => []),
  saveSusurroHistory: vi.fn(),
};
const openAIClientMock = {
  getOpenAIKey: vi.fn(() => 'sk-settings'),
};

class FakeRealtimeSession {
  static instances = [];
  static nextStartError = null;

  constructor(options) {
    this.options = options;
    this.start = vi.fn(() => {
      if (FakeRealtimeSession.nextStartError) {
        return Promise.reject(FakeRealtimeSession.nextStartError);
      }
      return Promise.resolve();
    });
    this.appendAudio = vi.fn().mockReturnValue(true);
    this.stop = vi.fn();
    FakeRealtimeSession.instances.push(this);
  }
}

function mockCommonJSModule(modulePath, exports) {
  const resolvedPath = require.resolve(modulePath);
  require.cache[resolvedPath] = {
    id: resolvedPath,
    filename: resolvedPath,
    loaded: true,
    exports,
  };
}

mockCommonJSModule('electron', {
  app: {
    getPath: () => `/tmp/hades-susurro-ipc-test-${process.pid}`,
  },
  ipcMain: {
    handle: vi.fn((channel, handler) => {
      handleMap.set(channel, handler);
    }),
    on: vi.fn((channel, handler) => {
      onMap.set(channel, handler);
    }),
  },
});

mockCommonJSModule('../../electron/store/jsonStore', storeMock);

mockCommonJSModule('../../electron/services/openaiClient', openAIClientMock);

mockCommonJSModule('../../electron/services/openaiRealtimeTranscriptionService', {
  OpenAIRealtimeTranscriptionSession: FakeRealtimeSession,
});

mockCommonJSModule('../../electron/services/aiService', {
  generateSuggestion: vi.fn(),
});

mockCommonJSModule('../../electron/services/translationService', {
  translate: vi.fn(),
  translateIncremental: vi.fn(),
});

mockCommonJSModule('../../electron/windows/windowManager', {
  get: vi.fn(),
  createSuggestionsWindow: vi.fn(),
});

mockCommonJSModule('../../electron/services/logger', logger);

const registerSusurroHandlers = require('../../electron/ipc/susurroHandlers');

function createEvent() {
  return {
    sender: {
      isDestroyed: vi.fn(() => false),
      send: vi.fn(),
    },
  };
}

describe('registerSusurroHandlers', () => {
  beforeEach(() => {
    handleMap.clear();
    onMap.clear();
    logger.debug.mockClear();
    logger.error.mockClear();
    logger.info.mockClear();
    logger.warn.mockClear();
    storeMock.getSettings.mockClear();
    storeMock.getSettings.mockReturnValue({
      general: {
        openaiApiKey: 'sk-settings',
        fullTranscriptionModel: 'gpt-4o-mini-transcribe',
        sttModel: 'fallback-model',
      },
    });
    openAIClientMock.getOpenAIKey.mockClear();
    openAIClientMock.getOpenAIKey.mockReturnValue('sk-settings');
    FakeRealtimeSession.instances = [];
    FakeRealtimeSession.nextStartError = null;
    registerSusurroHandlers();
  });

  it('starts OpenAI realtime transcription and forwards status and delta events', async () => {
    const event = createEvent();
    const result = await handleMap.get('susurro-start-live')(event, 'Persona Susurro');

    expect(result).toEqual({ success: true, data: true });
    const session = FakeRealtimeSession.instances[0];
    expect(session.options.apiKey).toBe('sk-settings');
    expect(session.start).toHaveBeenCalledWith({
      personaPrompt: 'Persona Susurro',
      model: 'gpt-4o-mini-transcribe',
      language: 'pt',
    });

    session.options.onStatus('ready');
    session.options.onDelta({ text: 'ola', isFinal: false });

    expect(event.sender.send).toHaveBeenCalledWith('susurro-live-status', 'ready');
    expect(event.sender.send).toHaveBeenCalledWith('susurro-live-delta', { text: 'ola', isFinal: false });
  });

  it('forwards chunks to the active realtime session and stops it', async () => {
    const event = createEvent();
    await handleMap.get('susurro-start-live')(event, '');
    const session = FakeRealtimeSession.instances[0];

    onMap.get('susurro-send-chunk')(event, 'AAAA', 42);
    expect(session.appendAudio).toHaveBeenCalledWith('AAAA', 42);

    const result = await handleMap.get('susurro-stop-live')(event);
    expect(result).toEqual({ success: true, data: true });
    expect(session.stop).toHaveBeenCalledTimes(1);
  });

  it('does not crash when realtime callbacks run after the sender is destroyed', async () => {
    const event = createEvent();
    event.sender.isDestroyed.mockReturnValue(true);

    await handleMap.get('susurro-start-live')(event, '');
    const session = FakeRealtimeSession.instances[0];

    expect(() => session.options.onStatus('ready')).not.toThrow();
    expect(() => session.options.onDelta({ text: 'ola', isFinal: false })).not.toThrow();
    expect(event.sender.send).not.toHaveBeenCalled();
  });

  it('ignores chunks from a sender that does not own the active realtime session', async () => {
    const ownerEvent = createEvent();
    const otherEvent = createEvent();
    await handleMap.get('susurro-start-live')(ownerEvent, '');
    const session = FakeRealtimeSession.instances[0];

    onMap.get('susurro-send-chunk')(otherEvent, 'AAAA', 42);

    expect(session.appendAudio).not.toHaveBeenCalled();
    expect(logger.debug).toHaveBeenCalledWith('IPC', expect.stringContaining('does not own'));
  });

  it('does not stop the active realtime session from a non-owner sender', async () => {
    const ownerEvent = createEvent();
    const otherEvent = createEvent();
    await handleMap.get('susurro-start-live')(ownerEvent, '');
    const session = FakeRealtimeSession.instances[0];

    const result = await handleMap.get('susurro-stop-live')(otherEvent);

    expect(result).toEqual({ success: true, data: true });
    expect(session.stop).not.toHaveBeenCalled();

    onMap.get('susurro-send-chunk')(ownerEvent, 'BBBB', 43);
    expect(session.appendAudio).toHaveBeenCalledWith('BBBB', 43);
  });

  it('cleans the active realtime session after runtime onError and ignores later chunks', async () => {
    const event = createEvent();
    await handleMap.get('susurro-start-live')(event, '');
    const session = FakeRealtimeSession.instances[0];

    session.options.onError('runtime failure');
    onMap.get('susurro-send-chunk')(event, 'AAAA', 42);

    expect(event.sender.send).toHaveBeenCalledWith('susurro-live-status', 'error');
    expect(session.stop).toHaveBeenCalledTimes(1);
    expect(session.appendAudio).not.toHaveBeenCalled();
  });

  it('does not let an old session runtime error clean a newer active session', async () => {
    const firstEvent = createEvent();
    const secondEvent = createEvent();
    await handleMap.get('susurro-start-live')(firstEvent, '');
    const firstSession = FakeRealtimeSession.instances[0];
    await handleMap.get('susurro-start-live')(secondEvent, '');
    const secondSession = FakeRealtimeSession.instances[1];
    secondSession.stop.mockClear();

    firstSession.options.onError('old failure');
    onMap.get('susurro-send-chunk')(secondEvent, 'CCCC', 44);

    expect(secondSession.stop).not.toHaveBeenCalled();
    expect(secondSession.appendAudio).toHaveBeenCalledWith('CCCC', 44);
  });

  it('returns failure and clears the session when start rejects', async () => {
    const event = createEvent();
    FakeRealtimeSession.nextStartError = new Error('OpenAI API Key não configurada.');
    openAIClientMock.getOpenAIKey.mockReturnValue('');

    const result = await handleMap.get('susurro-start-live')(event, '');
    const session = FakeRealtimeSession.instances[0];
    onMap.get('susurro-send-chunk')(event, 'AAAA', 42);

    expect(result).toEqual({
      success: false,
      data: false,
      error: 'OpenAI API Key não configurada.',
    });
    expect(event.sender.send).toHaveBeenCalledWith('susurro-live-status', 'error');
    expect(session.stop).toHaveBeenCalledTimes(1);
    expect(session.appendAudio).not.toHaveBeenCalled();
  });
});
