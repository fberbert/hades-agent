<p align="center">
  <img src="https://res.cloudinary.com/dmii83n8i/image/upload/fl_preserve_transparency/v1779237561/hades-agent_cx7vq7.jpg?_s=public-apps" alt="Banner do Hades" width="100%" style="border-radius: 16px; max-width: 800px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
</p>

<table>
  <tr>
    <td width="35%" align="center" valign="top">
      <img src="public/icon/icon.png" width="280" style="border-radius: 40px; border: 5px solid #ff2a2a; box-shadow: 0 15px 40px rgba(255, 42, 42, 0.4); display: block; margin-bottom: 15px;" alt="Logo do Hades Agent" />
      <p align="center" style="margin-top: 10px; margin-bottom: 0;">
        <img src="https://img.shields.io/badge/License-MIT-red?style=flat-square&color=150202" alt="Licença" style="display: inline-block; vertical-align: middle;" />
        <img src="https://img.shields.io/badge/Electron-42.0-red?style=flat-square&logo=electron&logoColor=white&color=150202" alt="Electron" style="display: inline-block; vertical-align: middle;" />
        <img src="https://img.shields.io/badge/React-19.0-red?style=flat-square&logo=react&logoColor=61DAFB&color=150202" alt="React" style="display: inline-block; vertical-align: middle;" />
      </p>
    </td>
    <td width="65%" valign="top" style="padding-left: 20px;">
      <h1 style="margin-top: 0; margin-bottom: 8px;">Hades Agent <img src="https://res.cloudinary.com/dmii83n8i/image/upload/v1779302517/hades-tray-icon-128_dks55n.png" width="36" height="36" align="center" style="display: inline-block; vertical-align: middle; margin-left: 6px;" alt="Ícone do Hades" /></h1>
      <p><strong>Hades é um companheiro desktop invisível e ultrarrápido, com consolidação autônoma de memória em segundo plano e agendador local de tarefas.</strong></p>
      <p><strong>Limites de segurança:</strong> isolado em sandbox, com <strong>zero acesso de escrita no sistema</strong> para a IA (não cria, edita ou apaga arquivos, nem executa scripts). A IA fica restrita a consultas Google em tempo real via Tavily e logs locais de memória, mantendo o computador seguro.</p>
    </td>
  </tr>
</table>

<p align="center" style="margin-top: 20px;">
  <a href="https://github.com/victorl-dev/Hades-Agent/releases"><img src="https://img.shields.io/badge/Releases-Download-FF2A2A?style=for-the-badge&logo=github" alt="Releases"></a>
  <a href="https://github.com/victorl-dev/Hades-Agent/blob/master/LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="Licença: MIT"></a>
  <a href="https://github.com/victorl-dev/Hades-Agent"><img src="https://img.shields.io/badge/Built%20With-Gemini%20Live%20API-blueviolet?style=for-the-badge" alt="Construído com Gemini Live"></a>
  <a href="https://github.com/victorl-dev/Hades-Agent"><img src="https://img.shields.io/badge/Platform-Windows-0078D6?style=for-the-badge&logo=windows&logoColor=white" alt="Plataforma: Windows"></a>
</p>

<table>
<tr>
  <td><b>🛡️ Escudo Anti-Gravação</b></td>
  <td>Proteção nativa do sistema operacional via <code>setContentProtection</code>. No Windows, o Hades pode ficar invisível para APIs de captura de tela como OBS Studio, Discord, Teams e Zoom, reduzindo vazamento de dados privados em compartilhamento de tela.</td>
</tr>
<tr>
  <td><b>🎙️ Transcrição em Tempo Real (Alt+B)</b></td>
  <td>Pressione <code>Alt+B</code> para capturar e transcrever áudio interno do PC, como reuniões ou aulas, em tempo real. O fluxo envia áudio <strong>PCM 16 kHz</strong> por WebSocket full-duplex diretamente para a <strong>Gemini Live API</strong>.</td>
