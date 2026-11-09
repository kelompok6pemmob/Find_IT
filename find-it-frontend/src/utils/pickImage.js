import { Alert, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

/**
 * ActionSheet pilih sumber gambar: Kamera / Galeri / Hapus
 * @param {object} options - { allowCamera: true, aspect: [1,1], quality: 0.8, onDelete: fn }
 * @returns {Promise<{uri, fileName, mimeType}|null>}
 */
export const pickImageWithActionSheet = async (options = {}) => {
  const {
    allowCamera = true,
    aspect = null,
    quality = 0.8,
    onDelete = null,
    title = 'Pilih Sumber Gambar',
  } = options;

  return new Promise((resolve) => {
    const buttons = [];

    if (allowCamera) {
      buttons.push({
        text: 'Ambil dari Kamera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Izin Ditolak', 'Izin kamera diperlukan untuk mengambil foto.');
            return resolve(null);
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect,
            quality,
          });
          if (!result.canceled && result.assets?.[0]) {
            resolve(result.assets[0]);
          } else {
            resolve(null);
          }
        },
      });
    }

    buttons.push({
      text: 'Pilih dari Galeri',
      onPress: async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Izin Ditolak', 'Izin galeri diperlukan untuk mengunggah foto.');
          return resolve(null);
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect,
          quality,
        });
        if (!result.canceled && result.assets?.[0]) {
          resolve(result.assets[0]);
        } else {
          resolve(null);
        }
      },
    });

    if (onDelete) {
      buttons.push({
        text: 'Hapus Foto',
        style: 'destructive',
        onPress: () => {
          onDelete();
          resolve(null);
        },
      });
    }

    buttons.push({ text: 'Batal', style: 'cancel', onPress: () => resolve(null) });

    Alert.alert(title, undefined, buttons, { cancelable: true });
  });
};
export const updateMyProfile = async (formData) => {
  const res = await API.patch('/auth/profil', formData, {
    headers: { Accept: 'application/json' },
    transformRequest: (data, headers) => { if (headers) delete headers['Content-Type']; return data; },
  });
  return res.data;
};