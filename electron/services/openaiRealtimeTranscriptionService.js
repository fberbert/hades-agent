const WebSocket = require('ws');

const REALTIME_TRANSCRIPTION_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

function buildTranscriptionSessionUpdate(options = {}) {
  const model = options.model || DEFAULT_TRANSCRIPTION_MODEL;

  return {
    type: 'session.update',
    session: {
      type: 'transcription',
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          transcription: {
            model,
            language: options.language,
            prompt: options.prompt,
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
  };
}

function normalizeRealtimeEvent(event) {
  if (!event || typeof event !== 'object') {
    return null;
  }

  if (event.type === 'conversation.item.input_audio_transcription.delta') {
    return {
      kind: 'delta',
      delta: { text: event.delta || '', isFinal: false, itemId: event.item_id },
    };
  }

  if (event.type === 'conversation.item.input_audio_transcription.completed') {
    return {
      kind: 'delta',
      delta: {
        text: event.transcript || '',
        isFinal: true,
        itemId: event.item_id,
        replaceText: true,
      },
    };
  }

  if (event.type === 'input_audio_buffer.speech_started') {
    return { kind: 'status', status: 'ready' };
  }

  if (event.type === 'input_audio_buffer.speech_stopped') {
    return { kind: 'status', status: 'turn_complete' };
  }

  if (event.type === 'error') {
    return {
      kind: 'error',
      error: event.error?.message || event.message || 'Erro desconhecido no OpenAI Realtime.',
    };
  }

  return null;
}

class OpenAIRealtimeTranscriptionSession {
  constructor(options = {}) {
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.language = options.language;
    this.prompt = options.prompt;
    this.WebSocketImpl = options.WebSocketImpl || WebSocket;
    this.onStatus = options.onStatus || (() => {});
    this.onDelta = options.onDelta || (() => {});
    this.onError = options.onError || (() => {});
    this.socket = null;
    this.startPromise = null;
  }

  start(options = {}) {
    if (!this.apiKey) {
      const error = new Error('OpenAI API Key não configurada.');
      this.onError(error.message);
      return Promise.reject(error);
    }

    if (this.socket) {
      return this.startPromise || Promise.resolve();
    }

    this.onStatus('connecting');
    const sessionOptions = {
      model: options.model || this.model,
      language: options.language || this.language,
      prompt: options.personaPrompt || options.prompt || this.prompt,
    };

    this.startPromise = new Promise((resolve, reject) => {
      this.socket = new this.WebSocketImpl(REALTIME_TRANSCRIPTION_URL, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      });

      this.socket.on('open', () => {
        this.send(buildTranscriptionSessionUpdate(sessionOptions));
        this.onStatus('ready');
        resolve();
      });

      this.socket.on('message', (payload) => {
        this.handleMessage(payload);
      });

      this.socket.on('error', (error) => {
        const message = error?.message || 'Erro desconhecido no OpenAI Realtime.';
        this.onError(message);
        reject(error);
      });

      this.socket.on('close', () => {
        this.socket = null;
        this.startPromise = null;
        this.onStatus('closed');
      });
    });

    return this.startPromise;
  }

  appendAudio(audioBase64) {
    return this.send({
      type: 'input_audio_buffer.append',
      audio: audioBase64,
    });
  }

  stop() {
    if (!this.socket) {
      this.onStatus('closed');
      return;
    }

    this.socket.close();
  }

  send(payload) {
    const openState = this.WebSocketImpl.OPEN ?? 1;

    if (!this.socket || this.socket.readyState !== openState) {
      return false;
    }

    this.socket.send(JSON.stringify(payload));
    return true;
  }

  handleMessage(payload) {
    let event;

    try {
      event = JSON.parse(payload.toString());
    } catch (error) {
      this.onError(error?.message || 'Evento inválido do OpenAI Realtime.');
      return;
    }

    const normalized = normalizeRealtimeEvent(event);

    if (!normalized) {
      return;
    }

    if (normalized.kind === 'delta') {
      this.onDelta(normalized.delta);
      return;
    }

    if (normalized.kind === 'status') {
      this.onStatus(normalized.status);
      return;
    }

    if (normalized.kind === 'error') {
      this.onError(normalized.error);
    }
  }
}

module.exports = {
  REALTIME_TRANSCRIPTION_URL,
  DEFAULT_TRANSCRIPTION_MODEL,
  buildTranscriptionSessionUpdate,
  normalizeRealtimeEvent,
  OpenAIRealtimeTranscriptionSession,
};