</tr>
<tr>
  <td><b>⚡ Barra de Comando Spotlight</b></td>
  <td>Pressione <code>Alt+D</code> para abrir uma barra de comando flutuante e sem borda. Ela entrega respostas com contexto de internet em tempo real via Tavily Search API, permite anexar imagens, trocar modelos e responder sem sair do fluxo de trabalho.</td>
</tr>
<tr>
  <td><b>💬 MiniChat de Sessão</b></td>
  <td>HUD persistente de conversa que mostra modelo ativo, contagem de tokens e custo da sessão. A sessão pode ser encerrada para zerar timers, histórico e gastos sem reiniciar o app.</td>
</tr>
<tr>
  <td><b>🧠 Consolidação de Memória Dream</b></td>
  <td>Ciclos agendados em segundo plano sintetizam logs recentes de sessão em um perfil comprimido de memória em <strong><code>learnings.json</code></strong>, semelhante à consolidação de memória de longo prazo durante o sono.</td>
</tr>
<tr>
  <td><b>📋 Agendador Seguro de Tarefas</b></td>
  <td>Livro local de tarefas em sandbox, sem permissão ampla de escrita no sistema. Permite agendar pesquisas web, criar lembretes diários e organizar respostas do MiniChat sem modificar arquivos locais arbitrariamente.</td>
</tr>
</table>

---

## <img src="https://api.iconify.design/lucide:download.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Começando

### Para Usuários (Instalador)

