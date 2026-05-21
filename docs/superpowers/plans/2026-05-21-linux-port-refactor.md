# Plano de Refatoração Para Portabilidade Linux

> **Para agentes:** este documento registra o plano executado para fazer o Hades Agent rodar no Linux de forma baseada em capacidades. Ele deve ser usado como histórico técnico e como guia para próximas fases de hardening.

## Objetivo

Refatorar o Hades Agent para que o núcleo do assistente desktop funcione no Linux sem quebrar o comportamento existente no Windows, degradando explicitamente recursos que não têm equivalência confiável no Linux.

## Estratégia

A estratégia adotada foi criar uma camada explícita de capacidades de plataforma no processo principal Electron e encaminhar comportamento específico de Windows por adapters guardados.

Linux foi tratado em fases:

1. boot do app, CommandBar, MiniChat e Settings;
2. integração desktop básica: tray, atalhos globais e janelas;
3. captura de tela com metadados de capacidade;
4. áudio do sistema como recurso não suportado até existir backend PipeWire/PulseAudio validado;
5. empacotamento AppImage/deb e smoke tests automatizados.

## Stack Envolvida

- Electron 42
- React 19
- Vite 8
- TypeScript
- CommonJS no main process Electron
- Vitest
- electron-builder
- Linux AppImage/deb

## Status de Execução

Atualizado em 2026-05-21:

- Tarefas 1-11 foram implementadas e validadas na working tree.
- `npm test`, `npm run build`, `npm run smoke:linux`, `npm run smoke:linux:runtime` e `npm run dist:linux` passaram no ambiente Linux atual.
- O runtime smoke abriu CommandBar, MiniChat, Settings e Susurro pelo main process e confirmou que cada janela tinha BrowserWindow visível/focado com URL esperada.
- Checagens reais com modelo, captura de tela e captura de áudio ainda dependem de chaves de API configuradas e permissões reais do desktop.
- A tarefa 12 permanece como hardening opcional para backend Linux futuro.
- Commits por tarefa não foram executados nesta working tree.

## Fontes e Restrições

Documentação oficial consultada ao planejar:

- `BrowserWindow.setContentProtection` é documentado para macOS e Windows, não Linux: https://www.electronjs.org/docs/api/browser-window
- `desktopCapturer.getSources()` tem ressalvas de Linux/PipeWire: https://www.electronjs.org/docs/latest/api/desktop-capturer
- `globalShortcut` pode usar `GlobalShortcutsPortal` no Wayland: https://www.electronjs.org/docs/latest/api/global-shortcut/
- electron-builder suporta alvos Linux como `AppImage` e `deb`: https://www.electron.build/docs/targets/

Fatos verificados no repositório antes da execução:

- `package.json` tinha scripts orientados a Windows.
- `electron/tray.js` usava `.ico`.
- `electron/windows/windowManager.js` chamava `setContentProtection()` diretamente.
- `electron/windows/windowConfigs.js` já guardava `setBackgroundMaterial('mica')` por `process.platform === 'win32'`.
- `electron/shortcuts.js` registrava atalhos globais diretamente.
- `src/hooks/useAudioRecorder.ts` usava constraints de desktop capture para áudio do sistema.
- `electron/ipc/toolHandlers.js` usava `desktopCapturer.getSources()` para captura de tela/janela e source id de áudio do sistema.
- `npm run build` passava após `npm install`.
- Antes da refatoração não havia suíte de testes útil para esses adapters.

## Escopo

Incluído:

- boot em desenvolvimento no Linux;
- alvo de build/empacotamento Linux;
- ícone PNG seguro para tray;
- detecção de capacidades de plataforma;
- comportamento guardado para stealth/content protection;
- fallback de atalhos e flag de portal Wayland;
- metadata de captura de tela no Linux;
- plano honesto para áudio do sistema no Linux;
- testes para adapters de plataforma;
- documentação atualizada.

Fora do primeiro passe:

- garantir invisibilidade contra captura no Linux;
- suportar todos os desktop environments igualmente;
- implementar backend nativo completo PipeWire/PulseAudio;
- mudar comportamento de produto do Gemini/chat além do necessário para suporte de plataforma.

## Comportamento Alvo

### Linux Fase 1: Núcleo Usável

- `npm run dev:linux` inicia Vite e Electron no Linux.
- App inicia sem exceções específicas de plataforma.
- CommandBar, MiniChat, Settings, Gemini chat, Tavily, armazenamento local, prompts e docs continuam funcionando.
- Tray usa ícone PNG.
- Stealth mode é exibido como sem suporte/degradado no Linux em vez de fingir sucesso.

### Linux Fase 2: Integração Desktop

- Atalhos globais tentam registrar.
- Sessões Wayland habilitam `GlobalShortcutsPortal`.
- Falhas de atalhos aparecem em logs/settings em vez de quebrarem silenciosamente.
- Captura de tela lista/captura fontes quando Electron/portal suportam.

### Linux Fase 3: Áudio

- Microfone funciona onde permissões de mídia do navegador funcionam.
- Áudio do sistema é detectado separadamente de microfone.
- No Linux, áudio do sistema falha com mensagem clara até existir backend dedicado.
- Susurro não fica preso em "connecting" quando um caminho de captura sem suporte falha.

## Arquivos Criados

