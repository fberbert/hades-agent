# Arquitetura

## Modelo de Alto Nível

Hades Agent tem duas zonas de confiança:

- Processo principal Electron: operações desktop privilegiadas, persistência em filesystem, handlers IPC, ciclo de vida de janelas, atalhos, tray, serviços de transcrição, busca e agendamento de tarefas.
- Renderer React: UI, captura de mídia via navegador, estado de chat, loop de requisição Gemini, orquestração de ferramentas e interação do usuário.

A fronteira é `preload.js`. Código do renderer chama `window.electron`; `preload.js` encaminha para `ipcRenderer`; `electron/ipc/*Handlers.js` atende a solicitação no processo principal.

## Fluxo de Inicialização

1. `main.js` carrega `.env` da raiz do repositório, se existir.
2. Aceleração de hardware e GPU são desativadas para estabilidade de transparência no Windows.
3. `app.whenReady()` configura permissões de mídia e headers CSP.
4. `initIPC()` registra todos os grupos de handlers a partir de `electron/ipc/index.js`.
5. Atalhos globais são registrados a partir das configurações persistidas por `electron/shortcuts.js`.
6. A bandeja do sistema é criada por `electron/tray.js`.
7. `taskService.start()` inicia polling de tarefas agendadas.
8. `dreamService.runDreamCycle()` é agendado uma vez logo após a inicialização e depois a cada 24 horas.
9. A splash window é criada sob demanda por `windowManager.createWindow('splash')`.

A maioria das janelas de funcionalidade não é pré-criada. Elas são criadas quando atalhos ou ações da tray precisam delas.

## Sistema de Janelas

`electron/windows/windowConfigs.js` é a fonte de verdade para propriedades de BrowserWindow. Ele define:

- `command`
- `chat`
- `voice`
- `susurroSetup`
- `susurro`
- `suggestions`
- `notification`
- `splash`
- `settings`

Cada config inclui dimensões, transparência, frame, `alwaysOnTop`, URL e `webPreferences`.

Padrões críticos de segurança:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`

`electron/windows/windowManager.js` cria e cacheia janelas, aplica content protection, controla blur/hide, liga atalhos de DevTools e centraliza show/hide.

No Linux, as opções visuais usam fallback opaco para evitar janelas pretas em compositores X11/Wayland.

## Roteamento de Janelas no Renderer

Todas as janelas renderizadas pelo Vite carregam o mesmo app React. `src/App.tsx` lê `globalThis.location.search` e escolhe o componente ativo:

- `?window=splash` -> `Splash`
- `?window=chat` -> `MiniChat`
- `?window=voice` -> `VoiceRecorder`
- `?window=susurro` -> `Susurro`
- `?window=suggestions` -> `SuggestionsPopup`
- `?window=settings` -> `Settings`
- parâmetro ausente ou desconhecido -> `CommandBar`

Novas janelas normalmente exigem uma config de janela e uma rota em `App.tsx`.

## Fronteira IPC

A pilha IPC tem quatro camadas:

1. `preload.js` expõe métodos em `window.electron`.
2. `src/types/electron.ts` descreve a API vista pelo renderer.
3. `src/services/electron.ts` encapsula a API global para código React.
4. `electron/ipc/*Handlers.js` implementa os handlers no main process.

Ao adicionar ou alterar IPC, atualize todas as camadas juntas.

## Camada de Services

`electron/services/` contém services de funcionalidade no main process:

- `aiService.js` - geração Gemini para sugestões, títulos e transcrição de áudio.
- `geminiLiveService.js` - sessão Gemini Live para transcrição PCM em tempo real.
- `searchService.js` - busca web Tavily.
- `translationService.js` - wrapper de tradução.
- `taskService.js` - polling e execução de tarefas agendadas.
- `dreamService.js` - consolidação de memória em segundo plano sobre logs de sessão.
- `skillService.js` - persistência e busca de skills locais.
- `sessionLogger.js` - persistência de logs de sessão.
- `logger.js` - helper de logging.

Hooks do renderer devem acessar esses services por IPC, não por import direto.

## Exemplos de Fluxo de Dados

### Command Bar Para MiniChat

1. Usuário abre o comando com o atalho configurado, por padrão `Alt+D`.
2. `electron/shortcuts.js` cria ou mostra a janela `command`.
3. `CommandBar` coleta texto e imagem opcional.
4. `useCommandBar` chama `electronService.sendMessage`.
5. `preload.js` envia `send-message`.
6. `main.js` recebe `send-message`, mostra ou cria `chat` e envia `new-message`.
7. `MiniChat` recebe `new-message`, adiciona o texto do usuário e roda o loop de IA.

### Loop de IA do MiniChat

1. `useMiniChat` recebe uma mensagem pendente.
2. `useGemini` monta o system prompt do Hades usando `src/constants/prompts.ts`.
3. O hook chama Gemini com as ferramentas declaradas em `src/constants/tools.ts`.
4. Chamadas de ferramenta são executadas localmente em `executeTool`.
5. Resultados das ferramentas são adicionados ao loop de conversa.
6. O texto final é adicionado como mensagem do assistente e persistido.

### Transcrição Ao Vivo do Susurro

1. Usuário abre Susurro com `Alt+B`.
2. `shortcuts.js` mostra `susurro` e envia `start-susurro`.
3. `useTranscription` chama `startSusurroLive`.
4. `susurroHandlers.js` delega para `geminiLiveService.start`.
5. `useAudioRecorder` captura áudio suportado, converte chunks para PCM16/base64 e envia `susurro-send-chunk`.
6. `geminiLiveService` envia chunks ao Gemini Live e emite deltas de transcrição.
7. O renderer atualiza estado de transcript e tradução/sugestões opcionais.

## Regras Arquiteturais

- Mantenha comportamento privilegiado no processo principal Electron.
- Mantenha código do renderer declarativo e seguro para navegador.
- Mantenha nomes de IPC estáveis, a menos que todas as camadas de ponte, tipos, wrappers e handlers sejam atualizadas.
- Mantenha `jsonStore.js` como entrada única de persistência.
- Mantenha configs de janelas centralizadas.
- Mantenha texto de prompts em `prompts/`, não embutido em componentes.
- Mantenha validação determinística em código, não em prompts de modelo.
