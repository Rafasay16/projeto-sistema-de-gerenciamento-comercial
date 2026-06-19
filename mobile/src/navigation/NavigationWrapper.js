import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import LoadingOverlay from '../components/LoadingOverlay';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import AppNavigator from './AppNavigator';

export default function NavigationWrapper() {
  const { user, isLoading } = useAuth();
  const { isDarkMode } = useAppTheme();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    const themeBgColor = isDarkMode ? '#15181c' : '#f1f5f9';
    return <LoadingOverlay isDarkMode={isDarkMode} themeBgColor={themeBgColor} />;
  }

  if (!user) {
    if (showRegister) {
      return <SignupScreen onNavigateToLogin={() => setShowRegister(false)} />;
    }
    return <LoginScreen onNavigateToRegister={() => setShowRegister(true)} />;
  }

  return <AppNavigator />;
}
