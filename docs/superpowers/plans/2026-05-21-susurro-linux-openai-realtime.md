# Susurro Linux OpenAI Realtime Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reativar o modo Susurro no Linux com transcrição realtime por microfone usando OpenAI, preservando a UI existente, tradução, sugestões e histórico.

**Architecture:** O renderer continua capturando áudio com `useAudioRecorder` e enviando chunks PCM16/base64 a 24 kHz por IPC. O main process passa a manter uma sessão WebSocket OpenAI Realtime Transcription por janela Susurro, traduzindo eventos OpenAI em `susurro-live-status` e `susurro-live-delta`. A primeira entrega usa microfone no Linux; captura de áudio do sistema entra em uma fase separada com backend PulseAudio/PipeWire.

**Tech Stack:** Electron IPC, React hooks, Web Audio/getUserMedia, `ws`, OpenAI Realtime Transcription WebSocket, Vitest, Linux X11/Wayland.

---

## Contexto Atual

- Estado histórico pré-implementação: `electron/ipc/susurroHandlers.js` retornava erro fixo em `susurro-start-live` antes da migração para OpenAI Realtime.
- `src/hooks/useTranscription.ts` já orquestra estado, status, deltas, sugestões, tokens e start/stop.
- `src/hooks/useAudioRecorder.ts` já captura microfone ou áudio do sistema e emite PCM16/base64 por chunk; Susurro Realtime usa 24 kHz.
- No Linux, áudio do sistema está bloqueado por capacidade; microfone é o menor caminho viável.
- `electron/services/openaiClient.js` já centraliza leitura segura da OpenAI API key via settings/env.
- O pacote `ws` já está em `dependencies`, então o main process pode abrir WebSocket sem nova dependência.

## Decisões

1. O Susurro Linux começa com microfone (`isSystemAudio: false`) e não tenta desktop/system audio na primeira fase.
2. O WebSocket fica no main process para manter a OpenAI API key fora do renderer.
3. O renderer continua recebendo os mesmos eventos atuais:
   - `susurro-live-status`
   - `susurro-live-delta`
4. Os deltas emitidos ao renderer usam o contrato atual:
   ```ts
   { text: string; isFinal: boolean }
   ```
5. Erros precisam ser visíveis em log e no estado do renderer. Status aceitos:
   - `connecting`
   - `ready`
   - `turn_complete`
   - `error`
   - `closed`
6. System audio no Linux entra depois, com detecção explícita e sem regressão para o microfone.

## Estrutura de Arquivos

- Criar `electron/services/openaiRealtimeTranscriptionService.js`
  - WebSocket OpenAI Realtime Transcription.
  - Helpers testáveis de payload, parse de eventos e estado.
  - Classe de sessão com `start()`, `appendAudio(base64, seq)`, `stop()`.
- Criar `tests/services/openaiRealtimeTranscriptionService.test.js`
  - Testes de payload, normalização de eventos e controle de sessão com WebSocket falso.
- Modificar `electron/ipc/susurroHandlers.js`
  - Substituir erro fixo por sessão realtime real.
  - Encaminhar chunks de `susurro-send-chunk`.
  - Fechar sessão em `susurro-stop-live`.
- Modificar `src/hooks/useTranscription.ts`
  - Usar microfone por padrão no Linux.
  - Manter system audio para plataformas/situações futuras via capability flag.
  - Adicionar feedback de erro backend.
- Modificar `src/hooks/useSusurro.ts`
  - Evitar que espaço reinicie transcrição quando input/textarea estiver focado.
- Revisar `src/services/electron.ts`, `src/types/electron.ts`, `preload.js`
  - Manter contrato atual de `startSusurroLive(personaPrompt)`; não adicionar opções de captura na primeira fase.
- Modificar docs:
  - `docs/AI_AND_TOOLS.md`
  - `docs/ELECTRON_IPC.md`
  - `docs/OPERATIONS.md`
  - `docs/TESTING.md`
  - `docs/LINUX_PORT.md`

---

## Task 1: Criar Testes do Serviço Realtime

**Files:**
- Create: `tests/services/openaiRealtimeTranscriptionService.test.js`
- Target import: `electron/services/openaiRealtimeTranscriptionService.js`

- [ ] **Step 1: Escrever teste vermelho de payload de configuração**

Crie `tests/services/openaiRealtimeTranscriptionService.test.js` com:

