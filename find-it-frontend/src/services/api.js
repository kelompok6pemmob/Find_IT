import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// IP LOKAL LAPTOP (Sudah disesuaikan dengan permintaanmu)
export const BASE_URL = 'http://192.168.1.104:3000'; 

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data && (config.data instanceof FormData || config.data._parts)) {
    if (config.headers) delete config.headers['Content-Type'];
  }
  return config;
});

export default API;