- `electron/platform/capabilities.js`
- `electron/platform/icons.js`
- `electron/platform/windowFeatures.js`
- `electron/platform/shortcuts.js`
- `electron/platform/captureCapabilities.js`
- `electron/platform/runtimeSmoke.js`
- `src/utils/captureCapabilities.ts`
- `scripts/linux-smoke-check.sh`
- `scripts/linux-runtime-smoke.sh`
- `tests/platform/capabilities.test.js`
- `tests/platform/icons.test.js`
- `tests/platform/windowFeatures.test.js`
- `tests/platform/shortcuts.test.js`
- `tests/platform/captureCapabilities.test.js`
- `tests/platform/rendererCaptureCapabilities.test.ts`
- `docs/LINUX_PORT.md`

## Arquivos Modificados

- `package.json`
- `main.js`
- `preload.js`
- `electron/tray.js`
- `electron/shortcuts.js`
- `electron/windows/windowManager.js`
- `electron/windows/windowConfigs.js`
- `electron/ipc/settingsHandlers.js`
- `electron/ipc/toolHandlers.js`
- `src/types/electron.ts`
- `src/services/electron.ts`
- `src/hooks/useAudioRecorder.ts`
- `src/hooks/useTranscription.ts`
- `src/hooks/useSettings.ts`
- `src/components/Settings.tsx`
- `src/components/settings/GeneralTab.tsx`
- `src/components/settings/AudioTab.tsx`
- `README.md`
- `docs/TESTING.md`
- `docs/OPERATIONS.md`
- `docs/SECURITY.md`
- `docs/PROJECT_OVERVIEW.md`
- `AGENTS.md`
- `CLAUDE.md`

## Principais Decisões

### Camada de Capacidades

`electron/platform/capabilities.js` detecta plataforma, display server, desktop session, arquitetura e recursos disponíveis. Essa camada evita `process.platform` espalhado pela aplicação.

Capacidades relevantes:

- content protection;
- mica background;
- global shortcuts;
- Wayland portal;
- tray icon;
- desktop capture;
- system audio capture.

### Content Protection

`setContentProtection` não é tratado como suportado no Linux. A chamada passa por `applyContentProtection()`, que retorna resultado estruturado com `success`, `supported` e `reason`.

No Linux, o resultado esperado é `platform-unsupported`.

### Janelas no Linux

Janelas transparentes causaram render preto em validação X11. A solução foi aplicar fallback visual opaco no Linux:

- `transparent: false`
- `hasShadow: true`
- `backgroundColor: '#120707'`

Windows mantém o comportamento transparente original.

### Atalhos Globais

Atalhos continuam sendo registrados por Electron `globalShortcut`, mas agora há flags runtime para Wayland e formatação clara de resultado. Falhas não devem ser mascaradas.

### Captura

Captura de tela usa as APIs do Electron quando disponíveis. No Linux, metadados avisam que o resultado depende de PipeWire e desktop portal.

Áudio do sistema no Linux retorna erro estruturado de sem suporte. Isso evita estados silenciosos e loops presos em `connecting`.

### Empacotamento

Foram adicionados scripts Linux e configuração electron-builder para:

- AppImage
- deb

O empacotamento Linux inclui maintainer em `package.json`, exigido pelo alvo deb.

## Validação Executada

```bash
npm test
npm run build
npm run smoke:linux
npm run smoke:linux:runtime
npm run dist:linux
```

Resultados:

- `npm test`: passou, 6 arquivos e 21 testes.
- `npm run build`: passou.
- `npm run smoke:linux`: passou em Linux x86_64, X11, ubuntu:GNOME.
- `npm run smoke:linux:runtime`: passou; abriu CommandBar, MiniChat, Settings e Susurro.
- `npm run dist:linux`: passou; gerou AppImage e deb em `release/`.

Artefatos gerados:

- `release/Hades-Agent-1.0.0-x86_64.AppImage`
- `release/Hades-Agent-1.0.0-amd64.deb`

## Critérios de Aceite

Considerado atendido:

- boot Linux por `npm run dev:linux`;
- build renderer;
- testes unitários dos adapters de plataforma;
- smoke estático Linux;
- smoke runtime Linux com janelas principais;
- empacotamento Linux AppImage/deb;
- docs atualizadas;
- fallback claro para stealth/content protection no Linux;
- erro claro para system audio sem suporte no Linux.

Ainda exige validação manual fora do smoke:

- fluxo real Gemini com chave configurada;
- busca Tavily real;
- captura de tela com prompt de permissão desktop;
- microfone em ambiente real;
- comportamento Windows regressivo em máquina Windows.

## Próximas Fases Opcionais

1. Implementar backend PipeWire/PulseAudio dedicado para áudio do sistema.
2. Adicionar teste end-to-end com Playwright/Electron se a infraestrutura do projeto permitir.
3. Validar Wayland com `xdg-desktop-portal`.
4. Validar AppImage/deb instalados em distribuição limpa.
5. Revalidar Windows para garantir que transparência e content protection permaneceram intactos.

## Regra de Comandos

Qualquer comando com saída desconhecida ou potencialmente grande deve ser limitado:

```bash
COMMAND 2>&1 | head -c 4000
```

Isso protege o contexto dos agentes e evita despejo de logs grandes durante depuração.
