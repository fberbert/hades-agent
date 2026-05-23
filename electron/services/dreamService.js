const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const logger = require('./logger');
const sessionLogger = require('./sessionLogger');
const { DEFAULT_MINICHAT_MODEL, runOpenAIResponse } = require('./openaiResponsesService');

function selectDreamingModel(settings = {}) {
  const configuredModel = settings.general?.dreamingModel;
  return typeof configuredModel === 'string' && configuredModel.startsWith('gpt-')
    ? configuredModel
    : DEFAULT_MINICHAT_MODEL;
}

class DreamService {
  constructor(deps = {}) {
    const userDataPath = path.join(os.homedir(), '.Hades');
    this.memoryDir = deps.memoryDir || path.join(userDataPath, 'memory');
    this.sessionLogger = deps.sessionLogger || sessionLogger;
    this.jsonStore = deps.jsonStore || null;
    this.logger = deps.logger || logger;
    this.runOpenAIResponse = deps.runOpenAIResponse || runOpenAIResponse;

    if (!fs.existsSync(this.memoryDir)) {
      fs.mkdirSync(this.memoryDir, { recursive: true });
    }
  }

  getSettings() {
    const store = this.jsonStore || require('../store/jsonStore');
    return store.getSettings();
  }

  async runDreamCycle() {
    this.logger.info('DreamService', 'Starting dream cycle...');
    const settings = this.getSettings();

    if (settings?.general?.dreamingEnabled === false) {
      this.logger.info('DreamService', 'Dream cycle is disabled in settings. Skipping.');
      return;
    }

    const sessions = this.sessionLogger.getUnprocessedSessions();
    if (sessions.length === 0) {
      this.logger.info('DreamService', 'No new sessions to process.');
      return;
    }

    try {
      this.logger.info('DreamService', `Analyzing ${sessions.length} sessions...`);

      let combinedLogs = '';
      sessions.forEach(s => {
        try {
          combinedLogs += `\n--- Session ---\n${JSON.stringify(s.data)}\n`;
        } catch (e) {
          this.logger.error('DreamService', 'Error processing session data', e);
        }
      });

      if (combinedLogs.length > 50000) {
        combinedLogs = combinedLogs.substring(combinedLogs.length - 50000);
      }

      const promptTemplate = fs.readFileSync(path.join(__dirname, '../../prompts/dreamService.md'), 'utf-8');
      const prompt = promptTemplate.replace('{{combinedLogs}}', combinedLogs);
      const dreamingModel = selectDreamingModel(settings);
      this.logger.info('DreamService', `Generating dream insights using model: ${dreamingModel}`);

      const response = await this.runOpenAIResponse({
        model: dreamingModel,
        input: [{ role: 'user', content: prompt }],
      });
      const insightsText = response.text || 'Nenhum padrão novo detectado.';

      const learningsPath = path.join(this.memoryDir, 'learnings.json');
      let currentLearnings = [];
      if (fs.existsSync(learningsPath)) {
        try {
          currentLearnings = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
        } catch (e) {
          this.logger.error('DreamService', 'Error parsing learnings.json', e);
          currentLearnings = [];
        }
      }

      currentLearnings.push({
        date: new Date().toISOString(),
        processedSessions: sessions.length,
        insights: insightsText.split('\n').filter(i => i.trim() !== '')
      });

      if (currentLearnings.length > 10) {
        currentLearnings = currentLearnings.slice(-10);
      }

      fs.writeFileSync(learningsPath, JSON.stringify(currentLearnings, null, 2), 'utf-8');
      sessions.forEach(s => this.sessionLogger.markSessionAsProcessed(s.file));
      this.logger.info('DreamService', 'Dream cycle completed successfully. Found insights.');
    } catch (error) {
      this.logger.error('DreamService', 'Error during dream cycle', error);
    }
  }

  getLearnings() {
    const learningsPath = path.join(this.memoryDir, 'learnings.json');
    if (fs.existsSync(learningsPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(learningsPath, 'utf-8'));
        if (data.length > 0) {
          const recentLearnings = data.slice(-3);
          const allInsights = recentLearnings.flatMap(l => l.insights);
          if (allInsights.length > 0) {
            return allInsights.join('\n');
          }
        }
      } catch (e) {
        this.logger.error('DreamService', 'Error reading learnings.json in getLearnings', e);
      }
    }
    return 'Nenhuma memória consolidada ainda.';
  }
}

module.exports = new DreamService();
module.exports.DreamService = DreamService;
module.exports.selectDreamingModel = selectDreamingModel;
