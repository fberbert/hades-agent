/**
 * Standardized response from the Electron backend.
 */
export interface IPCResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PlatformFeatureSummary {
  contentProtection: { supported: boolean; level: string };
  micaBackground: { supported: boolean };
  globalShortcuts: { supported: boolean; needsWaylandPortal: boolean };
  trayPngIcon: { supported: boolean };
  desktopCapture: { supported: boolean; caveat: string };
  systemAudioCapture: { supported: boolean; caveat: string };
}

export interface AssistantGeneratePayload {
  message: string;
  history: any[];
  systemPrompt: string;
  model?: string;
  enableWebSearch?: boolean;
}

export interface AssistantGenerateResult {
  text: string;
  totalTokens: number;
  model: string;
}

export interface ChatMessageOptions {
  speakResponse?: boolean;
  source?: 'text' | 'voice' | 'task';
}

export interface SpeechSynthesisResult {
  audioDataUrl: string;
  model: string;
  voice: string;
  format: string;
}

export interface ElectronAPI {
  // Window Control
  closeWindow: () => Promise<IPCResponse<void>>;
  hideVoiceWindow: () => Promise<IPCResponse<void>>;
  minimizeWindow: () => Promise<IPCResponse<void>>;
  resizeWindow: (width: number, height: number) => Promise<IPCResponse<void>>;
  togglePin: () => void;
  isPinned: () => Promise<boolean>;
  isMinimized: () => Promise<boolean>;
  isMaximized: () => Promise<boolean>;
  startResizing: () => void;
  toggleMic: (enabled: boolean) => void;
  toggleAudio: (enabled: boolean) => void;
  
  // Messaging & Notifications
  sendMessage: (text: string, image?: string | null, options?: ChatMessageOptions) => void;
  showNotification: (text: string) => void;
  onNewChatMessage: (callback: (msg: string, img?: string, options?: ChatMessageOptions) => void) => () => void;
  onFocusInput: (callback: () => void) => () => void;
  onNotify: (callback: (message: string) => void) => () => void;
  notifHidden: () => void;
  
  // Screen Capture
  getSources: () => Promise<any[]>;
  captureSource: (sourceId: string) => Promise<string>;
  captureAllScreens: () => Promise<string | string[]>;
  getCaptureCapabilities: () => Promise<IPCResponse<any>>;
  onCaptureEvent: (callback: () => void) => () => void;
  
  // Chat History & Tokens
  getChat: () => Promise<IPCResponse<any[]>>;
  saveChat: (history: any[]) => void;
  updateChatStatus: (hasMessages: boolean) => void;
  endSession: (type?: string) => Promise<IPCResponse<any>>;
  getTotalTokens: () => Promise<IPCResponse<number>>;
  updateTokens: (count: number) => Promise<IPCResponse<number>>;
  chatWindowReady: () => void;
  assistantGenerateResponse: (payload: AssistantGeneratePayload) => Promise<IPCResponse<AssistantGenerateResult>>;
  
  // Susurro (Live Transcription)
  startSusurroLive: (personaPrompt?: string) => Promise<IPCResponse<boolean>>;
  stopSusurroLive: () => Promise<IPCResponse<void>>;
  sendSusurroChunk: (base64: string, seq: number) => void;
  onSusurroLiveDelta: (callback: (delta: any) => void) => () => void;
  onSusurroLiveStatus: (callback: (status: string) => void) => () => void;
  onToggleSusurroTranscriptionSignal: (callback: () => void) => () => void;
  onStartSusurro: (callback: () => void) => () => void;
  onStopSusurro: (callback: () => void) => () => void;
  generateSuggestion: (data: { transcription: string, personaPrompt: string }) => Promise<IPCResponse<string>>;
  saveSusurroMessage: (msg: any) => Promise<IPCResponse<void>>;
  
  // Tools & IPC
  openFileDialog: () => Promise<string | null>;
  