```js
import { describe, expect, it, vi } from 'vitest';
import {
  buildTranscriptionSessionUpdate,
  normalizeRealtimeEvent,
  OpenAIRealtimeTranscriptionSession,
} from '../../electron/services/openaiRealtimeTranscriptionService';

describe('openaiRealtimeTranscriptionService', () => {
  it('builds a transcription session update for low-cost Portuguese STT', () => {
    expect(buildTranscriptionSessionUpdate({
      model: undefined,
      language: 'pt',
      prompt: 'Persona do Susurro',
    })).toEqual({
      type: 'session.update',
      session: {
        type: 'transcription',
        audio: {
          input: {
            format: { type: 'audio/pcm', rate: 24000 },
            transcription: {
              model: 'gpt-4o-mini-transcribe',
              language: 'pt',
              prompt: 'Persona do Susurro',
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 700,
            },
            noise_reduction: {
              type: 'near_field',
            },
          },
        },
      },
    });
  });
});
```

- [ ] **Step 2: Rodar teste para confirmar falha**

Run:

```bash
npm test -- tests/services/openaiRealtimeTranscriptionService.test.js 2>&1 | head -c 12000
```

Expected: FAIL com erro de import porque `openaiRealtimeTranscriptionService.js` ainda não existe.

- [ ] **Step 3: Adicionar testes de normalização de eventos OpenAI**

Acrescente ao mesmo arquivo:

```js
it('normalizes realtime transcription events into renderer deltas and statuses', () => {
  expect(normalizeRealtimeEvent({
    type: 'conversation.item.input_audio_transcription.delta',
    delta: 'olá',
  })).toEqual({ kind: 'delta', delta: { text: 'olá', isFinal: false } });

  expect(normalizeRealtimeEvent({
    type: 'conversation.item.input_audio_transcription.completed',
    transcript: 'olá mundo',
  })).toEqual({ kind: 'delta', delta: { text: 'olá mundo', isFinal: true } });

  expect(normalizeRealtimeEvent({ type: 'input_audio_buffer.speech_started' }))
    .toEqual({ kind: 'status', status: 'ready' });

  expect(normalizeRealtimeEvent({ type: 'input_audio_buffer.speech_stopped' }))
    .toEqual({ kind: 'status', status: 'turn_complete' });

  expect(normalizeRealtimeEvent({ type: 'error', error: { message: 'falhou' } }))
    .toEqual({ kind: 'error', error: 'falhou' });
});
```

- [ ] **Step 4: Adicionar teste de sessão com WebSocket falso**

Acrescente ao mesmo arquivo:

```js
class FakeWebSocket {
  static instances = [];

  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.readyState = FakeWebSocket.CONNECTING;
    this.listeners = {};
    this.sent = [];
    FakeWebSocket.instances.push(this);
  }

  on(event, callback) {
    this.listeners[event] = callback;
    return this;
  }

  send(payload) {
    this.sent.push(JSON.parse(payload));
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED;
    this.listeners.close?.();
  }

  emit(event, payload) {
    if (event === 'open') this.readyState = FakeWebSocket.OPEN;
    this.listeners[event]?.(payload);
  }
}

FakeWebSocket.CONNECTING = 0;
FakeWebSocket.OPEN = 1;
FakeWebSocket.CLOSED = 3;

it('opens websocket, sends session config, appends audio, and maps events', async () => {
  FakeWebSocket.instances = [];
  const onStatus = vi.fn();
  const onDelta = vi.fn();
  const onError = vi.fn();

  const session = new OpenAIRealtimeTranscriptionSession({
    apiKey: 'test-key',
    WebSocketImpl: FakeWebSocket,
    onStatus,
    onDelta,
    onError,
  });

  const started = session.start({ personaPrompt: 'Persona' });
  const socket = FakeWebSocket.instances[0];
  socket.emit('open');
  await started;

  session.appendAudio('AAAA', 1);
  socket.emit('message', JSON.stringify({
    type: 'conversation.item.input_audio_transcription.completed',
    transcript: 'texto final',
  }));
  session.stop();

  expect(socket.url).toBe('wss://api.openai.com/v1/realtime?intent=transcription');
  expect(socket.options.headers.Authorization).toBe('Bearer test-key');
  expect(socket.sent[0].type).toBe('session.update');
  expect(socket.sent[1]).toEqual({
    type: 'input_audio_buffer.append',
    audio: 'AAAA',
  });
  expect(onStatus).toHaveBeenCalledWith('connecting');
  expect(onStatus).toHaveBeenCalledWith('ready');
  expect(onDelta).toHaveBeenCalledWith({ text: 'texto final', isFinal: true });
  expect(onStatus).toHaveBeenCalledWith('closed');
  expect(onError).not.toHaveBeenCalled();
});
```

