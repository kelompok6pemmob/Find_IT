import React, { useState, useEffect } from'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ActivityIndicator,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import * as ImagePicker from'expo-image-picker';
import { getKategori, createBarangReport, recordPostUploadTime } from'../services/finditService';
import { BASE_URL } from'../services/api';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';

const DEFAULT_CATEGORIES = [
  { id_kategori: 1, nama_kategori:'Elektronik' },
  { id_kategori: 2, nama_kategori:'Dokumen' },
  { id_kategori: 3, nama_kategori:'Pakaian & Tas' },
  { id_kategori: 4, nama_kategori:'Kunci' },
  { id_kategori: 5, nama_kategori:'Lainnya' },
];

const getDefaultDate = () => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2,'0');
  const dd = String(now.getDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
};

export default function CreateReportScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  // Mode:'LOST' (Saya Kehilangan) atau'FOUND' (Saya Menemukan)
  const [reportType, setReportType] = useState('LOST');
  const [itemName, setItemName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [location, setLocation] = useState('');
  const [dateTime, setDateTime] = useState(getDefaultDate());
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isLost = reportType ==='LOST';

  // Fetch Kategori dari DB dengan fallback default
  useEffect(() => {
    const fetchKategoriData = async () => {
      try {
        const data = await getKategori();
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setSelectedCategory(data[0]);
        }
      } catch (error) {
        console.log('Kategori offline, using DEFAULT_CATEGORIES');
        setCategoriesList(DEFAULT_CATEGORIES);
      }
    };
    fetchKategoriData();
  }, []);

  // Fungsi Pilih Foto
  const handlePickImage = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showCustomAlert({
        title:'Izin Akses Galeri',
        message:'FindIt memerlukan izin galeri agar kamu dapat menyertakan foto barang.',
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
      setSelectedImage(result.assets[0]);
    }
  };

  // Submit Form ke Express Backend (Real API POST /barang + Fallback)
  const handleSubmitReport = async () => {
    if (!itemName.trim() || !location.trim()) {
      showCustomAlert({
        title:'Informasi Belum Lengkap',
        message:'Mohon cantumkan nama barang dan lokasi agar teman-teman kampus lebih mudah mengenalinya.',
        type:'warning',
      });
      return;
    }

    const tanggalKirim = dateTime.trim() || getDefaultDate();

    try {
      setSubmitting(true);

      const formData = new FormData();
      formData.append('judul', itemName.trim());
      formData.append('id_kategori', String(selectedCategory?.id_kategori || 1));
      formData.append('lokasi', location.trim());
      formData.append('tanggal', tanggalKirim);
      formData.append('deskripsi', description.trim());
      formData.append('status', isLost ?'Hilang' :'Ditemukan');

      if (selectedImage && selectedImage.uri) {
        const fileUri = selectedImage.uri;
        const fileExtension = fileUri.split('.').pop()?.toLowerCase() ||'jpg';
        const mimeType = selectedImage.mimeType || `image/${fileExtension ==='jpg' ?'jpeg' : fileExtension}`;
        const fileName = selectedImage.fileName || `foto_${Date.now()}.${fileExtension}`;

        formData.append('foto', {
          uri: Platform.OS ==='android' ? fileUri : fileUri.replace('file://',''),
          name: fileName,
          type: mimeType,
        });
      }

      const response = await createBarangReport(formData);

      if (response && response.id_barang) {
        await recordPostUploadTime(response.id_barang, Date.now());
      }

      showCustomAlert({
        title:'Laporan Berhasil Diterbitkan!',
        message: `Laporan"${itemName}" sudah tayang di feed Beranda. Semoga lekas terhubung dengan pemilik atau penemunya!`,
        type:'success',
        buttons: [
          {
            text:'Lihat di Beranda',
            style:'default',
            onPress: () => navigation.navigate('MainTabs', { screen:'HomeTab' }),
          },
        ],
      });
    } catch (error) {
      console.log('Submit report error:', error?.response?.status, error?.response?.data, error?.message);
      const serverData = error?.response?.data;
      const serverMessage = (typeof serverData ==='object' && serverData?.message) 
        ? serverData.message 
        : (typeof serverData ==='string' && serverData.length < 150 ? serverData : null);

      if (serverMessage) {
        showCustomAlert({
          title:'Laporan Belum Terunggah',
          message: serverMessage,
          type:'error',
        });
      } else if (error?.response?.status) {
        showCustomAlert({ title: 'Gagal Mengunggah', message: `Server merespons kode ${error.response.status}. Pastikan Anda login dengan akun terdaftar.`, type: 'error' });
      } else {
        showCustomAlert({
          title:'Koneksi Server Belum Terhubung',
          message: `Tidak dapat menjangkau server backend (${BASE_URL}). Pastikan server di laptop aktif dan HP berada di Wi-Fi yang sama ya!\n\nLaporan"${itemName}" telah dicatat secara lokal.`,
          type:'warning',
          buttons: [
            {
              text:'Lihat di Beranda',
              style:'default',
              onPress: () => navigation.navigate('MainTabs', { screen:'HomeTab' }),
            },
          ],
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.card : '#FFFFFF'}
      />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, isDark && { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}
          onPress={() => {
            if (navigation?.canGoBack?.()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs', { screen:'HomeTab' });
            }
          }}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Buat Laporan</Text>
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
          {/* Toggle Type Laporan */}
          <View style={[styles.tabContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.tabButton,
                isLost && styles.tabButtonActive,
              ]}
              onPress={() => setReportType('LOST')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isDark && !isLost && { color: colors.textSecondary }, isLost && styles.tabTextActive]}>
                Saya Kehilangan
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tabButton,
                !isLost && styles.tabButtonActive,
              ]}
              onPress={() => setReportType('FOUND')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isDark && isLost && { color: colors.textSecondary }, !isLost && styles.tabTextActive]}>
                Saya Menemukan
              </Text>
            </TouchableOpacity>
          </View>

          {/* Upload Photo Area */}
          <TouchableOpacity
            style={[styles.uploadCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handlePickImage}
          >
            {selectedImage ? (
              <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            ) : (
              <>
                <View style={styles.uploadIconCircle}>
                  <Feather name="aperture" size={24} color="#10B981" />
                </View>
                <Text style={[styles.uploadTitle, isDark && { color: colors.text }]}>
                  {isLost ?'Unggah Foto Barang' :'Upload Photo Barang'}
                </Text>
                <Text style={styles.uploadSubtitle}>PNG, JPG maksimal 5MB</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {/* Nama Barang */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Nama Barang</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder="Contoh: Kunci, Dompet, Flashdisk"
                placeholderTextColor="#94A3B8"
                value={itemName}
                onChangeText={setItemName}
              />
            </View>

            {/* Kategori */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Kategori</Text>
              <TouchableOpacity
                style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
              >
                <Text
                  style={
                    selectedCategory
                      ? [styles.inputText, isDark && { color: colors.text }]
                      : styles.placeholderText
                  }
                >
                  {selectedCategory
                    ? selectedCategory.nama_kategori
                    :'Pilih Kategori'}
                </Text>
                <Ionicons name="chevron-down" size={18} color="#64748B" />
              </TouchableOpacity>

              {/* List Dropdown Kategori */}
              {showCategoryDropdown && (
                <View style={[styles.dropdownList, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                  {categoriesList.map((cat) => (
                    <TouchableOpacity
                      key={cat.id_kategori}
                      style={[styles.dropdownItem, isDark && { borderBottomColor: colors.border }]}
                      onPress={() => {
                        setSelectedCategory(cat);
                        setShowCategoryDropdown(false);
                      }}
                    >
                      <Text style={[styles.dropdownItemText, isDark && { color: colors.text }]}>
                        {cat.nama_kategori}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Lokasi */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>
                {isLost
                  ?'Lokasi Terakhir Terlihat'
                  :'Lokasi Terakhir / Ditemukan'}
              </Text>
              <View style={[styles.iconInputContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.iconInput, isDark && { color: colors.text }]}
                  placeholder="Contoh: Perpustakaan UINSA"
                  placeholderTextColor="#94A3B8"
                  value={location}
                  onChangeText={setLocation}
                />
              </View>
            </View>

            {/* Tanggal & Waktu */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>
                {isLost ?'Tanggal Kehilangan' :'Tanggal Ditemukan'}
              </Text>
              <View style={[styles.iconInputContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather
                  name="calendar"
                  size={18}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.iconInput, isDark && { color: colors.text }]}
                  placeholder="YYYY-MM-DD (Contoh: 2026-10-18)"
                  placeholderTextColor="#94A3B8"
                  value={dateTime}
                  onChangeText={setDateTime}
                />
              </View>
            </View>

            {/* Deskripsi Detail */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Deskripsi detail</Text>
              <TextInput
                style={[styles.textArea, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                placeholder={
                  isLost
                    ?'Tuliskan warna, merek, ciri khas, dan isi barang agar mudah dikenali...'
                    :'Ceritakan detail barang, kondisi, atau isi di dalamnya...'
                }
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.85}
              onPress={handleSubmitReport}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLost ?'Kirim Laporan Kehilangan' :'Kirim Laporan Penemuan'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#FFFFFF',
  },
  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal: 20,
    height: 52,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor:'#F8FAFC',
    alignItems:'center',
    justifyContent:'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight:'700',
    color:'#0F172A',
  },
  headerRightPlaceholder: {
    width: 38,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
  },
  tabContainer: {
    flexDirection:'row',
    backgroundColor:'#F8FAFC',
    borderRadius: 999,
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
  },
  tabButtonActive: {
    backgroundColor:'#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight:'600',
    color:'#64748B',
  },
  tabTextActive: {
    color:'#FFFFFF',
  },
  uploadCard: {
    borderWidth: 1.5,
    borderColor:'#CBD5E1',
    borderStyle:'dashed',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#FFFFFF',
    marginBottom: 24,
    overflow:'hidden',
  },
  previewImage: {
    width:'100%',
    height: 160,
    borderRadius: 12,
  },
  uploadIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor:'#D1FAE5',
    alignItems:'center',
    justifyContent:'center',
    marginBottom: 10,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight:'700',
    color:'#0F172A',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 12,
    color:'#94A3B8',
  },
  formGroup: {
    gap: 18,
  },
  inputContainer: {
    gap: 6,
    position:'relative',
  },
  label: {
    fontSize: 14,
    fontWeight:'600',
    color:'#334155',
  },
  input: {
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color:'#0F172A',
    backgroundColor:'#FFFFFF',
  },
  dropdownInput: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor:'#FFFFFF',
  },
  dropdownList: {
    backgroundColor:'#FFFFFF',
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor:'#F1F5F9',
  },
  dropdownItemText: {
    fontSize: 14,
    color:'#0F172A',
  },
  iconInputContainer: {
    flexDirection:'row',
    alignItems:'center',
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor:'#FFFFFF',
    height: 46,
  },
  inputIcon: {
    marginRight: 10,
  },
  iconInput: {
    flex: 1,
    fontSize: 14,
    color:'#0F172A',
  },
  placeholderText: {
    fontSize: 14,
    color:'#94A3B8',
  },
  inputText: {
    fontSize: 14,
    color:'#0F172A',
  },
  textArea: {
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color:'#0F172A',
    backgroundColor:'#FFFFFF',
    height: 100,
  },
  submitButton: {
    backgroundColor:'#10B981',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
    marginTop: 10,
  },
  submitButtonText: {
    color:'#FFFFFF',
    fontSize: 16,
    fontWeight:'600',
  },
});