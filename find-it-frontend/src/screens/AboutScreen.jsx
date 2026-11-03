import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Linking,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { TERMS_AND_CONDITIONS, PRIVACY_POLICY } from '../constants/termsContent';
import { useTheme } from '../context/ThemeContext';

export default function AboutScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('terms');

  const openModal = (type) => {
    setModalType(type);
    setModalVisible(true);
  };

  const handleOpenRepo = () => {
    Linking.openURL('https://github.com/ersameiliana/Find_IT');
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
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Tentang FindIt</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* App Info Banner Card */}
        <View style={[styles.infoBannerCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.bannerHeader}>
            <Image
              source={require('../../assets/logo-find_it.png')}
              style={styles.appLogo}
              resizeMode="contain"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.appName, isDark && { color: colors.text }]}>FindIt</Text>
              <Text style={styles.appSubtitle}>Lost & Found UINSA</Text>
              <Text style={[styles.appVersion, isDark && { color: colors.textSecondary }]}>v1.0.0 • React Native / Expo</Text>
            </View>
          </View>
          <Text style={[styles.bannerDescription, isDark && { color: colors.textSecondary }]}>
            Menghubungkan penemu dan pemilik asli di UINSA melalui laporan barang hilang dan temuan terpusat, agar komunikasi lebih mudah.
          </Text>
        </View>

        {/* Section 1: Ketentuan & Privasi */}
        <View style={styles.sectionGroup}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Ketentuan & Privasi</Text>
          <View style={styles.menuContainer}>
            
            {/* Tombol Syarat Layanan memanggil Modal */}
            <TouchableOpacity
              style={[styles.menuCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => openModal('terms')}
            >
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#064E3B' }]}>
                <Feather name="file-text" size={20} color={isDark ? '#34D399' : '#10B981'} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={[styles.menuTitle, isDark && { color: colors.text }]}>Syarat Layanan</Text>
                <Text style={[styles.menuSubtitle, isDark && { color: colors.textSecondary }]}>
                  Perilaku pengguna & aturan verifikasi klaim.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>

            {/* Tombol Kebijakan Privasi memanggil Modal */}
            <TouchableOpacity
              style={[styles.menuCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => openModal('privacy')}
            >
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#064E3B' }]}>
                <Feather name="shield" size={20} color={isDark ? '#34D399' : '#10B981'} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={[styles.menuTitle, isDark && { color: colors.text }]}>Kebijakan Privasi</Text>
                <Text style={[styles.menuSubtitle, isDark && { color: colors.textSecondary }]}>
                  Perlindungan data & keamanan pengguna.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Proyek & Pengembang */}
        <View style={styles.sectionGroup}>
          <View style={styles.projectHeader}>
            <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Proyek & Pengembang</Text>
            <Text style={styles.projectMeta}>
              Kelompok 6 • Project-Based Learning (PjBL)
            </Text>
            <Text style={[styles.projectMetaSub, isDark && { color: colors.textSecondary }]}>
              Mata kuliah Mobile Programming
            </Text>
            <Text style={[styles.projectMetaSub, isDark && { color: colors.textSecondary }]}>
              UIN Sunan Ampel Surabaya (UINSA)
            </Text>
          </View>

          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={[styles.menuCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={handleOpenRepo}
            >
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#064E3B' }]}>
                <Feather name="code" size={20} color={isDark ? '#34D399' : '#10B981'} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={[styles.menuTitle, isDark && { color: colors.text }]}>Repositori Proyek</Text>
                <Text style={[styles.menuSubtitle, isDark && { color: colors.textSecondary }]}>
                  Kode sumber proyek FindIt di GitHub.
                </Text>
              </View>
              <Feather name="external-link" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.menuCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              activeOpacity={0.8}
              onPress={() => openModal('license')}
            >
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#064E3B' }]}>
                <Feather name="layers" size={20} color={isDark ? '#34D399' : '#10B981'} />
              </View>
              <View style={styles.menuTextContent}>
                <Text style={[styles.menuTitle, isDark && { color: colors.text }]}>Lisensi Open Source</Text>
                <Text style={[styles.menuSubtitle, isDark && { color: colors.textSecondary }]}>
                  Atribusi pustaka & paket UI React Native.
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Modal / Notif Pop-up untuk membaca aturan */}
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
                {modalType === 'terms' 
                  ? 'Syarat & Ketentuan' 
                  : modalType === 'privacy' 
                    ? 'Kebijakan Privasi' 
                    : 'Lisensi Open Source'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={isDark ? colors.text : '#0F172A'} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Text style={[styles.longText, isDark && { color: colors.textSecondary }]}>
                {modalType === 'terms' 
                  ? TERMS_AND_CONDITIONS 
                  : modalType === 'privacy' 
                    ? PRIVACY_POLICY 
                    : `FindIt dibangun dengan teknologi open source terdepan:\n\n• React Native\n• Expo SDK\n• React Navigation\n• Axios\n• AsyncStorage\n• Expo Vector Icons\n\nDidistribusikan di bawah lisensi MIT. Hak cipta milik masing-masing pemilik package.`}
              </Text>
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Tutup</Text>
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 20,
  },
  infoBannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  appLogo: {
    width: 65,
    height: 65,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  appSubtitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    marginTop: 2,
  },
  appVersion: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  bannerDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginTop: 4,
  },
  sectionGroup: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 4,
  },
  projectHeader: {
    gap: 4,
    marginBottom: 6,
    marginLeft: 4,
  },
  projectMeta: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981', 
  },
  projectMetaSub: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  menuContainer: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  iconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextContent: {
    flex: 1,
    gap: 4,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
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