---

## Task 2: Implementar Serviço OpenAI Realtime Transcription

**Files:**
- Create: `electron/services/openaiRealtimeTranscriptionService.js`
- Test: `tests/services/openaiRealtimeTranscriptionService.test.js`

- [ ] **Step 1: Criar implementação mínima**

Crie `electron/services/openaiRealtimeTranscriptionService.js`:

```js
const WebSocket = require('ws');

const REALTIME_TRANSCRIPTION_URL = 'wss://api.openai.com/v1/realtime?intent=transcription';
const DEFAULT_TRANSCRIPTION_MODEL = 'gpt-4o-mini-transcribe';

function buildTranscriptionSessionUpdate({ model, language = 'pt', prompt = '' } = {}) {
  return {
    type: 'session.update',
    session: {
      type: 'transcription',
      audio: {
        input: {
          format: { type: 'audio/pcm', rate: 24000 },
          transcription: {
            model: model || DEFAULT_TRANSCRIPTION_MODEL,
            language,
            prompt,
          },
          turn_detection: {
            type: 'server_vad',
            threshold: 0.5,
            prefix_padding_ms: 300,
            silence_duration_ms: 700,
          },
          noise_reduction: {
            type: 'near_field',
          },
        },
      },
    },
  };
}

function normalizeRealtimeEvent(event) {
  if (!event || !event.type) return { kind: 'ignore' };

  if (event.type === 'conversation.item.input_audio_transcription.delta') {
    return {
      kind: 'delta',
      delta: { text: event.delta || '', isFinal: false },
    };
  }

  if (event.type === 'conversation.item.input_audio_transcription.completed') {
    return {
      kind: 'delta',
      delta: { text: event.transcript || '', isFinal: true },
    };
  }

  if (event.type === 'input_audio_buffer.speech_started') {
    return { kind: 'status', status: 'ready' };
  }

  if (event.type === 'input_audio_buffer.speech_stopped') {
    return { kind: 'status', status: 'turn_complete' };
  }

  if (event.type === 'session.created' || event.type === 'session.updated') {
    return { kind: 'status', status: 'ready' };
  }

  if (event.type === 'error') {
    return {
      kind: 'error',
      error: event.error?.message || 'Erro desconhecido no OpenAI Realtime.',
    };
  }

  return { kind: 'ignore' };
}

class OpenAIRealtimeTranscriptionSession {
  constructor({
    apiKey,
    WebSocketImpl = WebSocket,
    logger = console,
    onStatus = () => {},
    onDelta = () => {},
    onError = () => {},
  }) {
    this.apiKey = apiKey;
    this.WebSocketImpl = WebSocketImpl;
    this.logger = logger;
    this.onStatus = onStatus;
    this.onDelta = onDelta;
    this.onError = onError;
    this.socket = null;
    this.isOpen = false;
  }

  start({ personaPrompt = '', model, language = 'pt' } = {}) {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key não configurada.');
    }

    this.onStatus('connecting');
    this.socket = new this.WebSocketImpl(REALTIME_TRANSCRIPTION_URL, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    return new Promise((resolve, reject) => {
      const rejectOnce = (error) => {
        this.onError(error.message || String(error));
        reject(error);
      };

      this.socket.on('open', () => {
        this.isOpen = true;
        this.onStatus('ready');
        this.socket.send(JSON.stringify(buildTranscriptionSessionUpdate({
          model,
          language,
          prompt: personaPrompt,
        })));
        resolve(true);
      });

      this.socket.on('message', (payload) => {
        this.handleMessage(payload);
      });

      this.socket.on('error', rejectOnce);

      this.socket.on('close', () => {
        this.isOpen = false;
        this.onStatus('closed');
      });
    });
  }

  handleMessage(payload) {
    let event;
    try {
      event = JSON.parse(payload.toString());
    } catch (error) {
      this.onError(`Evento realtime inválido: ${error.message}`);
      return;
    }

    const normalized = normalizeRealtimeEvent(event);
    if (normalized.kind === 'delta') {
      this.onDelta(normalized.delta);
      return;
    }
    if (normalized.kind === 'status') {
      this.onStatus(normalized.status);
      return;
    }
    if (normalized.kind === 'error') {
      this.onError(normalized.error);
      this.onStatus('error');
    }
  }

  appendAudio(base64Audio, seq) {
    if (!this.socket || !this.isOpen || !base64Audio) return false;
    this.socket.send(JSON.stringify({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    }));

    if (seq === 1 || seq % 50 === 0) {
      this.logger.info?.('OpenAIRealtime', `Audio chunk sent seq=${seq}`);
    }
    return true;
  }

  stop() {
    if (this.socket && this.isOpen) {
      this.socket.close();
    } else {
      this.onStatus('closed');
    }
    this.socket = null;
    this.isOpen = false;
  }
}

module.exports = {
  REALTIME_TRANSCRIPTION_URL,
  DEFAULT_TRANSCRIPTION_MODEL,
  buildTranscriptionSessionUpdate,
  normalizeRealtimeEvent,
  OpenAIRealtimeTranscriptionSession,
};
```

