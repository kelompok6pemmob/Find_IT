import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
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
import { registerUser } from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../constants/termsContent';
import { useTheme } from '../context/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('terms');

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showCustomAlert({
        title: 'Lengkapi Data Diri',
        message: 'Mohon isi nama lengkap, email kampus UINSA, dan kata sandi kamu.',
        type: 'warning',
      });
      return;
    }

    if (password.length < 8) {
      showCustomAlert({
        title: 'Kata Sandi Kurang Kuat',
        message: 'Demi keamanan akunmu, buat kata sandi minimal 8 karakter ya.',
        type: 'warning',
      });
      return;
    }

    if (password !== confirmPassword) {
      showCustomAlert({
        title: 'Konfirmasi Sandi Berbeda',
        message: 'Kata sandi dan konfirmasi kata sandi yang kamu masukkan belum sama persis.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      await registerUser({
        nama: fullName.trim(),
        email: email.trim(),
        password: password.trim(),
      });

      showCustomAlert({
        title: 'Akun Berhasil Didaftarkan!',
        message: 'Selamat datang di FindIt UINSA. Akunmu sudah aktif, silakan masuk dengan email dan kata sandimu.',
        type: 'success',
        buttons: [
          {
            text: 'Masuk Sekarang',
            style: 'default',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      });
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        showCustomAlert({
          title: 'Registrasi Belum Berhasil',
          message: serverMessage === 'Email sudah terdaftar' ? 'Alamat email UINSA ini sudah memiliki akun. Silakan langsung masuk di menu Login.' : serverMessage,
          type: 'error',
        });
      } else {
        showCustomAlert({
          title: 'Koneksi Server Belum Terhubung',
          message: 'Server backend belum dapat dihubungi. Pastikan server di laptop sudah aktif.\n\nKamu juga bisa langsung masuk via Mode Eksplorasi.',
          type: 'warning',
          buttons: [
            { text: 'Batal', style: 'cancel' },
            { text: 'Mode Eksplorasi', style: 'default', onPress: handleBypass },
          ],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBypass = async () => {
    const dummyUser = {
      nama: 'Nadia Azzahra',
      email: 'nadia.azzh@uinsa.ac.id',
      foto_profil: null,
    };
    await AsyncStorage.setItem('user_token', 'dummy_bypass_token_123');
    await AsyncStorage.setItem('user_data', JSON.stringify(dummyUser));
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.background : '#ffffff'}
      />

      <View style={[styles.header, isDark && { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, isDark && { backgroundColor: '#334155' }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Register</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/logo-find_it.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, isDark && { color: colors.text }]}>Create your account</Text>
            <Text style={[styles.subtitle, isDark && { color: colors.textSecondary }]}>
              Join UINSA Lost & Found and help reconnect items with their owners.
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.googleButton, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
            onPress={handleBypass}
          >
            <Image
              source={require('../../assets/google.png')}
              style={styles.googleIcon}
            />
            <Text style={[styles.googleText, isDark && { color: colors.text }]}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, isDark && { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, isDark && { color: colors.textSecondary }]}>or register with email</Text>
            <View style={[styles.dividerLine, isDark && { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="Enter your full name"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Email</Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="name@uinsa.ac.id"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  isDark && { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, isDark && { color: colors.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.helperText, isDark && { color: colors.textSecondary }]}>Use at least 8 characters.</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Confirm Password</Text>
              <View
                style={[
                  styles.passwordContainer,
                  isDark && { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <TextInput
                  style={[styles.passwordInput, isDark && { color: colors.text }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Feather
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={18}
                    color={isDark ? '#94A3B8' : '#64748B'}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <Text style={[styles.termsText, isDark && { color: colors.textSecondary }]}>
              By registering, you agree to our{' '}
              <Text style={styles.linkText} onPress={() => openModal('terms')}>
                Terms & Conditions
              </Text>{' '}
              and{' '}
              <Text style={styles.linkText} onPress={() => openModal('privacy')}>
                Privacy Policy
              </Text>
              .
            </Text>

            <TouchableOpacity
              style={styles.registerButton}
              activeOpacity={0.8}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>Register</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.quickBypassButton,
                isDark && { backgroundColor: '#064E3B', borderColor: '#047857' },
              ]}
              activeOpacity={0.8}
              onPress={handleBypass}
            >
              <Ionicons name="flash-outline" size={16} color={isDark ? '#34D399' : '#047857'} style={{ marginRight: 6 }} />
              <Text style={[styles.quickBypassText, isDark && { color: '#34D399' }]}>Bypass Langsung ke Dashboard</Text>
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, isDark && { color: colors.textSecondary }]}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, isDark && { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, isDark && { color: colors.text }]}>
                {modalType === 'terms' ? 'Syarat & Ketentuan' : 'Kebijakan Privasi'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={[styles.longText, isDark && { color: colors.textSecondary }]}>
                {modalType === 'terms' ? TERMS_AND_CONDITIONS : PRIVACY_POLICY}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Saya Mengerti</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
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
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 12,
    color: '#94A3B8',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
  },
  eyeIcon: {
    padding: 4,
  },
  helperText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  termsText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  linkText: {
    color: '#10B981',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  quickBypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 12,
    borderRadius: 9999,
  },
  quickBypassText: {
    color: '#047857',
    fontSize: 14,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalScrollView: {
    flex: 1,
    marginBottom: 20,
  },
  longText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 22,
    textAlign: 'justify',
  },
  closeButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
