import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import API, { BASE_URL } from './api';

export const formatPhotoUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;
  if (url.startsWith('file:') || url.startsWith('content:') || url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.includes('localhost:3000')) return url.replace('http://localhost:3000', BASE_URL);
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${BASE_URL}${url}`;
  return `${BASE_URL}/${url}`;
};

export const formatKejadianDate = (dateStr) => {
  if (!dateStr) return '-';
  let cleanDate = dateStr;
  if (cleanDate.includes('•')) cleanDate = cleanDate.split('•')[0].trim();
  const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${parseInt(match[3], 10)} ${months[parseInt(match[2], 10) - 1]} ${match[1]}`;
  }
  return cleanDate;
};

export const recordPostUploadTime = async (idBarang, timestamp = Date.now()) => {
  try {
    const raw = await AsyncStorage.getItem('post_upload_timestamps');
    const map = raw ? JSON.parse(raw) : {};
    map[idBarang] = timestamp;
    await AsyncStorage.setItem('post_upload_timestamps', JSON.stringify(map));
  } catch (e) {}
};

export const getPostUploadTimes = async () => {
  try {
    const raw = await AsyncStorage.getItem('post_upload_timestamps');
    return raw ? JSON.parse(raw) : {};
  } catch (e) { return {}; }
};

// Helper waktu upload (FALLBACK KE created_at DARI BACKEND BARU)
export const getWaktuUpload = (item, localMap = {}) => {
  if (!item) return '';
  let ts = null;
  if (item.id_barang && localMap && localMap[item.id_barang]) ts = new Date(localMap[item.id_barang]);
  if (!ts && item.created_at) ts = new Date(item.created_at); // Schema Baru!
  
  if (!ts || isNaN(ts.getTime())) return formatKejadianDate(item.tanggal_kejadian || item.tanggal);

  const now = new Date();
  const diffMs = now.getTime() - ts.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMins / 60);
  const hours = String(ts.getHours()).padStart(2, '0');
  const mins = String(ts.getMinutes()).padStart(2, '0');

  if (diffMins >= 0 && diffMins < 1) return 'Baru saja';
  if (diffMins >= 1 && diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours >= 1 && diffHours < 24) return `${diffHours} jam lalu`;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${ts.getDate()} ${months[ts.getMonth()]} ${ts.getFullYear()} • ${hours}:${mins}`;
};

export const getKejadianLabel = (status) => {
  if (status === 'Ditemukan') return 'Tanggal Ditemukan';
  if (status === 'Hilang') return 'Tanggal Kehilangan';
  return 'Tanggal Kejadian';
};

// --- AUTH & AKADEMIK SERVICES ---
export const loginUser = async (emailOrObj, password) => {
  const payload = typeof emailOrObj === 'object' && emailOrObj !== null ? emailOrObj : { email: emailOrObj, password };
  const res = await API.post('/auth/login', payload);
  return res.data;
};

export const registerUser = async (namaOrObj, email, password) => {
  const payload = typeof namaOrObj === 'object' && namaOrObj !== null ? namaOrObj : { nama: namaOrObj, email, password };
  const res = await API.post('/auth/register', payload);
  return res.data;
};

export const googleLogin = async (googleData) => {
  const res = await API.post('/auth/google', googleData);
  return res.data;
};

// BARU: Ambil profil lengkap (termasuk nama_fakultas & nama_prodi)
export const getMyProfile = async () => {
  const res = await API.get('/auth/me');
  return res.data;
};

export const getFakultas = async () => {
  const res = await API.get('/akademik/fakultas');
  return res.data;
};

export const getProdi = async (idFakultas) => {
  const res = await API.get('/akademik/prodi', { params: { id_fakultas: idFakultas } });
  return res.data;
};

// --- KATEGORI & BARANG SERVICES ---
export const getKategori = async () => {
  const res = await API.get('/kategori');
  return res.data;
};

export const getBarangList = async (params = {}) => {
  const res = await API.get('/barang', { params });
  return res.data;
};

export const getBarangDetail = async (idBarang) => {
  const res = await API.get(`/barang/${idBarang}`);
  return res.data;
};

export const getBarangSaya = async () => {
  try {
    const saved = await AsyncStorage.getItem('user_data');
    const user = saved ? JSON.parse(saved) : null;
    const myId = user?.id_user;
    const res = await API.get('/barang');
    if (Array.isArray(res.data)) {
      if (myId) return res.data.filter((item) => Number(item.id_user) === Number(myId));
      return res.data;
    }
    return [];
  } catch (error) { throw error; }
};

export const createBarangReport = async (formData) => {
  const res = await API.post('/barang', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => {
      if (headers) delete headers['Content-Type'];
      return data;
    },
  });
  return res.data;
};

export const updateStatusBarang = async (idBarang, status) => {
  const res = await API.patch(`/barang/${idBarang}/status`, { status });
  return res.data;
};

// --- KLAIM SERVICES ---
export const submitKlaim = async (formData) => {
  const res = await API.post('/klaim', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => { if (headers) delete headers['Content-Type']; return data; },
  });
  return res.data;
};

export const getKlaimSaya = async () => {
  const res = await API.get('/klaim/saya');
  return res.data;
};

export const getKlaimMasuk = async () => {
  const res = await API.get('/klaim/masuk');
  return res.data;
};

export const updateStatusKlaim = async (idKlaim, status_klaim) => {
  const res = await API.patch(`/klaim/${idKlaim}/status`, { status_klaim });
  return res.data;
};

// --- PESAN / CHAT SERVICES (DIREVISI KE ROOM_CHAT) ---
// --- PESAN / CHAT SERVICES (BARU: BERBASIS ROOM) ---
export const getChatRoomsSaya = async () => {
  const res = await API.get('/pesan/room/saya');
  return res.data;
};

export const openOrCreateRoom = async (idBarang, idLawan) => {
  const res = await API.post('/pesan/room', { id_barang: idBarang, id_lawan: idLawan });
  return res.data;
};

export const getPesanByRoom = async (idRoom) => {
  const res = await API.get(`/pesan/room/${idRoom}`);
  return res.data;
};

export const sendPesanKeRoom = async (idRoom, isiPesan, tipePesan = 'teks', fileAsset = null) => {
  const formData = new FormData();
  formData.append('id_room', idRoom);
  formData.append('tipe_pesan', tipePesan);
  formData.append('isi_pesan', isiPesan || (tipePesan === 'gambar' ? '[Gambar]' : ''));
  
  if (fileAsset && fileAsset.uri) {
    const ext = fileAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mime = fileAsset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    formData.append('gambar', {
      uri: Platform.OS === 'android' ? fileAsset.uri : fileAsset.uri.replace('file://', ''),
      name: fileAsset.fileName || `chat_${Date.now()}.${ext}`,
      type: mime,
    });
  }

  const res = await API.post('/pesan', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => { if (headers) delete headers['Content-Type']; return data; },
  });
  return res.data;
};

export const markRoomAsRead = async (idRoom) => {
  const res = await API.patch(`/pesan/room/${idRoom}/read`);
  return res.data;
};

// --- NOTIFIKASI SERVICES (DIREVISI KE JWT) ---
export const saveExpoPushToken = async (expo_push_token, platform = 'Android') => {
  const res = await API.post('/notifikasi/token', { expo_push_token, platform });
  return res.data;
};

export const getNotifikasi = async () => {
  const res = await API.get('/notifikasi');
  return res.data;
};

export const markNotifikasiRead = async (id) => {
  const res = await API.patch(`/notifikasi/${id}/read`);
  return res.data;
};

export const markAllNotifikasiRead = async () => {
  const res = await API.patch('/notifikasi/read-all');
  return res.data;
};
// Update profil user ke backend (untuk sinkronisasi EditProfileScreen)
export const updateMyProfile = async (formData) => {
  const res = await API.patch('/auth/profil', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => {
      if (headers) delete headers['Content-Type'];
      return data;
    },
  });
  return res.data;
};

// BARU: Kirim pesan gambar ke room (pakai FormData)
export const sendPesanGambarKeRoom = async (idRoom, imageAsset, caption = '') => {
  const formData = new FormData();
  formData.append('id_room', String(idRoom));
  formData.append('tipe_pesan', 'gambar');
  formData.append('isi_pesan', caption || '[Gambar]');
  const fileUri = imageAsset.uri;
  const ext = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
  const mime = imageAsset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  formData.append('gambar', {
    uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
    name: imageAsset.fileName || `chat_${Date.now()}.${ext}`,
    type: mime,
  });
  const res = await API.post('/pesan', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => { if (headers) delete headers['Content-Type']; return data; },
  });
  return res.data;
};