- [ ] **Step 2: Rodar teste do serviço**

Run:

```bash
npm test -- tests/services/openaiRealtimeTranscriptionService.test.js 2>&1 | head -c 12000
```

Expected: PASS.

- [ ] **Step 3: Rodar suíte de serviços**

Run:

```bash
npm test -- tests/services 2>&1 | head -c 16000
```

Expected: todos os testes de serviços passam.

- [ ] **Step 4: Commit**

```bash
git add electron/services/openaiRealtimeTranscriptionService.js tests/services/openaiRealtimeTranscriptionService.test.js
git commit -m "feat: add OpenAI realtime transcription service"
```

---

## Task 3: Ligar Serviço Realtime ao IPC do Susurro

**Files:**
- Modify: `electron/ipc/susurroHandlers.js`
- Modify: `electron/ipc/index.js` se necessário apenas para assinatura de deps
- Test: `tests/services/openaiRealtimeTranscriptionService.test.js`

- [ ] **Step 1: Atualizar imports e estado de sessão**

No topo de `electron/ipc/susurroHandlers.js`, adicione:

```js
const { getOpenAIKey } = require('../services/openaiClient');
const { OpenAIRealtimeTranscriptionSession } = require('../services/openaiRealtimeTranscriptionService');
```

Dentro de `registerSusurroHandlers()`, antes dos handlers, adicione:

```js
  let activeRealtimeSession = null;

  const emitSusurroStatus = (event, status) => {
    event.sender.send('susurro-live-status', status);
  };

  const emitSusurroDelta = (event, delta) => {
    event.sender.send('susurro-live-delta', delta);
  };

  const stopActiveRealtimeSession = () => {
    if (activeRealtimeSession) {
      activeRealtimeSession.stop();
      activeRealtimeSession = null;
    }
  };
```

- [ ] **Step 2: Substituir `susurro-send-chunk`**

Troque o handler atual:

```js
  ipcMain.on('susurro-send-chunk', (event, chunk) => {
    logger.debug?.('IPC', 'Ignoring susurro audio chunk because realtime transcription backend is not configured.');
  });
```

por:

```js
  ipcMain.on('susurro-send-chunk', (event, chunk, seq) => {
    if (!activeRealtimeSession) {
      logger.debug?.('IPC', 'Ignoring susurro audio chunk because realtime session is not active.');
      return;
    }
    activeRealtimeSession.appendAudio(chunk, seq);
  });
```

- [ ] **Step 3: Substituir `susurro-start-live`**

Troque o handler atual:

```js
  ipcMain.handle('susurro-start-live', async (event, personaPrompt) => {
    return {
      success: false,
      data: false,
      error: 'Transcrição realtime temporariamente indisponível.'
    };
  });
```

por:

```js
  ipcMain.handle('susurro-start-live', async (event, personaPrompt) => {
    try {
      stopActiveRealtimeSession();

      const settings = store.getSettings();
      const apiKey = getOpenAIKey(settings);
      activeRealtimeSession = new OpenAIRealtimeTranscriptionSession({
        apiKey,
        logger,
        onStatus: (status) => emitSusurroStatus(event, status),
        onDelta: (delta) => emitSusurroDelta(event, delta),
        onError: (message) => {
          logger.error('SusurroRealtime', message);
          event.sender.send('susurro-live-status', 'error');
        },
      });

      await activeRealtimeSession.start({
        personaPrompt: personaPrompt || '',
        model: settings?.general?.fullTranscriptionModel || settings?.general?.sttModel,
        language: 'pt',
      });

      return { success: true, data: true };
    } catch (error) {
      stopActiveRealtimeSession();
      logger.error('IPC', 'susurro-start-live error', error);
      event.sender.send('susurro-live-status', 'error');
      return { success: false, data: false, error: error.message };
    }
  });
```

