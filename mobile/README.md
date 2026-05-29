# Insight Gestor — Aplicativo Móvel (Híbrido Expo Go)

Este diretório contém o projeto de aplicativo móvel híbrido construído com **React Native** e **Expo**. O aplicativo funciona como um wrapper de alto desempenho da plataforma web, integrando funcionalidades nativas de dispositivo.

---

## 📱 Recursos Implementados

1. **WebView de Alta Performance (`react-native-webview`)**:
   - Carrega a aplicação completa em tela cheia de forma fluida.
   - Suporta navegação interna nativa e botões de voltar do Android (`BackHandler`).
   - Habilita suporte a vídeo em tela cheia e armazenamento local (`domStorageEnabled`).
2. **Tratamento Offline Amigável (`@react-native-community/netinfo`)**:
   - Monitora o estado de conexão de internet do usuário em tempo real.
   - Apresenta uma tela offline customizada com a identidade visual do projeto e botão de "Tentar Novamente" caso o sinal caia, evitando erros técnicos ou telas em branco.
3. **Deep Linking Inteligente (WhatsApp, Instagram, ligações, emails)**:
   - Captura e intercepta tentativas de navegação do WebView para links externos.
   - Abre os apps oficiais correspondentes diretamente no celular do usuário.
4. **Splash Screen & Ícones Customizados**:
   - Configurados no `app.json`.

---

## 🛠️ Como Executar em Desenvolvimento

### Pré-requisitos
- Ter o **Node.js** e **npm** instalados.
- Ter o aplicativo **Expo Go** instalado no seu dispositivo móvel (disponível na Google Play Store ou Apple App Store).

### 1. Instalar as Dependências
Abra o terminal neste diretório e execute:
```bash
npm install
```

### 2. Configurar a URL do Site
No arquivo `App.js`, localize a constante `WEB_URL` nas linhas superiores:
```javascript
const WEB_URL = 'http://10.0.2.2:5173';
```
- **Em Produção**: Mantenha a URL pública do site final.
- **Em Desenvolvimento Local**: Se você quiser testar as suas modificações locais do site:
  - **Emulador Android**: Mude para `http://10.0.2.2:5173` (que aponta para a porta do seu Vite dev server).
  - **Celular físico na mesma rede Wi-Fi**: Mude para o IP local do seu computador na rede (ex: `http://192.168.1.15:5173`).

### 3. Iniciar o Expo
Execute o comando:
```bash
npx expo start
```
- Um **QR Code** será exibido no seu terminal.
- Abra o aplicativo **Expo Go** no seu celular:
  - **Android**: Toque em "Scan QR Code" e aponte para a tela.
  - **iOS**: Abra a câmera padrão do iPhone, aponte para o QR Code e clique no link de abertura no Expo Go.

---

## 🏗️ Como Compilar e Gerar o Aplicativo (APK / AAB)

Para gerar o instalador nativo do Android (`.apk` para teste ou `.aab` para publicação na Google Play Store), o Expo utiliza a ferramenta **EAS (Expo Application Services)**, facilitando o build em nuvem sem a necessidade de configurar ambientes Java/Android SDK locais no seu computador.

### Passo 1: Instalar o EAS CLI globalmente
```bash
npm install -g eas-cli
```

### Passo 2: Criar/Logar na conta Expo
```bash
eas login
```
*(Caso não tenha conta, crie gratuitamente em [expo.dev](https://expo.dev)).*

### Passo 3: Configurar o EAS no projeto
```bash
eas build:configure
```

### Passo 4: Compilar o app para Android
* **Gerar APK de Teste (Debug/Ad-hoc)**:
  ```bash
  eas build --platform android --profile preview
  ```
  *(Isso gerará um arquivo `.apk` pronto para instalar e testar diretamente em qualquer celular Android).*

* **Gerar arquivo de Produção (AAB)**:
  ```bash
  eas build --platform android --profile production
  ```
  *(Gera o formato `.aab` pronto para subir e distribuir pela Google Play Store).*

---

## 📁 Estrutura do Diretório

```text
mobile/
├── App.js                   # Lógica principal, monitoramento de internet e WebView
├── app.json                 # Metadados e configurações de builds nativos (Expo)
├── package.json             # Dependências e scripts npm
└── README.md                # Guia de desenvolvimento (este arquivo)
```
