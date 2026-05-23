# Visão Geral do Projeto

## O Que é o Hades Agent

Hades Agent é um assistente desktop Electron com foco original em Windows e suporte Linux experimental baseado em capacidades. Ele roda como janelas overlay acionadas por teclado e fornece:

- barra de comando estilo Spotlight aberta com `Alt+D`;
- MiniChat aberto diretamente com `Alt+C`;
- janela MiniChat persistente para respostas do modelo, contagem de tokens e histórico de sessão;
- HUD de transcrição ao vivo Susurro aberto com `Alt+B`;
- fluxo de captura de voz aberto com `Alt+V`;
- configurações e gerenciamento de atalhos abertos com `Alt+S`;
- busca web via OpenAI Responses, captura de tela, anexos de imagem, chamadas de ferramentas de IA, skills locais, tarefas agendadas e consolidação de memória em segundo plano.

O app é composto por um processo principal Electron e um renderer React/Vite em sandbox. O renderer não acessa Node ou Electron diretamente; ele usa `window.electron`, exposto por `preload.js`.

## Capacidades do Produto

### Command Bar

A barra de comando é a janela padrão do renderer (`?window=command`). Ela aceita texto, imagens coladas e capturas de tela, depois envia uma mensagem ao MiniChat por IPC.

Arquivos principais:

- `src/components/CommandBar.tsx`
- `src/hooks/useCommandBar.ts`
- `electron/shortcuts.js`
- `main.js`

### MiniChat

MiniChat é a janela de conversa do assistente (`?window=chat`). Ele gerencia estado do chat, usa OpenAI Responses API, contabiliza tokens e pode ser fixado.

Arquivos principais:

- `src/components/MiniChat.tsx`
- `src/hooks/useMiniChat.ts`
- `src/hooks/useChatState.ts`
- `src/hooks/useAssistantInference.ts`
- `electron/ipc/aiHandlers.js`
- `electron/services/openaiResponsesService.js`
- `electron/ipc/chatHandlers.js`

### Susurro

Susurro é o modo de transcrição e tradução ao vivo (`?window=susurro`). O backend realtime usa OpenAI Realtime Transcription no processo principal: `startSusurroLive(persona)` abre a sessão, o renderer envia chunks PCM16/base64 a 24 kHz por `susurro-send-chunk`, e status/deltas voltam por `susurro-live-status` e `susurro-live-delta`. No Linux, a primeira fase usa microfone; captura de áudio do sistema ainda depende de um backend PulseAudio/PipeWire separado.

Arquivos principais:

- `src/components/Susurro.tsx`
- `src/hooks/useSusurro.ts`
- `src/hooks/useTranscription.ts`
- `src/hooks/useAudioRecorder.ts`
- `src/hooks/useTranslation.ts`
- `electron/ipc/susurroHandlers.js`
- `electron/services/openaiRealtimeTranscriptionService.js`

### Voice Recorder

O fluxo de voz (`?window=voice`) grava áudio, converte para WAV/base64, envia por IPC e insere automaticamente a transcrição no chat com `gpt-4o-mini-transcribe`. Quando a mensagem vem do `Alt+V`, o MiniChat mantém a janela aberta e reproduz a resposta com TTS OpenAI (`gpt-4o-mini-tts`).

Arquivos principais:

- `src/components/VoiceRecorder.tsx`
- `src/hooks/useVoiceRecorder.ts`
- `electron/ipc/voiceHandlers.js`
- `electron/services/openaiSpeechService.js`
- `electron/services/aiService.js`

### Settings

Settings gerencia OpenAI API Key, modelos, áudio, stealth mode, histórico e atalhos globais.

Arquivos principais:

- `src/components/Settings.tsx`
- `src/components/settings/*`
- `src/hooks/useSettings.ts`
- `electron/ipc/settingsHandlers.js`
- `electron/store/jsonStore.js`

## Stack Técnica

- Runtime desktop: Electron 42.
- Renderer: React 19, React DOM 19, TypeScript, Vite 8.
- SDK de IA: `openai`.
- Busca: OpenAI `web_search_preview` pela Responses API.
- Áudio: APIs de mídia do navegador, AudioWorklet e utilitários de conversão PCM.
- Desktop: Electron BrowserWindow, Tray, globalShortcut, desktopCapturer, clipboard e shell.
- Persistência: arquivos JSON em `app.getPath('userData')`, centralizados em `electron/store/jsonStore.js`.
- Build/pacote: Vite e `electron-builder`, com Windows como alvo padrão e Linux por scripts explícitos.

## Mapa do Repositório

```text
.
├── main.js                         # Entrada do processo principal Electron
├── preload.js                      # Ponte segura exposta como window.electron
├── package.json                    # scripts npm, dependências e electron-builder
├── vite.config.ts                  # Vite, renderer na porta 3000
├── index.html                      # entrada HTML do Vite
├── electron/
│   ├── appState.js                 # flags runtime compartilhadas no main process
│   ├── ipc/                        # handlers IPC agrupados por funcionalidade
│   ├── platform/                   # capacidades e adapters por plataforma
│   ├── services/                   # IA, busca, tradução, tarefas, logs e skills
│   ├── store/jsonStore.js          # fonte de verdade da persistência JSON local
│   ├── tray.js                     # menu de bandeja do sistema
│   ├── shortcuts.js                # atalhos globais e toggles de janelas
│   └── windows/                    # configs BrowserWindow e gerenciador de ciclo de vida
├── prompts/                        # prompts Markdown carregados por constants
├── public/                         # ícones, HTML de notificação e áudio
├── scripts/                        # checks e smoke tests de plataforma
├── src/
│   ├── App.tsx                     # seletor de janela por query parameter
│   ├── components/                 # janelas e componentes de funcionalidades
│   ├── constants/                  # modelos, prompts, ferramentas, áudio/tradução
│   ├── hooks/                      # comportamento das funcionalidades e estado de UI
│   ├── services/electron.ts        # wrapper tipado sobre window.electron
│   ├── styles/                     # CSS por área
│   ├── types/                      # tipos do renderer e contratos IPC
│   └── utils/                      # helpers de áudio, imagem, IA e transcrição
└── docs/                           # base de conhecimento legível por agentes
```

## Ressalvas Importantes

- O README ainda descreve Windows como alvo principal testado; Linux é suportado por capacidades.
- `npm run dev` usa `taskkill`, então é orientado a Windows; use `npm run dev:linux` no Linux.
- O empacotamento padrão continua Windows, com Linux disponível via `npm run dist:linux`.
- `package.json` declara licença `ISC`, enquanto `README.md` referencia MIT. Não corrija isso silenciosamente sem uma decisão de licenciamento com escopo.
- OpenAI é o único provider de IA para MiniChat, voice transcription, sugestões, títulos e Dreaming.
- Algumas afirmações de README podem ser aspiracionais ou antigas; quando houver conflito, prefira o código inspecionado.
