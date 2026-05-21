# Manutenção

## Dono da Documentação

`docs/` é a base de conhecimento do repositório. Mantenha-a sincronizada com o comportamento runtime.

`AGENTS.md` e `CLAUDE.md` são entradas compactas. Eles não devem virar manuais longos.

## Quando Atualizar Docs

Atualize docs na mesma mudança quando modificar:

- ciclo de vida do Electron, janelas, atalhos ou tray;
- nomes de métodos IPC, payloads ou formatos de resposta;
- hooks do renderer ou propriedade de funcionalidades;
- prompts Gemini, modelos, ferramentas ou comportamento de transcript;
- dados armazenados, schema de settings ou arquivos em `userData`;
- comportamento sensível a segurança;
- comandos, build, empacotamento ou requisitos de plataforma;
- estratégia de testes ou passos de validação.

## Roteamento da Documentação

- Comportamento do produto -> `PROJECT_OVERVIEW.md`
- Estrutura do sistema -> `ARCHITECTURE.md`
- Comportamento do renderer -> `FRONTEND.md`
- Contratos IPC -> `ELECTRON_IPC.md`
- IA, prompts, ferramentas, tarefas, skills, memória -> `AI_AND_TOOLS.md`
- Persistência e settings -> `DATA_AND_STORAGE.md`
- Execução, build, depuração -> `OPERATIONS.md`
- Segurança e privacidade -> `SECURITY.md`
- Testes e checagens manuais -> `TESTING.md`
- Workflow de agentes e regras de documentação -> `MAINTENANCE.md`

## Workflow de Agente

1. Leia `AGENTS.md`.
2. Abra apenas os docs relevantes para a tarefa.
3. Procure no código antes de propor novas abstrações.
4. Identifique o arquivo dono mais estreito para o comportamento.
5. Faça a menor mudança útil.
6. Rode primeiro a validação estreita.
7. Atualize docs se comportamento durável mudou.
8. Relate exatamente o que mudou e o que foi verificado.

## Checkpoints Para Trabalhos Maiores

Depois de cada fase significativa, registre:

- o que mudou;
- o que foi verificado;
- o que falta;
- qualquer suposição que possa estar errada.

Se a tarefa crescer além do escopo original, pare e divida em etapas menores.

## Evitando Drift da Documentação

- Prefira caminhos de arquivos e comportamento concreto a afirmações amplas.
- Não copie claims de marketing do README para docs de arquitetura sem confirmação no código.
- Se README e código discordarem, documente o código inspecionado e mencione a divergência quando relevante.
- Mantenha exemplos de comandos alinhados com `package.json`.
- Mantenha docs de IPC alinhadas com `preload.js` e handlers.

## Notas de Harness Engineering

O artigo solicitado da OpenAI defende repositórios legíveis por agentes:

- Markdown local é visível a agentes;
- índices curtos superam manuais monolíticos;
- docs estruturadas permitem disclosure progressivo;
- arquitetura e restrições de qualidade devem ser explícitas;
- falhas recorrentes de agentes devem virar docs, testes, lints ou restrições de código.

Aplique isso aqui transformando surpresas repetidas em artefatos do repositório, não apenas em contexto de chat.

## Notas das Regras de CLAUDE.md

O artigo solicitado sobre `CLAUDE.md` enfatiza regras pequenas, negativas e práticas:

- não adivinhar;
- não refatorar código não relacionado;
- não criar abstrações sem necessidade;
- não esconder falhas;
- não alegar validação sem executar.

Prefira regras que removem modos comuns de falha a conselhos genéricos como "escreva bom código".
