const logger = require('./logger');
const { DEFAULT_MINICHAT_MODEL, runOpenAIResponse } = require('./openaiResponsesService');

const SESSION_TITLE_SYSTEM_PROMPT = [
  'Você é um gerador de títulos de sessão. Dada a mensagem do usuário, produza um título conciso e descritivo.',
  'Regras:',
  '- Mínimo de 2 palavras, máximo de 5 palavras',
  '- Letra maiúscula em cada palavra principal (Title Case)',
  '- Sem pontuação no final',
  '- Sem aspas, sem emojis, sem markdown',
  '- Orientado a ação quando possível (ex: "Corrigindo Bug de Login", "Configurando Tema Escuro")',
  '- O TÍTULO DEVE SER GERADO EM PORTUGUÊS (PT-BR)',
  '- Retorne APENAS o título, nada mais'
].join('\n');

function buildSuggestionPrompt({ transcription, personaPrompt }) {
  return `Persona: ${personaPrompt}\n\nTranscription Chunk: ${transcription}\n\nBased on the persona and the transcription, generate a brief suggestion or insight. Be concise. Use markdown if needed.`;
}

function sanitizeTitle(raw, fallback) {
  return String(raw || '').trim().replace(/['"]/g, '').replace(/\n.*/g, '').trim() || fallback;
}

class AIService {
  constructor(deps = {}) {
    this.jsonStore = deps.jsonStore || null;
    this.logger = deps.logger || logger;
    this.runOpenAIResponse = deps.runOpenAIResponse || runOpenAIResponse;
  }

  getSettings() {
    const store = this.jsonStore || require('../store/jsonStore');
    return store.getSettings();
  }

  async generateSuggestion({ transcription, personaPrompt }) {
    try {
      const settings = this.getSettings();
      const result = await this.runOpenAIResponse({
        model: settings?.general?.minichatModel || DEFAULT_MINICHAT_MODEL,
        input: [
          {
            role: 'user',
            content: buildSuggestionPrompt({ transcription, personaPrompt }),
          },
        ],
      });
      return result.text?.trim() || null;
    } catch (err) {
      this.logger.error('AI', 'Error generating suggestion', err);
      return null;
    }
  }

  async generateSessionTitle(firstMessage) {
    const fallback = this._fallbackTitle(firstMessage);

    try {
      const settings = this.getSettings();
      const result = await this.runOpenAIResponse({
        model: settings?.general?.minichatModel || DEFAULT_MINICHAT_MODEL,
        systemPrompt: SESSION_TITLE_SYSTEM_PROMPT,
        input: [{ role: 'user', content: firstMessage.substring(0, 500) }],
      });
      return sanitizeTitle(result.text, fallback);
    } catch (err) {
      this.logger.error('AI', 'Error generating session title', err);
      return fallback;
    }
  }

  _fallbackTitle(text) {
    if (!text) return 'Nova Sessão';
    return text.substring(0, 40).trim() + (text.length > 40 ? '...' : '');
  }

  async transcribeAudio(base64Audio) {
    const { transcribeWavBase64 } = require('./openaiTranscriptionService');
    const settings = this.getSettings();
    const result = await transcribeWavBase64(base64Audio, {
      model: settings?.general?.sttModel || 'gpt-4o-mini-transcribe',
    });
    return result.text;
  }
}

module.exports = new AIService();
module.exports.AIService = AIService;
module.exports.buildSuggestionPrompt = buildSuggestionPrompt;
module.exports.sanitizeTitle = sanitizeTitle;
