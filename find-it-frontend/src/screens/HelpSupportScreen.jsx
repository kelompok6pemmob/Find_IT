import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

const HELP_OPTIONS = [
  {
    id: '1',
    title: 'FAQ',
    subtitle: 'Jawaban cepat untuk pelaporan, klaim, dan akun.',
    icon: 'file-text',
  },
  {
    id: '2',
    title: 'Report',
    subtitle: 'Laporkan postingan mencurigakan, klaim palsu, atau perilaku tidak pantas.',
    icon: 'alert-circle',
  },
  {
    id: '3',
    title: 'Guidance',
    subtitle: 'Tips serah terima aman di kampus, verifikasi, dan perlindungan data.',
    icon: 'map-pin',
  },
  {
    id: '4',
    title: 'Help',
    subtitle: 'Hubungi admin untuk kendala teknis, akun, atau bantuan lanjutan.',
    icon: 'headphones',
  },
];

export default function HelpSupportScreen({ navigation }) {
  const { isDark, colors } = useTheme();

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
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Bantuan & Dukungan</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Banner Greeting Box */}
        <View
          style={[
            styles.greetingCard,
            isDark && { backgroundColor: '#064E3B', borderColor: '#047857', borderWidth: 1 },
          ]}
        >
          <View style={[styles.iconCircleHeader, isDark && { backgroundColor: '#047857' }]}>
            <Feather name="help-circle" size={20} color={isDark ? '#34D399' : '#047857'} />
          </View>
          <Text style={[styles.greetingTitle, isDark && { color: '#34D399' }]}>
            Ada yang bisa kami bantu?
          </Text>
          <Text style={[styles.greetingSubtitle, isDark && { color: '#A7F3D0' }]}>
            Panduan barang hilang, klaim, dan serah terima di lingkungan UINSA.
          </Text>
        </View>

        {/* Support Options List */}
        <View style={styles.optionsContainer}>
          {HELP_OPTIONS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.optionCard,
                isDark && { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                if (item.id === '1') {
                  showCustomAlert({
                    title: 'FAQ - Pertanyaan Umum',
                    message: '1. Bagaimana cara melaporkan barang hilang?\nBuka tab navigasi tengah, pilih "Saya Kehilangan".\n\n2. Bagaimana cara mengklaim barang?\nBuka detail barang yang ditemukan, lalu tap tombol "Klaim".\n\n3. Apakah data saya aman?\nYa, FindIt menggunakan otentikasi resmi kampus UINSA.',
                    type: 'info',
                  });
                } else if (item.id === '2') {
                  showCustomAlert({
                    title: 'Laporkan Kendala / Konten',
                    message: 'Jika kamu menemukan postingan mencurigakan atau klaim palsu, laporkan langsung ke admin via email: admin-findit@uinsa.ac.id',
                    type: 'warning',
                  });
                } else if (item.id === '3') {
                  showCustomAlert({
                    title: 'Panduan Serah Terima Aman',
                    message: '1. Bertemu di area kampus yang ramai (Gedung SAC, Perpustakaan, Masjid Kampus).\n2. Cocokkan identitas KTM penerima sebelum menyerahkan barang.\n3. Ubah status barang menjadi "Dikembalikan" setelah selesai.',
                    type: 'success',
                  });
                } else if (item.id === '4') {
                  showCustomAlert({
                    title: 'Hubungi Tim FindIt',
                    message: 'Email: admin-findit@uinsa.ac.id\nJam Layanan: Senin - Jumat, 08:00 - 16:00 WIB\nTim kami siap membantu kendala kamu.',
                    type: 'info',
                  });
                }
              }}
            >
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
                <Feather name={item.icon} size={20} color={isDark ? '#34D399' : '#047857'} />
              </View>

              <View style={styles.optionTextContent}>
                <Text style={[styles.optionTitle, isDark && { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.optionSubtitle, isDark && { color: colors.textSecondary }]}>{item.subtitle}</Text>
              </View>

              <Feather name="chevron-right" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          ))}
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
  greetingCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  iconCircleHeader: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#047857',
  },
  greetingSubtitle: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 18,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextContent: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});
