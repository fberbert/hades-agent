const { toFile } = require('openai/uploads');
const { createOpenAIClient } = require('./openaiClient');

const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

function bufferFromBase64(base64Audio) {
  return Buffer.from(base64Audio, 'base64');
}

async function transcribeWavBase64(base64Audio, options = {}) {
  if (!base64Audio) {
    throw new Error('Nenhum áudio recebido para transcrição.');
  }

  const client = options.createOpenAIClient
    ? options.createOpenAIClient()
    : createOpenAIClient();
  const model = options.model || DEFAULT_TRANSCRIPTION_MODEL;
  const buffer = bufferFromBase64(base64Audio);
  const file = await toFile(buffer, 'voice.wav', { type: 'audio/wav' });

  const response = await client.audio.transcriptions.create({
    file,
    model,
    language: 'pt',
  });

  return {
    text: response.text || '',
    model,
  };
}

module.exports = {
  DEFAULT_TRANSCRIPTION_MODEL,
  bufferFromBase64,
  transcribeWavBase64,
};
