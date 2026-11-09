import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  formatPhotoUrl,
  getMyProfile,
  getFakultas,
  getProdi,
  updateMyProfile,
} from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import { pickImageWithActionSheet } from '../utils/pickImage';

export default function EditProfileScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const [avatarAsset, setAvatarAsset] = useState(null); // asset lokal baru untuk upload

  const [fakultasList, setFakultasList] = useState([]);
  const [prodiList, setProdiList] = useState([]);
  const [selectedFakultas, setSelectedFakultas] = useState(null);
  const [selectedProdi, setSelectedProdi] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [programModalVisible, setProgramModalVisible] = useState(false);

  // Muat profil dari backend + daftar fakultas
  useEffect(() => {
    const init = async () => {
      try {
        const [profile, faks] = await Promise.all([getMyProfile(), getFakultas()]);
        if (Array.isArray(faks)) setFakultasList(faks);
        if (profile) {
          setFullName(profile.nama || '');
          setEmail(profile.email || '');
          setPhoneNumber(profile.telepon || '');
          if (profile.foto_profil) setAvatarUri(formatPhotoUrl(profile.foto_profil));
          if (profile.id_fakultas) {
            const fak = { id_fakultas: profile.id_fakultas, nama_fakultas: profile.nama_fakultas };
            setSelectedFakultas(fak);
            try {
              const prodis = await getProdi(fak.id_fakultas);
              if (Array.isArray(prodis)) {
                setProdiList(prodis);
                const mine = prodis.find((p) => p.id_prodi === profile.id_prodi);
                if (mine) setSelectedProdi(mine);
              }
            } catch (eProdi) {}
          }
        }
      } catch (eBackend) {
        // Fallback lokal bila backend tidak terjangkau
        try {
          const saved = await AsyncStorage.getItem('user_data');
          if (saved) {
            const u = JSON.parse(saved);
            setFullName(u.nama || '');
            setEmail(u.email || '');
            setPhoneNumber(u.telepon || '');
            if (u.foto_profil) setAvatarUri(formatPhotoUrl(u.foto_profil));
          }
        } catch (eLocal) {}
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ActionSheet: Kamera / Galeri / Hapus untuk foto profil
  const handlePickAvatar = async () => {
    const asset = await pickImageWithActionSheet({
      title: 'Foto Profil',
      aspect: [1, 1],
      onDelete: avatarUri
        ? () => {
            setAvatarUri(null);
            setAvatarAsset(null);
          }
        : null,
    });
    if (asset) {
      setAvatarUri(asset.uri);
      setAvatarAsset(asset);
    }
  };

  const handlePilihFakultas = async (fak) => {
    setSelectedFakultas(fak);
    setSelectedProdi(null);
    setProdiList([]);
    setFacultyModalVisible(false);
    try {
      const prodis = await getProdi(fak.id_fakultas);
      if (Array.isArray(prodis)) setProdiList(prodis);
    } catch (e) {}
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showCustomAlert({
        title: 'Nama Lengkap Wajib Diisi',
        message: 'Mohon isi nama lengkapmu agar akunmu mudah dikenali.',
        type: 'warning',
      });
      return;
    }
    try {
      setSaving(true);
      const formData = new FormData();
      formData.append('nama', fullName.trim());
      formData.append('telepon', phoneNumber.trim() || '');
      if (selectedProdi?.id_prodi) {
        formData.append('id_prodi', String(selectedProdi.id_prodi));
      }
      if (avatarAsset && avatarAsset.uri) {
        const ext = avatarAsset.uri.split('.').pop()?.toLowerCase() || 'jpg';
        const mime = avatarAsset.mimeType || `image/${ext === 'jpg' ? 'jpeg' : ext}`;
        formData.append('foto_profil', {
          uri: Platform.OS === 'android' ? avatarAsset.uri : avatarAsset.uri.replace('file://', ''),
          name: avatarAsset.fileName || `avatar_${Date.now()}.${ext}`,
          type: mime,
        });
      }
      await updateMyProfile(formData);

      // Refresh profil dari backend, lalu simpan ke AsyncStorage + vault
      let fresh = {};
      try {
        fresh = await getMyProfile();
      } catch (eRefresh) {}
      const savedRaw = await AsyncStorage.getItem('user_data');
      const current = savedRaw ? JSON.parse(savedRaw) : {};
      const updatedUser = {
        ...current,
        ...fresh,
        nama: fresh.nama || fullName.trim(),
        email: fresh.email || email,
        telepon: fresh.telepon || phoneNumber.trim(),
        fakultas: fresh.nama_fakultas || selectedFakultas?.nama_fakultas || current.fakultas || '',
        prodi: fresh.nama_prodi || selectedProdi?.nama_prodi || current.prodi || '',
        foto_profil: fresh.foto_profil ? formatPhotoUrl(fresh.foto_profil) : avatarUri,
      };
      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
      try {
        const vaultRaw = await AsyncStorage.getItem('user_profiles_vault');
        const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
        const key = (updatedUser.email || 'user@uinsa.ac.id').toLowerCase().trim();
        vault[key] = updatedUser;
        if (updatedUser.id_user) vault[`id_${updatedUser.id_user}`] = updatedUser;
        await AsyncStorage.setItem('user_profiles_vault', JSON.stringify(vault));
      } catch (eVault) {}

      showCustomAlert({
        title: 'Profil Berhasil Disimpan!',
        message: 'Informasi dan foto profil kamu telah diperbarui dan tersimpan di server.',
        type: 'success',
        buttons: [{ text: 'Selesai', style: 'default', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      const serverMessage = e?.response?.data?.message;
      showCustomAlert({
        title: 'Gagal Menyimpan',
        message: serverMessage || 'Terjadi kesalahan saat menyimpan profil.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.card : '#FFFFFF'}
      />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backButton, isDark && { backgroundColor: '#334155' }]}
          onPress={() => navigation?.goBack?.()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveBadgeButton, isDark && { backgroundColor: '#064E3B' }]}
          activeOpacity={0.8}
          onPress={handleSaveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#10B981" />
          ) : (
            <Text style={[styles.saveBadgeText, isDark && { color: '#34D399' }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri: avatarUri || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.avatar}
              />
              <TouchableOpacity style={styles.cameraBadge} activeOpacity={0.85} onPress={handlePickAvatar}>
                <Feather name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formGroup}>
            {/* Nama */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Nama Lengkap</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Masukkan nama lengkap"
                placeholderTextColor="#94A3B8"
              />
            </View>

            {/* Email (tidak dapat diubah) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Email UINSA</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.textSecondary }]}
                value={email}
                editable={false}
                placeholder="nama@uinsa.ac.id"
                placeholderTextColor="#94A3B8"
              />
              <Text style={[styles.noteText, isDark && { color: colors.textSecondary }]}>
                Email tidak dapat diubah karena terhubung dengan akun login.
              </Text>
            </View>

            {/* Telepon */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Nomor WhatsApp / Telepon</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08123456789"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                maxLength={20}
              />
            </View>

            {/* Fakultas */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Fakultas</Text>
              <TouchableOpacity
                style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setFacultyModalVisible(true)}
              >
                <Text style={[styles.dropdownText, isDark && { color: colors.text }]}>
                  {selectedFakultas?.nama_fakultas || 'Pilih Fakultas'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? colors.textSecondary : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Prodi */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Program Studi</Text>
              <TouchableOpacity
                style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => selectedFakultas && setProgramModalVisible(true)}
              >
                <Text style={[styles.dropdownText, isDark && { color: colors.text }]}>
                  {selectedProdi?.nama_prodi || (selectedFakultas ? 'Pilih Program Studi' : 'Pilih fakultas terlebih dahulu')}
                </Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? colors.textSecondary : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Tombol simpan besar */}
            <TouchableOpacity style={styles.bigSaveButton} activeOpacity={0.85} onPress={handleSaveProfile} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.bigSaveButtonText}>Simpan Perubahan</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal Fakultas */}
      <Modal visible={facultyModalVisible} transparent animationType="slide" onRequestClose={() => setFacultyModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setFacultyModalVisible(false)}>
          <View style={[styles.modalContent, isDark && { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>Pilih Fakultas</Text>
              <TouchableOpacity onPress={() => setFacultyModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {fakultasList.map((f) => {
                const isSelected = selectedFakultas?.id_fakultas === f.id_fakultas;
                return (
                  <TouchableOpacity
                    key={f.id_fakultas}
                    style={[
                      styles.modalOption,
                      isDark && { borderBottomColor: colors.border },
                      isSelected && (isDark ? { backgroundColor: '#064E3B' } : styles.modalOptionActive),
                    ]}
                    onPress={() => handlePilihFakultas(f)}
                  >
                    <Text style={[styles.modalOptionText, isDark && { color: colors.text }, isSelected && styles.modalOptionTextActive]}>
                      {f.nama_fakultas}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#10B981" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Prodi */}
      <Modal visible={programModalVisible} transparent animationType="slide" onRequestClose={() => setProgramModalVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProgramModalVisible(false)}>
          <View style={[styles.modalContent, isDark && { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>Pilih Program Studi</Text>
                <Text style={[styles.modalSubTitle, isDark && { color: colors.textSecondary }]}>
                  {selectedFakultas?.nama_fakultas || ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setProgramModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {prodiList.map((p) => {
                const isSelected = selectedProdi?.id_prodi === p.id_prodi;
                return (
                  <TouchableOpacity
                    key={p.id_prodi}
                    style={[
                      styles.modalOption,
                      isDark && { borderBottomColor: colors.border },
                      isSelected && (isDark ? { backgroundColor: '#064E3B' } : styles.modalOptionActive),
                    ]}
                    onPress={() => {
                      setSelectedProdi(p);
                      setProgramModalVisible(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, isDark && { color: colors.text }, isSelected && styles.modalOptionTextActive]}>
                      {p.nama_prodi}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={18} color="#10B981" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', flex: 1, marginLeft: 14 },
  saveBadgeButton: {
    backgroundColor: '#E6FDF4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBadgeText: { fontSize: 14, fontWeight: '600', color: '#10B981' },
  bigSaveButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: 12,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  bigSaveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 20 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  formGroup: { gap: 16 },
  inputContainer: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#334155' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  inputDisabled: { backgroundColor: '#F8FAFC', color: '#94A3B8' },
  noteText: { fontSize: 11, color: '#94A3B8' },
  dropdownInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: { fontSize: 14, color: '#0F172A' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '65%',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  modalSubTitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionActive: { backgroundColor: '#ECFDF5', marginHorizontal: -8, paddingHorizontal: 8, borderRadius: 8 },
  modalOptionText: { fontSize: 14, color: '#334155' },
  modalOptionTextActive: { color: '#10B981', fontWeight: '600' },
});