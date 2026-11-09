import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  StatusBar, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { getKategori, createBarangReport, recordPostUploadTime } from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { pickImageWithActionSheet } from '../utils/pickImage';
import { getCurrentLocation } from '../utils/getCurrentLocation';

const DEFAULT_CATEGORIES = [
  { id_kategori: 1, nama_kategori: 'Elektronik' },
  { id_kategori: 4, nama_kategori: 'Dokumen dan Identitas' },
  { id_kategori: 6, nama_kategori: 'Kunci' },
  { id_kategori: 14, nama_kategori: 'Lainnya' },
];

const getDefaultDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export default function CreateReportScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [reportType, setReportType] = useState('LOST');
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [dateTime, setDateTime] = useState(getDefaultDate());
  const [description, setDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState([]); // MULTI-FOTO

  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isLost = reportType === 'LOST';

  useEffect(() => {
    const fetchKategoriData = async () => {
      try {
        const data = await getKategori();
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setSelectedCategory(data[0]);
        }
      } catch (error) {
        setCategoriesList(DEFAULT_CATEGORIES);
      }
    };
    fetchKategoriData();
  }, []);

  // ActionSheet tambah foto (bisa kamera / galeri)
  const handleAddImage = async () => {
    if (selectedImages.length >= 5) {
      showCustomAlert({ title: 'Maksimal 5 Foto', message: 'Kamu hanya bisa mengunggah maksimal 5 foto per laporan.', type: 'warning' });
      return;
    }
    const asset = await pickImageWithActionSheet({ title: 'Tambah Foto Barang' });
    if (asset) setSelectedImages([...selectedImages, asset]);
  };

  const handleRemoveImage = (index) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  // GPS: ambil lokasi saat ini
  const handlePickCurrentLocation = async () => {
    setLoadingLocation(true);
    const loc = await getCurrentLocation();
    if (loc) {
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
      if (loc.address && !location.trim()) setLocation(loc.address);
      showCustomAlert({ title: 'Lokasi Didapat', message: `Lat: ${loc.latitude.toFixed(5)}, Lng: ${loc.longitude.toFixed(5)}`, type: 'success' });
    }
    setLoadingLocation(false);
  };

  const handleSubmitReport = async () => {
    if (!itemName.trim() || !location.trim()) {
      showCustomAlert({ title: 'Informasi Belum Lengkap', message: 'Mohon isi nama barang dan lokasi.', type: 'warning' });
      return;
    }
    if (selectedImages.length === 0) {
      showCustomAlert({ title: 'Foto Wajib', message: 'Unggah minimal 1 foto barang agar mudah dikenali.', type: 'warning' });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('judul', itemName.trim());
      formData.append('id_kategori', String(selectedCategory?.id_kategori || 1));
      formData.append('lokasi', location.trim());
      formData.append('tanggal_kejadian', dateTime.trim() || getDefaultDate());
      formData.append('deskripsi', description.trim());
      formData.append('status', isLost ? 'Hilang' : 'Ditemukan');
      if (latitude !== null && longitude !== null) {
        formData.append('latitude', String(latitude));
        formData.append('longitude', String(longitude));
      }

      // Multi-foto dengan key sama 'foto'
      selectedImages.forEach((img, idx) => {
        const fileUri = img.uri;
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() || 'jpg';
        const mimeType = img.mimeType || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`;
        const fileName = img.fileName || `foto_${Date.now()}_${idx}.${fileExtension}`;
        formData.append('foto', {
          uri: Platform.OS === 'android' ? fileUri : fileUri.replace('file://', ''),
          name: fileName,
          type: mimeType,
        });
      });

      const response = await createBarangReport(formData);
      if (response && response.id_barang) {
        await recordPostUploadTime(response.id_barang, Date.now());
      }
      showCustomAlert({
        title: 'Laporan Berhasil Diterbitkan!',
        message: `Laporan "${itemName}" sudah tayang di feed Beranda.`,
        type: 'success',
        buttons: [{ text: 'Lihat di Beranda', style: 'default', onPress: () => navigation.navigate('MainTabs', { screen: 'HomeTab' }) }],
      });
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        showCustomAlert({ title: 'Laporan Belum Terunggah', message: serverMessage, type: 'error' });
      } else {
        showCustomAlert({ title: 'Koneksi Server Belum Terhubung', message: 'Server tidak terjangkau. Pastikan Wi-Fi sama dengan laptop.', type: 'warning' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Buat Laporan</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.tabContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity style={[styles.tabButton, isLost && styles.tabButtonActive]} onPress={() => setReportType('LOST')}>
              <Text style={[styles.tabText, isDark && !isLost && { color: colors.textSecondary }, isLost && styles.tabTextActive]}>Saya Kehilangan</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, !isLost && styles.tabButtonActive]} onPress={() => setReportType('FOUND')}>
              <Text style={[styles.tabText, isDark && isLost && { color: colors.textSecondary }, !isLost && styles.tabTextActive]}>Saya Menemukan</Text>
            </TouchableOpacity>
          </View>

          {/* MULTI-FOTO GALLERY */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, isDark && { color: colors.text }]}>Foto Barang ({selectedImages.length}/5) *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRow}>
              {selectedImages.map((img, idx) => (
                <View key={idx} style={styles.photoThumb}>
                  <Image source={{ uri: img.uri }} style={styles.photoImage} />
                  <TouchableOpacity style={styles.photoRemoveBtn} onPress={() => handleRemoveImage(idx)}>
                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}
              {selectedImages.length < 5 && (
                <TouchableOpacity style={styles.photoAddBtn} onPress={handleAddImage}>
                  <Ionicons name="camera-outline" size={28} color="#10B981" />
                  <Text style={styles.photoAddText}>Tambah</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Nama Barang *</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Contoh: Kunci Motor, Dompet Hitam"
                placeholderTextColor="#94A3B8"
                value={itemName} onChangeText={setItemName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Kategori *</Text>
              <TouchableOpacity style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}>
                <Text style={[styles.inputText, isDark && { color: colors.text }]}>{selectedCategory?.nama_kategori || 'Pilih Kategori'}</Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>
              {showCategoryDropdown && (
                <View style={[styles.dropdownList, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {categoriesList.map((cat) => (
                    <TouchableOpacity key={cat.id_kategori} style={styles.dropdownItem} onPress={() => { setSelectedCategory(cat); setShowCategoryDropdown(false); }}>
                      <Text style={[styles.dropdownItemText, isDark && { color: colors.text }]}>{cat.nama_kategori}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* LOKASI: GPS + Manual */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>{isLost ? 'Lokasi Terakhir Terlihat *' : 'Lokasi Ditemukan *'}</Text>
              <View style={[styles.iconInputContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons name="location-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.iconInput, isDark && { color: colors.text }]}
                  placeholder="Contoh: Perpustakaan UINSA"
                  placeholderTextColor="#94A3B8"
                  value={location} onChangeText={setLocation}
                />
              </View>
              <TouchableOpacity style={styles.gpsButton} onPress={handlePickCurrentLocation} disabled={loadingLocation}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="navigate" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.gpsButtonText}>Pakai Lokasi Saya Sekarang</Text>
                  </>
                )}
              </TouchableOpacity>
              {latitude !== null && longitude !== null && (
                <Text style={{ fontSize: 11, color: '#10B981', marginTop: 4 }}>
                  ✓ Koordinat tersimpan: {latitude.toFixed(5)}, {longitude.toFixed(5)}
                </Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>{isLost ? 'Tanggal Kehilangan *' : 'Tanggal Ditemukan *'}</Text>
              <View style={[styles.iconInputContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="calendar" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.iconInput, isDark && { color: colors.text }]}
                  placeholder="YYYY-MM-DD (Contoh: 2026-11-08)"
                  placeholderTextColor="#94A3B8"
                  value={dateTime} onChangeText={setDateTime}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Deskripsi detail</Text>
              <TextInput
                style={[styles.textArea, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder={isLost ? 'Warna, merek, ciri khas, isi barang...' : 'Detail barang, kondisi, isi di dalamnya...'}
                placeholderTextColor="#94A3B8"
                multiline numberOfLines={4} textAlignVertical="top"
                value={description} onChangeText={setDescription}
              />
            </View>

            <TouchableOpacity style={styles.submitButton} activeOpacity={0.85} onPress={handleSubmitReport} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{isLost ? 'Kirim Laporan Kehilangan' : 'Kirim Laporan Penemuan'}</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 52 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerRightPlaceholder: { width: 38 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 999, padding: 4, marginBottom: 20 },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  tabButtonActive: { backgroundColor: '#10B981' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#FFFFFF' },
  formGroup: { gap: 18 },
  inputContainer: { gap: 6, position: 'relative', marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF' },
  dropdownInput: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF' },
  dropdownList: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, marginTop: 4 },
  dropdownItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  dropdownItemText: { fontSize: 14, color: '#0F172A' },
  inputText: { fontSize: 14, color: '#0F172A' },
  iconInputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, backgroundColor: '#FFFFFF', height: 46 },
  inputIcon: { marginRight: 10 },
  iconInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  textArea: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#0F172A', backgroundColor: '#FFFFFF', height: 100 },
  submitButton: { backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 999, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  // Multi-foto
  photoRow: { gap: 10, paddingVertical: 4 },
  photoThumb: { width: 100, height: 100, borderRadius: 12, position: 'relative', overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoRemoveBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: '#FFFFFF', borderRadius: 12 },
  photoAddBtn: { width: 100, height: 100, borderRadius: 12, borderWidth: 1.5, borderColor: '#CBD5E1', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  photoAddText: { fontSize: 11, color: '#10B981', marginTop: 4, fontWeight: '600' },
  // GPS
  gpsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  gpsButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
});