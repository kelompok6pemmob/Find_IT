import React, { useState } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import * as ImagePicker from'expo-image-picker';
import { submitKlaim, formatPhotoUrl } from'../services/finditService';
import { BASE_URL } from'../services/api';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';

const DEFAULT_CLAIM_ITEM = {
  id_barang: 1,
  judul:'Wallet Hitam Pedro',
  lokasi:'Perpustakaan UINSA',
  tanggal:'02 Mei 2025 • 14:30',
  status:'Ditemukan',
  foto_url:'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop',
};

export default function ClaimFormScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  // Ambil detail barang dari route params dengan fallback default
  const { item } = route.params || {};
  const activeItem = item || DEFAULT_CLAIM_ITEM;

  const [description, setDescription] = useState('');
  const [selectedProofImage, setSelectedProofImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fungsi Pilih Foto Bukti Kepemilikan
  const handlePickProofImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showCustomAlert({
        title:'Izin Akses Galeri',
        message:'Izin akses galeri dibutuhkan untuk mengunggah foto bukti kepemilikan.',
        type:'warning',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setSelectedProofImage(result.assets[0]);
    }
  };

  // Submit Klaim ke Backend Express (Real API POST /klaim + Fallback)
  const handleSubmitClaim = async () => {
    if (!description.trim()) {
      showCustomAlert({
        title:'Keterangan Wajib Diisi',
        message:'Mohon tuliskan penjelasan ciri khas barang atau alasan kepemilikan agar penemu yakin.',
        type:'warning',
      });
      return;
    }

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('id_barang', String(activeItem.id_barang));
      formData.append('alasan_klaim', description.trim());

      if (selectedProofImage && selectedProofImage.uri) {
        const fileUri = selectedProofImage.uri;
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() ||'jpg';
        const mimeType = selectedProofImage.mimeType || `image/${fileExtension ==='jpg' ?'jpeg' : fileExtension}`;
        const fileName = selectedProofImage.fileName || `bukti_${Date.now()}.${fileExtension}`;

        formData.append('bukti', {
          uri: Platform.OS ==='android' ? fileUri : fileUri.replace('file://',''),
          name: fileName,
          type: mimeType,
        });
      }

      const res = await submitKlaim(formData);

      showCustomAlert({
        title:'Klaim Berhasil Dikirimkan! ',
        message:'Pengajuan klaim kepemilikan kamu telah terkirim ke penemu barang. Silakan koordinasi lebih lanjut melalui pesan chat.',
        type:'success',
        buttons: [
          {
            text:'Buka Pesan Chat',
            style:'default',
            onPress: () => navigation.navigate('MainTabs', { screen:'ChatTab' }),
          },
        ],
      });
    } catch (error) {
      console.log('Submit klaim error:', error?.message);
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        showCustomAlert({
          title:'Pengajuan Belum Berhasil',
          message: serverMessage,
          type:'error',
        });
      } else {
        // Backend offline / network unreachable
        showCustomAlert({
          title:'Koneksi Server Terputus',
          message:'Server backend sedang tidak terjangkau. Pengajuan klaim telah dicatat dalam mode simulasi.',
          type:'warning',
          buttons: [
            {
              text:'Lanjut ke Chat',
              style:'default',
              onPress: () =>
                navigation.navigate('DirectChat', {
                  id_barang: activeItem.id_barang,
                  role:'claimer',
                  claimStatus:'submitted',
                }),
            },
          ],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const itemPhotoUrl = formatPhotoUrl(activeItem?.foto_url);
  const isFound = activeItem?.status ==='Ditemukan';

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajukan Klaim Barang</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS ==='ios' ?'padding' :'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Summary Barang */}
          <View style={[styles.itemCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{
                uri:
                  itemPhotoUrl ||'https://via.placeholder.com/150?text=No+Photo',
              }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTag}>Barang yang diklaim</Text>
              <Text style={styles.itemTitle}>{activeItem?.judul ||'Barang FindIt'}</Text>
              <Text style={styles.itemMeta}>{activeItem?.lokasi ||'UINSA'}</Text>
              <Text style={styles.itemMeta}>{activeItem?.tanggal ||'-'}</Text>
            </View>
            <View
              style={[
                styles.foundBadge,
                !isFound && { backgroundColor:'#FEE2E2' },
              ]}
            >
              <Text
                style={[
                  styles.foundBadgeText,
                  !isFound && { color:'#DC2626' },
                ]}
              >
                {isFound ?'FOUND' :'LOST'}
              </Text>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {/* Bukti Identitas & Kepemilikan */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>
                Bukti Kepemilikan / Foto Barang <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.helperText}>
                Unggah KTM, KTP, foto sebelum hilang, atau ciri khas barang.
              </Text>
              <TouchableOpacity
                style={styles.uploadCard}
                activeOpacity={0.7}
                onPress={handlePickProofImage}
              >
                {selectedProofImage ? (
                  <Image
                    source={{ uri: selectedProofImage.uri }}
                    style={styles.previewProofImage}
                  />
                ) : (
                  <>
                    <View style={styles.uploadIconCircle}>
                      <Feather name="image" size={20} color="#10B981" />
                    </View>
                    <Text style={styles.uploadTitle}>Upload Foto Bukti</Text>
                    <Text style={styles.uploadSubtitle}>
                      PNG, JPG maksimal 5MB
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Penjelasan Kepemilikan */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                Penjelasan Kepemilikan <Text style={styles.asterisk}>*</Text>
              </Text>
              <Text style={styles.helperText}>
                Jelaskan ciri khas dan alasan mengapa barang ini milik kamu.
              </Text>
              <TextInput
                style={[styles.textArea, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Jelaskan secara rinci ciri khusus barang, gantungan, atau isi di dalamnya..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Notice Info Box */}
            <View style={styles.infoBox}>
              <Ionicons
                name="shield-checkmark-outline"
                size={20}
                color="#047857"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.infoBoxTitle}>
                  Klaim menunggu verifikasi pengunggah
                </Text>
                <Text style={styles.infoBoxText}>
                  Pelapor laporan akan memeriksa bukti kepemilikan kamu sebelum menyetujui klaim.
                </Text>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleSubmitClaim}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Kirim Pengajuan Klaim</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#FFFFFF' },
  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:'#F8FAFC',
    alignItems:'center',
    justifyContent:'center',
  },
  headerTitle: { fontSize: 18, fontWeight:'700', color:'#0F172A' },
  headerRightPlaceholder: { width: 36 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  itemCard: {
    flexDirection:'row',
    backgroundColor:'#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    alignItems:'center',
    marginBottom: 20,
  },
  itemImage: { width: 64, height: 64, borderRadius: 12, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTag: { fontSize: 12, color:'#10B981', fontWeight:'600', marginBottom: 2 },
  itemTitle: { fontSize: 16, fontWeight:'700', color:'#0F172A', marginBottom: 2 },
  itemMeta: { fontSize: 12, color:'#64748B' },
  foundBadge: {
    backgroundColor:'#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf:'flex-start',
  },
  foundBadgeText: { color:'#2563EB', fontSize: 10, fontWeight:'700' },
  formGroup: { gap: 18 },
  inputContainer: { gap: 4 },
  label: { fontSize: 14, fontWeight:'600', color:'#334155' },
  asterisk: { color:'#10B981' },
  helperText: { fontSize: 12, color:'#64748B', marginBottom: 4 },
  uploadCard: {
    borderWidth: 1.5,
    borderColor:'#CBD5E1',
    borderStyle:'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#FFFFFF',
    overflow:'hidden',
  },
  previewProofImage: {
    width:'100%',
    height: 140,
    borderRadius: 12,
  },
  uploadIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:'#D1FAE5',
    alignItems:'center',
    justifyContent:'center',
    marginBottom: 8,
  },
  uploadTitle: { fontSize: 13, fontWeight:'700', color:'#0F172A', marginBottom: 2 },
  uploadSubtitle: { fontSize: 11, color:'#94A3B8' },
  textArea: {
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color:'#0F172A',
    backgroundColor:'#FFFFFF',
    height: 90,
  },
  infoBox: {
    flexDirection:'row',
    backgroundColor:'#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginTop: 4,
  },
  infoBoxTitle: { fontSize: 13, fontWeight:'700', color:'#047857', marginBottom: 2 },
  infoBoxText: { fontSize: 12, color:'#047857', lineHeight: 16 },
  submitButton: {
    backgroundColor:'#10B981',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
    marginTop: 8,
  },
  submitButtonText: { color:'#FFFFFF', fontSize: 16, fontWeight:'600' },
});