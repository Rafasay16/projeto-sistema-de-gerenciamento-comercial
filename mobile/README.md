# Insight Gestor — Aplicativo Móvel (Navegação Nativa Expo Go)

Este diretório contém o projeto de aplicativo móvel construído com **React Native** e **Expo**. O aplicativo foi reestruturado de forma modular e agora conta com navegação nativa e telas independentes, servindo como uma solução híbrida de alto desempenho para encapsular a plataforma web.

---

## 📱 Recursos Implementados

1. **Navegação Estruturada por Abas (Bottom Tab Navigation)**:
   - Navegação nativa robusta utilizando a biblioteca oficial `@react-navigation/bottom-tabs`.
   - Divisão clara em 3 telas funcionais construídas nativamente: **Painel (Dashboard)**, **Suporte** e **Ajustes (Configurações)**.

2. **Dashboard / Painel (WebView de Alta Performance)**:
   - Carrega a aplicação web completa de forma fluida.
   - Suporta navegação interna no histórico da WebView e tratamento inteligente do botão voltar do Android (`BackHandler`), ativo apenas quando a aba correspondente está focada.
   - Habilita suporte a vídeo em tela cheia e armazenamento local (`domStorageEnabled`).

3. **Ajustes Nativos (Settings Screen)**:
   - Tela 100% nativa que permite visualizar e alterar a URL base da plataforma (`WEB_URL`) persistida no armazenamento local do celular (`AsyncStorage`).
   - Evita a necessidade de editar o código fonte para alternar entre ambientes:
     - **Desenvolvimento local (Emulador Android)**: `http://10.0.2.2:5173`
     - **Desenvolvimento local (Celular físico)**: IP local do computador (ex: `http://192.168.1.15:5173`)
     - **Produção**: URL final do domínio hospedado.

4. **Suporte e Diagnóstico de Rede (Support Screen)**:
   - Links com suporte a **Deep Linking** nativo para WhatsApp e Instagram.
   - Diagnóstico em tempo real da conexão de rede do dispositivo (Status, Tipo de rede como WiFi/Celular, Endereço IP local) com `@react-native-community/netinfo`.

5. **Tratamento Offline Amigável (`OfflineView`)**:
   - Apresenta uma tela offline customizada com a identidade visual do projeto e botão de "Tentar Novamente" caso a conexão de internet seja interrompida.

---

## 📂 Estrutura do Diretório Modularizado

O projeto foi organizado de forma componentizada seguindo as melhores práticas do ecossistema React Native:

```text
mobile/
├── App.js                         # Inicializador do NavigationContainer e SafeAreaProvider
├── app.json                       # Metadados e configurações de builds nativos (Expo)
├── package.json                   # Dependências e scripts npm
├── README.md                      # Guia de desenvolvimento (este arquivo)
└── src/
    ├── components/
    │   ├── LoadingOverlay.js      # Spinner de carregamento da WebView
    │   └── OfflineView.js         # Tela customizada de ausência de rede
    ├── navigation/
    │   └── AppNavigator.js        # Configuração das Abas (Tabs) do React Navigation
    └── screens/
        ├── DashboardScreen.js     # Tela com WebView e listeners de rede/voltar do Android
        ├── SettingsScreen.js      # Tela de configurações e manipulação da URL no AsyncStorage
        └── SupportScreen.js       # Tela com contatos e ferramentas de diagnóstico de rede
```

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

### 2. Iniciar o Expo
Execute o comando:
```bash
npx expo start
```
- Um **QR Code** será exibido no seu terminal.
- Abra o aplicativo **Expo Go** no seu celular:
  - **Android**: Toque em "Scan QR Code" e aponte para a tela.
  - **iOS**: Abra a câmera padrão do iPhone, aponte para o QR Code e clique no link de abertura no Expo Go.

### 3. Configurar a URL da Plataforma Web no App
Com o aplicativo aberto no celular ou emulador, vá para a aba **Ajustes** na barra de navegação inferior. Digite a URL que você deseja carregar na WebView e clique em **Salvar**. A alteração é persistida localmente e refletida imediatamente quando você voltar para a aba **Painel**.

---

## 🏗️ Como Compilar e Gerar o Aplicativo (APK / AAB)

Para gerar o instalador nativo do Android (`.apk` para teste ou `.aab` para publicação na Google Play Store), o Expo utiliza a ferramenta **EAS (Expo Application Services)**.

### Passo 1: Instalar o EAS CLI globalmente
```bash
npm install -g eas-cli
```

### Passo 2: Criar/Logar na conta Expo
```bash
eas login
```

### Passo 3: Configurar o EAS no projeto
```bash
eas build:configure
```

### Passo 4: Compilar o app para Android
* **Gerar APK de Teste (Debug/Ad-hoc)**:
  ```bash
  eas build --platform android --profile preview
  ```
* **Gerar arquivo de Produção (AAB)**:
  ```bash
  eas build --platform android --profile production
  ```