  // Skills System
  saveSkill: (args: { name: string, description: string, procedure: string }) => Promise<IPCResponse<any>>;
  listSkills: () => Promise<IPCResponse<any[]>>;
  loadSkill: (name: string) => Promise<IPCResponse<string>>;

  // Session Logging
  logSession: (data: any) => Promise<IPCResponse<any>>;
  getLearnings: () => Promise<IPCResponse<string>>;
  logRendererDiagnostic: (source: string, message: string, detail?: any) => void;

  scheduleTask: (args: any) => Promise<IPCResponse<any>>;

  getTasks: () => Promise<IPCResponse<any[]>>;
  deleteTask: (id: string) => Promise<IPCResponse<void>>;
  onExecuteTask: (callback: (task: any) => void) => () => void;
  showChat: () => void;
  translateText: (text: string, targetLanguage: string) => Promise<IPCResponse<string>>;
  translateIncremental: (text: string, previousText: string, targetLanguage: string) => Promise<IPCResponse<string>>;
  transcribeAudio: (base64: string) => Promise<IPCResponse<string>>;
  synthesizeSpeech: (text: string, options?: any) => Promise<IPCResponse<SpeechSynthesisResult>>;
  getSystemAudioSourceId: () => Promise<IPCResponse<string>>;
  updateChatPin: (pinned: boolean) => void;
  getPersonas: () => Promise<IPCResponse<any[]>>;
  savePersona: (persona: any) => Promise<IPCResponse<void>>;
  deletePersona: (id: string) => Promise<IPCResponse<void>>;

  // Voice Recording
  onStartVoice: (callback: () => void) => () => void;
  onVoiceSend: (callback: () => void) => () => void;

  // Translation & Setup
  sendSusurroSetupComplete: () => void;
  downloadTranslationModel: () => void;
  onTranslationDownloadProgress: (callback: (progress: number) => void) => () => void;
  onTranslationDownloadStatus: (callback: (status: string) => void) => () => void;
  onTranslationDownloadComplete: (callback: () => void) => () => void;
  onTranslationDownloadError: (callback: (error: string) => void) => () => void;

  // Suggestions
  toggleSuggestions: (enabled: boolean) => void;
  onNewSuggestion: (callback: (text: string) => void) => () => void;

  // --- Settings ---
  getSettings: () => Promise<SettingsData>;
  getPlatformCapabilities: () => Promise<IPCResponse<PlatformFeatureSummary>>;
  saveSettings: (settings: SettingsData) => Promise<IPCResponse<void>>;
  applyStealthMode: (enabled: boolean) => Promise<IPCResponse<any>>;
  getHistoryData: () => Promise<IPCResponse<{ susurroHistory: any[], chatHistory: any[] }>>;
  onSettingsUpdated: (callback: (settings: SettingsData) => void) => () => void;
  disableShortcuts: () => Promise<IPCResponse<void>>;
  enableShortcuts: () => Promise<IPCResponse<void>>;

  // Misc
  openExternal: (url: string) => void;
  copyToClipboard: (text: string) => void;
}

export interface AudioSettings {
  inputDeviceId: string;
  outputDeviceId: string;
  micEnabled: boolean;
  micVolume: number;
  systemAudioEnabled: boolean;
  systemAudioVolume: number;
}

export interface GeneralSettings {
  openaiApiKey: string;
  minichatModel: string;
  sttModel: string;
  fullTranscriptionModel: string;
  realtimeModel: string;
  stealthMode: boolean;
  dreamingEnabled: boolean;
  dreamingModel: string;
}

export interface ResponseSettings {
  audioForVoiceInput: boolean;
  alwaysAudio: boolean;
}

export interface ShortcutsSettings {
  toggleCommand: string;
  toggleChat: string;
  toggleSettings: string;
  toggleSusurro: string;
  toggleVoice: string;
}

export interface SettingsData {
  audio: AudioSettings;
  general: GeneralSettings;
  response: ResponseSettings;
  shortcuts?: ShortcutsSettings;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
