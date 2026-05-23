# Referência de IPC do Electron

## Forma do Contrato

Código do renderer usa `window.electron`, exposto por `preload.js`. Código React normalmente deve chamá-lo por `src/services/electron.ts`.

Handlers do main process são registrados por `electron/ipc/index.js`:

```js
registerWindowHandlers();
registerChatHandlers();
registerPersonaHandlers();
registerTaskHandlers();
registerSusurroHandlers();
registerToolHandlers();
registerVoiceHandlers();
registerAIHandlers();
registerSettingsHandlers();
```

## Procedimento de Mudança

Ao adicionar ou alterar um método IPC, atualize juntos:

1. `preload.js` - expor método ou assinatura de evento.
2. `src/types/electron.ts` - atualizar `ElectronAPI`.
3. `src/services/electron.ts` - adicionar ou ajustar o wrapper do renderer.
4. `electron/ipc/*Handlers.js` - implementar o handler.
5. Hooks/componentes chamadores.
6. Este documento, se o canal for durável.

Não exponha `ipcRenderer` bruto ao renderer.

## Grupos de Canais

### Mensagens e UI Centrais

Métodos do preload:

- `sendMessage(message, image, options)`
- `onNewChatMessage(callback)`
- `onFocusInput(callback)`
- `onNotify(callback)`
- `showNotification(text)`
- `notifHidden()`

Handlers:

- `main.js` trata `send-message` e `chat-window-ready`.
- `electron/ipc/windowHandlers.js` trata eventos de notificação.

`options.source` identifica a origem da mensagem (`text`, `voice` ou `task`). O fluxo Voice envia `{ source: 'voice' }`; o MiniChat cruza essa origem com `settings.response` para decidir se também reproduz a resposta em áudio. A resposta textual é sempre exibida.

### Gerenciamento de Janelas

Métodos do preload:

- `closeWindow()`
- `hideVoiceWindow()`
- `minimizeWindow()`
- `resizeWindow(w, h)`
- `showChat()`
- `togglePin()`
- `isPinned()`
- `isMinimized()`
- `isMaximized()`
- `startResizing()`
- `updateChatPin(pinned)`
- `toggleMic(enabled)`
- `toggleAudio(enabled)`

Handlers:

- `electron/ipc/windowHandlers.js`
- alguns toggles de áudio do Susurro são tratados por `electron/ipc/susurroHandlers.js`.

`closeWindow()` ainda é genérico e pode esconder múltiplas janelas dependendo da origem. O Voice Recorder deve usar `hideVoiceWindow()` para cancelar ou finalizar sem fechar o MiniChat.

### Chat e Estado de Sessão

Métodos do preload:

- `getChat()`
- `saveChat(history)`
- `updateChatStatus(hasMessages)`
- `updateTokens(count)`
- `getTotalTokens()`
- `endSession(type)`
- `chatWindowReady()`
- `assistantGenerateResponse(payload)`

Handler:

- `electron/ipc/chatHandlers.js`
- `electron/ipc/aiHandlers.js`

Service:

- `electron/services/openaiResponsesService.js`

`assistantGenerateResponse` é o caminho OpenAI-first do MiniChat. O renderer envia mensagem, histórico, system prompt, modelo e flag de web search; o main process lê a OpenAI API key das settings/env e retorna texto, modelo e total de tokens.

### Tarefas

Métodos do preload:

- `scheduleTask(data)`
- `getTasks()`
- `deleteTask(id)`
- `onExecuteTask(callback)`

Handler:

- `electron/ipc/taskHandlers.js`

Service:

- `electron/services/taskService.js`

### Susurro e Voz

Métodos do preload:

- `startSusurroLive(persona)`
- `stopSusurroLive()`
- `sendSusurroChunk(base64, seq)`
- `onSusurroLiveDelta(callback)`
- `onSusurroLiveStatus(callback)`
- `onToggleSusurroTranscriptionSignal(callback)`
- `onStartSusurro(callback)`
- `onStopSusurro(callback)`
- `transcribeAudio(base64)`
- `synthesizeSpeech(text, options)`
- `getSystemAudioSourceId()`

