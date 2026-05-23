# IA, Ferramentas, Transcrição e Memória

## Superfícies de IA

Hades Agent tem vários caminhos relacionados a IA:

- inferência do MiniChat por `src/hooks/useAssistantInference.ts` via IPC;
- cliente e Responses API em `electron/services/openaiClient.js` e `electron/services/openaiResponsesService.js`;
- transcrição OpenAI em `electron/services/openaiTranscriptionService.js`;
- síntese de fala OpenAI em `electron/services/openaiSpeechService.js`;
- normalização de modelos/settings antigas por `electron/services/providerRouter.js`;
- helpers de sugestão, título e transcrição de áudio por `electron/services/aiService.js`;
- busca web principal por OpenAI `web_search_preview`;
- tradução por `electron/services/translationService.js`;
- skills locais por `electron/services/skillService.js`;
- consolidação de memória Dream por `electron/services/dreamService.js`.

## Fontes de Prompt

Arquivos de prompt ficam em `prompts/`:

- `prompts/hadesSystem.md`
- `prompts/susurroSystem.md`
- `prompts/dreamService.md`

A montagem dos prompts do renderer fica em `src/constants/prompts.ts`.

`buildHadesContext()` injeta:

- data;
- dia da semana;
- horário;
- fuso horário;
- idioma;
- plataforma;
- skills ativas;
- memória consolidada do usuário.

`getHadesSystemPrompt()` substitui placeholders em `prompts/hadesSystem.md`.

## Configuração de Modelos

OpenAI é o único provider de IA do projeto.

Camadas de configuração:

- `electron/services/modelCatalog.js` - catálogo e defaults do main process.
- `electron/services/providerRouter.js` - normalização de settings antigas e remoção de modelos/chaves legadas.
- `src/constants/models.ts` - labels, filtros e defaults do renderer.
- `electron/store/jsonStore.js` - persistência criptografada de settings.

Default atual:

```ts
export const DEFAULT_MODEL = 'gpt-5-nano';
```

Modelos baratos padrão:

- MiniChat/respostas: `gpt-5-nano`
- Opção de maior qualidade: `gpt-5-mini`
- Voice/STT: `gpt-4o-mini-transcribe`
- Voice/TTS: `gpt-4o-mini-tts`
- Susurro realtime transcription: `gpt-4o-mini-transcribe`
- Realtime conversational futuro: `gpt-realtime-mini`
- Dreaming: `gpt-5-nano`

Settings persistidas por `jsonStore.js` incluem:

- `general.openaiApiKey`
- `general.minichatModel`
- `general.sttModel`
- `general.fullTranscriptionModel`
- `general.realtimeModel`
- `general.dreamingModel`
- `response.audioForVoiceInput`
- `response.alwaysAudio`

Ao alterar IDs de modelos, verifique tanto constants quanto comportamento da UI de settings.

## Modos de Resposta

O MiniChat sempre adiciona a resposta textual ao histórico. A aba `Resposta` em Settings controla apenas se a resposta também será reproduzida por TTS OpenAI:

- `response.audioForVoiceInput`: reproduz áudio quando a pergunta veio do `Alt+V`.
- `response.alwaysAudio`: reproduz áudio para qualquer resposta, inclusive perguntas digitadas.

`response.alwaysAudio` tem precedência sobre `response.audioForVoiceInput`. Se ambos estiverem desativados, o MiniChat continua respondendo em texto.

## Loop de Ferramentas do MiniChat

O fluxo do MiniChat é orquestrado por `useAssistantInference`.

Arquivos importantes:

- `src/hooks/useAssistantInference.ts` - monta contexto e chama o IPC OpenAI.
- `electron/ipc/aiHandlers.js` - handler `assistant-generate-response`.
- `electron/services/openaiResponsesService.js` - chamada OpenAI Responses API.
- `preload.js` - ponte para ações privilegiadas.
- `electron/ipc/toolHandlers.js` - handlers backend de ferramentas.

MiniChat envia prompt/histórico por IPC e usa `web_search_preview` quando o turno indica necessidade de web. A OpenAI API key fica no main process.

## Regra de Lógica Determinística

Não use chamadas de modelo para decisões que código consegue tomar exatamente.

Use código para:

- decisões de retry;
- interpretação de status code;
- validação de schema;
- seleção de rota;
- permissões;
- checagem de existência de arquivo;
- transformações fixas de dados;
- parsing de formatos estáveis.

Use chamadas de modelo para:

- sumarização;
- classificação com ambiguidade semântica;
- sugestões em linguagem natural;
- conversa;
- limpeza de transcript quando regras determinísticas exatas forem insuficientes.

## Busca

A busca do MiniChat usa `web_search_preview` pela Responses API. Ela depende apenas da OpenAI API key.

Não imprima valores reais de chaves em logs ou docs.

## Voice e Transcrição Curta

O fluxo `Alt+V`/Voice Recorder grava áudio, gera WAV/base64 e chama `transcribe-audio` por IPC.

- `electron/services/aiService.js` delega para `openaiTranscriptionService.js`;
- o modelo padrão é `gpt-4o-mini-transcribe`;
- o MIME esperado é `audio/wav`.

