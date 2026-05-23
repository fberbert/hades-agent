# CLAUDE.md

Instruções para Claude e outros agentes de programação que trabalham neste repositório.

## Comece Aqui

Leia `AGENTS.md` primeiro. Ele é o mapa compacto do repositório. Depois abra apenas os arquivos de `docs/` relevantes para a tarefa.

Documentos centrais:

- `docs/README.md` - índice da base de conhecimento.
- `docs/PROJECT_OVERVIEW.md` - o que é o Hades Agent.
- `docs/ARCHITECTURE.md` - processos, janelas, renderer, services e fluxo de dados.
- `docs/ELECTRON_IPC.md` - contrato de IPC e preload.
- `docs/OPERATIONS.md` - execução, build, empacotamento e depuração.
- `docs/SECURITY.md` - regras de Electron, chaves, captura e filesystem.
- `docs/LINUX_PORT.md` - status de suporte Linux, ressalvas de capacidades e validação.

## Command Output

Proteja o uso de contexto. **Qualquer comando com saída desconhecida ou potencialmente grande deve ter limite por bytes.**

Padrão:

```bash
COMMAND 2>&1 | head -c 4000
```

Exemplos:

```bash
rg -n "ipcMain" . 2>&1 | head -c 4000
npm test 2>&1 | head -c 4000
find . -maxdepth 3 -type f 2>&1 | head -c 4000
```

## Regras

1. Não adivinhe. Se um requisito for ambíguo, declare suposições ou pergunte antes de implementar.
2. Faça a menor mudança útil. Não refatore código adjacente sem necessidade da tarefa.
3. Siga os padrões existentes do projeto. Prefira convenções locais a boas práticas genéricas.
4. Leia antes de criar. Procure hooks, services, handlers, constants e utilities existentes antes de adicionar novos.
5. Não misture padrões conflitantes. Se o repo tiver duas abordagens, escolha a já usada na área tocada e explique a escolha.
6. Código lida com decisões determinísticas. Não delegue retry, parsing, status checks, roteamento, permissões ou validação fixa a um LLM.
7. Testes devem verificar intenção. Evite testes que só checam se algo existe.
8. Verifique antes de reportar sucesso. Nomeie o comando ou caminho manual usado para validação.
9. Não esconda falhas. Relate checks bloqueados, ferramentas ausentes, incompatibilidade de plataforma ou validação pulada.
10. Mantenha conhecimento durável no repo. Atualize `docs/` quando arquitetura, comandos, armazenamento, IPC, prompts ou segurança mudarem.

## Restrições Específicas do Projeto

- Este é um app desktop Electron com renderer React/Vite.
- O renderer é sandboxed. Componentes React não devem importar APIs Node ou Electron diretamente.
- `preload.js` é a ponte pública exposta como `window.electron`.
- `electron/ipc/*Handlers.js` implementa o comportamento backend para métodos da ponte.
- `electron/store/jsonStore.js` é dono dos dados persistidos do usuário em `app.getPath('userData')`.
- Chaves de API são configurações do usuário e também podem vir de `.env`; nunca imprima valores reais.
- OpenAI é o único provider de IA. MiniChat e Dreaming usam `gpt-5-nano` por padrão; STT usa `gpt-4o-mini-transcribe`; realtime futuro usa `gpt-realtime-mini`.
- A OpenAI API key deve permanecer no main process. O renderer deve acessar OpenAI por IPC, não por chamada direta com segredo no frontend.
- Janelas são criadas sob demanda e configuradas em `electron/windows/windowConfigs.js`.
- `setContentProtection` e atalhos globais são centrais para o comportamento desktop no Windows; teste com cuidado ao mudar ciclo de vida das janelas.
- Suporte Linux é baseado em capacidades. Não prometa stealth/content-protection ou system audio no Linux sem validação específica da plataforma.

## Modelo de Documentação

O artigo de harness engineering da OpenAI recomenda uma entrada curta para agentes mais uma base estruturada em `docs/`. Este repositório segue esse modelo:

- `AGENTS.md` e `CLAUDE.md` são navegação e regras obrigatórias.
- `docs/` é o sistema de registro.
- Decisões complexas devem virar Markdown local, checks executáveis ou restrições de código em vez de contexto único de chat.

## Fontes Destas Regras

- OpenAI, "Alavancando o Codex em um mundo centrado no agente": https://openai.com/pt-BR/index/harness-engineering/
- Viva o Linux, "CLAUDE.md: como regras simples podem reduzir erros de IA ao programar": https://www.vivaolinux.com.br/artigo/CLAUDEmd-como-regras-simples-podem-reduzir-erros-de-IA-ao-programar