- [ ] **Step 4: Substituir `susurro-stop-live`**

Troque o handler atual por:

```js
  ipcMain.handle('susurro-stop-live', async () => {
    stopActiveRealtimeSession();
    return { success: true, data: true };
  });
```

- [ ] **Step 5: Rodar build para capturar erro CommonJS**

Run:

```bash
npm run build 2>&1 | head -c 12000
```

Expected: `✓ built`.

- [ ] **Step 6: Commit**

```bash
git add electron/ipc/susurroHandlers.js
git commit -m "feat: wire Susurro IPC to OpenAI realtime"
```

---

## Task 4: Fazer Susurro Usar Microfone no Linux

**Files:**
- Modify: `src/hooks/useTranscription.ts`
- Test: build + manual

- [ ] **Step 1: Criar helper local para modo de captura**

Em `src/hooks/useTranscription.ts`, antes do hook, adicione:

```ts
function shouldUseSystemAudioForSusurro() {
  return navigator.platform.toLowerCase().includes('win');
}
```

- [ ] **Step 2: Alterar startRecording**

Troque:

```ts
    const started = await startRecording({
      isSystemAudio: true,
      onChunk: (base64, seq) => {
        electronService.sendSusurroChunk(base64, seq);
      }
    });
```

por:

```ts
    const started = await startRecording({
      isSystemAudio: shouldUseSystemAudioForSusurro(),
      onChunk: (base64, seq) => {
        electronService.sendSusurroChunk(base64, seq);
      }
    });
```

- [ ] **Step 3: Adicionar log claro de modo**

Antes de `startRecording`, adicione:

```ts
    const useSystemAudio = shouldUseSystemAudioForSusurro();
    console.log(`[TRANSCRIPTION] Starting capture mode: ${useSystemAudio ? 'system-audio' : 'microphone'}`);
```

Então use a variável:

```ts
    const started = await startRecording({
      isSystemAudio: useSystemAudio,
      onChunk: (base64, seq) => {
        electronService.sendSusurroChunk(base64, seq);
      }
    });
```

- [ ] **Step 4: Rodar build**

Run:

```bash
npm run build 2>&1 | head -c 12000
```

Expected: `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTranscription.ts
git commit -m "feat: use microphone capture for Susurro on Linux"
```

---

## Task 5: Mostrar Erros do Susurro na UI

**Files:**
- Modify: `src/hooks/useTranscription.ts`
- Modify: `src/hooks/useSusurro.ts`
- Modify: `src/components/Susurro.tsx`
- Modify: `src/styles/susurro.css`

- [ ] **Step 1: Adicionar estado de erro no hook**

Em `useTranscription`, adicione:

```ts
  const [transcriptionError, setTranscriptionError] = useState<string | null>(null);
```

No início de `toggleTranscription`, antes de abrir sessão:

```ts
    setTranscriptionError(null);
```

No bloco `if (!success)`:

```ts
      setTranscriptionError('Não foi possível iniciar a transcrição realtime. Verifique a OpenAI API key e os logs.');
```

No `handleStatusUpdate`, dentro de `status === 'error' || status === 'closed'`:

```ts
      if (status === 'error') {
        setTranscriptionError('Transcrição realtime encerrada com erro. Verifique os logs do terminal.');
      }
```

No retorno do hook, inclua:

```ts
    transcriptionError,
```

- [ ] **Step 2: Propagar erro em `useSusurro`**

No destructuring de `useTranscription`, troque:

```ts
  const { isTranscribing, isConnecting, startTranscriptionHades, stopTranscriptionHades } = useTranscription(
```

por:

```ts
  const {
    isTranscribing,
    isConnecting,
    transcriptionError,
    startTranscriptionHades,
    stopTranscriptionHades
  } = useTranscription(
```

No retorno de `useSusurro`, inclua:

```ts
    transcriptionError,
```

- [ ] **Step 3: Exibir erro no componente**

Abra `src/components/Susurro.tsx`, encontre o uso do hook `useSusurro()` e inclua `transcriptionError` no destructuring.

