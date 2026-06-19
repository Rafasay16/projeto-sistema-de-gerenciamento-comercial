import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const DEFAULT_IP = '10.0.2.2';
const DEFAULT_URL = `http://${DEFAULT_IP}:3000`;

// Cache em memória para consultas GraphQL (limpa ao fechar o app)
const queryCache = {};

export function clearApiCache() {
  for (const key in queryCache) {
    delete queryCache[key];
  }
}

export async function getBaseUrl() {
  try {
    let url = await AsyncStorage.getItem('WEB_URL');
    if (!url) return DEFAULT_URL;

    url = url.trim();
    if (url.includes(':5173')) {
      return url.replace(':5173', ':3000');
    }
    return url;
  } catch (err) {
    return DEFAULT_URL;
  }
}

/**
 * Utilitário de chamadas REST comuns (Auth)
 */
export async function requestREST(path, method = 'POST', data = null) {
  // Limpa o cache ao deslogar ou logar
  if (path === '/api/login' || path === '/api/signup') {
    clearApiCache();
  }

  const baseUrl = await getBaseUrl();
  const token = await SecureStore.getItemAsync('APP_TOKEN');
  
  const headers = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`Resposta inválida do servidor: ${text.substring(0, 100)}...`);
  }

  if (!response.ok) {
    throw new Error(result.error || `Erro HTTP: ${response.status}`);
  }
  return result;
}

/**
 * Executa queries e mutations GraphQL com cache automático
 */
export async function requestGraphQL(query, variables = {}, forceRefresh = false) {
  const isMutation = query.trim().toLowerCase().includes('mutation');

  if (isMutation) {
    // Mutações modificam dados: limpa o cache para garantir consistência
    clearApiCache();
  } else if (!forceRefresh) {
    // Tenta obter do cache em memória
    const cacheKey = JSON.stringify({ query, variables });
    if (queryCache[cacheKey]) {
      return queryCache[cacheKey];
    }
  }

  const baseUrl = await getBaseUrl();
  const token = await SecureStore.getItemAsync('APP_TOKEN');

  const headers = {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch (e) {
    throw new Error(`Resposta GraphQL inválida: ${text.substring(0, 100)}...`);
  }
  
  if (result.errors && result.errors.length > 0) {
    throw new Error(result.errors[0].message);
  }

  // Salva no cache se for uma consulta (Query) bem sucedida
  if (!isMutation) {
    const cacheKey = JSON.stringify({ query, variables });
    queryCache[cacheKey] = result.data;
  }
  
  return result.data;
}
