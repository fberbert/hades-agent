# Contribuindo Para o Hades Agent ☤

Obrigado pelo interesse em contribuir com o Hades Agent. Contribuições da comunidade ajudam a tornar este agente desktop de IA cada vez melhor.

## Como Contribuir

### 1. Reportar Bugs e Sugerir Funcionalidades

- Abra uma issue descrevendo o bug ou a solicitação de funcionalidade.
- Seja o mais detalhado possível, incluindo passos para reproduzir o problema e informações do sistema quando forem relevantes.

### 2. Enviar Pull Requests

- Faça um fork do repositório e crie sua branch a partir de `master`.
- Se você adicionou código que deve ser testado, adicione testes.
- Garanta que a suíte de validação passe (`npm run build` e `npm test` quando aplicável).
- Garanta que o código esteja formatado e coerente com o padrão local.
- Abra um pull request contra a branch `master`.

## Ambiente de Desenvolvimento

1. Clone seu fork do repositório:

   ```bash
   git clone https://github.com/YOUR-USERNAME/Hades-Agent.git
   cd Hades-Agent
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Execute o ambiente de desenvolvimento:

   ```bash
   npm run dev
   ```

   No Linux, use:

   ```bash
   npm run dev:linux
   ```

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a [Licença MIT](LICENSE) do projeto.
