import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  getBarangSaya, getKlaimSaya, getKlaimMasuk, deleteBarangReport,
  updateStatusBarang, formatPhotoUrl, formatKejadianDate,
  getWaktuUpload, getPostUploadTimes,
} from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  if (dateStr.includes('•') || dateStr.includes('yang lalu') || dateStr.includes('Kemarin') || dateStr.includes('Hari ini')) return dateStr;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

export default function MyActivityScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [isClaimAccordionOpen, setIsClaimAccordionOpen] = useState(true);
  const [activeClaimTab, setActiveClaimTab] = useState('SUBMITTED');

  const [myPosts, setMyPosts] = useState([]);
  const [submittedClaims, setSubmittedClaims] = useState([]);
  const [incomingClaims, setIncomingClaims] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadMeta, setUploadMeta] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('Hilang');
  const [savingStatus, setSavingStatus] = useState(false);

  const fetchActivityData = async () => {
    try {
      const [postsData, claimsData, incomingData, metaData] = await Promise.all([
        getBarangSaya().catch(() => null),
        getKlaimSaya().catch(() => null),
        getKlaimMasuk().catch(() => null),
        getPostUploadTimes().catch(() => ({})),
      ]);
      if (metaData) setUploadMeta(metaData);
      if (Array.isArray(postsData)) setMyPosts(postsData);
      if (Array.isArray(claimsData)) setSubmittedClaims(claimsData);
      if (Array.isArray(incomingData)) setIncomingClaims(incomingData);
    } catch (error) {
      console.log('Activity data error:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchActivityData);
    fetchActivityData();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => { setRefreshing(true); fetchActivityData(); };

  const handleOpenEditModal = (item) => {
    setEditingPost(item);
    setSelectedStatus(item.status || 'Hilang');
  };

  const handleSaveStatus = async () => {
    if (!editingPost) return;
    setSavingStatus(true);
    try {
      await updateStatusBarang(editingPost.id_barang, selectedStatus);
      setMyPosts((prev) =>
        prev.map((p) => p.id_barang === editingPost.id_barang ? { ...p, status: selectedStatus } : p)
      );
      setEditingPost(null);
      showCustomAlert({ title: 'Status Diperbarui', message: `Status berhasil diubah menjadi "${selectedStatus}".`, type: 'success' });
    } catch (error) {
      showCustomAlert({ title: 'Gagal Memperbarui', message: error?.response?.data?.message || 'Terjadi kesalahan.', type: 'error' });
    } finally {
      setSavingStatus(false);
    }
  };

  const handleDeletePost = (id_barang, judul) => {
    showCustomAlert({
      title: 'Hapus Laporan?',
      message: `Laporan "${judul}" akan dihapus permanen.`,
      type: 'warning',
      buttons: [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Ya, Hapus', style: 'destructive',
          onPress: async () => {
            try { await deleteBarangReport(id_barang); } catch (err) {}
            setMyPosts((prev) => prev.filter((p) => p.id_barang !== id_barang));
            showCustomAlert({ title: 'Laporan Dihapus', message: 'Laporan berhasil dihapus.', type: 'info' });
          },
        },
      ],
    });
  };

  const getPostStatusBadge = (status) => {
    if (status === 'Dikembalikan') return { label: 'DIKEMBALIKAN', badgeStyle: styles.typeReturned, textStyle: styles.typeTextReturned, eventLabel: 'Dikembalikan' };
    if (status === 'Ditemukan') return { label: 'FOUND', badgeStyle: styles.typeFound, textStyle: styles.typeTextFound, eventLabel: 'Ditemukan' };
    return { label: 'LOST', badgeStyle: styles.typeLost, textStyle: styles.typeTextLost, eventLabel: 'Kehilangan' };
  };

  const getStepIndex = (statusKlaim) => {
    switch (statusKlaim) {
      case 'Pending': case 'Menunggu': return 0;
      case 'Ditolak': return 1;
      case 'Diterima': case 'Disetujui': return 2;
      case 'Selesai': return 3;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />

      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, isDark && { backgroundColor: '#334155' }]} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Aktivitas Saya</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Section 1: My Posts */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Postingan Saya</Text>
            <Text style={[styles.sectionSubtitle, isDark && { color: colors.textSecondary }]}>Riwayat postingan barang yang kamu buat</Text>
          </View>
          <View style={[styles.countBadge, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.countBadgeText, isDark && { color: colors.text }]}>{myPosts.length}</Text>
          </View>
        </View>

        <View style={styles.postsList}>
          {myPosts.length === 0 ? (
            <Text style={[styles.emptyText, isDark && { color: colors.textSecondary }]}>Belum ada postingan barang.</Text>
          ) : (
            myPosts.map((item) => {
              const postStatus = getPostStatusBadge(item.status);
              // ✅ FIX: Support foto_utama (schema baru) dan foto_url (legacy)
              const photoUrl = formatPhotoUrl(item.foto_utama || item.foto_url);

              return (
                <View key={item.id_barang} style={[styles.postCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Image source={{ uri: photoUrl || 'https://via.placeholder.com/150' }} style={styles.postImage} />
                  <View style={styles.postDetails}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.postTitle, isDark && { color: colors.text }]} numberOfLines={1}>{item.judul}</Text>
                      <View style={[styles.typeBadge, postStatus.badgeStyle]}>
                        <Text style={[styles.typeText, postStatus.textStyle]}>{postStatus.label}</Text>
                      </View>
                    </View>
                    <View style={styles.postMetaColumn}>
                      <View style={styles.metaLine}>
                        <Ionicons name="location-outline" size={13} color="#64748B" />
                        <Text style={[styles.postMetaText, isDark && { color: colors.textSecondary }]} numberOfLines={1}>{item.lokasi}</Text>
                      </View>
                      <View style={styles.metaLine}>
                        <Ionicons name="calendar-outline" size={13} color="#10B981" />
                        <Text style={[styles.eventDateText, isDark && { color: colors.textSecondary }]} numberOfLines={1}>
                          {postStatus.eventLabel}: {formatKejadianDate(item.tanggal_kejadian || item.tanggal)}
                        </Text>
                      </View>
                      <View style={styles.metaLine}>
                        <Ionicons name="time-outline" size={12} color="#94A3B8" />
                        <Text style={styles.postUploadTimeText} numberOfLines={1}>Diposting {getWaktuUpload(item, uploadMeta)}</Text>
                      </View>
                    </View>
                    <View style={styles.postFooter}>
                      <View style={[
                        styles.statusPillBadge,
                        item.status === 'Dikembalikan' ? styles.statusPillDone : item.status === 'Ditemukan' ? styles.statusPillFound : styles.statusPillLost,
                      ]}>
                        <Text style={[
                          styles.statusPillText,
                          item.status === 'Dikembalikan' ? styles.statusPillTextDone : item.status === 'Ditemukan' ? styles.statusPillTextFound : styles.statusPillTextLost,
                        ]}>
                          {item.status === 'Dikembalikan' ? 'Selesai' : item.status}
                        </Text>
                      </View>
                      <TouchableOpacity style={styles.linkDetailRow} onPress={() => navigation.navigate('DetailItem', { id_barang: item.id_barang })}>
                        <Text style={styles.linkDetailText}>Detail</Text>
                        <Feather name="chevron-right" size={14} color="#10B981" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.postActionsColumn}>
                    <TouchableOpacity style={styles.editButton} onPress={() => handleOpenEditModal(item)}>
                      <Feather name="edit-3" size={16} color="#047857" />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePost(item.id_barang, item.judul)}>
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Section 2: Claim Activity Accordion */}
        <TouchableOpacity style={styles.accordionHeader} onPress={() => setIsClaimAccordionOpen(!isClaimAccordionOpen)}>
          <Text style={[styles.accordionTitle, isDark && { color: colors.text }]}>Aktivitas Klaim</Text>
          <Feather name={isClaimAccordionOpen ? 'chevron-up' : 'chevron-down'} size={22} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>

        {isClaimAccordionOpen && (
          <View style={styles.claimSectionContent}>
            <TouchableOpacity
              style={[styles.tabOptionCard, activeClaimTab === 'SUBMITTED' && styles.tabOptionActive, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setActiveClaimTab('SUBMITTED')}
            >
              <View style={styles.tabOptionLeft}>
                <View style={[styles.radioCircle, activeClaimTab === 'SUBMITTED' && styles.radioCircleActive]}>
                  {activeClaimTab === 'SUBMITTED' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.tabOptionTitle, isDark && { color: colors.text }]}>Klaim Yang Saya Ajukan</Text>
              </View>
              <View style={styles.tabCountPill}>
                <Text style={styles.tabCountText}>{submittedClaims.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabOptionCard, activeClaimTab === 'ACTION' && styles.tabOptionActive, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setActiveClaimTab('ACTION')}
            >
              <View style={styles.tabOptionLeft}>
                <View style={[styles.radioCircle, activeClaimTab === 'ACTION' && styles.radioCircleActive]}>
                  {activeClaimTab === 'ACTION' && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                </View>
                <Text style={[styles.tabOptionTitle, isDark && { color: colors.text }]}>Klaim Masuk Butuh Tindakan</Text>
              </View>
              <View style={styles.tabCountPill}>
                <Text style={styles.tabCountText}>{incomingClaims.length}</Text>
              </View>
            </TouchableOpacity>

            {/* TAB 1: SUBMITTED */}
            {activeClaimTab === 'SUBMITTED' && (
              <View style={styles.claimsSubmittedContainer}>
                <View style={styles.subHeader}>
                  <View>
                    <Text style={[styles.subTitle, isDark && { color: colors.text }]}>Klaim Diajukan</Text>
                    <Text style={[styles.subDescription, isDark && { color: colors.textSecondary }]}>Pengajuan kamu pada postingan penemu</Text>
                  </View>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{submittedClaims.length}</Text>
                  </View>
                </View>

                {submittedClaims.length === 0 ? (
                  <Text style={[styles.emptyText, isDark && { color: colors.textSecondary }]}>Belum ada pengajuan klaim.</Text>
                ) : (
                  submittedClaims.map((item) => {
                    const stepIndex = getStepIndex(item.status_klaim);
                    const isRejected = item.status_klaim === 'Ditolak';
                    // ✅ FIX: pakai foto_utama, nama_pengunggah
                    const photoUrl = formatPhotoUrl(item.foto_utama || item.foto_url);
                    const namaPenemu = item.nama_pengunggah || item.nama_penemu || 'Pengguna';

                    return (
                      <TouchableOpacity
                        key={item.id_klaim}
                        style={[styles.claimCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => {
                          // Navigasi ke DirectChat butuh id_penerima = pemilik barang
                          navigation.navigate('DirectChat', {
                            id_barang: item.id_barang,
                            id_penerima: item.id_pengunggah,
                            nama_penerima: namaPenemu,
                            item: {
                              id_barang: item.id_barang,
                              judul: item.judul,
                              lokasi: item.lokasi,
                              status: item.status_barang,
                              foto_utama: item.foto_utama,
                              nama_pengunggah: namaPenemu,
                            },
                            role: 'claimer',
                            claimStatus: item.status_klaim === 'Diterima' || item.status_klaim === 'Disetujui' ? 'approved' : 'submitted',
                          });
                        }}
                      >
                        <View style={styles.claimCardHeader}>
                          <Image source={{ uri: photoUrl || 'https://via.placeholder.com/150' }} style={styles.claimImage} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.claimTitle, isDark && { color: colors.text }]} numberOfLines={1}>{item.judul}</Text>
                            <Text style={[styles.claimMeta, isDark && { color: colors.textSecondary }]}>Penemu: {namaPenemu}</Text>
                          </View>
                          <View style={[styles.statusBadgePill, { backgroundColor: isRejected ? '#FEE2E2' : '#FEF3C7' }]}>
                            <Text style={[styles.statusBadgeText, { color: isRejected ? '#DC2626' : '#D97706' }]}>
                              {item.status_klaim}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.stepperContainer}>
                          <View style={styles.stepperTrack}>
                            <View style={[styles.stepBar, stepIndex >= 0 && (isRejected ? styles.stepBarRejected : styles.stepBarActive)]} />
                            <View style={[styles.stepBar, stepIndex >= 1 && (isRejected ? styles.stepBarRejected : styles.stepBarActive)]} />
                            <View style={[styles.stepBar, stepIndex >= 2 && styles.stepBarActive]} />
                            <View style={[styles.stepBar, stepIndex >= 3 && styles.stepBarActive]} />
                          </View>
                          <View style={styles.stepLabelsRow}>
                            <Text style={styles.stepLabelActive}>Diajukan</Text>
                            <Text style={stepIndex >= 1 ? styles.stepLabelActive : styles.stepLabelInactive}>Verifikasi</Text>
                            <Text style={stepIndex >= 2 ? styles.stepLabelActive : styles.stepLabelInactive}>Serah terima</Text>
                            <Text style={stepIndex >= 3 ? styles.stepLabelActive : styles.stepLabelInactive}>Selesai</Text>
                          </View>
                        </View>

                        <Text style={[styles.claimNoteText, isDark && { color: colors.textSecondary }]} numberOfLines={2}>{item.alasan_klaim}</Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 8, gap: 4 }}>
                          <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>Buka Percakapan</Text>
                          <Feather name="chevron-right" size={14} color="#10B981" />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 2: ACTION (klaim masuk butuh tindakan) */}
            {activeClaimTab === 'ACTION' && (
              <View style={styles.claimsActionContainer}>
                <View style={styles.subHeaderAction}>
                  <Text style={[styles.subTitle, isDark && { color: colors.text }]}>{incomingClaims.length} klaim masuk butuh verifikasi</Text>
                  <Text style={[styles.subDescription, isDark && { color: colors.textSecondary }]}>Periksa identitas dan foto bukti pengklaim.</Text>
                </View>

                {incomingClaims.length === 0 ? (
                  <Text style={[styles.emptyText, isDark && { color: colors.textSecondary }]}>Tidak ada klaim masuk.</Text>
                ) : (
                  incomingClaims.map((item) => (
                    <View key={item.id_klaim} style={[styles.actionCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <View style={styles.itemHeaderRow}>
                        {/* ✅ FIX: pakai foto_utama */}
                        <Image source={{ uri: formatPhotoUrl(item.foto_utama || item.foto_url) || 'https://via.placeholder.com/150' }} style={styles.actionImage} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.actionItemTitle, isDark && { color: colors.text }]} numberOfLines={1}>{item.judul}</Text>
                          <Text style={[styles.actionItemMeta, isDark && { color: colors.textSecondary }]}>{item.lokasi}</Text>
                        </View>
                        <View style={styles.foundBadge}>
                          <Text style={styles.foundBadgeText}>{item.status_barang === 'Ditemukan' ? 'FOUND' : 'LOST'}</Text>
                        </View>
                      </View>

                      <View style={styles.claimerRow}>
                        <View>
                          <Text style={[styles.claimerName, isDark && { color: colors.text }]}>{item.nama_pengklaim}</Text>
                          {/* ✅ FIX: pakai waktu_klaim (bukan tanggal_klaim) */}
                          <Text style={[styles.claimerTime, isDark && { color: colors.textSecondary }]}>
                            {formatDisplayDate(item.waktu_klaim || item.created_at)}
                          </Text>
                        </View>
                        <View style={styles.pendingYellowBadge}>
                          <Text style={styles.pendingYellowText}>{item.status_klaim}</Text>
                        </View>
                      </View>

                      {/* ✅ FIX: kirim params yang benar ke ReviewClaim */}
                      <TouchableOpacity
                        style={styles.reviewButton}
                        onPress={() =>
                          navigation.navigate('ReviewClaim', {
                            klaim: item,  // ✅ KEY = 'klaim' (sesuai ReviewClaimScreen)
                            item: {
                              id_barang: item.id_barang,
                              judul: item.judul,
                              lokasi: item.lokasi,
                              foto_utama: item.foto_utama,
                              status: item.status_barang,
                            },
                          })
                        }
                      >
                        <Text style={styles.reviewButtonText}>Tinjau & Verifikasi Klaim</Text>
                        <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Edit Status Postingan */}
      <Modal visible={!!editingPost} transparent animationType="fade" onRequestClose={() => !savingStatus && setEditingPost(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Edit Status Postingan</Text>
                <Text style={styles.modalSubtitle}>Perbarui status keberadaan barang</Text>
              </View>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => !savingStatus && setEditingPost(null)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {editingPost && (
              <View style={styles.modalItemPreview}>
                <Image source={{ uri: formatPhotoUrl(editingPost.foto_utama || editingPost.foto_url) || 'https://via.placeholder.com/100' }} style={styles.modalItemImage} />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.modalItemTitle} numberOfLines={1}>{editingPost.judul}</Text>
                  <Text style={styles.modalItemMeta} numberOfLines={1}>{editingPost.lokasi}</Text>
                  <Text style={styles.modalItemCurrentStatus}>Status saat ini: {editingPost.status}</Text>
                </View>
              </View>
            )}

            <Text style={styles.optionsLabel}>Pilih Status Baru:</Text>
            <View style={styles.statusOptionsList}>
              {[
                { value: 'Hilang', label: 'Hilang', desc: 'Barang masih belum ditemukan.', color: '#DC2626', bg: '#FEF2F2', border: '#FCA5A5' },
                { value: 'Ditemukan', label: 'Ditemukan', desc: 'Barang telah diamankan.', color: '#2563EB', bg: '#EFF6FF', border: '#93C5FD' },
                { value: 'Dikembalikan', label: 'Sudah Dikembalikan', desc: 'Barang sudah kembali ke pemilik.', color: '#047857', bg: '#ECFDF5', border: '#6EE7B7' },
              ].map((opt) => {
                const isSelected = selectedStatus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.statusOptionCard, isSelected && { borderColor: opt.border, backgroundColor: opt.bg }]}
                    onPress={() => setSelectedStatus(opt.value)}
                  >
                    <View style={[styles.radioDotOuter, isSelected && { borderColor: opt.color }]}>
                      {isSelected && <View style={[styles.radioDotInner, { backgroundColor: opt.color }]} />}
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.statusOptionLabel, isSelected && { color: opt.color, fontWeight: '700' }]}>{opt.label}</Text>
                      <Text style={styles.statusOptionDesc}>{opt.desc}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity style={styles.modalCancelButton} disabled={savingStatus} onPress={() => setEditingPost(null)}>
                <Text style={styles.modalCancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} disabled={savingStatus} onPress={handleSaveStatus}>
                {savingStatus ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.modalSaveButtonText}>Simpan Status</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 52, backgroundColor: '#FFFFFF' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0F172A' },
  headerRightPlaceholder: { width: 36 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 90, gap: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  sectionSubtitle: { fontSize: 12, color: '#64748B' },
  countBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  postsList: { gap: 12 },
  postCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  postImage: { width: 60, height: 60, borderRadius: 12, marginRight: 12 },
  postDetails: { flex: 1, gap: 2 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  postTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', flexShrink: 1 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  typeFound: { backgroundColor: '#DBEAFE' }, typeLost: { backgroundColor: '#FEE2E2' }, typeReturned: { backgroundColor: '#D1FAE5' },
  typeText: { fontSize: 10, fontWeight: '700' },
  typeTextFound: { color: '#2563EB' }, typeTextLost: { color: '#DC2626' }, typeTextReturned: { color: '#047857' },
  postMetaColumn: { gap: 3, marginVertical: 3 },
  metaLine: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postMetaText: { fontSize: 11, color: '#64748B', flex: 1 },
  eventDateText: { fontSize: 11, color: '#334155', fontWeight: '500', flex: 1 },
  postUploadTimeText: { fontSize: 10, color: '#94A3B8', flex: 1 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  statusPillBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPillDone: { backgroundColor: '#D1FAE5' }, statusPillFound: { backgroundColor: '#DBEAFE' }, statusPillLost: { backgroundColor: '#FEE2E2' },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  statusPillTextDone: { color: '#047857' }, statusPillTextFound: { color: '#2563EB' }, statusPillTextLost: { color: '#DC2626' },
  linkDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkDetailText: { fontSize: 12, fontWeight: '600', color: '#10B981' },
  postActionsColumn: { gap: 8, marginLeft: 8 },
  editButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A7F3D0' },
  deleteButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FECACA' },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#F1F5F9', marginTop: 8 },
  accordionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  claimSectionContent: { gap: 12, marginTop: 4 },
  tabOptionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#FFFFFF', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tabOptionActive: { backgroundColor: '#ECFDF5', borderColor: '#10B981' },
  tabOptionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  radioCircleActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  tabOptionTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  tabCountPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 2, borderRadius: 999 },
  tabCountText: { fontSize: 12, fontWeight: '700', color: '#047857' },
  claimsSubmittedContainer: { gap: 12, marginTop: 8 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  subTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  subDescription: { fontSize: 12, color: '#64748B' },
  claimCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  claimCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  claimImage: { width: 48, height: 48, borderRadius: 10 },
  claimTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  claimMeta: { fontSize: 12, color: '#64748B' },
  statusBadgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  stepperContainer: { gap: 6 },
  stepperTrack: { flexDirection: 'row', gap: 4 },
  stepBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  stepBarActive: { backgroundColor: '#10B981' },
  stepBarRejected: { backgroundColor: '#EF4444' },
  stepLabelsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepLabelActive: { fontSize: 10, fontWeight: '600', color: '#0F172A' },
  stepLabelInactive: { fontSize: 10, color: '#94A3B8' },
  claimNoteText: { fontSize: 12, color: '#64748B' },
  claimsActionContainer: { gap: 12, marginTop: 8 },
  subHeaderAction: { marginBottom: 4 },
  actionCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#F1F5F9', gap: 12 },
  itemHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionImage: { width: 50, height: 50, borderRadius: 10 },
  actionItemTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  actionItemMeta: { fontSize: 12, color: '#64748B' },
  foundBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  foundBadgeText: { color: '#2563EB', fontSize: 10, fontWeight: '700' },
  claimerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  claimerName: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  claimerTime: { fontSize: 11, color: '#64748B' },
  pendingYellowBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pendingYellowText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  reviewButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 999, gap: 6 },
  reviewButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  emptyText: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', paddingVertical: 8 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#FFFFFF', borderRadius: 24, padding: 20, gap: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  modalSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalCloseButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalItemPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 14, padding: 10, gap: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  modalItemImage: { width: 50, height: 50, borderRadius: 10 },
  modalItemTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  modalItemMeta: { fontSize: 11, color: '#64748B' },
  modalItemCurrentStatus: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  optionsLabel: { fontSize: 13, fontWeight: '700', color: '#334155' },
  statusOptionsList: { gap: 10 },
  statusOptionCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', gap: 12 },
  radioDotOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  radioDotInner: { width: 10, height: 10, borderRadius: 5 },
  statusOptionLabel: { fontSize: 13, fontWeight: '600', color: '#0F172A' },
  statusOptionDesc: { fontSize: 11, color: '#64748B', lineHeight: 15 },
  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 999, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalCancelButtonText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  modalSaveButton: { flex: 1.5, paddingVertical: 12, borderRadius: 999, backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  modalSaveButtonText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});