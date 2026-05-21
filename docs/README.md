# Base de Conhecimento do Hades Agent

Este diretório é a base de conhecimento durável para agentes e mantenedores. `AGENTS.md` e `CLAUDE.md` ficam curtos e apontam para cá.

## Caminho Rápido

- Novo no repositório: leia `PROJECT_OVERVIEW.md` e depois `ARCHITECTURE.md`.
- Alterando janelas ou ciclo de vida do Electron: leia `ARCHITECTURE.md`, `ELECTRON_IPC.md` e `SECURITY.md`.
- Alterando chat, prompts, ferramentas, Gemini, Susurro, tradução ou memória: leia `AI_AND_TOOLS.md`.
- Alterando estado persistido ou configurações: leia `DATA_AND_STORAGE.md`.
- Executando, buildando, empacotando ou depurando: leia `OPERATIONS.md`.
- Escrevendo testes ou verificando um patch: leia `TESTING.md`.
- Mantendo docs atualizadas: leia `MAINTENANCE.md`.

## Documentos

- `PROJECT_OVERVIEW.md` - propósito do produto, principais capacidades, stack e mapa do repositório.
- `ARCHITECTURE.md` - processo principal, renderer, ciclo de vida de janelas, IPC, services e fluxo de dados.
- `FRONTEND.md` - organização do renderer React, componentes, hooks, estilos e estado de UI.
- `ELECTRON_IPC.md` - API do preload, arquivos de handlers, grupos de canais e procedimento de mudança.
- `AI_AND_TOOLS.md` - prompts Gemini, loop do MiniChat, ferramentas, transcrição Susurro, tradução, skills, tarefas e memória Dream.
- `DATA_AND_STORAGE.md` - armazenamento em `userData`, schema de settings, históricos, sessões, personas, tokens e tarefas.
- `OPERATIONS.md` - instalação, desenvolvimento, build, empacotamento, logs, ressalvas de plataforma e troubleshooting.
- `SECURITY.md` - sandbox, context isolation, content protection, chaves, limites de filesystem, CSP e captura.
- `TESTING.md` - comandos de teste, checagens manuais, expectativas de validação e lacunas.
- `MAINTENANCE.md` - regras de atualização da documentação, workflow de agentes e higiene do repo.
- `LINUX_PORT.md` - status de suporte Linux, ressalvas de capacidades, comandos e notas de validação.

## Princípios de Documentação

A base segue duas referências solicitadas:

- Harness engineering da OpenAI: o repositório deve expor conhecimento legível por agentes com um índice pequeno e docs locais estruturadas.
- Artigo sobre `CLAUDE.md`: agentes precisam de restrições claras que evitem adivinhação, diffs amplos, mistura de padrões, testes fracos e alegações sem validação.

Na dúvida, atualize o documento mais específico que seja dono do comportamento.
