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
- Testes: passou, 20 arquivos e 72 testes via `npm test`.
- Smoke: passou via `npm run smoke:linux`.
- Runtime smoke: passou via `npm run smoke:linux:runtime`; Vite iniciou em `3000`, Electron iniciou com `--no-sandbox`, atalhos globais foram registrados, e CommandBar, MiniChat, Settings e Susurro abriram como janelas visíveis/focadas com URLs esperadas.
- Pacote Linux: passou via `npm run dist:linux`; gerou `release/Hades-Agent-1.0.0-x86_64.AppImage` e `release/Hades-Agent-1.0.0-amd64.deb`.
- Stealth/content protection: degradado como esperado; Linux registrou `platform-unsupported` em vez de tratar comportamento sem suporte como sucesso.
- Chat real com modelo, Susurro realtime com microfone, captura de tela real e captura de áudio real: não concluídos nesta execução automatizada porque exigem chaves de API e prompts de permissão do desktop.

Use a matriz abaixo para mudanças que não podem ser cobertas apenas por testes unitários.

## Matriz de Validação Manual

### Command Bar

- Abra com `Alt+D`.
- Abra o MiniChat direto com `Alt+C` e confirme que ele aparece sem enviar mensagem.
- Digite uma mensagem.
- Anexe ou cole uma imagem se comportamento de imagem mudou.
- Envie ao MiniChat.
- Verifique empilhamento entre command window e chat window.

### MiniChat

- Receba mensagem da Command Bar.
- Obtenha resposta de modelo.
- Confirme que a resposta passa por `assistant-generate-response` e que web search usa OpenAI Responses.
- Verifique mudança no contador de tokens.
- Limpe ou encerre a sessão se persistência de chat mudou.
- Teste pin/minimize se estado de janela mudou.

### Susurro

- Abra com `Alt+B`.
- Pressione espaço para iniciar a transcrição.
- No Linux, fale no microfone; o modo esperado é microfone, não áudio do sistema.
- Observe status `ready`, deltas parciais e texto final vindos do OpenAI Realtime.
- Teste tradução se comportamento de tradução mudou.
- Pressione espaço para parar e confirme encerramento da sessão.
- Se a mudança tocar áudio do sistema no Linux, confirme que a ausência de backend PulseAudio/PipeWire reporta erro claro e mantém o app responsivo.

Validação humana real do Susurro realtime com microfone ainda não foi registrada como concluída nesta base. Não marque sucesso manual sem executar o roteiro acima com OpenAI API key válida, permissão de microfone e fala audível.

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
- Validação manual do Susurro Linux por microfone não foi executada; ainda falta teste humano com `Alt+B`, espaço, fala no microfone e parada com espaço.

## Controle de Saída

Qualquer comando com saída desconhecida ou grande deve ser limitado por bytes:

```bash
COMMAND 2>&1 | head -c 4000
```

Isso se aplica especialmente a logs, buscas recursivas, package managers, listagens de processos e falhas de teste.