Renderize perto do indicador de status:

```tsx
{transcriptionError && (
  <div className="susurro-error" role="status">
    {transcriptionError}
  </div>
)}
```

Se `src/styles/susurro.css` não tiver classe de erro, adicione:

```css
.susurro-error {
  color: #ffb4b4;
  background: rgba(120, 20, 20, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.35);
  padding: 8px 10px;
  margin: 8px 0;
  font-size: 12px;
}
```

- [ ] **Step 4: Rodar build**

Run:

```bash
npm run build 2>&1 | head -c 16000
```

Expected: `✓ built`.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useTranscription.ts src/hooks/useSusurro.ts src/components/Susurro.tsx src/styles/susurro.css
git commit -m "feat: surface Susurro realtime errors"
```

---

## Task 6: Validar Manualmente Microfone no Linux

**Files:**
- No code changes expected.
- Update later: `docs/TESTING.md`

- [ ] **Step 1: Iniciar ambiente dev**

Run:

```bash
npm run dev:linux
```

Expected:

```text
[0] VITE ... ready
[1] Hades Agent initialized successfully
```

- [ ] **Step 2: Abrir Susurro**

Use `Alt+B`.

Expected:

- janela Susurro aparece dentro da tela;
- logs do Electron registram criação/foco da janela;
- nenhum erro de backend aparece ainda.

- [ ] **Step 3: Iniciar transcrição**

Pressione espaço dentro do Susurro.

Expected logs:

```text
[TRANSCRIPTION] Starting capture mode: microphone
[INFO] [IPC] Received susurro-start-live request
[INFO] [OpenAIRealtime] Audio chunk sent seq=1
```

Expected UI:

- estado visual de conectando passa para transcrevendo;
- ao falar no microfone, texto aparece incrementalmente ou como final;
- ao parar de falar, o turno fecha.

- [ ] **Step 4: Parar transcrição**

Pressione espaço novamente.

Expected:

- gravação para;
- WebSocket fecha;
- status `closed` chega ao renderer;
- UI sai de transcrevendo.

- [ ] **Step 5: Testar sugestões**

Ative sugestões com uma persona selecionada e fale uma frase final.

Expected:

- após delta final, `generateSuggestion` roda;
- janela de sugestões recebe `new-suggestion`;
- se a sugestão falhar, transcrição continua funcionando.

- [ ] **Step 6: Testar tradução**

Ative tradução global e fale uma frase final.

Expected:

- texto transcrito permanece;
- tradução roda pelo `translationService`;
- falha de tradução não derruba a transcrição.

---

## Task 7: Atualizar Documentação da Fase Microfone

**Files:**
- Modify: `docs/AI_AND_TOOLS.md`
- Modify: `docs/ELECTRON_IPC.md`
- Modify: `docs/OPERATIONS.md`
- Modify: `docs/TESTING.md`
- Modify: `docs/LINUX_PORT.md`

- [ ] **Step 1: Atualizar `docs/AI_AND_TOOLS.md`**

Substitua a seção “Transcrição Ao Vivo Susurro” por:

```md
## Transcrição Ao Vivo Susurro

Susurro usa OpenAI Realtime Transcription no main process. No Linux, a primeira rota suportada é microfone; captura de áudio do sistema permanece desabilitada até a fase PipeWire/PulseAudio.

Fluxo:

1. Renderer chama `startSusurroLive`.
2. Main process abre WebSocket em `electron/services/openaiRealtimeTranscriptionService.js`.
3. Renderer captura microfone com `useAudioRecorder`.
4. Renderer envia chunks PCM16/base64 a 24 kHz por `susurro-send-chunk`.
5. Main process envia `input_audio_buffer.append` para OpenAI.
6. Eventos OpenAI são normalizados para `susurro-live-delta` e `susurro-live-status`.

Modelo padrão: `gpt-4o-mini-transcribe`.
```

- [ ] **Step 2: Atualizar `docs/ELECTRON_IPC.md`**

Na seção “Susurro e Voz”, adicione:

```md
`startSusurroLive(persona)` abre uma sessão OpenAI Realtime Transcription no main process. `sendSusurroChunk(base64, seq)` encaminha PCM16/base64 a 24 kHz para essa sessão. `onSusurroLiveDelta` recebe `{ text, isFinal }`; `onSusurroLiveStatus` recebe `connecting`, `ready`, `turn_complete`, `error` ou `closed`.
```

- [ ] **Step 3: Atualizar `docs/OPERATIONS.md`**

Na seção “Susurro Não Transcreve”, registre:

```md
No Linux, confirme primeiro o modo microfone:

