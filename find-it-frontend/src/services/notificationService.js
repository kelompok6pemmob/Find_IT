
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { saveExpoPushToken } from './finditService';

// Konfigurasi tampilan notifikasi saat aplikasi aktif
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Mengambil Expo Push Token dan menyimpannya ke backend
export const registerForPushNotifications = async (id_user) => {
  try {
    // Push notification memerlukan perangkat fisik
    if (!Device.isDevice) {
      console.log('Push notification memerlukan perangkat fisik');
      return null;
    }

    // Meminta izin notifikasi
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Izin notifikasi tidak diberikan');
      return null;
    }

    // Mengambil project ID Expo
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    if (!projectId) {
      console.log('EAS Project ID belum tersedia');
      return null;
    }

    // Mengambil Expo Push Token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const expoPushToken = tokenData.data;

    console.log('Expo Push Token:', expoPushToken);

    // Menyimpan token ke database melalui backend
    await saveExpoPushToken(id_user, expoPushToken);

    console.log('Expo Push Token berhasil disimpan ke backend');

    return expoPushToken;
  } catch (error) {
    console.log('Register push notification error:', error.message);
    return null;
  }
};
