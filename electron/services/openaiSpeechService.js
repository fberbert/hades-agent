const { createOpenAIClient } = require('./openaiClient');

const DEFAULT_SPEECH_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_SPEECH_VOICE = 'coral';
const DEFAULT_SPEECH_FORMAT = 'mp3';
const DEFAULT_SPEECH_SPEED = 1.25;

const MIME_BY_FORMAT = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  opus: 'audio/ogg',
  aac: 'audio/aac',
  flac: 'audio/flac',
};

function buildSpeechRequest({ text, model, voice, format, speed } = {}) {
  const input = typeof text === 'string' ? text.trim() : '';
  if (!input) {
    throw new Error('Nenhum texto recebido para síntese de voz.');
  }

  return {
    model: model || DEFAULT_SPEECH_MODEL,
    voice: voice || DEFAULT_SPEECH_VOICE,
    input,
    response_format: format || DEFAULT_SPEECH_FORMAT,
    speed: speed || DEFAULT_SPEECH_SPEED,
  };
}

async function synthesizeSpeechDataUrl(text, options = {}) {
  const client = options.client || createOpenAIClient();
  const request = buildSpeechRequest({
    text,
    model: options.model,
    voice: options.voice,
    format: options.format,
    speed: options.speed,
  });

  const response = await client.audio.speech.create(request);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length === 0) {
    throw new Error('OpenAI retornou áudio vazio para síntese de voz.');
  }
  const mime = MIME_BY_FORMAT[request.response_format] || 'application/octet-stream';

  return {
    audioDataUrl: `data:${mime};base64,${buffer.toString('base64')}`,
    model: request.model,
    voice: request.voice,
    format: request.response_format,
    speed: request.speed,
  };
}

module.exports = {
  DEFAULT_SPEECH_MODEL,
  DEFAULT_SPEECH_VOICE,
  DEFAULT_SPEECH_FORMAT,
  DEFAULT_SPEECH_SPEED,
  buildSpeechRequest,
  synthesizeSpeechDataUrl,
};
