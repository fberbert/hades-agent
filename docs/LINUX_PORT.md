# Portabilidade Linux

## Status de Suporte

O suporte Linux é baseado em capacidades. Chat central, settings, prompts, busca, armazenamento local e a maior parte do renderer são portáveis. A integração desktop depende do display server e dos desktop portals instalados.

## Suportado na Primeira Versão Linux

- Desenvolvimento com `npm run dev:linux`.
- Build/empacotamento com `npm run dist:linux`.
- CommandBar e MiniChat.
- Settings.
- Fluxos Gemini e Tavily.
- Armazenamento JSON local.
- Tray com ícone PNG.
- Captura de microfone quando permissões de mídia do navegador funcionam.

## Degradado ou Condicional

- Atalhos globais dependem de X11 ou suporte a Wayland portal.
- Captura de tela depende do `desktopCapturer` do Electron, PipeWire e `xdg-desktop-portal`.
- Captura de áudio do sistema fica desabilitada até existir backend Linux implementado e testado.
- Stealth/content protection não é suportado no Linux.

## Pacotes Runtime Necessários

Para testar Wayland/captura de tela, instale os pacotes de portal adequados ao desktop, por exemplo:

- `xdg-desktop-portal`
- `xdg-desktop-portal-gtk` ou backend específico do desktop
- pacotes PipeWire fornecidos pela distribuição

Nomes de pacotes variam por distribuição.

## Validação

```bash
npm install
npm run build
npm test
npm run dev:linux
```

Para smoke validation:

```bash
npm run smoke:linux
npm run smoke:linux:runtime
```

## Validação Linux Atual

A primeira validação neste checkout passou em:

- platform: Linux
- arch: x86_64
- session: x11
- desktop: ubuntu:GNOME
- build: pass
- tests: 21 pass em 6 arquivos
- package: pass, AppImage e deb gerados em `release/`
- runtime smoke: pass; Electron abriu CommandBar, MiniChat, Settings e Susurro, confirmou cada janela visível/focada com URL esperada e saiu.

Chat com modelo real, captura de tela real e captura de áudio real ainda exigem chaves de API configuradas e prompts de permissão do desktop. Áudio do sistema permanece intencionalmente desabilitado no Linux até existir backend dedicado implementado e testado.

## Nota Sobre Sandbox em Desenvolvimento

`npm run dev:linux` inicia Electron com `--no-sandbox`. Isso é uma conveniência de desenvolvimento para checkouts de código-fonte onde `node_modules/electron/dist/chrome-sandbox` não pertence a root com modo `4755`. Não trate isso como o modelo de segurança do app empacotado.

## Não Objetivo

Suporte Linux não promete janelas invisíveis durante compartilhamento de tela. O comportamento anti-gravação do Windows usa APIs de plataforma sem equivalente direto no Linux.
