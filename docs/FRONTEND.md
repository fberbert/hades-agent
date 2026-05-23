# Frontend

## Organização do Renderer

O renderer é um app React/Vite em `src/`. Ele é usado por múltiplas janelas Electron. A seleção da janela acontece em `src/App.tsx` com base em `?window=...`.

Áreas principais:

- `src/components/` - componentes visuais de cada janela e funcionalidade.
- `src/hooks/` - comportamento com estado e orquestração de funcionalidades.
- `src/services/electron.ts` - wrapper do renderer sobre `window.electron`.
- `src/constants/` - prompts, modelos, idiomas, áudio e timers de tradução.
- `src/types/` - contratos TypeScript do lado do renderer.
- `src/utils/` - helpers de áudio, imagem, transcrição e IA.
- `src/styles/` - CSS separado por funcionalidade.

## Mapa de Componentes

- `CommandBar.tsx` - overlay de comando com texto/imagem.
- `MiniChat.tsx` - HUD de conversa do assistente.
- `VoiceRecorder.tsx` - gravação curta de voz e fluxo de transcrição.
- `Susurro.tsx` - HUD de transcrição e tradução ao vivo.
- `SuggestionsPopup.tsx` - overlay baixo de sugestões.
- `Settings.tsx` - casca de configurações.
- `settings/*` - abas de histórico, geral, áudio e atalhos.
- `chat/*` - cabeçalho, lista, bolha/conteúdo de mensagem e menu de settings.
- `susurro/*` - cabeçalho, menu, lista de chat e card de mensagem.

## Responsabilidades dos Hooks

- `useCommandBar` - estado de input, anexos, captura de tela, tamanho dinâmico e ação de envio.
- `useMiniChat` - orquestração do chat, seleção de modelo, timers, tokens e menu.
- `useChatState` - merge de histórico local e persistido, append, clear e persistência.
- `useAssistantInference` - monta system prompt e usa OpenAI via IPC.
- `useSusurro` - estado do Susurro, personas, transcrição, tradução, sugestões, timers e menu.
- `useTranscription` - start/stop da transcrição realtime, agregação de turnos e status.
- `useAudioRecorder` - captura de áudio suportada, AudioWorklet, silence gating e chunks PCM16/base64.
- `useTranslation` - ciclo de tradução em segundo plano para mensagens do Susurro.
- `useVoiceRecorder` - gravação one-shot, WAV, envio para transcrição e finalização.
- `useSettings` - carregamento, edição, salvamento e estado de atalhos/settings.
- `useWindowControl` - fixar, minimizar e redimensionar.
- `useClipboard` - estado de cópia com timeout.
- `usePersonas` - carregamento e persistência de personas do Susurro.

## Regra da API do Renderer

Código do renderer deve usar:

```ts
import { electronService } from '@/services/electron'
```

Não importe `electron`, `fs`, `path` ou módulos do main process em código React.

Quando o renderer precisar de novo comportamento privilegiado, adicione por:

1. `preload.js`
2. `src/types/electron.ts`
3. `src/services/electron.ts`
4. `electron/ipc/<feature>Handlers.js`

## Estilos

CSS é separado por funcionalidade:

- `src/index.css`
- `src/styles/base.css`
- `src/styles/layout.css`
- `src/styles/components.css`
- `src/styles/command.css`
- `src/styles/chat.css`
- `src/styles/voice.css`
- `src/styles/settings.css`
- `src/styles/setup.css`
- `src/styles/susurro.css`

Siga o arquivo CSS existente do componente tocado. Não mova estilos amplos sem uma tarefa explícita de limpeza visual.

## Modelos e Prompts

Labels, provider, tipo e defaults de modelos ficam em `src/constants/models.ts`. O default é `gpt-5-nano`.

A montagem de prompts fica em `src/constants/prompts.ts`. Os corpos brutos são importados de:

- `prompts/hadesSystem.md`
- `prompts/susurroSystem.md`
- `prompts/dreamService.md`

Se comportamento de prompt mudar, atualize `docs/AI_AND_TOOLS.md`.

## Padrões Comuns de Mudança no Frontend

### Adicionar uma Nova Janela

Atualize:

- `electron/windows/windowConfigs.js`
- `src/App.tsx`
- `preload.js` e handlers IPC, se a janela precisar de backend.
- `electron/shortcuts.js` ou `electron/tray.js`, se precisar de entrada.
- `docs/ARCHITECTURE.md` e este arquivo.

### Adicionar um Novo Campo de Settings

Atualize:

- settings padrão em `electron/store/jsonStore.js`;
- tipos em `src/types/electron.ts` ou tipos compartilhados, se existirem;
- `src/hooks/useSettings.ts`;
- aba relevante em `src/components/settings/*`;
- qualquer service que consuma o setting;
- `docs/DATA_AND_STORAGE.md`.

Settings também carrega capacidades de plataforma por IPC e repassa para abas que precisam mostrar avisos degradados no Linux. Esses dados de capacidade não são persistidos como settings do usuário.

### Alterar Inferência do MiniChat

Atualize:

- `src/hooks/useAssistantInference.ts`;
- `preload.js`, `src/types/electron.ts`, `src/services/electron.ts` e `electron/ipc/aiHandlers.js`, se o contrato IPC mudar;
- `electron/services/openaiResponsesService.js`;
- `docs/AI_AND_TOOLS.md`.
