import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, useColorScheme } from 'react-native';

export default function OfflineView({ 
  themeBgColor, 
  themeTextColor, 
  themeSubTextColor, 
  onRetry 
}) {
  const isDarkMode = useColorScheme() === 'dark';
  const buttonColor = isDarkMode ? '#00b377' : '#008055';

  return (
    <View style={[styles.offlineContainer, { backgroundColor: themeBgColor }]}>
      <Text style={[styles.offlineLogo, { color: themeSubTextColor }]}>InsightGestor</Text>
      <Text style={[styles.offlineTitle, { color: themeTextColor }]}>Sem Conexão com a Internet</Text>
      <Text style={[styles.offlineText, { color: themeSubTextColor }]}>
        Não conseguimos carregar as informações. Por favor, verifique a sua conexão com a rede e tente novamente.
      </Text>
      <TouchableOpacity style={[styles.retryButton, { backgroundColor: buttonColor, shadowColor: buttonColor }]} onPress={onRetry}>
        <Text style={styles.retryButtonText}>Tentar Novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
