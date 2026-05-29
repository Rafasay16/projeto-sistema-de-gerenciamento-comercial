import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  SafeAreaView, 
  Linking,
  Platform,
  BackHandler,
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

// URL principal do site. Altere para o domínio de produção.
// Para testar localmente com o emulador Android, use http://10.0.2.2:5173 (ou a porta configurada).
const WEB_URL = 'http://172.20.10.7:5173'; 

export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(1); // Usado para forçar o recarregamento do WebView
  
  const webViewRef = useRef(null);
  
  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';
  
  const themeBgColor = isDarkMode ? '#0f172a' : '#ffffff';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#1e293b';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';

  // Monitorar a conexão de internet
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected !== false);
    });

    return () => unsubscribe();
  }, []);

  // Tratar botão "Voltar" do Android para navegar no histórico do WebView
  useEffect(() => {
    const onBackPress = () => {
      if (webViewRef.current) {
        webViewRef.current.goBack();
        return true; // Impede o fechamento padrão do app
      }
      return false;
    };

    if (Platform.OS === 'android') {
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }
    
    return () => {
      if (Platform.OS === 'android') {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      }
    };
  }, []);

  // Forçar recarga da página e verificar conexão
  const handleTryAgain = () => {
    setIsLoading(true);
    NetInfo.fetch().then(state => {
      const connected = state.isConnected !== false;
      setIsConnected(connected);
      if (connected) {
        setKey(prevKey => prevKey + 1); // Força remontagem do WebView
      } else {
        setIsLoading(false);
      }
    });
  };

  // Interceptar requisições do WebView para redirecionamentos nativos
  const handleShouldStartLoadWithRequest = (request) => {
    const { url } = request;

    // Detectar links do WhatsApp, Instagram, telefone e email
    const isDeepLink = 
      url.includes('wa.me') || 
      url.includes('api.whatsapp.com') ||
      url.includes('whatsapp://') ||
      url.includes('instagram.com') ||
      url.includes('instagram://') ||
      url.startsWith('mailto:') || 
      url.startsWith('tel:');

    if (isDeepLink) {
      Linking.openURL(url).catch(err => {
        console.warn('Não foi possível abrir o link externo:', err);
      });
      return false; // Bloqueia o carregamento no WebView
    }

    return true; // Permite o carregamento no WebView
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      <View style={[styles.container, { backgroundColor: themeBgColor }]}>
        
        {isConnected ? (
          <View style={styles.webViewContainer}>
            <WebView
              key={key}
              ref={webViewRef}
              source={{ uri: WEB_URL }}
              style={[styles.webView, { backgroundColor: themeBgColor }]}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsBackForwardNavigationGestures={true}
              allowsFullscreenVideo={true}
              decelerationRate="normal"
              sharedCookiesEnabled={true}
              hideKeyboardAccessoryView={Platform.OS === 'ios'}
              showsVerticalScrollIndicator={false}
              automaticallyAdjustContentInsets={false}
            />

            {isLoading && (
              <View style={[styles.loadingOverlay, { backgroundColor: themeBgColor }]}>
                <Text style={[styles.loadingText, { color: isDarkMode ? '#3b82f6' : '#2563EB' }]}>InsightGestor</Text>
                <ActivityIndicator size="large" color={isDarkMode ? '#3b82f6' : '#2563EB'} style={styles.spinner} />
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.offlineContainer, { backgroundColor: themeBgColor }]}>
            <Text style={[styles.offlineLogo, { color: themeSubTextColor }]}>InsightGestor</Text>
            <Text style={[styles.offlineTitle, { color: themeTextColor }]}>Sem Conexão com a Internet</Text>
            <Text style={[styles.offlineText, { color: themeSubTextColor }]}>
              Não conseguimos carregar as informações. Por favor, verifique a sua conexão com a rede e tente novamente.
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleTryAgain}>
              <Text style={styles.retryButtonText}>Tentar Novamente</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 20,
  },
  spinner: {
    marginTop: 10,
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  offlineLogo: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 40,
  },
  offlineTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  offlineText: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 30,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
