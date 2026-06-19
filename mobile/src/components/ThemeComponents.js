import React, { useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ActivityIndicator,
  Animated
} from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useAppTheme } from '../context/ThemeContext';

/**
 * CustomCard com animação nativa de surgimento suave (Fade In + Slide Up)
 * Re-executa a animação sempre que o card ganha foco/aparece na tela
 */
export function CustomCard({ children, style, ...props }) {
  const { isDarkMode } = useAppTheme();
  const isFocused = useIsFocused(); // Detecta se a tela atual está focada
  
  const cardBgColor = isDarkMode ? '#20252b' : '#ffffff';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';

  // Valores de animação
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(15)).current;

  useEffect(() => {
    if (isFocused) {
      // Reseta a animação para o estado inicial
      fadeAnim.setValue(0);
      translateYAnim.setValue(15);

      // Inicia a animação de entrada
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [isFocused]);

  return (
    <Animated.View 
      style={[
        styles.card, 
        { 
          backgroundColor: cardBgColor, 
          borderColor: themeBorderColor,
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }]
        },
        style
      ]} 
      {...props}
    >
      {children}
    </Animated.View>
  );
}

export function CustomInput({ label, error, style, ...props }) {
  const { isDarkMode } = useAppTheme();

  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';
  const themeSubTextColor = isDarkMode ? '#94a3b8' : '#64748b';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const themeInputBgColor = isDarkMode ? '#15181c' : '#ffffff';

  return (
    <View style={styles.inputContainer}>
      {label && <Text style={[styles.inputLabel, { color: themeSubTextColor }]}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          { 
            backgroundColor: themeInputBgColor, 
            color: themeTextColor, 
            borderColor: error ? '#ef4444' : themeBorderColor 
          },
          style
        ]}
        placeholderTextColor={themeSubTextColor}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

/**
 * CustomButton com feedback tátil de escala (Spring scale on touch)
 */
export function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', 
  loading = false, 
  style, 
  textStyle,
  disabled = false,
  ...props 
}) {
  const { isDarkMode } = useAppTheme();
  
  const primaryColor = isDarkMode ? '#00b377' : '#008055';
  const themeBorderColor = isDarkMode ? '#30363d' : '#dbe1e8';
  const themeTextColor = isDarkMode ? '#f8fafc' : '#212121';

  // Animação de escala do botão ao clicar
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 40,
      bounciness: 0
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 12
    }).start();
  };

  let btnStyle = {};
  let txtStyle = {};

  if (variant === 'primary') {
    btnStyle = {
      backgroundColor: disabled ? '#64748b' : primaryColor,
    };
    txtStyle = {
      color: '#ffffff',
    };
  } else if (variant === 'secondary') {
    btnStyle = {
      backgroundColor: isDarkMode ? '#20252b' : '#f1f5f9',
      borderWidth: 1,
      borderColor: themeBorderColor,
    };
    txtStyle = {
      color: themeTextColor,
    };
  } else if (variant === 'danger') {
    btnStyle = {
      backgroundColor: '#ef4444',
    };
    txtStyle = {
      color: '#ffffff',
    };
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        { opacity: disabled ? 0.7 : 1 },
        style
      ]}
      {...props}
    >
      <Animated.View 
        style={[
          styles.button, 
          btnStyle, 
          { transform: [{ scale: scaleAnim }] }
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variant === 'secondary' ? themeTextColor : '#ffffff'} />
        ) : (
          <Text style={[styles.buttonText, txtStyle, textStyle]}>{title}</Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  inputContainer: {
    marginBottom: 16,
    width: '100%',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
