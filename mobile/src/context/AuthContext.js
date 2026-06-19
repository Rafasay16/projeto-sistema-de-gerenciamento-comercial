import React, { createContext, useState, useEffect, useContext } from 'react';
import * as SecureStore from 'expo-secure-store';
import { requestREST } from '../utils/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carrega a sessão salva ao iniciar o app
    const bootstrapAsync = async () => {
      try {
        const savedToken = await SecureStore.getItemAsync('APP_TOKEN');
        const savedUserJson = await SecureStore.getItemAsync('APP_USER');
        
        if (savedToken && savedUserJson) {
          setToken(savedToken);
          setUser(JSON.parse(savedUserJson));
        }
      } catch (e) {
        console.warn('Erro ao carregar dados de autenticação:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await requestREST('/api/login', 'POST', { email, password });
      
      if (response.success && response.token && response.user) {
        await SecureStore.setItemAsync('APP_TOKEN', response.token);
        await SecureStore.setItemAsync('APP_USER', JSON.stringify(response.user));
        
        setToken(response.token);
        setUser(response.user);
        return { success: true };
      }
      return { success: false, error: 'Resposta inválida do servidor.' };
    } catch (err) {
      return { success: false, error: err.message || 'Erro ao realizar login.' };
    }
  };

  const signup = async (name, email, password, role) => {
    try {
      const response = await requestREST('/api/signup', 'POST', { name, email, password, role });
      if (response.success) {
        return { success: true };
      }
      return { success: false, error: 'Falha ao cadastrar usuário.' };
    } catch (err) {
      return { success: false, error: err.message || 'Erro ao realizar cadastro.' };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('APP_TOKEN');
      await SecureStore.deleteItemAsync('APP_USER');
      setToken(null);
      setUser(null);
    } catch (e) {
      console.warn('Erro ao realizar logout:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
