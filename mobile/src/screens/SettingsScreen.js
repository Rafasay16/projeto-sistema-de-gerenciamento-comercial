import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Keyboard, 
  TouchableWithoutFeedback,
  Platform,
  useColorScheme
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const DEFAULT_WEB_URL = 'http://172.20.10.7:5173';

export default function SettingsScreen() {
  const [urlInput, setUrlInput] = useState(DEFAULT_WEB_URL);
  
  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const themeInputBgColor = isDarkMode ? '#15181c' : '#ffffff';

  // Carregar URL salva
  useEffect(() => {
    const loadSavedUrl = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem('WEB_URL');
        if (storedUrl) {
          setUrlInput(storedUrl);
        }
      } catch (err) {
        console.error('Erro ao ler URL do AsyncStorage:', err);
      }
    };

    loadSavedUrl();
  }, []);

  const handleSave = async () => {
    Keyboard.dismiss();
    
    // Validação básica de URL
    let formattedUrl = urlInput.trim();
    if (!formattedUrl) {
      Alert.alert('Erro', 'A URL não pode estar vazia.');
      return;
    }

    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      Alert.alert('Erro', 'A URL deve começar com http:// ou https://');
      return;
    }

    try {
      await AsyncStorage.setItem('WEB_URL', formattedUrl);
      Alert.alert('Sucesso', 'Configurações salvas! A WebView será recarregada ao abrir o Dashboard.');
    } catch (err) {
      Alert.alert('Erro', 'Ocorreu um erro ao salvar as configurações.');
      console.error(err);
    }
  };

  const handleRestoreDefault = async () => {
    Alert.alert(
      'Restaurar Padrão',
      'Deseja redefinir a URL para o endereço padrão de desenvolvimento?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restaurar', 
          onPress: async () => {
            try {
              await AsyncStorage.setItem('WEB_URL', DEFAULT_WEB_URL);
              setUrlInput(DEFAULT_WEB_URL);
              Alert.alert('Sucesso', 'URL restaurada para o padrão.');
            } catch (err) {
              console.error(err);
            }
          } 
        }
      ]
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]} edges={['top', 'left', 'right']}>
        <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
        <View style={styles.container}>
          
          <Text style={[styles.headerTitle, { color: themeTextColor }]}>Configurações</Text>
          <Text style={[styles.headerSubtitle, { color: themeSubTextColor }]}>
            Personalize os parâmetros de conexão e veja informações do sistema.
          </Text>

          {/* Card: URL de Conexão */}
          <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
            <Text style={[styles.cardTitle, { color: themeTextColor }]}>Servidor Web / API</Text>
            <Text style={[styles.cardDescription, { color: themeSubTextColor }]}>
              Altere para o endereço de produção ou insira o IP de teste local para depuração.
            </Text>

            <TextInput
              style={[styles.input, { 
                backgroundColor: themeInputBgColor, 
                color: themeTextColor, 
                borderColor: themeBorderColor 
              }]}
              value={urlInput}
              onChangeText={setUrlInput}
              placeholder="Ex: http://192.168.1.10:5173"
              placeholderTextColor={themeSubTextColor}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={[styles.outlineButton, { borderColor: themeBorderColor }]} 
                onPress={handleRestoreDefault}
              >
                <Text style={[styles.outlineButtonText, { color: themeSubTextColor }]}>Padrão</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: isDarkMode ? '#00b377' : '#008055' }]} 
                onPress={handleSave}
              >
                <Text style={styles.primaryButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Card: Informações do Aplicativo */}
          <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
            <Text style={[styles.cardTitle, { color: themeTextColor }]}>Informações do Sistema</Text>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Aplicativo</Text>
              <Text style={[styles.infoValue, { color: themeTextColor }]}>Insight Gestor</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Versão</Text>
              <Text style={[styles.infoValue, { color: themeTextColor }]}>1.0.0</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Plataforma</Text>
              <Text style={[styles.infoValue, { color: themeTextColor }]}>
                {Platform.OS === 'ios' ? 'iOS' : 'Android'} ({Platform.Version})
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Tema Ativo</Text>
              <Text style={[styles.infoValue, { color: themeTextColor }]}>
                {isDarkMode ? 'Escuro' : 'Claro'}
              </Text>
            </View>
          </View>

        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  outlineButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
  },
});
