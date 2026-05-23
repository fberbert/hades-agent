const OpenAI = require('openai');

function getOpenAIKey(settings = {}, env = process.env) {
  return settings?.general?.openaiApiKey || env.OPENAI_API_KEY || '';
}

function createOpenAIClient(options = {}) {
  const jsonStore = options.jsonStore;
  const settings = options.settings || (jsonStore || require('../store/jsonStore')).getSettings();
  const env = options.env || process.env;
  const apiKey = getOpenAIKey(settings, env);

  if (!apiKey) {
    throw new Error('OpenAI API Key não configurada.');
  }

  return new OpenAI({ apiKey });
}

module.exports = {
  getOpenAIKey,
  createOpenAIClient,
};
