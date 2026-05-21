# Hades Agent - Entrada Para Agentes

Este arquivo é o mapa compacto para agentes de programação. Mantenha conhecimento durável do projeto em `docs/`; atualize este arquivo somente quando navegação, regras obrigatórias ou comandos comuns mudarem.

## Leia Primeiro

1. Comece por `docs/README.md`, o índice da base de conhecimento.
2. Leia `docs/PROJECT_OVERVIEW.md` para entender o que o Hades Agent faz.
3. Leia `docs/ARCHITECTURE.md` antes de alterar Electron, IPC, janelas ou fluxos de IA.
4. Leia `docs/ELECTRON_IPC.md` antes de alterar `preload.js` ou `electron/ipc/*`.
5. Leia `docs/OPERATIONS.md` antes de executar, empacotar ou depurar o app.
6. Leia `docs/SECURITY.md` antes de tocar em chaves, acesso a arquivos, captura de tela/audio ou configurações de segurança do Electron.
7. Para portabilidade Linux, leia `docs/LINUX_PORT.md` antes de alterar comportamento por plataforma.

## Forma do Projeto

- Processo principal do Electron: `main.js`, `electron/`.
- Renderer: React 19 + Vite em `src/`.
- Roteamento de entrada do renderer: `src/App.tsx`, selecionado por `?window=...`.
- Ponte segura do renderer: `preload.js`.
- Registro de IPC: `electron/ipc/index.js` mais um arquivo de handlers por funcionalidade.
- Fonte de verdade das janelas: `electron/windows/windowConfigs.js`.
- Fonte de verdade da persistência local: `electron/store/jsonStore.js`.
- Prompts de IA: `prompts/*.md` e `src/constants/prompts.ts`.
- Declarações de ferramentas Gemini: `src/constants/tools.ts`; loop de execução: `src/hooks/useGemini.ts`.

## Comandos

Use limite por bytes para comandos exploratórios com saída desconhecida.

```bash
COMMAND 2>&1 | head -c 4000
```

Comandos comuns:

```bash
npm install
npm run dev
npm run dev:linux
npm run build
npm test
npm run dist
npm run dist:linux
```

Notas:

- `npm run dev` é orientado a Windows porque usa `taskkill`; no Linux, use `npm run dev:linux`.
- O Vite usa porta estrita `3000` em `vite.config.ts`.
- O alvo padrão de empacotamento continua sendo Windows; Linux tem scripts explícitos.

## Regras Para Agentes

Estas regras vêm da inspeção do repositório e dos dois artigos solicitados: a orientação de harness engineering da OpenAI e o artigo sobre `CLAUDE.md`.

- Trate a documentação do repositório como sistema de registro. Se comportamento durável mudar, atualize o arquivo relevante em `docs/`.
- Mantenha `AGENTS.md` curto. Ele é um índice, não um manual.
- Não adivinhe requisitos em silêncio. Se algo estiver ambíguo, declare a suposição ou pergunte.
- Prefira a menor mudança que resolva a tarefa real.
- Não refatore código não relacionado, não renomeie símbolos vizinhos e não reformate arquivos intocados.
- Siga o padrão local existente mesmo quando houver um padrão mais novo em outro lugar.
- Leia antes de criar: procure exports, chamadores diretos, handlers, hooks, services e constants antes de adicionar código.
- Se dois padrões conflitarem, não misture ambos em um terceiro padrão. Nomeie o conflito e escolha o padrão mais compatível com a área alterada.
- Deixe regras determinísticas no código. Use código explícito, schemas, parsers, condicionais e testes para retry, roteamento, status codes, validação, parsing, permissões e transformações fixas.
- Use chamadas de IA/modelo somente quando julgamento semântico, linguagem, sumarização ou raciocínio aproximado forem realmente necessários.
- Escreva testes que verifiquem intenção. Um teste deve falhar se a regra de negócio ou UX for quebrada.
- Trabalhe contra critérios de sucesso verificáveis: reproduza, altere, rode a checagem estreita e relate o que passou ou falhou.
- Adicione checkpoints em trabalhos de múltiplas etapas. Depois de cada etapa significativa, registre o que mudou, o que foi verificado e o que falta.
- Se o contexto ficar longo ou o estado ficar incerto, resuma o estado atual antes de continuar.
- Não alegue validação que não foi executada. Diga exatamente quais comandos rodaram e quais foram pulados.
- Proteja segredos. Nunca imprima chaves de API nem valores persistidos de configuração.

## Guardrails de Arquitetura

- Código do renderer deve usar `window.electron` por meio de `src/services/electron.ts`; não importe APIs Node ou Electron diretamente em componentes React.
- Adicione IPC em todos os lugares necessários ao mesmo tempo: `preload.js`, `src/types/electron.ts`, `src/services/electron.ts` e o handler correspondente em `electron/ipc/*Handlers.js`.
- Mantenha filesystem privilegiado, captura de desktop, atalhos globais e comportamento de janelas do SO no processo principal do Electron.
- Mantenha dimensões e flags de segurança das janelas em `electron/windows/windowConfigs.js`.
- Mantenha estado persistido em `electron/store/jsonStore.js`; não adicione JSONs soltos sem atualizar a documentação de armazenamento.
- Mantenha declarações de ferramentas para Gemini em `src/constants/tools.ts` alinhadas com o executor real em `src/hooks/useGemini.ts`.
- Mantenha prompts visíveis ao usuário em `prompts/` e montagem de prompts em `src/constants/prompts.ts`.
- Mantenha o suporte Linux baseado em capacidades: não prometa stealth/content-protection ou system audio sem validação específica da plataforma.

## Manutenção da Documentação

Quando o código mudar:

- Atualize o documento de domínio específico em `docs/`.
- Adicione novos comandos ou ressalvas em `docs/OPERATIONS.md`.
- Adicione novos canais IPC em `docs/ELECTRON_IPC.md`.
- Adicione novos arquivos de armazenamento ou chaves de configuração em `docs/DATA_AND_STORAGE.md`.
- Adicione comportamento sensível a segurança em `docs/SECURITY.md`.

Fontes usadas nesta documentação:

- OpenAI, "Alavancando o Codex em um mundo centrado no agente": https://openai.com/pt-BR/index/harness-engineering/
- Viva o Linux, "CLAUDE.md: como regras simples podem reduzir erros de IA ao programar": https://www.vivaolinux.com.br/artigo/CLAUDEmd-como-regras-simples-podem-reduzir-erros-de-IA-ao-programar
