# Operações

## Instalação

```bash
npm install
```

## Desenvolvimento

Comando all-in-one orientado a Windows:

```bash
npm run dev
```

Esse comando usa `taskkill` e `kill-port`, depois roda Vite e Electron em paralelo.

Comando all-in-one para Linux:

```bash
npm run dev:linux
```

Esse comando limpa a porta `3000` do Vite e roda Vite/Electron sem comandos exclusivos do Windows. Ele inicia Electron com `--no-sandbox` para desenvolvimento local porque checkouts de código-fonte geralmente não têm o helper `node_modules/electron/dist/chrome-sandbox` instalado como root com modo `4755`.

Abordagem separada e portável:

```bash
npm run dev:react
```

Depois, em outro shell quando o Vite estiver disponível:

```bash
npm run dev:electron
```

O Vite roda em porta estrita `3000`.

## Build

```bash
npm run build
```

Alias equivalente:

```bash
npm run build:app
```

## Preview

```bash
npm run preview
```

## Testes

```bash
npm test
```

Vitest é o comando de teste configurado em `package.json`. Veja `TESTING.md` para expectativas de validação.

## Empacotamento

Pacote Windows:

```bash
npm run package
```

Pacote Linux:

```bash
npm run package:linux
```

Build completo mais pacote:

```bash
npm run dist
```

Build completo mais pacote Linux:

```bash
npm run dist:linux
```

Saída do Electron Builder fica em `release/`.

Alvos Windows configurados:

- instalador NSIS;
- executável portátil;
- zip.

Alvos Linux configurados:

- AppImage;
- deb.

## Ressalvas de Plataforma

- O app é documentado e configurado principalmente para Windows.
- `setContentProtection` é sensível no Windows e ligado a janelas transparentes.
- Atalhos globais podem falhar se outro processo já possuir o accelerator.
- No Wayland, Hades habilita `GlobalShortcutsPortal` do Electron/Chromium. A disponibilidade ainda depende de portal desktop e política da sessão.
- `npm run dev` continua sendo o padrão Windows; use `npm run dev:linux` no Linux.
- O empacotamento padrão continua Windows, com Linux disponível via `npm run dist:linux`.

## Logs

O main process configura `electron-log` em `main.js`:

```js
log.transports.file.level = 'info';
log.transports.console.level = false;
```

Arquivos de log do Electron normalmente ficam no caminho de logs/userData específico da plataforma. Use a localização `userData` do Electron para investigar builds empacotados.

## Depuração de Janelas

`windowManager.js` registra `Ctrl+Shift+I` por BrowserWindow para alternar DevTools.

Logs de ciclo de vida de janela cobrem:

- criação/reuso;
- carregamento de URL;
- `did-finish-load`;
- `did-fail-load`;
- abertura/fechamento de DevTools;
- enforcement de content protection;
- comportamento de blur/hide.

## Troubleshooting Comum

### OpenAI Não Responde no MiniChat

Verifique:

- `OpenAI API Key` preenchida;
- modelo do MiniChat em `gpt-5-nano` ou `gpt-5-mini`;
- handler `assistant-generate-response`;
- logs de `electron/services/openaiResponsesService.js`.

Para testar sem vazar segredos, use logs limitados e não imprima settings descriptografadas.

### Porta do Vite Ocupada

Vite usa porta estrita `3000`. Pare o processo ocupante ou altere `vite.config.ts` deliberadamente.

Use limite por bytes em comandos amplos:

```bash
lsof -i :3000 2>&1 | head -c 4000
```

### Atalhos Globais Falham

`electron/shortcuts.js` tenta registrar novamente até três vezes. Um processo Electron antigo ou outro app pode estar usando o atalho.

Verifique processos Electron com saída limitada:

```bash
ps aux | rg -i "electron|hades" 2>&1 | head -c 4000
```

### Janela Aparece em Compartilhamento de Tela

Verifique:

- `settings.general.stealthMode`
- `settingsHandlers.applyStealthMode`
- `windowManager.createWindow`
- enforcement em eventos `show`, `restore` e `focus`

Não pré-crie janelas transparentes ocultas sem retestar content protection.

### Susurro Não Transcreve

Verifique:

- handler `susurro-start-live`;
- sessão OpenAI Realtime Transcription em `electron/services/openaiRealtimeTranscriptionService.js`;
- OpenAI API Key nas settings/env, sem imprimir o valor em logs;
- modelo `general.fullTranscriptionModel || general.sttModel`, com default `gpt-4o-mini-transcribe`;
- permissão de microfone do sistema/navegador;
- log do renderer `[TRANSCRIPTION] Starting capture mode: microphone` no Linux;
- logs de chunks como `[AUDIO_RECORDER] Sending chunk seq: ...`;
- abertura/erro do WebSocket OpenAI Realtime no main process;
- sample rate e silence threshold em `useAudioRecorder`.

No Linux, o fluxo atual do Susurro usa microfone por padrão. Áudio do sistema permanece fase separada até existir backend PulseAudio/PipeWire implementado e testado; não trate ausência de áudio do sistema Linux como regressão do realtime por microfone.

### Voice Recorder Não Transcreve

Verifique:

- OpenAI API Key;
- modelo `gpt-4o-mini-transcribe`;
- permissões de microfone do sistema;
- se o handler `transcribe-audio` está recebendo WAV/base64;
- `electron/services/openaiTranscriptionService.js`.

### Busca Não Funciona

Verifique:

- OpenAI API Key para busca por `web_search_preview`;
- handler `assistant-generate-response`;
- `electron/services/openaiResponsesService.js`;
- erros de rede nos logs.

## Regra de Comando Seguro

Qualquer comando com saída desconhecida ou potencialmente grande deve ser limitado:

```bash
COMMAND 2>&1 | head -c 4000
```

Isso é obrigatório para logs, buscas recursivas, saída de testes, package managers e listagens de processos, salvo quando o tamanho da saída for conhecido.
