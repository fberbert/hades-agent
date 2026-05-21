# Testes e Validação

## Comando de Teste

```bash
npm test
```

O projeto usa Vitest conforme declarado em `package.json`.

## Validação de Build

```bash
npm run build
```

Rode depois de mudanças em TypeScript, React, Vite config, constants ou imports do renderer.

## Validação de Empacotamento

```bash
npm run dist
```

Use ao alterar configuração do Electron Builder, caminhos empacotados, ícones, assumptions de preload ou arquivos incluídos no app empacotado.

Para Linux:

```bash
npm run dist:linux
```

## Smoke Check Linux

```bash
npm run smoke:linux
```

Esse comando imprime detalhes de plataforma/sessão e roda build e testes com saída limitada dentro do script.

Smoke runtime Linux:

```bash
npm run smoke:linux:runtime
```

Ele inicia Vite e Electron com `HADES_LINUX_RUNTIME_SMOKE=1`, abre CommandBar, MiniChat, Settings e Susurro pelo main process, registra visibilidade/URLs e encerra.

## Notas de Validação Linux

### 2026-05-21 - Ubuntu GNOME X11

- Build: passou via `npm run build`.
- Testes: passou, 6 arquivos e 21 testes via `npm test`.
- Smoke: passou via `npm run smoke:linux`.
- Runtime smoke: passou via `npm run smoke:linux:runtime`; Vite iniciou em `3000`, Electron iniciou com `--no-sandbox`, atalhos globais foram registrados, e CommandBar, MiniChat, Settings e Susurro abriram como janelas visíveis/focadas com URLs esperadas.
- Pacote Linux: passou via `npm run dist:linux`; gerou `release/Hades-Agent-1.0.0-x86_64.AppImage` e `release/Hades-Agent-1.0.0-amd64.deb`.
- Stealth/content protection: degradado como esperado; Linux registrou `platform-unsupported` em vez de tratar comportamento sem suporte como sucesso.
- Chat real com modelo, captura de tela real e captura de áudio real: não concluídos nesta execução automatizada porque exigem chaves de API e prompts de permissão do desktop.

Use a matriz abaixo para mudanças que não podem ser cobertas apenas por testes unitários.

## Matriz de Validação Manual

### Command Bar

- Abra com `Alt+D`.
- Digite uma mensagem.
- Anexe ou cole uma imagem se comportamento de imagem mudou.
- Envie ao MiniChat.
- Verifique empilhamento entre command window e chat window.

### MiniChat

- Receba mensagem da Command Bar.
- Obtenha resposta de modelo.
- Verifique mudança no contador de tokens.
- Limpe ou encerre a sessão se persistência de chat mudou.
- Teste pin/minimize se estado de janela mudou.

### Ferramentas

- Teste o caminho específico da ferramenta alterada.
- Verifique se a declaração em `src/constants/tools.ts` corresponde ao executor em `useGemini.ts`.
- Confirme que erros aparecem e não são engolidos em silêncio.

### Susurro

- Abra com `Alt+B`.
- Inicie transcrição.
- Confirme que status Gemini Live chega a ready.
- Confirme que chunks de áudio produzem deltas de transcrição.
- Teste tradução se comportamento de tradução mudou.
- Pare transcrição e confirme encerramento da sessão.
- No Linux, confirme que captura de áudio do sistema sem suporte reporta erro claro e mantém o app responsivo.

### Settings

- Abra com `Alt+S`.
- Altere o setting tocado.
- Salve.
- Feche e reabra settings.
- Reinicie o app se comportamento de persistência mudou.

### Stealth Mode

- Alterne stealth mode.
- Mostre cada janela relevante.
- Verifique que `setContentProtection` é aplicado depois de show/focus.
- Reteste compartilhamento de tela ou captura no Windows se a mudança tocou ciclo de vida de janelas.

## Regra de Qualidade de Teste

Testes devem verificar intenção. Evite assertions que só provam que uma função retornou algo.

Fraco:

```ts
expect(result).toBeDefined()
```

Melhor:

```ts
expect(result.success).toBe(true)
expect(result.data.status).toBe('ready')
```

Para IPC e lógica determinística, prefira testes que falham quando uma regra é quebrada.

## Regra de Validação Para Agentes

Não diga "validado" a menos que um comando ou caminho manual tenha sido realmente executado.

Reporte validação assim:

- `npm run build` passou.
- `npm test` falhou porque uma dependência do ambiente de teste não estava disponível.
- Validação manual do Susurro não foi executada porque este ambiente é Linux e o comportamento alvo é captura desktop do Windows.

## Controle de Saída

Qualquer comando com saída desconhecida ou grande deve ser limitado por bytes:

```bash
COMMAND 2>&1 | head -c 4000
```

Isso se aplica especialmente a logs, buscas recursivas, package managers, listagens de processos e falhas de teste.
