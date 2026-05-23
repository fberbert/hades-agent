# Segurança

## Modelo de Segurança

Hades Agent separa comportamento desktop privilegiado da UI:

- o processo principal Electron possui capacidades Node/Electron;
- o renderer React roda em sandbox;
- `preload.js` expõe uma ponte estreita como `window.electron`.

Esse modelo é reforçado em `electron/windows/windowConfigs.js` com:

```js
nodeIntegration: false
contextIsolation: true
sandbox: true
```

Não enfraqueça essas configurações sem uma decisão de segurança explícita e documentada.

## Chaves de API

Chaves são aceitas por settings e também podem ser carregadas de `.env`.

Chaves conhecidas:

- OpenAI API key;

Regras:

- Nunca imprima chaves reais.
- Nunca commite `.env`.
- Nunca cole settings descriptografadas em docs ou logs.
- Trate `settings.json` como sensível mesmo sendo criptografado.
- Mantenha a OpenAI API key no main process. Código React deve usar IPC, não `fetch` direto para OpenAI.

## Criptografia de Settings

`jsonStore.js` criptografa settings com AES-256-CBC antes de escrever. Ele também consegue ler settings antigas em JSON puro.

Isso protege contra exposição casual acidental, não contra todo modelo de atacante local. Um processo rodando como o mesmo usuário ainda pode potencialmente acessar dados do app e memória runtime.

## Limite de Filesystem

Código do renderer não deve ler ou escrever arquivos locais diretamente. Ele deve chamar métodos IPC expostos em `preload.js`.

Acesso a arquivos no main process deve ficar centralizado:

- JSON de dados do usuário em `electron/store/jsonStore.js`;
- file dialog selecionado em `electron/ipc/windowHandlers.js`;
- persistência de sessão/skill/dream em seus services.

Não adicione IPC amplo de leitura/escrita arbitrária de arquivos sem requisito explícito e documentação das implicações de segurança.

## Captura de Tela e Áudio

Captura de tela e áudio são capacidades sensíveis.

Arquivos relevantes:

- `electron/ipc/toolHandlers.js`
- `src/hooks/useCommandBar.ts`
- `src/hooks/useAssistantInference.ts`
- `src/hooks/useAudioRecorder.ts`

Regras:

- Mantenha captura iniciada por ações explícitas do usuário ou fluxos visíveis de funcionalidade.
- Não persista screenshots ou chunks de áudio salvo se a tarefa exigir explicitamente.
- Não adicione captura em segundo plano sem decisão de produto visível e atualização de documentação.
- No Linux, captura depende de PipeWire e desktop portals. Estados sem suporte devem ser reportados explicitamente em vez de cair como erros genéricos de gravação.

## Content Protection

Stealth mode usa `setContentProtection` do Electron.

Arquivos relevantes:

- `electron/windows/windowManager.js`
- `electron/ipc/settingsHandlers.js`
- `electron/windows/windowConfigs.js`

Comportamento importante:

- Janelas são criadas sob demanda.
- Content protection é aplicado antes de janelas serem mostradas quando possível.
- Ele é reaplicado em `show`, `restore` e `focus`.
- No Linux, stealth/content protection é tratado como sem suporte até uma implementação futura específica de plataforma provar o contrário. O app deve mostrar isso como comportamento degradado em vez de prometer invisibilidade a captura.

Tenha cuidado ao mudar o ciclo de vida de janelas transparentes. Comentários no código indicam sensibilidade do comportamento DWM no Windows.

## Content Security Policy

`main.js` define headers CSP por `session.defaultSession.webRequest.onHeadersReceived`.

A CSP atual permite servidor de desenvolvimento, inline/eval script para Vite dev, blobs, imagens/fontes data, HTTPS/WSS e localhost.

Antes de apertar ou afrouxar a CSP:

- teste modo dev;
- teste modo empacotado;
- confira AudioWorklets e uso de blob;
- confira chamadas OpenAI.

## Links Externos

URLs externas devem abrir por shell no main process, não por efeitos diretos do renderer. Use o método de ponte `openExternal`.

## Regras de Segurança Para Agentes

- Não amplie IPC por conveniência.
- Não mova segredos para constants do renderer.
- Não registre payloads que possam conter chaves, capturas de tela, transcripts ou mensagens do usuário sem redaction intencional.
- Não prometa garantias de sandbox além do que o código inspecionado impõe.
- Se adicionar nova capacidade com impacto de privacidade, atualize este documento e `AGENTS.md` se virar regra obrigatória.
