import React, { useState } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import { updateStatusKlaim, formatPhotoUrl } from'../services/finditService';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';

const DEFAULT_REVIEW_CLAIM = {
  id_klaim: 101,
  id_barang: 1,
  judul:'Wallet Hitam Pedro',
  lokasi:'Perpustakaan UINSA',
  tanggal:'02 Mei 2025 • 14:30',
  nama_pengklaim:'Rizky Maulana',
  status_klaim:'Pending',
  alasan_klaim:'Dompet hitam Pedro ini milik saya. Di dalamnya terdapat identitas atas nama saya. Foto bukti terlampir.',
  bukti_kepemilikan:'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=600&auto=format&fit=crop',
  foto_url:'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=200&auto=format&fit=crop',
};

export default function ReviewClaimScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const { claim: paramClaim } = route.params || {};
  const activeClaim = paramClaim || DEFAULT_REVIEW_CLAIM;
  const [submitting, setSubmitting] = useState(false);

  const itemPhotoUrl = formatPhotoUrl(activeClaim.foto_url);
  const proofPhotoUrl = formatPhotoUrl(activeClaim.bukti_kepemilikan);

  const handleUpdateStatus = (decision) => {
    const isApprove = decision ==='Diterima';
    showCustomAlert({
      title: isApprove ?'Setujui Klaim Kepemilikan?' :'Tolak Pengajuan Klaim?',
      message: isApprove
        ?'Dengan menyetujui, kamu mengonfirmasi bahwa bukti sudah sesuai. Status barang akan otomatis ditandai Dikembalikan.'
        :'Apakah kamu yakin ingin menolak klaim ini karena bukti belum memenuhi kecocokan?',
      type: isApprove ?'success' :'warning',
      buttons: [
        { text:'Kembali', style:'cancel' },
        {
          text: isApprove ?'Setujui & Hubungi' :'Ya, Tolak',
          style: isApprove ?'default' :'destructive',
          onPress: async () => {
            setSubmitting(true);
            try {
              if (activeClaim.id_klaim) {
                await updateStatusKlaim(activeClaim.id_klaim, decision);
              }
              showCustomAlert({
                title: isApprove ?'Klaim Berhasil Disetujui!' :'Klaim Telah Ditolak',
                message: isApprove
                  ?'Status barang telah menjadi Dikembalikan. Silakan koordinasikan waktu dan tempat serah terima melalui chat.'
                  :'Pengajuan klaim telah ditolak.',
                type: isApprove ?'success' :'info',
                buttons: [
                  {
                    text:'Lanjut',
                    style:'default',
                    onPress: () => {
                      if (isApprove) {
                        navigation.navigate('DirectChat', {
                          id_barang: activeClaim.id_barang,
                          role:'finder',
                          claimStatus:'approved',
                        });
                      } else {
                        navigation.goBack();
                      }
                    },
                  },
                ],
              });
            } catch (error) {
              const serverMessage = error?.response?.data?.message;
              showCustomAlert({
                title:'Kendala Proses',
                message: serverMessage ||'Tidak dapat terhubung ke server. Perubahan status disimulasikan.',
                type: serverMessage ?'error' :'warning',
                buttons: [{ text:'Mengerti', style:'default', onPress: () => navigation.goBack() }],
              });
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tinjau Klaim Barang</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card Context Item */}
        <View style={[styles.itemCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{
              uri:
                itemPhotoUrl ||'https://via.placeholder.com/200?text=No+Photo',
            }}
            style={styles.itemImage}
          />
          <View style={styles.itemInfo}>
            <Text style={styles.itemTag}>Barang yang diklaim</Text>
            <Text style={styles.itemTitle}>{activeClaim.judul ||'Barang'}</Text>
            <Text style={styles.itemMeta}>{activeClaim.lokasi ||'UINSA'}</Text>
            <Text style={styles.itemMeta}>{activeClaim.tanggal ||'-'}</Text>
          </View>
          <View style={styles.foundBadge}>
            <Text style={styles.foundBadgeText}>FOUND</Text>
          </View>
        </View>

        {/* Status Pill & Context */}
        <View style={styles.statusPillRow}>
          <View style={styles.pendingPill}>
            <Feather name="clock" size={13} color="#92400E" />
            <Text style={styles.pendingPillText}>
              Status: {activeClaim.status_klaim ||'Pending'}
            </Text>
          </View>
        </View>
        <Text style={styles.reviewContextText}>
          Tinjau pengajuan klaim kepemilikan dari mahasiswa
        </Text>

        {/* Details List */}
        <View style={styles.detailsGroup}>
          {/* Nama Pengklaim */}
          <View style={styles.detailBlock}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Nama Pengklaim</Text>
              <Text style={styles.subLabel}>Pemohon klaim</Text>
            </View>
            <View style={styles.readOnlyBox}>
              <Text style={styles.readOnlyText}>{activeClaim.nama_pengklaim ||'Pengguna FindIt'}</Text>
            </View>
          </View>

          {/* Foto Bukti Kepemilikan */}
          <View style={styles.detailBlock}>
            <Text style={styles.label}>Foto Bukti Kepemilikan</Text>
            <View style={styles.attachmentCard}>
              {proofPhotoUrl ? (
                <Image
                  source={{ uri: proofPhotoUrl }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.previewBoxPlaceholder}>
                  <Feather name="file-text" size={24} color="#64748B" />
                  <Text style={styles.previewBoxText}>TANPA FOTO</Text>
                </View>
              )}
              <View style={styles.attachmentMeta}>
                <Text style={styles.fileName}>
                  {proofPhotoUrl ?'Lampiran Bukti' :'Tidak ada foto bukti'}
                </Text>
                <Text style={styles.fileDetail}>Foto / dokumen terlampir</Text>
                {proofPhotoUrl && (
                  <TouchableOpacity
                    style={styles.linkRow}
                    onPress={() =>
                      showCustomAlert({ title: 'Bukti Kepemilikan', message: 'Foto bukti terlampir oleh pengklaim.', type: 'info' })
                    }
                  >
                    <Text style={styles.linkText}>Lihat detail</Text>
                    <Feather name="maximize-2" size={12} color="#10B981" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>

          {/* Penjelasan Kepemilikan */}
          <View style={styles.detailBlock}>
            <Text style={styles.label}>Penjelasan Kepemilikan</Text>
            <View style={styles.readOnlyTextArea}>
              <Text style={styles.readOnlyText}>
                {activeClaim.alasan_klaim ||'Tidak ada alasan klaim tertulis.'}
              </Text>
            </View>
          </View>

          {/* Notice Info Box */}
          <View style={styles.infoBox}>
            <Ionicons
              name="shield-checkmark-outline"
              size={20}
              color="#047857"
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoBoxTitle}>Periksa bukti sebelum menyetujui</Text>
              <Text style={styles.infoBoxText}>
                Persetujuan akan mengubah status barang menjadi'Dikembalikan' dan menutup klaim lainnya.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.rejectButton}
              activeOpacity={0.8}
              onPress={() => handleUpdateStatus('Ditolak')}
              disabled={submitting}
            >
              <Text style={styles.rejectButtonText}>Tolak Klaim</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.approveButton}
              activeOpacity={0.85}
              onPress={() => handleUpdateStatus('Diterima')}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>Setujui Klaim</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#FFFFFF' },
  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal: 16,
    height: 52,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:'#F8FAFC',
    alignItems:'center',
    justifyContent:'center',
  },
  headerTitle: { fontSize: 18, fontWeight:'700', color:'#0F172A' },
  headerRightPlaceholder: { width: 36 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 32, paddingTop: 12 },
  itemCard: {
    flexDirection:'row',
    backgroundColor:'#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor:'#E2E8F0',
    alignItems:'center',
    marginBottom: 12,
  },
  itemImage: { width: 64, height: 64, borderRadius: 12, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemTag: { fontSize: 12, color:'#10B981', fontWeight:'600', marginBottom: 2 },
  itemTitle: { fontSize: 16, fontWeight:'700', color:'#0F172A', marginBottom: 2 },
  itemMeta: { fontSize: 12, color:'#64748B' },
  foundBadge: {
    backgroundColor:'#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf:'flex-start',
  },
  foundBadgeText: { color:'#2563EB', fontSize: 10, fontWeight:'700' },
  statusPillRow: { marginBottom: 4 },
  pendingPill: {
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
    backgroundColor:'#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf:'flex-start',
  },
  pendingPillText: { fontSize: 12, fontWeight:'700', color:'#92400E' },
  reviewContextText: { fontSize: 12, color:'#64748B', marginBottom: 20 },
  detailsGroup: { gap: 18 },
  detailBlock: { gap: 6 },
  labelRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  label: { fontSize: 14, fontWeight:'600', color:'#334155' },
  subLabel: { fontSize: 12, color:'#94A3B8' },
  readOnlyBox: {
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor:'#FFFFFF',
  },
  readOnlyText: { fontSize: 14, color:'#0F172A', lineHeight: 20 },
  attachmentCard: {
    flexDirection:'row',
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 14,
    padding: 12,
    gap: 12,
    alignItems:'center',
  },
  previewBoxPlaceholder: {
    width: 80,
    height: 70,
    borderRadius: 10,
    backgroundColor:'#F1F5F9',
    alignItems:'center',
    justifyContent:'center',
    padding: 4,
  },
  previewBoxText: { fontSize: 8, fontWeight:'700', color:'#475569', marginTop: 2 },
  previewImage: { width: 80, height: 70, borderRadius: 10 },
  attachmentMeta: { flex: 1, gap: 2 },
  fileName: { fontSize: 14, fontWeight:'700', color:'#0F172A' },
  fileDetail: { fontSize: 12, color:'#64748B' },
  linkRow: { flexDirection:'row', alignItems:'center', gap: 4, marginTop: 4 },
  linkText: { fontSize: 12, fontWeight:'600', color:'#10B981' },
  readOnlyTextArea: {
    borderWidth: 1,
    borderColor:'#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor:'#FFFFFF',
  },
  infoBox: {
    flexDirection:'row',
    backgroundColor:'#ECFDF5',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  infoBoxTitle: { fontSize: 13, fontWeight:'700', color:'#047857', marginBottom: 2 },
  infoBoxText: { fontSize: 12, color:'#047857', lineHeight: 16 },
  actionRow: { flexDirection:'row', gap: 12, marginTop: 4 },
  rejectButton: {
    flex: 1,
    borderWidth: 1,
    borderColor:'#FCA5A5',
    backgroundColor:'#FFFFFF',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
  },
  rejectButtonText: { color:'#DC2626', fontSize: 15, fontWeight:'600' },
  approveButton: {
    flex: 1.5,
    backgroundColor:'#10B981',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 999,
  },
  approveButtonText: { color:'#FFFFFF', fontSize: 15, fontWeight:'600' },
});
