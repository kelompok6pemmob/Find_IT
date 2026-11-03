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
import { Ionicons } from '@expo/vector-icons';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

export default function ForgotPasswordScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResetPassword = () => {
    if (!email.trim()) {
      showCustomAlert({ title: 'Email Belum Diisi', message: 'Mohon masukkan alamat email kampus UINSA kamu.', type: 'warning' });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showCustomAlert({
        title: 'Tautan Terkirim',
        message: `Instruksi pemulihan kata sandi telah dikirim ke ${email}. Silakan periksa kotak masuk atau spam email Anda.`,
        type: 'success',
        buttons: [
          {
            text: 'Kembali ke Login',
            onPress: () => navigation.navigate('Login'),
          },
        ],
      });
    }, 800);
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
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Lupa Password</Text>
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
            <Text style={[styles.title, isDark && { color: colors.text }]}>Atur Ulang Password</Text>
            <Text style={[styles.subtitle, isDark && { color: colors.textSecondary }]}>
              Masukkan alamat email UINSA yang terdaftar untuk menerima tautan pemulihan kata sandi.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, isDark && { color: colors.text }]}>Email Akademik UINSA</Text>
              <TextInput
                style={[
                  styles.input,
                  isDark && { backgroundColor: colors.card, borderColor: colors.border, color: colors.text },
                ]}
                placeholder="nama@uinsa.ac.id"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Send Reset Link Button */}
            <TouchableOpacity
              style={styles.resetButton}
              activeOpacity={0.8}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.resetButtonText}>Kirim Tautan Pemulihan</Text>
              )}
            </TouchableOpacity>

            {/* Back to Login */}
            <View style={styles.footerContainer}>
              <Text style={[styles.footerText, isDark && { color: colors.textSecondary }]}>Ingat password Anda? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
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
    marginTop: 20,
    marginBottom: 32,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#10B981',
    height: 48,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
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
});
