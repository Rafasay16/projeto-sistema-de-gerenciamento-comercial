import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert,
  Modal,
  TouchableOpacity,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { CustomInput, CustomButton, CustomCard } from '../components/ThemeComponents';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBaseUrl } from '../utils/api';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ onNavigateToRegister }) {
  const { login } = useAuth();
  const { isDarkMode } = useAppTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [newUrlInput, setNewUrlInput] = useState('');

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const themeCardBg = isDarkMode ? '#20252b' : '#ffffff';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';

  // Buscar URL da API atual
  useEffect(() => {
    const fetchUrl = async () => {
      const url = await getBaseUrl();
      setCurrentApiUrl(url);
      setNewUrlInput(url);
    };
    fetchUrl();
  }, [showConfigModal]);

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);

    if (!result.success) {
      Alert.alert(
        'Erro de Conexão ou Credenciais',
        `${result.error}\n\nSe o servidor estiver rodando localmente, verifique as configurações da URL da API.`,
        [
          { text: 'OK' },
          { text: 'Ajustar API', onPress: () => setShowConfigModal(true) }
        ]
      );
    }
  };

  const handleSaveApiUrl = async () => {
    let formatted = newUrlInput.trim();
    if (!formatted) {
      Alert.alert('Erro', 'A URL não pode estar vazia.');
      return;
    }
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      Alert.alert('Erro', 'A URL deve começar com http:// ou https://');
      return;
    }
    try {
      await AsyncStorage.setItem('WEB_URL', formatted);
      setCurrentApiUrl(formatted);
      setShowConfigModal(false);
      Alert.alert('Sucesso', 'Endereço da API atualizado!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao salvar URL.');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerContainer}>
            <Text style={[styles.logoText, { color: isDarkMode ? '#00b377' : '#008055' }]}>InsightGestor</Text>
            <Text style={[styles.subtitleText, { color: themeSubTextColor }]}>
              Seu sistema de gerenciamento comercial móvel
            </Text>
          </View>

          <CustomCard style={styles.formCard}>
            <Text style={[styles.cardTitle, { color: themeTextColor }]}>Acesse sua Conta</Text>
            
            <CustomInput
              label="E-mail"
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <CustomInput
              label="Senha"
              placeholder="Digite sua senha"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />

            <CustomButton
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity 
              style={styles.registerLink}
              onPress={onNavigateToRegister}
            >
              <Text style={[styles.registerText, { color: themeSubTextColor }]}>
                Não tem uma conta? <Text style={{ color: isDarkMode ? '#00b377' : '#008055', fontWeight: 'bold' }}>Cadastre-se</Text>
              </Text>
            </TouchableOpacity>
          </CustomCard>

          <View style={styles.footerContainer}>
            <Text style={[styles.apiUrlLabel, { color: themeSubTextColor }]}>
              Conectado a: {currentApiUrl}
            </Text>
            <TouchableOpacity 
              style={styles.configBtn}
              onPress={() => setShowConfigModal(true)}
            >
              <Ionicons name="settings-outline" size={16} color={isDarkMode ? '#00b377' : '#008055'} style={{ marginRight: 6 }} />
              <Text style={[styles.configBtnText, { color: isDarkMode ? '#00b377' : '#008055' }]}>
                Configurar URL da API
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de Configuração de URL da API */}
      <Modal
        visible={showConfigModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConfigModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeCardBg, borderColor: themeBorderColor }]}>
            <Text style={[styles.modalTitle, { color: themeTextColor }]}>Endereço da API</Text>
            <Text style={[styles.modalDescription, { color: themeSubTextColor }]}>
              Insira o IP e porta do seu backend local ou servidor remoto.
            </Text>

            <CustomInput
              label="URL Base da API"
              value={newUrlInput}
              onChangeText={setNewUrlInput}
              placeholder="Ex: http://192.168.10.5:3000"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <CustomButton
                title="Cancelar"
                variant="secondary"
                onPress={() => setShowConfigModal(false)}
                style={styles.modalBtn}
              />
              <CustomButton
                title="Salvar"
                onPress={handleSaveApiUrl}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  subtitleText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  formCard: {
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  submitBtn: {
    marginTop: 12,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  apiUrlLabel: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 6,
  },
  configBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  configBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
  },
});
