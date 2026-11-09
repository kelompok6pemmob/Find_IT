import * as Location from 'expo-location';
import { Alert } from 'react-native';

/**
 * Minta izin lokasi & ambil koordinat saat ini
 * @returns {Promise<{latitude, longitude, address}|null>}
 */
export const getCurrentLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Izin Lokasi Ditolak',
        'Aktifkan izin lokasi di pengaturan perangkat agar titik kejadian bisa ditandai otomatis.'
      );
      return null;
    }

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    let address = null;
    try {
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      if (geo) {
        address = [geo.name, geo.street, geo.city, geo.region]
          .filter(Boolean)
          .join(', ');
      }
    } catch (e) {}

    return {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      address,
    };
  } catch (e) {
    Alert.alert('Gagal Mengambil Lokasi', e.message || 'Pastikan GPS perangkat aktif.');
    return null;
  }
};