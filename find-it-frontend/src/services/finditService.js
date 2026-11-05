
import AsyncStorage from '@react-native-async-storage/async-storage';
import API, { BASE_URL } from './api';

// Helper agar URL foto dari backend bisa dibaca di HP
export const formatPhotoUrl = (url) => {
  if (!url) return null;
  if (typeof url !== 'string') return null;

  // Local file URIs from ImagePicker (camera / gallery)
  if (
    url.startsWith('file:') ||
    url.startsWith('content:') ||
    url.startsWith('data:') ||
    url.startsWith('blob:')
  ) {
    return url;
  }

  if (url.includes('localhost:3000')) {
    return url.replace('http://localhost:3000', BASE_URL);
  }

  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }

  return `${BASE_URL}/${url}`;
};

// Helper format murni tanggal kejadian
export const formatKejadianDate = (dateStr) => {
  if (!dateStr) return '-';

  let cleanDate = dateStr;

  if (cleanDate.includes('•')) {
    cleanDate = cleanDate.split('•')[0].trim();
  }

  const match = cleanDate.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (match) {
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const y = match[1];
    const m = months[parseInt(match[2], 10) - 1];
    const d = parseInt(match[3], 10);

    return `${d} ${m} ${y}`;
  }

  return cleanDate;
};

// Catat waktu upload lokal untuk setiap postingan
export const recordPostUploadTime = async (
  idBarang,
  timestamp = Date.now()
) => {
  try {
    const raw = await AsyncStorage.getItem('post_upload_timestamps');
    const map = raw ? JSON.parse(raw) : {};

    map[idBarang] = timestamp;

    await AsyncStorage.setItem(
      'post_upload_timestamps',
      JSON.stringify(map)
    );
  } catch (e) {}
};

// Ambil seluruh waktu upload lokal
export const getPostUploadTimes = async () => {
  try {
    const raw = await AsyncStorage.getItem('post_upload_timestamps');
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
};

// Helper format waktu upload aktual
export const getWaktuUpload = (item, localMap = {}) => {
  if (!item) return '';

  let ts = null;

  if (item.id_barang && localMap && localMap[item.id_barang]) {
    ts = new Date(localMap[item.id_barang]);
  }

  if (!ts && item.foto_url) {
    const match = item.foto_url.match(/uploads\/(\d{13})-/);

    if (match) {
      ts = new Date(parseInt(match[1], 10));
    }
  }

  if (!ts || isNaN(ts.getTime())) {
    return formatKejadianDate(item.tanggal);
  }

  const now = new Date();
  const diffMs = now.getTime() - ts.getTime();
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMins / 60);

  const hours = String(ts.getHours()).padStart(2, '0');
  const mins = String(ts.getMinutes()).padStart(2, '0');

  if (diffMins >= 0 && diffMins < 1) return 'Baru saja';

  if (diffMins >= 1 && diffMins < 60) {
    return `${diffMins} menit lalu`;
  }

  if (diffHours >= 1 && diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
  ];

  return `${ts.getDate()} ${months[ts.getMonth()]} ${ts.getFullYear()} • ${hours}:${mins}`;
};

export const getKejadianLabel = (status) => {
  if (status === 'Ditemukan') return 'Tanggal Ditemukan';
  if (status === 'Hilang') return 'Tanggal Kehilangan';

  return 'Tanggal Kejadian';
};

// --- AUTH SERVICES ---

export const loginUser = async (emailOrObj, password) => {
  const payload =
    typeof emailOrObj === 'object' && emailOrObj !== null
      ? emailOrObj
      : { email: emailOrObj, password };

  const res = await API.post('/auth/login', payload);
  return res.data;
};

export const registerUser = async (namaOrObj, email, password) => {
  const payload =
    typeof namaOrObj === 'object' && namaOrObj !== null
      ? namaOrObj
      : { nama: namaOrObj, email, password };

  const res = await API.post('/auth/register', payload);
  return res.data;
};

export const googleLogin = async (googleData) => {
  const res = await API.post('/auth/google', googleData);
  return res.data;
};

// --- KATEGORI SERVICES ---

export const getKategori = async () => {
  const res = await API.get('/kategori');
  return res.data;
};

// --- BARANG SERVICES ---

export const getBarangList = async (params = {}) => {
  // params: { status, id_kategori, lokasi, dari, sampai, sort }
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

    // Backend tidak memiliki endpoint /barang/saya
    // sehingga kita ambil feed barang dan filter berdasarkan id_user
    const res = await API.get('/barang');

    if (Array.isArray(res.data)) {
      if (myId) {
        return res.data.filter(
          (item) => Number(item.id_user) === Number(myId)
        );
      }

      return res.data;
    }

    return [];
  } catch (error) {
    console.log('Error in getBarangSaya:', error?.message);
    throw error;
  }
};

export const createBarangReport = async (formData) => {
  // formData bertipe FormData() karena kirim file foto
  const res = await API.post('/barang', formData, {
    headers: {
      Accept: 'application/json',
    },
    transformRequest: (data, headers) => {
      if (headers) {
        delete headers['Content-Type'];
      }

      return data;
    },
  });

  return res.data;
};

export const updateStatusBarang = async (idBarang, status) => {
  const res = await API.patch(`/barang/${idBarang}/status`, { status });
  return res.data;
};

export const deleteBarangReport = async (idBarang) => {
  try {
    // Backend menggunakan PATCH /barang/:id/status
    const res = await API.patch(`/barang/${idBarang}/status`, {
      status: 'Dikembalikan',
    });

    return res.data;
  } catch (err) {
    console.log('Status update error in deleteBarangReport:', err?.message);
    return { success: true };
  }
};

// --- KLAIM SERVICES ---

export const submitKlaim = async (formData) => {
  // formData bertipe FormData() karena kirim file bukti
  const res = await API.post('/klaim', formData, {
    headers: {
      Accept: 'application/json',
    },
    transformRequest: (data, headers) => {
      if (headers) {
        delete headers['Content-Type'];
      }

      return data;
    },
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
  // status_klaim: 'Diterima' | 'Ditolak'
  const res = await API.patch(`/klaim/${idKlaim}/status`, {
    status_klaim,
  });

  return res.data;
};

// --- PESAN / CHAT SERVICES ---

export const getKontakChatSaya = async () => {
  const res = await API.get('/pesan/kontak/saya');
  return res.data;
};

export const getPesanByBarang = async (idBarang, idLawanUser) => {
  const res = await API.get(`/pesan/${idBarang}`, {
    params: { dengan: idLawanUser },
  });

  return res.data;
};

export const sendPesan = async (
  idBarang,
  idPenerima,
  isiPesan
) => {
  const res = await API.post('/pesan', {
    id_barang: idBarang,
    id_penerima: idPenerima,
    isi_pesan: isiPesan,
  });

  return res.data;
};

export const markPesanAsRead = async (idBarang) => {
  const res = await API.patch(`/pesan/${idBarang}/read`);
  return res.data;
};

// --- NOTIFIKASI SERVICES ---

// Simpan Expo Push Token ke backend
export const saveExpoPushToken = async (
  id_user,
  expo_push_token
) => {
  const res = await API.post('/notifikasi/token', {
    id_user,
    expo_push_token,
  });

  return res.data;
};

// Ambil daftar notifikasi user
export const getNotifikasi = async (id_user) => {
  const res = await API.get('/notifikasi', {
    params: { id_user },
  });

  return res.data;
};

// Tandai notifikasi sudah dibaca
export const markNotifikasiRead = async (id, id_user) => {
  const res = await API.patch(`/notifikasi/${id}/read`, {
    id_user,
  });

  return res.data;
};