Ao finalizar a gravação, `useVoiceRecorder` transcreve o áudio e envia automaticamente a mensagem ao MiniChat com `{ source: 'voice' }`; não há etapa extra de confirmação por espaço após a transcrição. O MiniChat mantém a janela aberta, gera a resposta textual normalmente e, conforme `settings.response`, chama `synthesize-speech` para gerar MP3 com `gpt-4o-mini-tts` e reproduzir a resposta no renderer.

O TTS fica no main process para manter a OpenAI API key fora do renderer. O renderer recebe apenas um `data:audio/mpeg;base64,...` pronto para reprodução.

## Transcrição Ao Vivo Susurro

Susurro usa OpenAI Realtime Transcription no main process. `startSusurroLive(persona)` chama o handler `susurro-start-live`; `electron/ipc/susurroHandlers.js` mantém uma sessão ativa, lê a OpenAI API key via settings/env, inicia `OpenAIRealtimeTranscriptionSession` com idioma `pt` e encaminha chunks PCM16/base64 a 24 kHz recebidos por `susurro-send-chunk`.

Eventos do service são enviados ao renderer por:

- `susurro-live-status`
- `susurro-live-delta`

O modelo vem de `general.fullTranscriptionModel || general.sttModel`, com o default barato `gpt-4o-mini-transcribe` definido no service realtime.

Fluxo atual:

1. `useTranscription` chama `startSusurroLive(persona)` antes de iniciar a captura local.
2. No Linux, `useAudioRecorder` captura microfone por `navigator.mediaDevices.getUserMedia({ audio: true })`.
3. O renderer converte amostras para PCM16/base64 em 24 kHz e envia cada chunk por `susurro-send-chunk`.
4. O main process repassa os chunks para o WebSocket OpenAI Realtime.
5. Deltas parciais/finais e status normalizados voltam ao renderer por `susurro-live-delta` e `susurro-live-status`.

Renderer:

- `src/hooks/useSusurro.ts`
- `src/hooks/useTranscription.ts`
- `src/hooks/useAudioRecorder.ts`
- `src/components/Susurro.tsx`

Main process:

- `electron/ipc/susurroHandlers.js`
- `electron/services/openaiRealtimeTranscriptionService.js`

Constantes importantes:

- `AUDIO_CONFIG.SAMPLE_RATE`
- `AUDIO_CONFIG.BUFFER_SIZE`
- `AUDIO_CONFIG.NOISE_THRESHOLD`

No Linux, captura de áudio do sistema no Susurro é controlada por capacidade. A primeira versão Linux pode suportar microfone enquanto áudio do sistema permanece desabilitado até existir backend PipeWire/PulseAudio implementado e testado.

## Tradução

Tradução é gerenciada por:

- `src/hooks/useTranslation.ts`
- `electron/services/translationService.js`
- `electron/ipc/susurroHandlers.js`
- `src/constants/languages.ts`

`useTranslation` traduz periodicamente mensagens estáveis do Susurro. Ele usa intervalos diferentes para transcrição ativa e inativa.

## Tarefas

Tarefas são persistidas por `jsonStore.js`, expostas por `taskHandlers.js` e verificadas por `taskService.js`.

Ferramentas do renderer podem agendar, listar e apagar tarefas. Quando vencidas, tarefas são emitidas ao renderer com `execute-scheduled-task`.

Comportamento de tarefas é local e não deve ganhar poderes de filesystem ou execução de scripts sem revisão explícita de segurança.

## Skills

Skills são gerenciadas por `electron/services/skillService.js` e expostas por `toolHandlers.js`.

O app pode salvar, listar e carregar skills como conhecimento procedural local. Ao alterar formato ou armazenamento de skills, atualize `DATA_AND_STORAGE.md`.

## Sugestões, Títulos e Dreaming

`aiService.js` também gera:

- sugestões do Susurro;
- títulos curtos de sessão.

Esses caminhos usam OpenAI Responses API, com `gpt-5-nano` por padrão ou o modelo configurado em `minichatModel`.

## Consolidação de Memória Dream

`main.js` agenda `dreamService.runDreamCycle()`:

- uma vez 10 segundos após o app iniciar;
- depois a cada 24 horas.

`dreamService.js` usa logs de sessão e instruções de prompt para construir memória consolidada com Responses API e `dreamingModel || gpt-5-nano`.

Ele é controlado por:

- `general.dreamingEnabled`
- `general.dreamingModel`

Ao alterar comportamento de memória, atualize:

- `prompts/dreamService.md`
- `electron/services/dreamService.js`
- `docs/DATA_AND_STORAGE.md`
- este documento.

## Checklist de Mudança em Prompt

- Leia o arquivo de prompt e o código que injeta variáveis nele.
- Mantenha requisitos determinísticos em código, não apenas em texto de prompt.
- Adicione ou atualize testes/validação manual para o comportamento que o prompt pretende mudar.
- Mantenha a redação do prompt concisa o bastante para caber no contexto rotineiro.
- Documente contratos duráveis de prompt aqui.
