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
import * as ImagePicker from 'expo-image-picker';
import { formatPhotoUrl } from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { UINSA_FAKULTAS_PRODI, UINSA_FAKULTAS_LIST } from '../constants/uinData';
import { useTheme } from '../context/ThemeContext';

export default function EditProfileScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [faculty, setFaculty] = useState('Fak. Sains dan Teknologi');
  const [studyProgram, setStudyProgram] = useState('Sistem Informasi');
  const [avatarUri, setAvatarUri] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal selector states
  const [facultyModalVisible, setFacultyModalVisible] = useState(false);
  const [programModalVisible, setProgramModalVisible] = useState(false);

  // Ambil data user dari AsyncStorage saat load
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const savedUserData = await AsyncStorage.getItem('user_data');
        if (savedUserData) {
          const user = JSON.parse(savedUserData);
          if (user.nama) setFullName(user.nama);
          if (user.email) setEmail(user.email);
          if (user.telepon) setPhoneNumber(user.telepon);

          const userFaculty = user.fakultas || 'Fak. Sains dan Teknologi';
          setFaculty(userFaculty);

          const availableProdis = UINSA_FAKULTAS_PRODI[userFaculty] || [];
          if (user.prodi && availableProdis.includes(user.prodi)) {
            setStudyProgram(user.prodi);
          } else if (availableProdis.length > 0) {
            setStudyProgram(availableProdis[0]);
          }

          if (user.foto_profil) {
            setAvatarUri(formatPhotoUrl(user.foto_profil));
          }
        }
      } catch (e) {
        console.error('Gagal memuat profil:', e);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Pilih Foto Profil Baru
  const handlePickAvatar = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      showCustomAlert({
        title: 'Izin Akses Galeri',
        message: 'Izin akses galeri dibutuhkan untuk mengganti foto profil kamu.',
        type: 'warning',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  // Simpan Perubahan Profil
  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      showCustomAlert({
        title: 'Nama Lengkap Wajib Diisi',
        message: 'Mohon isi nama lengkapmu agar akunmu mudah dikenali teman kampus.',
        type: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      const savedUserData = await AsyncStorage.getItem('user_data');
      let currentUser = savedUserData ? JSON.parse(savedUserData) : {};

      const updatedUser = {
        ...currentUser,
        nama: fullName.trim(),
        email: email.trim(),
        telepon: phoneNumber.trim(),
        fakultas: faculty,
        prodi: studyProgram,
        foto_profil: avatarUri,
      };

      await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));

      // Cadangkan ke brankas profil lokal agar tetap utuh saat logout
      try {
        const vaultRaw = await AsyncStorage.getItem('user_profiles_vault');
        const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
        const key = (updatedUser.email || 'user@uinsa.ac.id').toLowerCase().trim();
        vault[key] = updatedUser;
        if (updatedUser.id_user) {
          vault[`id_${updatedUser.id_user}`] = updatedUser;
        }
        await AsyncStorage.setItem('user_profiles_vault', JSON.stringify(vault));
      } catch (errVault) {
        console.error('Gagal mencadangkan profil ke vault:', errVault);
      }

      showCustomAlert({
        title: 'Profil Berhasil Disimpan!',
        message: 'Informasi dan foto profil kamu telah berhasil diperbarui.',
        type: 'success',
        buttons: [{ text: 'Selesai', style: 'default', onPress: () => navigation.goBack() }],
      });
    } catch (e) {
      showCustomAlert({ title: 'Gagal Menyimpan', message: 'Terjadi kesalahan saat menyimpan profil.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const currentProgramList = UINSA_FAKULTAS_PRODI[faculty] || [];

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
          style={[styles.backButton, isDark && { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrapper}>
              <Image
                source={{
                  uri:
                    avatarUri || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=400&auto=format&fit=crop',
                }}
                style={styles.avatar}
              />
              <TouchableOpacity
                style={styles.cameraBadge}
                activeOpacity={0.85}
                onPress={handlePickAvatar}
              >
                <Feather name="camera" size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            {/* 1. Full Name */}
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

            {/* 2. Email */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Email UINSA</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={email}
                onChangeText={setEmail}
                placeholder="nama@uinsa.ac.id"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 3. Phone Number */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Nomor WhatsApp / Telepon</Text>
              <TextInput
                style={[styles.input, isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="08123456789"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>

            {/* 4. Faculty Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Fakultas</Text>
              <TouchableOpacity
                style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setFacultyModalVisible(true)}
              >
                <Text style={[styles.dropdownText, isDark && { color: colors.text }]}>{faculty}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? colors.textSecondary : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* 5. Study Program Dropdown */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Program Studi</Text>
              <TouchableOpacity
                style={[styles.dropdownInput, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
                onPress={() => setProgramModalVisible(true)}
              >
                <Text style={[styles.dropdownText, isDark && { color: colors.text }]}>{studyProgram}</Text>
                <Ionicons name="chevron-down" size={20} color={isDark ? colors.textSecondary : '#475569'} />
              </TouchableOpacity>
            </View>

            {/* Tombol Simpan Besar di Bawah Form */}
            <TouchableOpacity
              style={styles.bigSaveButton}
              activeOpacity={0.85}
              onPress={handleSaveProfile}
              disabled={saving}
            >
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

      {/* Modal Selection Faculty */}
      <Modal
        visible={facultyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFacultyModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFacultyModalVisible(false)}
        >
          <View style={[styles.modalContent, isDark && { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>Pilih Fakultas</Text>
              <TouchableOpacity onPress={() => setFacultyModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {UINSA_FAKULTAS_LIST.map((item, index) => {
                const isSelected = item === faculty;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalOption,
                      isDark && { borderBottomColor: colors.border },
                      isSelected && (isDark ? { backgroundColor: '#064E3B' } : styles.modalOptionActive),
                    ]}
                    onPress={() => {
                      setFaculty(item);
                      const prodis = UINSA_FAKULTAS_PRODI[item] || [];
                      if (prodis.length > 0) {
                        setStudyProgram(prodis[0]);
                      }
                      setFacultyModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isDark && { color: colors.text },
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Selection Study Program */}
      <Modal
        visible={programModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProgramModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProgramModalVisible(false)}
        >
          <View style={[styles.modalContent, isDark && { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>Pilih Program Studi</Text>
                <Text style={[styles.modalSubTitle, isDark && { color: colors.textSecondary }]}>{faculty}</Text>
              </View>
              <TouchableOpacity onPress={() => setProgramModalVisible(false)}>
                <Ionicons name="close" size={22} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {currentProgramList.map((item, index) => {
                const isSelected = item === studyProgram;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.modalOption,
                      isDark && { borderBottomColor: colors.border },
                      isSelected && (isDark ? { backgroundColor: '#064E3B' } : styles.modalOptionActive),
                    ]}
                    onPress={() => {
                      setStudyProgram(item);
                      setProgramModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        isDark && { color: colors.text },
                        isSelected && styles.modalOptionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={18} color="#10B981" />
                    )}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    height: 52,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
    marginLeft: 14,
  },
  saveBadgeButton: {
    backgroundColor: '#E6FDF4',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 62,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
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
  bigSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
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
  formGroup: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
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
  dropdownText: {
    fontSize: 14,
    color: '#0F172A',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalSubTitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  modalOptionActive: {
    backgroundColor: '#ECFDF5',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#334155',
  },
  modalOptionTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
});
