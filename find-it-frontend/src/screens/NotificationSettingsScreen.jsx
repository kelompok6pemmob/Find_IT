import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [isPushEnabled, setIsPushEnabled] = useState(true);
  const [isChatEnabled, setIsChatEnabled] = useState(true);
  const [isClaimEnabled, setIsClaimEnabled] = useState(true);
  const [isPostEnabled, setIsPostEnabled] = useState(false);

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
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Pengaturan Notifikasi</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Master Push Toggle Card */}
        <View style={[styles.masterCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.masterHeader}>
            <View style={[styles.iconCircleGreen, isDark && { backgroundColor: '#064E3B' }]}>
              <Feather name="bell" size={20} color={isDark ? '#34D399' : '#047857'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.masterTitle, isDark && { color: colors.text }]}>Notifikasi push</Text>
              <Text style={[styles.masterSubtitle, isDark && { color: '#34D399' }]}>
                Semua aktivitas di perangkat
              </Text>
            </View>
            <Switch
              trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#10B981' }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
              onValueChange={() => setIsPushEnabled(!isPushEnabled)}
              value={isPushEnabled}
            />
          </View>
          <Text style={[styles.masterDescription, isDark && { color: colors.textSecondary }]}>
            Matikan untuk menghentikan semua push di perangkat. Notifikasi di aplikasi tetap tersedia.
          </Text>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Kategori push</Text>
          <Text style={[styles.sectionSubtitle, isDark && { color: colors.textSecondary }]}>Atur per kategori</Text>
        </View>

        {/* Category List Card */}
        <View style={[styles.categoryCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Pesan chat */}
          <View style={[styles.categoryItem, styles.itemBorder, isDark && { borderBottomColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
                <Feather name="message-square" size={18} color={isDark ? '#94A3B8' : '#475569'} />
              </View>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>Pesan chat</Text>
              <Switch
                trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                onValueChange={() => setIsChatEnabled(!isChatEnabled)}
                value={isChatEnabled}
                disabled={!isPushEnabled}
              />
            </View>
            <Text style={[styles.itemDescription, isDark && { color: colors.textSecondary }]}>
              Push instan untuk pesan langsung baru tentang barang hilang atau temuan.
            </Text>
          </View>

          {/* Aktivitas klaim */}
          <View style={[styles.categoryItem, styles.itemBorder, isDark && { borderBottomColor: colors.border }]}>
            <View style={styles.itemHeader}>
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
                <Feather name="clipboard" size={18} color={isDark ? '#94A3B8' : '#475569'} />
              </View>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>Aktivitas klaim</Text>
              <Switch
                trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                onValueChange={() => setIsClaimEnabled(!isClaimEnabled)}
                value={isClaimEnabled}
                disabled={!isPushEnabled}
              />
            </View>
            <Text style={[styles.itemDescription, isDark && { color: colors.textSecondary }]}>
              Klaim baru pada temuanmu dan pembaruan klaimmu: Pending, Diterima, atau Ditolak oleh penemu. Diterima bukan konfirmasi serah terima barang.
            </Text>
          </View>

          {/* Aktivitas postingan */}
          <View style={styles.categoryItem}>
            <View style={styles.itemHeader}>
              <View style={[styles.iconSquare, isDark && { backgroundColor: '#334155' }]}>
                <Feather name="file-text" size={18} color={isDark ? '#94A3B8' : '#475569'} />
              </View>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>Aktivitas postingan</Text>
              <Switch
                trackColor={{ false: isDark ? '#334155' : '#E2E8F0', true: '#10B981' }}
                thumbColor="#FFFFFF"
                ios_backgroundColor={isDark ? '#334155' : '#E2E8F0'}
                onValueChange={() => setIsPostEnabled(!isPostEnabled)}
                value={isPostEnabled}
                disabled={!isPushEnabled}
              />
            </View>
            <Text style={[styles.itemDescription, isDark && { color: colors.textSecondary }]}>
              Perubahan status postinganmu: Hilang, Ditemukan, atau Dikembalikan.
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            isDark && { backgroundColor: '#064E3B', borderColor: '#047857' },
          ]}
        >
          <Ionicons name="information-circle-outline" size={22} color={isDark ? '#34D399' : '#047857'} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoTitle, isDark && { color: '#34D399' }]}>Riwayat tetap tersimpan</Text>
            <Text style={[styles.infoDescription, isDark && { color: '#A7F3D0' }]}>
              Mematikan push atau kategori tidak menghapus notifikasi di aplikasi, riwayat chat, atau data aktivitas.
            </Text>
          </View>
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
  masterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  masterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
  masterTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  masterSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#047857',
    marginTop: 2,
  },
  masterDescription: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryItem: {
    paddingVertical: 16,
    gap: 8,
  },
  itemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconSquare: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  itemDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    paddingLeft: 48,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
});
