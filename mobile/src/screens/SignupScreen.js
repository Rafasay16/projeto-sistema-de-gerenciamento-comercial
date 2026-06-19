import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { CustomInput, CustomButton, CustomCard } from '../components/ThemeComponents';

export default function SignupScreen({ onNavigateToLogin }) {
  const { signup } = useAuth();
  const { isDarkMode } = useAppTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('vendedor'); // 'vendedor' ou 'gerente'
  const [loading, setLoading] = useState(false);

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const primaryColor = isDarkMode ? '#00b377' : '#008055';

  const handleRegister = async () => {
    Keyboard.dismiss();
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    const result = await signup(name.trim(), email.trim(), password, role);
    setLoading(false);

    if (result.success) {
      Alert.alert(
        'Sucesso',
        'Conta criada com sucesso! Faça login para continuar.',
        [{ text: 'Fazer Login', onPress: onNavigateToLogin }]
      );
    } else {
      Alert.alert('Erro ao Cadastrar', result.error || 'Verifique as informações e tente novamente.');
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
            <Text style={[styles.logoText, { color: primaryColor }]}>InsightGestor</Text>
            <Text style={[styles.subtitleText, { color: themeSubTextColor }]}>
              Registre-se para começar a gerenciar sua empresa
            </Text>
          </View>

          <CustomCard style={styles.formCard}>
            <Text style={[styles.cardTitle, { color: themeTextColor }]}>Criar nova conta</Text>

            <CustomInput
              label="Nome Completo"
              placeholder="Digite seu nome"
              autoCapitalize="words"
              value={name}
              onChangeText={setName}
            />

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
              placeholder="Crie uma senha forte"
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              value={password}
              onChangeText={setPassword}
            />

            {/* Seletor de Cargo/Role Nativo */}
            <View style={styles.roleContainer}>
              <Text style={[styles.roleLabel, { color: themeSubTextColor }]}>Função / Cargo</Text>
              <View style={styles.roleOptions}>
                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'vendedor' && { backgroundColor: primaryColor }
                  ]}
                  onPress={() => setRole('vendedor')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.roleTabText,
                    role === 'vendedor' ? { color: '#ffffff', fontWeight: 'bold' } : { color: themeSubTextColor }
                  ]}>
                    Vendedor
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleTab,
                    role === 'gerente' && { backgroundColor: primaryColor }
                  ]}
                  onPress={() => setRole('gerente')}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.roleTabText,
                    role === 'gerente' ? { color: '#ffffff', fontWeight: 'bold' } : { color: themeSubTextColor }
                  ]}>
                    Gerente
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <CustomButton
              title="Registrar"
              onPress={handleRegister}
              loading={loading}
              style={styles.submitBtn}
            />

            <TouchableOpacity 
              style={styles.loginLink}
              onPress={onNavigateToLogin}
            >
              <Text style={[styles.loginLinkText, { color: themeSubTextColor }]}>
                Já tem uma conta? <Text style={{ color: primaryColor, fontWeight: 'bold' }}>Faça Login</Text>
              </Text>
            </TouchableOpacity>
          </CustomCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
    marginBottom: 28,
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
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  roleOptions: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  roleTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  roleTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: 8,
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    fontSize: 14,
  },
});
