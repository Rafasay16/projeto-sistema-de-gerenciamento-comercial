import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Linking, 
  ScrollView,
  useColorScheme
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const [netInfo, setNetInfo] = useState(null);
  
  const systemScheme = useColorScheme();
  const isDarkMode = systemScheme === 'dark';

  const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';

  useEffect(() => {
    // Buscar estado inicial
    NetInfo.fetch().then(state => {
      setNetInfo(state);
    });

    // Monitorar alterações
    const unsubscribe = NetInfo.addEventListener(state => {
      setNetInfo(state);
    });

    return () => unsubscribe();
  }, []);

  const handleOpenLink = (url) => {
    Linking.openURL(url).catch(err => {
      console.warn('Erro ao abrir deep link:', err);
    });
  };

  const getNetworkIcon = () => {
    if (!netInfo || !netInfo.isConnected) return 'cloud-offline-outline';
    if (netInfo.type === 'wifi') return 'wifi-outline';
    return 'cellular-outline';
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeBgColor }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} backgroundColor={themeBgColor} />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        <Text style={[styles.headerTitle, { color: themeTextColor }]}>Suporte e Canal</Text>
        <Text style={[styles.headerSubtitle, { color: themeSubTextColor }]}>
          Precisa de ajuda ou deseja relatar um problema? Entre em contato conosco ou verifique o diagnóstico da sua rede.
        </Text>

        {/* Card: Canais de Suporte (Deep Links) */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
          <Text style={[styles.cardTitle, { color: themeTextColor }]}>Falar Conosco</Text>
          <Text style={[styles.cardDescription, { color: themeSubTextColor }]}>
            Escolha uma das plataformas abaixo para iniciar um atendimento rápido com a equipe InsightGestor.
          </Text>

          <TouchableOpacity 
            style={[styles.linkRow, { borderBottomWidth: 1, borderBottomColor: themeBorderColor }]}
            onPress={() => handleOpenLink('https://wa.me/5500000000000?text=Olá,%20preciso%20de%20suporte%20no%20InsightGestor.')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <Text style={[styles.linkText, { color: themeTextColor }]}>WhatsApp Suporte</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeSubTextColor} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkRow}
            onPress={() => handleOpenLink('https://instagram.com/insightgestor')}
          >
            <View style={styles.iconWrapper}>
              <Ionicons name="logo-instagram" size={24} color="#E1306C" />
              <Text style={[styles.linkText, { color: themeTextColor }]}>Siga-nos no Instagram</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={themeSubTextColor} />
          </TouchableOpacity>
        </View>

        {/* Card: Diagnóstico de Rede */}
        <View style={[styles.card, { backgroundColor: cardBgColor, borderColor: themeBorderColor }]}>
          <View style={styles.diagnosticsHeader}>
            <Text style={[styles.cardTitle, { color: themeTextColor }]}>Diagnóstico de Conexão</Text>
            <Ionicons name={getNetworkIcon()} size={22} color={netInfo?.isConnected ? '#10B981' : '#EF4444'} />
          </View>
          
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Status de Conexão</Text>
            <Text style={[
              styles.infoValue, 
              { color: netInfo?.isConnected ? '#10B981' : '#EF4444' }
            ]}>
              {netInfo?.isConnected ? 'Conectado' : 'Desconectado'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />

          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Tipo de Rede</Text>
            <Text style={[styles.infoValue, { color: themeTextColor }]}>
              {netInfo?.type ? netInfo.type.toUpperCase() : 'N/A'}
            </Text>
          </View>

          {netInfo?.isConnected && (
            <>
              <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />
              
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Internet Acessível</Text>
                <Text style={[styles.infoValue, { color: themeTextColor }]}>
                  {netInfo?.isInternetReachable ? 'Sim' : 'Não'}
                </Text>
              </View>

              {netInfo.details?.ipAddress && (
                <>
                  <View style={[styles.divider, { backgroundColor: themeBorderColor }]} />
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: themeSubTextColor }]}>Endereço IP</Text>
                    <Text style={[styles.infoValue, { color: themeTextColor }]}>
                      {netInfo.details.ipAddress}
                    </Text>
                  </View>
                </>
              )}
            </>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
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
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 16,
  },
  diagnosticsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  iconWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  linkText: {
    fontSize: 16,
    fontWeight: '500',
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
