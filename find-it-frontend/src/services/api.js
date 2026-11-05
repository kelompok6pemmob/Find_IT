import axios from'axios';
import AsyncStorage from'@react-native-async-storage/async-storage';

//  GANTI DENGAN IP LOKAL LAPTOP KAMU (Misal: 192.168.1.15 atau IP Wifi kampus)
// Jangan pakai'localhost' karena HP/Emulator gak bisa baca localhost laptop
export const BASE_URL ='http://20.5.21.37:3000'; 

const API = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {'Content-Type':'application/json',
  },
});

// Otomatis tempel Token JWT di Header setiap request
API.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('user_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Khusus FormData, hapus Content-Type agar native network layer otomatis menambahkan boundary
  if (config.data && (config.data instanceof FormData || config.data._parts)) {
    if (config.headers) {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

export default API;