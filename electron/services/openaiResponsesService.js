const { createOpenAIClient } = require('./openaiClient');

const DEFAULT_MINICHAT_MODEL = 'gpt-5-nano';
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_CHARS = 12000;

function normalizeRole(sender) {
  return sender === 'user' ? 'user' : 'assistant';
}

function trimText(value) {
  return String(value || '').slice(0, MAX_MESSAGE_CHARS);
}

function createTextContent(text) {
  return trimText(text);
}

function createImageContent(text, image) {
  const content = [];
  if (text) {
    content.push({ type: 'input_text', text: trimText(text) });
  }
  if (image && typeof image === 'string') {
    content.push({ type: 'input_image', image_url: image });
  }
  return content;
}

function mapMiniChatMessage(message) {
  const text = trimText(message?.text);
  const image = message?.image;

  if (!text && !image) return null;

  const role = normalizeRole(message?.sender);
  const content = image && role === 'user'
    ? createImageContent(text, image)
    : createTextContent(text);

  return { role, content };
}

function isSameUserMessage(message, userText) {
  return message?.sender === 'user' && trimText(message?.text) === trimText(userText);
}

function buildMiniChatInput({ history = [], message = '' } = {}) {
  const recentHistory = Array.isArray(history)
    ? history.slice(-MAX_HISTORY_MESSAGES)
    : [];
  const input = recentHistory
    .map(mapMiniChatMessage)
    .filter(Boolean);

  const lastMessage = recentHistory[recentHistory.length - 1];
  if (message && !isSameUserMessage(lastMessage, message)) {
    input.push({ role: 'user', content: createTextContent(message) });
  }

  return input;
}

function buildResponseTools({ enableWebSearch = false } = {}) {
  return enableWebSearch ? [{ type: 'web_search_preview' }] : [];
}

function extractTextFromContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';

  return content
    .map(part => {
      if (typeof part === 'string') return part;
      if (part?.type === 'output_text' || part?.type === 'text') {
        return part.text || '';
      }
      return part?.text || '';
    })
    .filter(Boolean)
    .join('');
}

function extractResponseText(response = {}) {
  if (typeof response.output_text === 'string' && response.output_text) {
    return response.output_text;
  }

  if (!Array.isArray(response.output)) return '';

  return response.output
    .map(item => extractTextFromContent(item?.content))
    .filter(Boolean)
    .join('')
    .trim();
}

function extractTotalTokens(response = {}) {
  return response.usage?.total_tokens
    || response.usage?.totalTokens
    || response.usage?.input_tokens + response.usage?.output_tokens
    || 0;
}

async function runOpenAIResponse({
  client,
  input,
  model,
  tools = [],
  systemPrompt = '',
  createOpenAIClient: createClient,
} = {}) {
  const openai = client || (createClient ? createClient() : createOpenAIClient());
  const selectedModel = model || DEFAULT_MINICHAT_MODEL;
  const request = {
    model: selectedModel,
    input,
  };

  if (systemPrompt) {
    request.instructions = systemPrompt;
  }
  if (tools.length > 0) {
    request.tools = tools;
  }

  const response = await openai.responses.create(request);

  return {
    text: extractResponseText(response),
    totalTokens: extractTotalTokens(response),
    model: selectedModel,
    raw: response,
  };
}

async function generateMiniChatResponse({
  message,
  history = [],
  settings = {},
  systemPrompt = '',
  enableWebSearch = false,
  model,
  createOpenAIClient: createClient,
  client,
} = {}) {
  const selectedModel = model || settings?.general?.minichatModel || DEFAULT_MINICHAT_MODEL;
  const input = buildMiniChatInput({ history, message });
  const tools = buildResponseTools({ enableWebSearch });

  return runOpenAIResponse({
    client,
    createOpenAIClient: createClient,
    input,
    model: selectedModel,
    tools,
    systemPrompt,
  });
}

module.exports = {
  DEFAULT_MINICHAT_MODEL,
  buildMiniChatInput,
  buildResponseTools,
  extractResponseText,
  generateMiniChatResponse,
  runOpenAIResponse,
};
