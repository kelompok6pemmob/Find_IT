import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function AccountSecurityScreen({ navigation }) {
  const { isDark, colors } = useTheme();

  const handleOpenGoogleAccount = () => {
    Linking.openURL('https://myaccount.google.com');
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
          style={[styles.backButton, isDark && { backgroundColor: '#334155' }]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Keamanan Akun</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Auth Info Card */}
        <View style={[styles.mainInfoCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconCircleGreen, isDark && { backgroundColor: '#064E3B' }]}>
            <Feather name="log-in" size={20} color={isDark ? '#34D399' : '#047857'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.mainTitle, isDark && { color: colors.text }]}>Masuk melalui Google</Text>
            <Text style={[styles.mainSubtitle, isDark && { color: '#34D399' }]}>Autentikasi Google OAuth</Text>
          </View>
          <Text style={[styles.mainDescription, isDark && { color: colors.textSecondary }]}>
            FindIt hanya menggunakan Google untuk masuk. Pengaturan keamanan dikelola di Akun Google, bukan di aplikasi ini.
          </Text>
        </View>

        {/* Section Title */}
        <Text style={[styles.sectionLabel, isDark && { color: colors.text }]}>Dikelola di Akun Google</Text>

        {/* Google Management List Card */}
        <View style={[styles.listCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Item 1: Password & 2FA */}
          <View style={[styles.listItem, styles.listItemBorder, isDark && { borderBottomColor: colors.border }]}>
            <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
              <Feather name="key" size={18} color={isDark ? '#94A3B8' : '#475569'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>Kata sandi & verifikasi 2 langkah</Text>
              <Text style={[styles.itemDescription, isDark && { color: colors.textSecondary }]}>
                Ubah kata sandi dan atur autentikasi dua faktor (2FA) di Akun Google, bukan di FindIt.
              </Text>
            </View>
          </View>

          {/* Item 2: Primary Email */}
          <View style={styles.listItem}>
            <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
              <Feather name="mail" size={18} color={isDark ? '#94A3B8' : '#475569'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>Email utama</Text>
              <Text style={[styles.itemDescription, isDark && { color: colors.textSecondary }]}>
                Email mengikuti profil Google yang terhubung. Perubahan email dilakukan di pengaturan Akun Google.
              </Text>
            </View>
          </View>
        </View>

        {/* Info Box Session */}
        <View
          style={[
            styles.sessionInfoBox,
            isDark && { backgroundColor: '#064E3B', borderColor: '#047857' },
          ]}
        >
          <Ionicons name="information-circle-outline" size={22} color={isDark ? '#34D399' : '#047857'} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.sessionTitle, isDark && { color: '#34D399' }]}>Sesi masuk di FindIt</Text>
            <Text style={[styles.sessionDescription, isDark && { color: '#A7F3D0' }]}>
              Pelacakan sesi multi-perangkat belum tersedia di FindIt. Validitas sesi diperiksa melalui token autentikasi Google.
            </Text>
          </View>
        </View>

        {/* Google External Button */}
        <View style={styles.actionWrapper}>
          <TouchableOpacity
            style={styles.googleAccountButton}
            activeOpacity={0.85}
            onPress={handleOpenGoogleAccount}
          >
            <Text style={styles.googleAccountButtonText}>
              Buka Pengaturan Akun Google
            </Text>
            <Feather name="external-link" size={18} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={[styles.subtextUrl, isDark && { color: colors.textSecondary }]}>Di luar FindIt • myaccount.google.com</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
    gap: 16,
  },
  mainInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  iconCircleGreen: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  mainSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 2,
  },
  mainDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 4,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  listItem: {
    flexDirection: 'row',
    paddingVertical: 16,
    gap: 14,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  sessionInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  sessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
  actionWrapper: {
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  googleAccountButton: {
    width: '100%',
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
  },
  googleAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  subtextUrl: {
    fontSize: 12,
    color: '#64748B',
  },
});