Handlers:

- `electron/ipc/susurroHandlers.js`
- `electron/ipc/voiceHandlers.js`
- `electron/ipc/toolHandlers.js` para busca de source id de áudio do sistema.

Services:

- `electron/services/aiService.js`
- `electron/services/openaiRealtimeTranscriptionService.js`
- `electron/services/openaiTranscriptionService.js`
- `electron/services/openaiSpeechService.js`

`startSusurroLive(persona)` invoca `susurro-start-live` e cria uma sessão OpenAI Realtime Transcription no main process usando a OpenAI API key das settings/env. O modelo padrão do service realtime é `gpt-4o-mini-transcribe`, salvo override por `general.fullTranscriptionModel || general.sttModel`.

`sendSusurroChunk(base64, seq)` invoca `susurro-send-chunk` e encaminha chunks PCM16/base64 a 24 kHz para a sessão ativa. No Linux, esses chunks vêm do microfone capturado pelo renderer com `useAudioRecorder`; áudio do sistema no Linux ainda é fase separada com backend PulseAudio/PipeWire. `stopSusurroLive()` encerra a sessão. Status e deltas de transcrição retornam por `susurro-live-status` e `susurro-live-delta`.

`synthesizeSpeech` usa OpenAI TTS no main process e retorna `audioDataUrl`, `model`, `voice` e `format` para o renderer reproduzir localmente.

### Captura de Tela

Métodos do preload:

- `getSources()`
- `captureSource(sourceId)`
- `captureAllScreens()`
- `getCaptureCapabilities()`
- `onCaptureEvent(callback)`

Handler:

- `electron/ipc/toolHandlers.js`

Consumidores no renderer:

- `src/hooks/useCommandBar.ts`
- `src/hooks/useAssistantInference.ts`

### Personas e Sugestões

Métodos do preload:

- `getPersonas()`
- `savePersona(persona)`
- `deletePersona(id)`
- `toggleSuggestions(show)`
- `generateSuggestion(data)`
- `onNewSuggestion(callback)`
- `saveSusurroMessage(msg)`

Handlers:

- `electron/ipc/personaHandlers.js`
- `electron/ipc/susurroHandlers.js`

### Tradução

Métodos do preload:

- `translateText(text, target)`
- `translateIncremental(text, previousText, target)`
- `sendSusurroSetupComplete()`

Handlers:

- `electron/ipc/susurroHandlers.js`

Service:

- `electron/services/translationService.js`

### Ferramentas Utilitárias

Métodos do preload:

- `openFileDialog()`
- `getLolPlayerStats(args)`
- `openExternal(url)`
- `copyToClipboard(text)`

Handlers:

- `electron/ipc/windowHandlers.js`
- `electron/ipc/toolHandlers.js`

Nota: `getLolPlayerStats` é exposto em `preload.js`; verifique se o handler existe antes de depender dele.

### Skills e Memória

Métodos do preload:

- `saveSkill(args)`
- `listSkills()`
- `loadSkill(name)`
- `logSession(data)`
- `getLearnings()`

Handlers:

- `electron/ipc/toolHandlers.js`

Services:

- `electron/services/skillService.js`
- `electron/services/sessionLogger.js`
- `electron/services/dreamService.js`

### Settings

Métodos do preload:

- `getSettings()`
- `saveSettings(settings)`
- `applyStealthMode(enabled)`
- `getHistoryData()`
- `onSettingsUpdated(callback)`
- `disableShortcuts()`
- `enableShortcuts()`
- `getPlatformCapabilities()`

Handler:

- `electron/ipc/settingsHandlers.js`

Store:

- `electron/store/jsonStore.js`

## Padrão de Resposta

A maioria dos handlers retorna:

```ts
{
  success: boolean
  data?: T
  error?: string
}
```

Mantenha esse padrão para novos handlers, salvo forte motivo de compatibilidade.
