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

- `sendMessage(message, image)`
- `onNewChatMessage(callback)`
- `onFocusInput(callback)`
- `onNotify(callback)`
- `showNotification(text)`
- `notifHidden()`

Handlers:

- `main.js` trata `send-message` e `chat-window-ready`.
- `electron/ipc/windowHandlers.js` trata eventos de notificação.

### Gerenciamento de Janelas

Métodos do preload:

- `closeWindow()`
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

### Chat e Estado de Sessão

Métodos do preload:

- `getChat()`
- `saveChat(history)`
- `updateChatStatus(hasMessages)`
- `updateTokens(count)`
- `getTotalTokens()`
- `endSession(type)`
- `chatWindowReady()`

Handler:

- `electron/ipc/chatHandlers.js`

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
- `getSystemAudioSourceId()`

Handlers:

- `electron/ipc/susurroHandlers.js`
- `electron/ipc/voiceHandlers.js`
- `electron/ipc/toolHandlers.js` para busca de source id de áudio do sistema.

Services:

- `electron/services/geminiLiveService.js`
- `electron/services/aiService.js`

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
- `src/hooks/useGemini.ts`

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
- `searchWeb(query)`
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
