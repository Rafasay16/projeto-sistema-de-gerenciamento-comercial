# 🛒 Dashboard de Gestão de Loja (InsightGestor)

Um painel administrativo completo e moderno para gerir operações de uma loja, incluindo vendas, estoque, clientes, análise de tráfego e campanhas de marketing. 

## ✨ Principais Funcionalidades

* **📊 Dashboard:** Visão geral de faturamento, ticket médio e alertas de estoque crítico.
* **📦 Produtos:** Gestão do catálogo de produtos e níveis de estoque.
* **👥 Clientes:** Lista de clientes com sistema de fidelidade, histórico de gastos e divisão por Tiers (Bronze, Prata, Ouro).
* **🛒 Pedidos:** Histórico completo de vendas, recibos detalhados e geração de novos pedidos integrados ao estoque.
* **📈 Analytics:** Gráficos interativos de tráfego, conversão e dispositivos (Mobile/Desktop).
* **📣 Marketing:** Controle de campanhas de tráfego pago e orgânico com cálculo automático de ROI.

## 🚀 Tecnologias Utilizadas

**Front-end:**
* [React](https://reactjs.org/) (com Vite)
* [Tailwind CSS](https://tailwindcss.com/) + UI Components (shadcn/ui adaptado)
* [Recharts](https://recharts.org/) (Gráficos)
* [Apollo Client](https://www.apollographql.com/docs/react/) (Consumo de GraphQL)
* [React Router](https://reactrouter.com/) (Navegação)

**Back-end:**
* [Node.js](https://nodejs.org/) com Express
* [Apollo Server](https://www.apollographql.com/docs/apollo-server/) (API GraphQL)
* [MongoDB](https://www.mongodb.com/) (Banco de Dados)
* Autenticação com JWT e Bcrypt

---

## ⚙️ Como Inicializar

### 1. Instalar Dependências
Na raiz do projeto, rode num terminal:
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Na pasta `server`, crie ou edite o ficheiro `.env` com as seguintes variáveis:
```
PORT=3000
MONGODB_URI=mongodb+srv://branjomal_db_user:TqpZTiZRh0m4NcSl@cluster0.i215c9c.mongodb.net/?appName=Cluster0
JWT_SECRET=teste
```

### 3. Popular o Banco de Dados

```bash
node preencherdb.js
```
*(Aguarde até a mensagem verde de sucesso aparecer no terminal).*

### 4. Iniciar o Servidor Back-end

```bash
node server.js
```
*(O servidor roda em `http://localhost:3000` e o Apollo Sandbox em `http://localhost:3000/graphql`).*

### 5. Iniciar o Front-end

```bash
npm run dev
```

Pronto! O Link Para Entrar No Site:  (`http://localhost:5173`) 
* [Link do postman](https://mattxss2-4939110.postman.co/workspace/mat's-Workspace~cdf80a5d-95c4-4a89-8e25-5f9e06982dfb/collection/50583647-2cd194c6-3990-47cd-b7a4-0023885c8916?action=share&creator=50583647&active-environment=50583647-1f40873d-6aeb-4b67-8e6a-57f524f6676f/)
