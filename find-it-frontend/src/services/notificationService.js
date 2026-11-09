import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { saveExpoPushToken } from './finditService';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log('⚠️ Push notification butuh perangkat fisik (bukan emulator)');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.log('⚠️ Izin notifikasi ditolak');
      return null;
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      console.log('⚠️ EAS Project ID belum ada di app.json');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data;
    console.log('🔔 Expo Push Token:', expoPushToken);

    // ✅ Panggil TANPA id_user — backend ambil dari JWT
    await saveExpoPushToken(
      expoPushToken,
      Platform.OS === 'ios' ? 'iOS' : 'Android'
    );
    console.log('✅ Token tersimpan ke backend');
    return expoPushToken;
  } catch (error) {
    console.error('❌ Register push gagal:', error.message);
    if (error?.response?.data) {
      console.error('Response backend:', error.response.data);
    }
    return null;
  }
};