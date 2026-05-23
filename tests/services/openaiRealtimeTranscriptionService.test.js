import { describe, expect, it, vi } from 'vitest';
import {
  OpenAIRealtimeTranscriptionSession,
  buildTranscriptionSessionUpdate,
  normalizeRealtimeEvent,
} from '../../electron/services/openaiRealtimeTranscriptionService';

class FakeWebSocket {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.sent = [];
    this.handlers = {};
    this.readyState = FakeWebSocket.CONNECTING;
    FakeWebSocket.instances.push(this);
  }

  on(eventName, handler) {
    this.handlers[eventName] = this.handlers[eventName] || [];
    this.handlers[eventName].push(handler);
  }

  emit(eventName, payload) {
    for (const handler of this.handlers[eventName] || []) {
      handler(payload);
    }
  }

  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.emit('open');
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.emit('close');
  }
}

FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;

describe('openaiRealtimeTranscriptionService', () => {
  it('builds the default transcription session update payload', () => {
    expect(buildTranscriptionSessionUpdate({
      model: undefined,
      language: 'pt',
      prompt: 'Persona do Susurro',
    })).toEqual({
      type: 'session.update',
      session: {
        type: 'transcription',
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            transcription: {
              model: 'gpt-4o-mini-transcribe',
              language: 'pt',
              prompt: 'Persona do Susurro',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
            noise_reduction: { type: 'near_field' },
          },
        },
      },
    });
  });

  it('normalizes realtime transcription events', () => {
    expect(normalizeRealtimeEvent({
      type: 'conversation.item.input_audio_transcription.delta',
      item_id: 'item_001',
      delta: 'olá',
    })).toEqual({
      kind: 'delta',
      delta: { text: 'olá', isFinal: false, itemId: 'item_001' },
    });

    expect(normalizeRealtimeEvent({
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'item_001',
      transcript: 'olá mundo',
    })).toEqual({
      kind: 'delta',
      delta: { text: 'olá mundo', isFinal: true, itemId: 'item_001', replaceText: true },
    });

    expect(normalizeRealtimeEvent({
      type: 'input_audio_buffer.speech_started',
    })).toEqual({ kind: 'status', status: 'ready' });

    expect(normalizeRealtimeEvent({
      type: 'input_audio_buffer.speech_stopped',
    })).toEqual({ kind: 'status', status: 'turn_complete' });

    expect(normalizeRealtimeEvent({
      type: 'error',
      error: { message: 'falhou' },
    })).toEqual({ kind: 'error', error: 'falhou' });
  });

  it('opens a realtime transcription session with injected websocket', async () => {
    FakeWebSocket.instances = [];
    const statuses = [];
    const deltas = [];

    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
      language: 'pt',
      prompt: 'Persona do Susurro',
      onStatus: (status) => statuses.push(status),
      onDelta: (delta) => deltas.push(delta),
    });

    const startPromise = session.start();
    const socket = FakeWebSocket.instances[0];

    expect(socket.url).toBe('wss://api.openai.com/v1/realtime?intent=transcription');
    expect(socket.options.headers).toEqual({
      Authorization: 'Bearer test-key',
    });
    expect(statuses).toEqual(['connecting']);

    socket.open();
    await startPromise;

    expect(statuses).toEqual(['connecting', 'ready']);
    expect(socket.sent[0]).toEqual(buildTranscriptionSessionUpdate({
      model: undefined,
      language: 'pt',
      prompt: 'Persona do Susurro',
    }));

    expect(session.appendAudio('AAAA', 1)).toBe(true);

    expect(socket.sent[1]).toEqual({
      type: 'input_audio_buffer.append',
      audio: 'AAAA',
    });

    socket.emit('message', JSON.stringify({
      type: 'conversation.item.input_audio_transcription.completed',
      item_id: 'item_001',
      transcript: 'texto final',
    }));

    expect(deltas).toEqual([{ text: 'texto final', isFinal: true, itemId: 'item_001', replaceText: true }]);

    session.stop();

    expect(statuses).toEqual(['connecting', 'ready', 'closed']);
  });

  it('uses start options for the session update payload', async () => {
    FakeWebSocket.instances = [];
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
    });

    const startPromise = session.start({
      personaPrompt: 'Persona',
      model: 'custom-model',
      language: 'en',
    });
    const socket = FakeWebSocket.instances[0];

    socket.open();
    await startPromise;

    expect(socket.sent[0]).toEqual(buildTranscriptionSessionUpdate({
      model: 'custom-model',
      language: 'en',
      prompt: 'Persona',
    }));
  });

  it('rejects before opening websocket when api key is missing', async () => {
    FakeWebSocket.instances = [];
    const errors = [];
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: '',
      WebSocketImpl: FakeWebSocket,
      onError: (error) => errors.push(error),
    });

    await expect(session.start()).rejects.toThrow('OpenAI API Key não configurada.');

    expect(errors).toEqual(['OpenAI API Key não configurada.']);
    expect(FakeWebSocket.instances).toHaveLength(0);
  });

  it('returns false without sending audio before the socket opens', () => {
    FakeWebSocket.instances = [];
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
    });

    session.start();
    const socket = FakeWebSocket.instances[0];

    expect(session.appendAudio('AAAA', 1)).toBe(false);
    expect(socket.sent).toEqual([]);
  });

  it('returns true and sends audio after the socket opens', async () => {
    FakeWebSocket.instances = [];
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
    });

    const startPromise = session.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await startPromise;

    expect(session.appendAudio('AAAA', 1)).toBe(true);
    expect(socket.sent[1]).toEqual({
      type: 'input_audio_buffer.append',
      audio: 'AAAA',
    });
  });

  it('reports malformed JSON through onError', async () => {
    FakeWebSocket.instances = [];
    const onError = vi.fn();
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
      onError,
    });

    const startPromise = session.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await startPromise;

    socket.emit('message', '{');

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toMatch(/JSON|Unexpected|invalid/i);
  });

  it('ignores unknown events without reporting errors', async () => {
    FakeWebSocket.instances = [];
    const onError = vi.fn();
    const onDelta = vi.fn();
    const onStatus = vi.fn();
    const session = new OpenAIRealtimeTranscriptionSession({
      apiKey: 'test-key',
      WebSocketImpl: FakeWebSocket,
      onError,
      onDelta,
      onStatus,
    });

    const startPromise = session.start();
    const socket = FakeWebSocket.instances[0];
    socket.open();
    await startPromise;
    onStatus.mockClear();

    socket.emit('message', JSON.stringify({ type: 'session.created' }));

    expect(onError).not.toHaveBeenCalled();
    expect(onDelta).not.toHaveBeenCalled();
    expect(onStatus).not.toHaveBeenCalled();
  });
});
