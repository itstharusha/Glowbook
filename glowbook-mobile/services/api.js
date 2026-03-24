import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: 'http://192.168.1.3:5000', // Local development IP
  timeout: 10000,
});

// Attach JWT to every request automatically
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('glowbook_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 responses (unauthorized/expired token)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token is invalid or expired - clear auth data
      console.log('Token expired or invalid, clearing auth data');
      await AsyncStorage.removeItem('glowbook_token');
      await AsyncStorage.removeItem('glowbook_user');
    }
    return Promise.reject(error);
  }
);

export default api;
