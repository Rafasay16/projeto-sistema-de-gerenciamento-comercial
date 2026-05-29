# 🛒 Dashboard de Gestão de Loja (InsightGestor)

Um painel administrativo completo e moderno para gerir operações de uma loja, incluindo vendas, estoque, clientes, análise de tráfego, campanhas de marketing e com aplicativo móvel integrado.

## ✨ Principais Funcionalidades

- **📊 Dashboard:** Visão geral de faturamento, ticket médio e alertas de estoque crítico.
- **📦 Produtos:** Gestão do catálogo de produtos e níveis de estoque.
- **👥 Clientes:** Lista de clientes com sistema de fidelidade, histórico de gastos e divisão por Tiers (Bronze, Prata, Ouro).
- **🛒 Pedidos:** Histórico completo de vendas, recibos detalhados e geração de novos pedidos integrados ao estoque.
- **📈 Analytics:** Gráficos interativos de tráfego, conversão e dispositivos (Mobile/Desktop).
- **📣 Marketing:** Controle de campanhas de tráfego pago e orgânico com cálculo automático de ROI.
- **📱 App Mobile Híbrido:** Aplicativo móvel híbrido (Android/iOS) que encapsula a interface web com alto desempenho, suporte a gestos nativos, monitoramento de conectividade em tempo real (tela offline amigável) e redirecionamento dinâmico para apps nativos (WhatsApp, Instagram, telefone e e-mail).

## 🚀 Tecnologias Utilizadas

**Front-end Web:**

- [React](https://reactjs.org/) (com Vite)
- [Tailwind CSS](https://tailwindcss.com/) + UI Components (shadcn/ui adaptado)
- [Recharts](https://recharts.org/) (Gráficos)
- [Apollo Client](https://www.apollographql.com/docs/react/) (Consumo de GraphQL)
- [React Router](https://reactrouter.com/) (Navegação)

**Back-end:**

- [Node.js](https://nodejs.org/) com Express
- [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (API GraphQL)
- [MongoDB](https://www.mongodb.com/) (Banco de Dados)
- Autenticação com JWT e Bcrypt

**Aplicativo Mobile:**

- [React Native](https://reactnative.dev/) com [Expo SDK 54](https://expo.dev/) (Expo Go)
- [React Native WebView](https://github.com/react-native-webview/react-native-webview) (Renderização rápida da interface web)
- [@react-native-community/netinfo](https://github.com/react-native-netinfo/react-native-netinfo) (Detecção offline em tempo real)

---

## ⚙️ Como Inicializar localmente

### 1. Instalar Dependências

Na raiz do projeto (para instalar dependências do Web/Back-end), rode no terminal:

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

O projeto já conta com arquivos `.env` pré-configurados com um cluster do MongoDB Atlas de demonstração tanto na raiz quanto na pasta `server`. Se desejar usar seu próprio banco de dados, crie ou edite o arquivo `.env` na raiz e na pasta `server` com as seguintes variáveis:

```env
PORT=3000
MONGODB_URI=mongodb+srv://branjomal_db_user:TqpZTiZRh0m4NcSl@cluster0.i215c9c.mongodb.net/?appName=Cluster0
JWT_SECRET=teste
```

### 3. Popular o Banco de Dados

Para preencher o banco de dados MongoDB com dados simulados de 3 anos (produtos, clientes, vendas, analytics e campanhas), execute o seguinte comando a partir da raiz do projeto:

```bash
node server/preencherdb.js
```

_(Aguarde até a mensagem de sucesso aparecer no terminal)._

### 4. Iniciar o Servidor Back-end

Para iniciar o servidor GraphQL e REST do back-end, execute na raiz do projeto:

```bash
node server.js
```

_(O servidor rodará em `http://localhost:3000` e o playground do Apollo Sandbox estará disponível em `http://localhost:3000/graphql`)._

### 5. Iniciar o Front-end Web

Abra um novo terminal na raiz do projeto e execute:

```bash
npm run dev
```

O Vite iniciará o servidor de desenvolvimento. O link padrão para entrar no site é `http://localhost:5173`.

- [Link do Postman para testes de API](https://mattxss2-4939110.postman.co/workspace/mat's-Workspace~cdf80a5d-95c4-4a89-8e25-5f9e06982dfb/collection/50583647-2cd194c6-3990-47cd-b7a4-0023885c8916?action=share&creator=50583647&active-environment=50583647-1f40873d-6aeb-4b67-8e6a-57f524f6676f/)

### 6. Iniciar o Aplicativo Mobile (Expo)

Para iniciar o aplicativo móvel localmente no seu computador ou emulador:

1. Navegue para a pasta `mobile`:
   ```bash
   cd mobile
   ```
2. Instale as dependências específicas do projeto móvel:
   ```bash
   npm install
   ```
3. Inicie o servidor de desenvolvimento do Expo:
   ```bash
   npm start
   ```
4. Escaneie o QR Code gerado no terminal usando o aplicativo **Expo Go** em seu dispositivo Android ou iOS (ou pressione `a` para emulador Android ou `i` para simulador iOS).

---

## 🌐 Como Executar em Outras Máquinas (Rede Local / Mobile Real)

Para rodar a aplicação em outras máquinas da mesma rede ou testar o aplicativo móvel diretamente em um smartphone físico conectando-se ao seu computador de desenvolvimento local, siga estes passos:

### Passo 1: Conectar à mesma rede

Certifique-se de que o computador que executa o servidor web e o celular/outro dispositivo que acessará o sistema estejam conectados **exatamente na mesma rede Wi-Fi**.

### Passo 2: Descobrir o IP Local da sua máquina

Abra o terminal na sua máquina de desenvolvimento e verifique o seu IP local:

- **Linux/macOS:** Execute `ifconfig` ou `ip a` (normalmente começa com `192.168.x.x` ou `10.x.x.x`).
- **Windows:** Execute `ipconfig` no Prompt de Comando.

### Passo 3: Iniciar o Front-end Web expondo-o na rede

Por padrão, o Vite só atende requisições de `localhost`. Para permitir conexões externas, inicie o front-end com a flag `--host`:

```bash
npm run dev -- --host
```

O console exibirá o endereço na rede local, por exemplo: `http://192.168.1.15:5173`.
_(Nota: O front-end foi desenvolvido de forma inteligente para se conectar à API dinamicamente usando o IP de acesso atual (`window.location.hostname`). Portanto, ao acessar pelo IP, ele se comunicará com o back-end automaticamente)._

### Passo 4: Configurar o IP no App Mobile

Para que o WebView do aplicativo móvel saiba onde carregar a aplicação:

1. Abra o arquivo `mobile/App.js` no seu editor.
2. Altere a constante `WEB_URL` no topo do arquivo para o IP local do seu computador de desenvolvimento:
   ```javascript
   // Altere o IP abaixo para o IP da sua máquina de desenvolvimento
   const WEB_URL = "http://192.168.1.15:5173";
   ```

### Passo 5: Iniciar o Expo e ler o QR Code

Na pasta `mobile`, execute:

```bash
npx expo start
```

Abra o aplicativo **Expo Go** no celular e escaneie o QR Code. O aplicativo carregará instantaneamente a aplicação web servida pelo seu computador.

---
