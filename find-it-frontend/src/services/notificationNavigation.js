import { createNavigationContainerRef } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import { getKlaimDetail, getChatRoomsSaya, markNotifikasiRead } from './finditService';

export const navigationRef = createNavigationContainerRef();

const AUTH_SCREENS = ['Splash', 'Welcome', 'Login', 'Register', 'ForgotPassword'];
let lastHandledKey = null;
let lastHandledAt = 0;

const wasRecentlyHandled = (key) => {
  const now = Date.now();
  if (key && key === lastHandledKey && now - lastHandledAt < 5000) return true;
  lastHandledKey = key;
  lastHandledAt = now;
  return false;
};

const waitAndNavigate = (action, tries = 0) => {
  if (tries > 30) return;
  if (!navigationRef.isReady()) {
    setTimeout(() => waitAndNavigate(action, tries + 1), 400);
    return;
  }
  const current = navigationRef.getCurrentRoute()?.name;
  if (AUTH_SCREENS.includes(current)) {
    setTimeout(() => waitAndNavigate(action, tries + 1), 400);
    return;
  }
  action();
};

export const navigateFromNotificationData = (data) => {
  if (!data) return;
  const key = `${data.id_notifikasi || ''}|${data.id_room || ''}|${data.id_klaim || ''}`;
  if (wasRecentlyHandled(key)) return;
  if (data.id_notifikasi) markNotifikasiRead(data.id_notifikasi).catch(() => {});

  const idRoom = data.id_room ? Number(data.id_room) : null;
  const idKlaim = data.id_klaim ? Number(data.id_klaim) : null;
  const idBarang = data.id_barang ? Number(data.id_barang) : null;

  if (idRoom) {
    waitAndNavigate(async () => {
      let extra = {};
      try {
        const rooms = await getChatRoomsSaya();
        const r = Array.isArray(rooms)
          ? rooms.find((x) => Number(x.id_room) === idRoom)
          : null;
        if (r) {
          extra = {
            id_penerima: r.id_lawan,
            nama_penerima: r.nama_lawan,
            item: {
              id_barang: r.id_barang,
              judul: r.judul,
              lokasi: '',
              status: r.status_barang,
              foto_utama: r.foto_barang,
            },
          };
        }
      } catch (e) {}
      navigationRef.navigate('DirectChat', {
        id_room: idRoom,
        id_barang: idBarang || undefined,
        ...extra,
      });
    });
    return;
  }

  if (idKlaim) {
    waitAndNavigate(async () => {
      try {
        const res = await getKlaimDetail(idKlaim);
        if (res?.peran === 'pelapor' && res?.klaim) {
          navigationRef.navigate('ReviewClaim', { klaim: res.klaim, item: res.item });
        } else {
          navigationRef.navigate('MyActivity');
        }
      } catch (e) {
        navigationRef.navigate('MyActivity');
      }
    });
    return;
  }

  if (idBarang) {
    waitAndNavigate(() => navigationRef.navigate('DetailItem', { id_barang: idBarang }));
    return;
  }

  waitAndNavigate(() => navigationRef.navigate('Notifications'));
};

export const setupNotificationNavigation = () => {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    navigateFromNotificationData(response?.notification?.request?.content?.data);
  });
  return () => sub.remove();
};

export const handleColdStartNotification = async () => {
  try {
    const response = await Notifications.getLastNotificationResponseAsync();
    const data = response?.notification?.request?.content?.data;
    if (data) {
      navigateFromNotificationData(data);
      await Notifications.clearLastNotificationResponseAsync();
    }
  } catch (e) {}
};