1. Inicie com `npm run dev:linux`.
2. Abra Susurro com `Alt+B`.
3. Pressione espaço.
4. Procure logs `Starting capture mode: microphone`, `susurro-start-live` e `Audio chunk sent seq=1`.

Se `OpenAI API Key não configurada` aparecer, configure a chave nas Settings.
Se `getUserMedia` falhar, revise permissão de microfone do desktop.
Se chunks saem mas não há deltas, verifique conectividade WebSocket com OpenAI.
```

- [ ] **Step 4: Atualizar `docs/TESTING.md`**

Na seção Susurro, substitua a expectativa histórica anterior por:

```md
- No Linux, Susurro deve transcrever microfone via OpenAI Realtime.
- Captura de áudio do sistema permanece fora do escopo automatizado até backend PulseAudio/PipeWire.
- Teste manual mínimo: `Alt+B`, espaço, falar no microfone, observar delta/final no HUD, espaço para parar.
```

- [ ] **Step 5: Atualizar `docs/LINUX_PORT.md`**

Adicione:

```md
Susurro Linux suporta microfone via OpenAI Realtime Transcription. Áudio do sistema ainda exige fase dedicada para PulseAudio/PipeWire.
```

- [ ] **Step 6: Commit docs**

```bash
git add docs/AI_AND_TOOLS.md docs/ELECTRON_IPC.md docs/OPERATIONS.md docs/TESTING.md docs/LINUX_PORT.md
git commit -m "docs: document Susurro realtime on Linux"
```

---

## Task 8: Preparar Fase de Áudio do Sistema no Linux

**Files:**
- Create: `electron/platform/linuxAudioSources.js`
- Create: `tests/platform/linuxAudioSources.test.js`
- Modify later: `electron/ipc/toolHandlers.js`

- [ ] **Step 1: Escrever teste para parsing de fontes PulseAudio**

Crie `tests/platform/linuxAudioSources.test.js`:

```js
import { describe, expect, it } from 'vitest';
import { parsePulseAudioSources } from '../../electron/platform/linuxAudioSources';

describe('linuxAudioSources', () => {
  it('detects monitor sources from pactl output', () => {
    const output = `
Source #42
  Name: alsa_output.pci-0000_00_1f.3.analog-stereo.monitor
  Description: Monitor of Built-in Audio Analog Stereo
Source #43
  Name: alsa_input.pci-0000_00_1f.3.analog-stereo
  Description: Built-in Audio Analog Stereo
`;

    expect(parsePulseAudioSources(output)).toEqual([
      {
        name: 'alsa_output.pci-0000_00_1f.3.analog-stereo.monitor',
        description: 'Monitor of Built-in Audio Analog Stereo',
        isMonitor: true,
      },
      {
        name: 'alsa_input.pci-0000_00_1f.3.analog-stereo',
        description: 'Built-in Audio Analog Stereo',
        isMonitor: false,
      },
    ]);
  });
});
```

- [ ] **Step 2: Rodar teste vermelho**

Run:

```bash
npm test -- tests/platform/linuxAudioSources.test.js 2>&1 | head -c 12000
```

Expected: FAIL por arquivo inexistente.

- [ ] **Step 3: Criar parser**

Crie `electron/platform/linuxAudioSources.js`:

```js
function parsePulseAudioSources(output) {
  const sources = [];
  let current = null;

  for (const line of String(output || '').split('\n')) {
    if (/^Source #/.test(line)) {
      if (current?.name) sources.push(current);
      current = { name: '', description: '', isMonitor: false };
      continue;
    }

    const nameMatch = line.match(/^\s*Name:\s*(.+)$/);
    if (nameMatch && current) {
      current.name = nameMatch[1].trim();
      current.isMonitor = current.name.endsWith('.monitor');
      continue;
    }

    const descMatch = line.match(/^\s*Description:\s*(.+)$/);
    if (descMatch && current) {
      current.description = descMatch[1].trim();
    }
  }

  if (current?.name) sources.push(current);
  return sources;
}

