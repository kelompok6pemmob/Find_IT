import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { updateStatusKlaim, formatPhotoUrl, formatKejadianDate } from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

export default function ReviewClaimScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const { klaim, item } = route.params || {};

  const [statusKlaim, setStatusKlaim] = useState(klaim?.status_klaim || 'Pending');
  const [processing, setProcessing] = useState(false);

  if (!klaim) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#64748B' }}>Data klaim tidak ditemukan</Text>
      </View>
    );
  }

  const isPending = statusKlaim === 'Pending';
  const isDiterima = statusKlaim === 'Diterima';

  // Fungsi buka chat dengan pengklaim (dipakai di 2 tempat)
  const bukaChatDenganPengklaim = () => {
    navigation.replace('DirectChat', {
      id_barang: item?.id_barang || klaim.id_barang,
      id_penerima: klaim.id_user, // ID PENGKLAIM, bukan diri sendiri
      nama_penerima: klaim.nama_pengklaim,
      item: item,
      role: 'finder',
    });
  };

  const handleDecision = async (keputusan) => {
    showCustomAlert({
      title: keputusan === 'Diterima' ? 'Terima Klaim?' : 'Tolak Klaim?',
      message: keputusan === 'Diterima'
        ? 'Barang akan otomatis ditandai sebagai Dikembalikan. Anda dapat langsung chat dengan pengklaim untuk koordinasi serah terima.'
        : 'Pengklaim akan diberi tahu bahwa klaimnya ditolak.',
      type: keputusan === 'Diterima' ? 'success' : 'warning',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: keputusan === 'Diterima' ? 'Terima & Buka Chat' : 'Ya, Tolak',
          style: 'default',
          onPress: async () => {
            setProcessing(true);
            try {
              await updateStatusKlaim(klaim.id_klaim, keputusan);
              setStatusKlaim(keputusan);
              if (keputusan === 'Diterima') {
                showCustomAlert({
                  title: 'Klaim Diterima!',
                  message: `Status barang otomatis berubah menjadi Dikembalikan. Silakan hubungi ${klaim.nama_pengklaim} untuk koordinasi serah terima.`,
                  type: 'success',
                  buttons: [
                    {
                      text: 'Nanti Saja',
                      style: 'cancel',
                      onPress: () => navigation.goBack(),
                    },
                    {
                      text: 'Buka Chat Sekarang',
                      style: 'default',
                      onPress: bukaChatDenganPengklaim,
                    },
                  ],
                });
              } else {
                showCustomAlert({
                  title: 'Klaim Ditolak',
                  message: 'Pengklaim telah diberi tahu.',
                  type: 'info',
                  buttons: [{ text: 'OK', style: 'default', onPress: () => navigation.goBack() }],
                });
              }
            } catch (err) {
              showCustomAlert({
                title: 'Gagal Memutuskan Klaim',
                message: err?.response?.data?.message || 'Terjadi kesalahan.',
                type: 'error',
              });
            } finally {
              setProcessing(false);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Tinjau Klaim</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Info Barang */}
        {item && (
          <View style={[styles.itemCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Image
              source={{ uri: formatPhotoUrl(item.foto_utama || item.foto?.[0]?.foto_url) || 'https://via.placeholder.com/150' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemTag}>Laporan terkait</Text>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>{item.judul}</Text>
              <Text style={styles.itemMeta}>{item.lokasi}</Text>
            </View>
          </View>
        )}

        {/* Profile Pengklaim */}
        <View style={[styles.profileCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{ uri: formatPhotoUrl(klaim.foto_pengklaim) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200' }}
            style={styles.profileAvatar}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, isDark && { color: colors.text }]}>{klaim.nama_pengklaim}</Text>
            <Text style={[styles.profileTime, isDark && { color: colors.textSecondary }]}>
              Mengajukan klaim pada {formatKejadianDate(klaim.waktu_klaim || klaim.created_at)}
            </Text>
          </View>
        </View>

        {/* Bukti Kepemilikan */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Bukti Kepemilikan</Text>
          {klaim.bukti_kepemilikan ? (
            <Image
              source={{ uri: formatPhotoUrl(klaim.bukti_kepemilikan) }}
              style={styles.buktiImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.noBuktiBox, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="image" size={24} color="#94A3B8" />
              <Text style={[styles.noBuktiText, isDark && { color: colors.textSecondary }]}>Tidak ada bukti foto terlampir</Text>
            </View>
          )}
        </View>

        {/* Alasan Klaim */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Penjelasan Kepemilikan</Text>
          <View style={[styles.alasanBox, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.alasanText, isDark && { color: colors.text }]}>{klaim.alasan_klaim}</Text>
          </View>
        </View>

        {/* Nomor Telepon Jaminan */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Nomor Telepon Jaminan</Text>
          {isDiterima ? (
            <View style={[styles.phoneBox, isDark && { backgroundColor: '#064E3B', borderColor: '#047857' }]}>
              <Ionicons name="call-outline" size={20} color={isDark ? '#34D399' : '#047857'} />
              <Text style={styles.phoneText}>{klaim.nomor_telepon_jaminan || '-'}</Text>
            </View>
          ) : (
            <View style={[styles.phoneLockedBox, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={20} color="#94A3B8" />
              <Text style={[styles.phoneLockedText, isDark && { color: colors.textSecondary }]}>
                Nomor telepon akan terbuka setelah Anda menerima klaim ini.
              </Text>
            </View>
          )}
        </View>

        {/* Status Akhir */}
        {!isPending && (
          <View style={[
            styles.finalStatusBox,
            isDiterima ? styles.finalDiterima : styles.finalDitolak,
          ]}>
            <Ionicons name={isDiterima ? 'checkmark-circle' : 'close-circle'} size={24} color={isDiterima ? '#047857' : '#DC2626'} />
            <Text style={[styles.finalStatusText, isDiterima ? { color: '#047857' } : { color: '#DC2626' }]}>
              Klaim telah {statusKlaim.toLowerCase()}
            </Text>
          </View>
        )}

        {/* Tombol Chat Pengklaim (muncul setelah diterima) */}
        {isDiterima && (
          <TouchableOpacity
            style={styles.chatAfterAcceptedButton}
            activeOpacity={0.85}
            onPress={bukaChatDenganPengklaim}
          >
            <Ionicons name="chatbubble-ellipses" size={20} color="#FFFFFF" />
            <Text style={styles.chatAfterAcceptedText}>
              Chat dengan {klaim.nama_pengklaim}
            </Text>
          </TouchableOpacity>
        )}

        {/* Action Buttons (hanya saat pending) */}
        {isPending && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.tolakButton]}
              onPress={() => handleDecision('Ditolak')}
              disabled={processing}
            >
              {processing ? <ActivityIndicator color="#DC2626" /> : (
                <>
                  <Ionicons name="close-circle-outline" size={20} color="#DC2626" />
                  <Text style={styles.tolakText}>Tolak</Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.terimaButton]}
              onPress={() => handleDecision('Diterima')}
              disabled={processing}
            >
              {processing ? <ActivityIndicator color="#FFFFFF" /> : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.terimaText}>Terima</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerRightPlaceholder: { width: 36 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 12 },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 16 },
  itemImage: { width: 64, height: 64, borderRadius: 12, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTag: { fontSize: 12, color: '#10B981', fontWeight: '600', marginBottom: 2 },
  itemTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#64748B' },
  profileCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 20, gap: 12 },
  profileAvatar: { width: 56, height: 56, borderRadius: 28 },
  profileName: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  profileTime: { fontSize: 12, color: '#64748B' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  buktiImage: { width: '100%', height: 220, borderRadius: 12, backgroundColor: '#F1F5F9' },
  noBuktiBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed', gap: 8 },
  noBuktiText: { fontSize: 13, color: '#94A3B8' },
  alasanBox: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  alasanText: { fontSize: 14, color: '#0F172A', lineHeight: 22 },
  phoneBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#10B981', gap: 12 },
  phoneText: { fontSize: 18, fontWeight: '700', color: '#047857', flex: 1 },
  phoneLockedBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 10 },
  phoneLockedText: { fontSize: 13, color: '#64748B', flex: 1, fontStyle: 'italic' },
  finalStatusBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, padding: 14, gap: 8, marginBottom: 16 },
  finalDiterima: { backgroundColor: '#D1FAE5' },
  finalDitolak: { backgroundColor: '#FEE2E2' },
  finalStatusText: { fontSize: 15, fontWeight: '700' },
  chatAfterAcceptedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    paddingVertical: 14,
    borderRadius: 999,
    gap: 8,
    marginTop: 4,
    marginBottom: 8,
  },
  chatAfterAcceptedText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 999, gap: 6 },
  tolakButton: { backgroundColor: '#FEE2E2' },
  tolakText: { color: '#DC2626', fontSize: 15, fontWeight: '700' },
  terimaButton: { backgroundColor: '#10B981' },
  terimaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});