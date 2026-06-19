# InsightGestor - Sistema de Gestão Comercial Corporativa

Um sistema de gestão comercial distribuído e full-stack, projetado para administração completa de lojas e operações móveis de ponto de venda (POS). A arquitetura consiste em um backend GraphQL, um painel de administração web baseado em React e um aplicativo móvel nativo em React Native para a equipe de vendas de balcão.

## Colaboradores:
- Matheus Rey Rodriguez
- Rafael Ribeiro Carvalho
- Bruno da Silva Bezerra
- Matheus Nascimento Farias
- João Pedro Santos de Sousa

## Principais Funcionalidades

- **Dashboard de Business Intelligence (BI):** Motor de análise em tempo real que monitora faturamento, ticket médio e desempenho de produtos.
- **Gestão de Estoque:** Catálogo completo com operações CRUD, alertas de estoque baixo e capacidade de soft-delete para conformidade de auditoria.
- **Customer Relationship Management (CRM):** Classificação automática de fidelidade (Bronze, Prata, Ouro) baseada em volumes cumulativos de transações.
- **Mobile POS (Frente de Caixa):** Interface móvel nativa para processamento de transações com sincronização de estoque em tempo real.
- **Análise Assistida por IA:** Assistente LLM integrado (Gemini 2.5 Flash) que fornece insights comerciais contextuais com base na telemetria de vendas local e níveis de estoque.

## Stack Tecnológico

### Infraestrutura e Backend
- **Ambiente de Execução:** Node.js / Express
- **Arquitetura da API:** Apollo Server (GraphQL)
- **Banco de Dados:** MongoDB (Atlas / Local)
- **Autenticação:** JWT (JSON Web Tokens) com hash Bcrypt
- **Integração de IA:** SDK Google GenAI

### Cliente Web (Painel Administrativo)
- **Framework:** React / Vite
- **Estilização:** Tailwind CSS / Shadcn UI
- **Consumo de Dados:** Apollo Client
- **Visualização de Dados:** Recharts

### Cliente Mobile (App POS)
- **Framework:** React Native / Expo SDK 54
- **Roteamento:** React Navigation
- **Estado e Dados:** Apollo Client / AsyncStorage
- **Segurança:** Expo SecureStore para gestão criptografada de tokens

---

## Instalação e Configuração

### 1. Inicialização do Servidor Backend

O backend expõe um endpoint GraphQL na porta 3000.

```bash
# Instalar dependências
npm install

# (Opcional) Povoar o banco de dados com dados comerciais simulados
node server/preencherdb.js

# Iniciar o servidor
node server.js
```
*O GraphQL Playground estará disponível em `http://localhost:3000/graphql`.*

### 2. Inicialização do Dashboard Web (Exclusivo Desktop)

O cliente web fornece as capacidades administrativas da loja. **Nota: O Vite é utilizado única e exclusivamente para a versão Desktop com React.**

```bash
# Iniciar o servidor de desenvolvimento do Vite
npm run dev
```
*O painel administrativo será servido em `http://localhost:5173`.*

### 3. Inicialização do Aplicativo Mobile (Exclusivo Mobile)

Para a parte móvel, **não se utiliza o Vite**. A inicialização é feita **apenas pelo Expo Go** ou emulador nativo.

```bash
cd mobile
npm install
npx expo start
```
*Pressione `a` para iniciar via Emulador do Android Studio, ou escaneie o QR Code usando o aplicativo Expo Go em um dispositivo físico.*

---

## Configuração de Rede do Cliente Mobile

Por padrão, o cliente móvel deve ser configurado para apontar para o endpoint GraphQL do backend. A configuração é acessível através das configurações na tela de Login.

### Ambiente Virtual (Emulador do Android Studio)
Ao executar o cliente Expo através do Emulador do Android Studio na máquina host:
- Defina a URL da API como: `http://10.0.2.2:3000`

### Ambiente Físico (Rede Local - LAN)
Ao testar em um dispositivo físico via Expo Go:
1. Certifique-se de que a máquina host e o dispositivo físico estejam na mesma sub-rede (mesmo Wi-Fi).
2. Obtenha o endereço IPv4 da máquina host (`ip a` no Linux, `ipconfig` no Windows).
3. Defina a URL da API como: `http://<IPV4_DO_HOST>:3000` (ex: `http://192.168.1.15:3000`).
