import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [theme, setThemeState] = useState(systemScheme || 'light');

  // Atualiza o tema sempre que o tema do dispositivo (sistema operacional) for alterado
  useEffect(() => {
    setThemeState(systemScheme || 'light');
  }, [systemScheme]);

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const isDarkMode = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme deve ser utilizado dentro de um ThemeProvider');
  }
  return context;
}