1. Acesse a página de **[Releases](https://github.com/victorl-dev/Hades-Agent/releases)**.
2. Baixe **`Hades-Agent-Setup-1.0.0.exe`** ou a versão portátil `.zip`.
3. Execute o instalador, abra o Hades e pressione **`Alt+S`** para informar suas chaves de API.

> [!WARNING]
> **Plataforma:** Hades é Windows-first. O suporte Linux é experimental e baseado em capacidades: os fluxos centrais de chat rodam depois da refatoração Linux, mas stealth/content protection e captura de áudio do sistema não são garantidos. macOS não é suportado.

> [!IMPORTANT]
> Hades requer duas chaves de API gratuitas para operar:
> - **[Google Gemini API Key](https://aistudio.google.com/app/apikey)** - para inferência de IA e streaming de voz.
> - **[Tavily Search API Key](https://app.tavily.com/)** - para busca web em tempo real.

### Para Desenvolvedores (Build do Código-Fonte)

**Pré-requisitos**

| Requisito | Versão | Observações |
| :--- | :--- | :--- |
| [Node.js](https://nodejs.org/) | v18.x ou mais novo | LTS recomendado |
| npm | incluído com Node.js | — |
| Windows | 10 / 11 | alvo principal |
| Linux | distribuição desktop moderna | suporte experimental via scripts Linux |

```bash
# 1. Clone o repositório
git clone https://github.com/victorl-dev/Hades-Agent.git
cd Hades-Agent

# 2. Instale as dependências
npm install

# 3. Execute o ambiente de desenvolvimento no Windows
npm run dev

# 4. No Linux, use o script específico
npm run dev:linux
```

O servidor de desenvolvimento inicia o Vite na porta `3000` e o Electron com hot reload do renderer.

---

## <img src="https://api.iconify.design/lucide:keyboard.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Atalhos de Teclado

O Hades fica silencioso na bandeja do sistema e pode ser chamado de qualquer aplicação:

| Atalho | Ação |
| :--- | :--- |
| **`Alt+D`** | Abrir ou ocultar a barra de comando Spotlight |
| **`Alt+B`** | Abrir ou ocultar o HUD de transcrição em tempo real |
| **`Alt+S`** | Abrir configurações e customização de atalhos |
| **`Alt+V`** | Alternar modo de entrada por voz |
| **`Esc`** | Ocultar a janela ativa e restaurar o foco anterior |

> [!TIP]
> Todos os atalhos podem ser redefinidos. Abra a aba **Atalhos** em Configurações (`Alt+S`) para escolher novas combinações.

---

## <img src="https://api.iconify.design/lucide:network.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Arquitetura do Sistema

Hades coordena múltiplas janelas overlay por uma ponte estrita de eventos IPC, mantendo o renderer em sandbox enquanto o processo principal executa operações privilegiadas:

```mermaid
graph TD
    classDef main fill:#1a0505,stroke:#ff2a2a,stroke-width:2px,color:#fff;
    classDef float fill:#0a0303,stroke:#dc2626,stroke-width:1px,color:#fff;
    classDef service fill:#111,stroke:#888,stroke-width:1px,color:#aaa;
    classDef external fill:#2b0c0c,stroke:#f97316,stroke-width:1px,color:#ffed4a;

    Main[Processo Principal Electron]:::main
    
    subgraph UI_Layers [Janelas Overlay]
        CommandBar[Alt+D: Comando Spotlight]:::float
        MiniChat[Janela Dinâmica MiniChat]:::float
        Susurro[Alt+B: HUD de Transcrição]:::float
        Notification[Alertas e Notificações]:::float
        Settings[Alt+S: Configurações e Atalhos]:::float
    end
    
    SSoT[Protocolo da Ponte IPC]:::service
    Store[JsonStore Seguro AES-256]:::service
    Dream[DreamService de Memória]:::service
    
    subgraph Cloud_APIs [Serviços de Inteligência em Nuvem]
        Gemini[Gemini Live API]:::external
        Tavily[Tavily Search API]:::external
    end

    Main -->|Gerencia estado das janelas| UI_Layers
    UI_Layers -->|Sinais e ações IPC| SSoT
    SSoT -->|Handlers Electron| Main
    Main -->|Lê/escreve segredos AES-256| Store
    Main -->|Agenda consolidação de IA| Dream
    Dream -->|Persiste aprendizados| Store
    
    Main <-->|Stream de áudio PCM 16kHz| Gemini
    Main <-->|Consultas web assíncronas| Tavily
```

---

## <img src="https://api.iconify.design/lucide:cpu.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Engenharia Assistida por IA

O Hades foi co-desenvolvido com apoio de agentes de programação, usando desenvolvimento orientado por subagentes e validação incremental:

- **Autonomia modular:** partes como IPC, criptografia AES-256, pipeline PCM de voz e ciclo de vida de janelas foram isoladas por responsabilidade.
- **Gates de qualidade:** a arquitetura favorece hooks menores, store central (`jsonStore.js`) e build Vite rápido.
- **Hardening contínuo:** isolamento de sandbox, Content Security Policy e `contextIsolation` protegem as fronteiras IPC.

---

## <img src="https://api.iconify.design/lucide:sparkles.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Inspiração e Créditos

> [!NOTE]
> Hades Agent é inspirado por **Persua**, um conceito de assistente de voz e IA em tempo real criado pelo engenheiro de software **Lucas Montano** ([@lucasmontano](https://github.com/lucasmontano)). O Hades foi desenvolvido do zero para explorar streaming PCM, WebSockets full-duplex e proteção de conteúdo em nível de sistema operacional no Electron.

---

## <img src="https://api.iconify.design/lucide:star.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Histórico de Stars

<a href="https://www.star-history.com/?repos=victorl-dev%2Fhades-agent&type=date&legend=top-left">
 <picture>
   <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/chart?repos=victorl-dev/hades-agent&type=date&theme=dark&legend=top-left" />
   <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/chart?repos=victorl-dev/hades-agent&type=date&legend=top-left" />
   <img alt="Gráfico de histórico de stars" src="https://api.star-history.com/chart?repos=victorl-dev/hades-agent&type=date&legend=top-left" />
 </picture>
</a>

---

## <img src="https://api.iconify.design/lucide:file-text.svg?color=%23ff2a2a" width="22" height="22" align="center" style="vertical-align: middle; margin-right: 8px;" /> Licença

MIT — consulte [LICENSE](LICENSE).

Construído por [Victor L.](https://github.com/victorl-dev)
