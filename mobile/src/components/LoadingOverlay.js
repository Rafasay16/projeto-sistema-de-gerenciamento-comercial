import React from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';

export default function LoadingOverlay({ isDarkMode, themeBgColor }) {
  const brandColor = isDarkMode ? '#00b377' : '#008055';

  return (
    <View style={[styles.loadingOverlay, { backgroundColor: themeBgColor }]}>
      <Text style={[styles.loadingText, { color: brandColor }]}>InsightGestor</Text>
      <ActivityIndicator size="large" color={brandColor} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
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
});
