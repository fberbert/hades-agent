# Dados e Armazenamento

## Fonte de Verdade

`electron/store/jsonStore.js` é a fonte de verdade para persistência local.

Ele armazena dados em:

```js
app.getPath('userData')
```

Não adicione persistência JSON independente em outro lugar sem atualizar esse arquivo e a documentação do store.

## Arquivos Armazenados

`jsonStore.js` define estes caminhos:

- `tasks.json`
- `chat_history.json`
- `tokens.json`
- `susurro_history.json`
- `personas.json`
- `settings.json`
- `sessions.json`

## Formato do Cache

O cache em memória contém:

- `tasks`
- `chatHistory`
- `personas`
- `susurroHistory`
- `sessions`
- `totalTokens`
- `settings`

Accessors expõem esses dados por métodos como:

- `getTasks()` / `saveTasks(tasks)`
- `getChatHistory()` / `saveChatHistory(history)`
- `getPersonas()` / `savePersonas(personas)`
- `getSusurroHistory()` / `saveSusurroHistory(history)`
- `getSessions()` / `saveSessions(sessions)`
- `getTotalTokens()` / `saveTokens(total)`
- `getSettings()` / `saveSettings(settings)`

## Schema de Settings

Settings padrão são definidas em `jsonStore.js`.

```js
{
  audio: {
    inputDeviceId: 'default',
    outputDeviceId: 'default',
    micEnabled: true,
    micVolume: 100,
    systemAudioEnabled: true,
    systemAudioVolume: 100
  },
  general: {
    apiKey: '',
    tavilyApiKey: '',
    minichatModel: 'gemini-2.5-flash',
    sttModel: 'gemini-2.5-flash',
    fullTranscriptionModel: 'gemini-2.5-flash',
    stealthMode: false,
    dreamingEnabled: true,
    dreamingModel: 'gemini-2.5-flash'
  },
  shortcuts: {
    toggleCommand: 'Alt+D',
    toggleSettings: 'Alt+S',
    toggleSusurro: 'Alt+B',
    toggleVoice: 'Alt+V'
  }
}
```

Settings são mescladas profundamente no carregamento para que novas chaves default sobrevivam a arquivos salvos antigos.

## Criptografia de Settings

`settings.json` é salvo por `safeSaveSettings()`, que criptografa a string JSON com AES-256-CBC.

Detalhes importantes:

- Derivação de chave usa `crypto.scryptSync`.
- Nome de usuário e salt estático são usados como material da chave.
- O IV é aleatório por escrita e prefixado ao ciphertext.
- `safeLoadSettings()` consegue carregar tanto JSON puro quanto conteúdo criptografado.

Não registre settings descriptografadas em logs. Trate todas as chaves de API como segredos.

## Variáveis de Ambiente

Na inicialização, `main.js` lê `.env` da raiz do repositório se existir.

`jsonStore.loadAll()` também popula:

- `process.env.VITE_GEMINI_API_KEY`
- `process.env.VITE_TAVILY_API_KEY`

Essas variáveis são preenchidas a partir de settings persistidas por compatibilidade.

`.env.example` documenta:

- `VITE_GEMINI_API_KEY`
- `VITE_TAVILY_API_KEY`

Chaves informadas pela UI são o caminho primário atual.

Capacidades runtime de plataforma, como suporte Linux a captura ou content protection, são derivadas por IPC na inicialização e não são persistidas em arquivos de settings.

## Históricos

Histórico de chat é usado por:

- `src/hooks/useChatState.ts`
- `electron/ipc/chatHandlers.js`
- `jsonStore.getChatHistory()`
- `jsonStore.saveChatHistory()`

Histórico do Susurro é usado por:

- `src/hooks/useSusurro.ts`
- `electron/ipc/susurroHandlers.js`
- `jsonStore.getSusurroHistory()`
- `jsonStore.saveSusurroHistory()`

Logs de sessão são usados por:

- `electron/services/sessionLogger.js`
- `electron/services/dreamService.js`

## Contabilidade de Tokens

O total de tokens é armazenado em `tokens.json` por:

- `getTotalTokens()`
- `saveTokens(total)`

O estado do renderer também guarda contadores de sessão em `localStorage` no MiniChat. Ao mudar comportamento de tokens, confira tanto estado local do renderer quanto totais do main process.

## Checklist de Mudança de Dados

- Adicione valor default em `jsonStore.js`.
- Garanta merge ou migração segura para arquivos salvos existentes.
- Adicione métodos IPC se o renderer precisar de acesso.
- Atualize a UI de settings se for visível ao usuário.
- Atualize este documento.
- Evite imprimir valores persistidos reais em logs ou saída de comandos.
