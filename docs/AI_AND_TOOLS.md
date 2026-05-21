# IA, Ferramentas, Transcrição e Memória

## Superfícies de IA

Hades Agent tem vários caminhos relacionados a IA:

- inferência do MiniChat por `src/hooks/useGemini.ts`;
- transcrição Gemini Live por `electron/services/geminiLiveService.js`;
- helpers de sugestão, título e transcrição de áudio por `electron/services/aiService.js`;
- busca web por `electron/services/searchService.js`;
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

Labels e defaults de modelos ficam em `src/constants/models.ts`.

Default atual:

```ts
export const DEFAULT_MODEL = 'gemini-2.5-flash';
```

Settings persistidas por `jsonStore.js` também incluem:

- `general.minichatModel`
- `general.sttModel`
- `general.fullTranscriptionModel`
- `general.dreamingModel`

Ao alterar IDs de modelos, verifique tanto constants quanto comportamento da UI de settings.

## Loop de Ferramentas do MiniChat

O fluxo do MiniChat é orquestrado por `useGemini`.

Arquivos importantes:

- `src/constants/tools.ts` - declarações enviadas ao Gemini.
- `src/hooks/useGemini.ts` - executa function calls retornadas.
- `preload.js` - ponte para ações privilegiadas.
- `electron/ipc/toolHandlers.js` - handlers backend de ferramentas.

Ferramentas declaradas incluem:

- `search_web`
- `read_url`
- `complete_task`
- `send_message`
- `notify`
- `show_chat`
- `get_open_windows`
- `capture_screen`
- `schedule_task`
- `list_tasks`
- `delete_task`
- `save_skill`
- `list_skills`
- `load_skill`

Guardrail: declarações de ferramentas e executor devem permanecer alinhados. Não adicione declaração sem implementar execução; não deixe branches do executor sem documentação.

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

`electron/services/searchService.js` lida com busca Tavily. Chaves de API vêm de settings ou variáveis de ambiente populadas por `jsonStore.js`.

Não imprima valores reais de chaves em logs ou docs.

## Transcrição Ao Vivo Susurro

Main process:

- `electron/services/geminiLiveService.js`
- `electron/ipc/susurroHandlers.js`

Renderer:

- `src/hooks/useSusurro.ts`
- `src/hooks/useTranscription.ts`
- `src/hooks/useAudioRecorder.ts`
- `src/components/Susurro.tsx`

Fluxo:

1. Renderer chama `startSusurroLive`.
2. Main process abre uma sessão Gemini Live.
3. Renderer captura áudio suportado e envia chunks PCM em base64.
4. Main process encaminha chunks como `audio/pcm;rate=16000`.
5. Gemini Live retorna deltas de transcrição.
6. Renderer mescla deltas em mensagens do Susurro.

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

## Consolidação de Memória Dream

`main.js` agenda `dreamService.runDreamCycle()`:

- uma vez 10 segundos após o app iniciar;
- depois a cada 24 horas.

`dreamService.js` usa logs de sessão e instruções de prompt para construir memória consolidada. Ele é controlado por:

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