module.exports = {
  parsePulseAudioSources,
};
```

- [ ] **Step 4: Rodar teste**

Run:

```bash
npm test -- tests/platform/linuxAudioSources.test.js 2>&1 | head -c 12000
```

Expected: PASS.

- [ ] **Step 5: Registrar decisão**

Atualize `docs/LINUX_PORT.md`:

```md
Próxima fase de áudio do sistema: detectar PulseAudio/PipeWire monitor sources via `pactl list sources`, expor seleção no renderer e só então habilitar `isSystemAudio` no Susurro Linux.
```

- [ ] **Step 6: Commit**

```bash
git add electron/platform/linuxAudioSources.js tests/platform/linuxAudioSources.test.js docs/LINUX_PORT.md
git commit -m "test: prepare Linux system audio source parsing"
```

---

## Task 9: Smoke e Aceite Final

**Files:**
- Modify: `docs/TESTING.md`
- No new source changes expected.

- [ ] **Step 1: Rodar suíte completa**

Run:

```bash
npm test 2>&1 | head -c 20000
```

Expected:

```text
Test Files  ... passed
Tests  ... passed
```

- [ ] **Step 2: Rodar build**

Run:

```bash
npm run build 2>&1 | head -c 20000
```

Expected:

```text
✓ built
```

- [ ] **Step 3: Rodar smoke Linux estático**

Run:

```bash
npm run smoke:linux 2>&1 | head -c 20000
```

Expected:

```text
platform=Linux
...
Test Files ... passed
```

- [ ] **Step 4: Rodar smoke runtime**

Run:

```bash
npm run smoke:linux:runtime 2>&1 | head -c 20000
```

Expected:

- Electron abre CommandBar, MiniChat, Settings e Susurro.
- Susurro abre com URL `?window=susurro`.
- Processo encerra sem travar.

- [ ] **Step 5: Rodar teste manual do Susurro**

Run:

```bash
npm run dev:linux
```

Manual:

1. `Alt+B`.
2. Espaço.
3. Falar: “teste de transcrição no Linux”.
4. Ver texto no HUD.
5. Espaço para parar.

Expected terminal evidence:

```text
[TRANSCRIPTION] Starting capture mode: microphone
[INFO] [OpenAIRealtime] Audio chunk sent seq=1
[TRANSCRIPTION] Status update received: ready
[TRANSCRIPTION] Status update received: turn_complete
```

- [ ] **Step 6: Atualizar `docs/TESTING.md` com resultado real**

Adicione uma linha datada:

```md
- 2026-05-21: Susurro Linux microfone validado manualmente com OpenAI Realtime; áudio do sistema permanece fase separada.
```

Se o teste manual falhar, não registre a linha de sucesso. Registre uma linha datada com a mensagem de erro real observada e sem segredos.

- [ ] **Step 7: Commit final**

```bash
git add docs/TESTING.md
git commit -m "docs: record Susurro Linux validation"
```

---

## Critérios de Aceite

- `Alt+B` abre Susurro no Linux.
- Espaço inicia transcrição usando microfone.
- Chunks PCM16/base64 a 24 kHz chegam ao main process.
- Main process mantém WebSocket OpenAI Realtime.
- Deltas/finais aparecem no HUD.
- Espaço para a transcrição e fecha WebSocket/gravação.
- Falta de API key mostra erro claro.
- Falha de permissão de microfone mostra erro claro.
- Sugestões e tradução continuam funcionando depois de deltas finais.
- `npm test`, `npm run build`, `npm run smoke:linux` passam.
- Docs refletem que microfone Linux funciona e system audio Linux ainda é fase separada.

## Riscos e Mitigações

- **Formato de evento OpenAI pode variar:** manter `normalizeRealtimeEvent` pequeno e coberto por testes; logar eventos ignorados em debug durante validação.
- **Autoplay não importa para Susurro:** transcrição só captura áudio, não toca áudio.
- **Permissão de microfone no Linux:** `getUserMedia` pode falhar por desktop portal; UI deve exibir erro.
- **Áudio do sistema é outro problema:** não misturar PipeWire/PulseAudio com a primeira entrega realtime.
- **Sessão WebSocket vazando:** `susurro-stop-live`, status `closed` e fechamento da janela precisam chamar `stop()`.

## Referências

- OpenAI Realtime transcription: https://platform.openai.com/docs/guides/realtime-transcription
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- Estado atual do repo:
  - `electron/ipc/susurroHandlers.js`
  - `src/hooks/useTranscription.ts`
  - `src/hooks/useAudioRecorder.ts`
  - `docs/AI_AND_TOOLS.md`
