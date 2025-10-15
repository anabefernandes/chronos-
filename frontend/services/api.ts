import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const baseURL = Constants.expoConfig?.extra?.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_URL;

console.log('Base URL da API:', baseURL);
const api = axios.create({
  baseURL,
  timeout: 5000,
});

// Interceptor para adicionar o token em todas as requisições
api.interceptors.request.use(async config => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
