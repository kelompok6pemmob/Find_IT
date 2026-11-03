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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginUser } from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handler Submit Login (Real Backend API + Fallback Bypass)
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      showCustomAlert({
        title: 'Form Masuk Belum Lengkap',
        message: 'Silakan isi email kampus UINSA dan kata sandi kamu untuk masuk.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await loginUser({ email: email.trim(), password: password.trim() });
      if (response?.token) {
        await AsyncStorage.setItem('user_token', response.token);
        
        // Pulihkan kustomisasi profil lokal dari vault (nama, telepon, prodi, fakultas, foto_profil)
        const targetEmail = (response.user?.email || email).toLowerCase().trim();
        let vaultedProfile = {};
        try {
          const vaultRaw = await AsyncStorage.getItem('user_profiles_vault');
          const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
          vaultedProfile = vault[targetEmail] || (response.user?.id_user ? vault[`id_${response.user.id_user}`] : null) || {};
        } catch (eVault) {}

        const mergedUser = {
          ...vaultedProfile,
          ...response.user,
          nama: vaultedProfile.nama || response.user?.nama || 'Mahasiswa UINSA',
          fakultas: vaultedProfile.fakultas || 'Fak. Sains dan Teknologi',
          prodi: vaultedProfile.prodi || 'Sistem Informasi',
          telepon: vaultedProfile.telepon || '',
          foto_profil: vaultedProfile.foto_profil || response.user?.foto_profil || null,
        };
        await AsyncStorage.setItem('user_data', JSON.stringify(mergedUser));
        navigation.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        });
      } else {
        showCustomAlert({
          title: 'Gagal Memuat Sesi',
          message: 'Data otorisasi dari server belum valid. Silakan coba kembali sesaat lagi.',
          type: 'error',
        });
      }
    } catch (error) {
      const serverMessage = error?.response?.data?.message;
      if (serverMessage) {
        showCustomAlert({
          title: 'Gagal Masuk',
          message: serverMessage === 'Email/password salah' ? 'Email atau kata sandi yang kamu masukkan belum sesuai. Periksa kembali ya!' : serverMessage,
          type: 'error',
        });
      } else {
        showCustomAlert({
          title: 'Koneksi Server Belum Terhubung',
          message: 'Aplikasi tidak dapat menjangkau server FindIt. Pastikan server backend aktif dan terhubung di Wi-Fi yang sama ya!\n\nKamu juga bisa masuk langsung via Mode Eksplorasi.',
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

  // Handler Bypass Langsung ke Dashboard
  const handleBypass = async () => {
    const dummyEmail = 'nadia.azzh@uinsa.ac.id';
    let vaultedProfile = {};
    try {
      const vaultRaw = await AsyncStorage.getItem('user_profiles_vault');
      const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
      vaultedProfile = vault[dummyEmail] || {};
    } catch (eVault) {}

    const dummyUser = {
      nama: vaultedProfile.nama || 'Nadia Azzahra',
      email: dummyEmail,
      fakultas: vaultedProfile.fakultas || 'Fak. Sains dan Teknologi',
      prodi: vaultedProfile.prodi || 'Sistem Informasi',
      telepon: vaultedProfile.telepon || '',
      foto_profil: vaultedProfile.foto_profil || null,
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

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, isDark && { backgroundColor: '#334155' }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Login</Text>
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
          {/* Logo & Title */}
          <View style={styles.topSection}>
            <Image
              source={require('../../assets/logo-find_it.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.title, isDark && { color: colors.text }]}>Welcome back!</Text>
            <Text style={[styles.subtitle, isDark && { color: colors.textSecondary }]}>
              Login to UINSA Lost & Found to find your items and stay connected.
            </Text>
          </View>

          {/* Button Google */}
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

          {/* Divider */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, isDark && { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, isDark && { color: colors.textSecondary }]}>or login with email</Text>
            <View style={[styles.dividerLine, isDark && { backgroundColor: colors.border }]} />
          </View>

          {/* Form Inputs */}
          <View style={styles.form}>
            {/* Email */}
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

            {/* Password */}
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
                  placeholder="Enter your password"
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
            </View>

            {/* Forgot Password Link */}
            <TouchableOpacity
              style={styles.forgotContainer}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Login Button */}
            <TouchableOpacity
              style={styles.loginButton}
              activeOpacity={0.8}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Quick Bypass Button */}
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

            {/* Footer Register Link */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, isDark && { color: colors.textSecondary }]}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>Register</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#10B981',
  },
  loginButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginButtonText: {
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
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});
