import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, Share, Dimensions, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBarangDetail, formatPhotoUrl, formatKejadianDate,
  getWaktuUpload, getPostUploadTimes, openOrCreateRoom,
} from '../services/finditService';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_DETAIL_ITEM = {
  id_barang: 1, judul: 'Wallet Hitam Pedro', nama_kategori: 'Dokumen',
  lokasi: 'Perpustakaan UINSA', tanggal_kejadian: '2026-05-02',
  status: 'Ditemukan', foto: [],
  deskripsi: 'Ditemukan dompet kulit hitam merk Pedro di lantai 2 perpustakaan pusat UINSA.',
  nama_pengunggah: 'Budi S.', id_user: 10,
};

export default function DetailItemScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  const { id_barang, item: paramItem } = route.params || {};

  const [itemData, setItemData] = useState(paramItem || null);
  const [loading, setLoading] = useState(!paramItem && !!id_barang);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({});
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const photoScrollRef = useRef(null);

  useEffect(() => {
    const checkCurrentUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id_user) setCurrentUserId(parsed.id_user);
          if (parsed.nama) setCurrentUserName(parsed.nama);
          if (parsed.foto_profil) setCurrentUserPhoto(formatPhotoUrl(parsed.foto_profil));
        }
        const meta = await getPostUploadTimes();
        setUploadMeta(meta);
      } catch (e) {}
    };
    checkCurrentUser();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchDetail = async () => {
      try {
        if (id_barang) {
          const data = await getBarangDetail(id_barang);
          if (data && isMounted) setItemData(data);
        }
      } catch (error) {
        if (isMounted && !itemData) setItemData(paramItem || DEFAULT_DETAIL_ITEM);
      } finally {
        if (isMounted) {
          setLoading(false);
          setItemData((prev) => prev || paramItem || DEFAULT_DETAIL_ITEM);
        }
      }
    };
    fetchDetail();
    return () => { isMounted = false; };
  }, [id_barang]);

  const activeItem = itemData || paramItem || DEFAULT_DETAIL_ITEM;

  // Konversi ke array foto (dukung response lama dan baru)
  const photos = Array.isArray(activeItem.foto) && activeItem.foto.length > 0
    ? activeItem.foto
        .slice()
        .sort((a, b) => a.urutan_foto - b.urutan_foto)
        .map((f) => formatPhotoUrl(f.foto_url))
    : [formatPhotoUrl(activeItem.foto_utama || activeItem.foto_url)].filter(Boolean);

  const isFound = activeItem.status === 'Ditemukan';
  const isReturned = activeItem.status === 'Dikembalikan';
  const isOwner = Boolean(
    currentUserId && activeItem.id_user &&
    Number(currentUserId) === Number(activeItem.id_user)
  );

  const getStatusBadge = (status) => {
    if (status === 'Dikembalikan') return { label: 'DIKEMBALIKAN', badgeStyle: styles.badgeReturned, textStyle: styles.badgeTextReturned, eventLabel: 'Selesai' };
    if (status === 'Ditemukan') return { label: 'FOUND', badgeStyle: styles.badgeFound, textStyle: styles.badgeTextFound, eventLabel: 'Tanggal Ditemukan' };
    return { label: 'LOST', badgeStyle: styles.badgeLost, textStyle: styles.badgeTextLost, eventLabel: 'Tanggal Kehilangan' };
  };

  const statusInfo = getStatusBadge(activeItem.status);

  const handleOpenMaps = () => {
    if (activeItem.latitude && activeItem.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${activeItem.latitude},${activeItem.longitude}`;
      Linking.openURL(url).catch(() => {});
    }
  };

  const handleStartChat = async () => {
    if (isOwner) return;
    try {
      const res = await openOrCreateRoom(activeItem.id_barang, activeItem.id_user);
      if (res?.room?.id_room) {
        navigation.navigate('DirectChat', {
          id_room: res.room.id_room,
          id_barang: activeItem.id_barang,
          id_penerima: activeItem.id_user,
          nama_penerima: activeItem.nama_pengunggah,
          item: activeItem,
        });
      }
    } catch (err) {
      showCustomAlert({ title: 'Gagal Membuka Chat', message: err?.response?.data?.message || 'Tidak dapat memulai percakapan.', type: 'error' });
    }
  };

  const klaimList = Array.isArray(activeItem.klaim) ? activeItem.klaim : [];
  const pendingKlaimCount = klaimList.filter((k) => k.status_klaim === 'Pending').length;

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Galeri Foto (Horizontal Scroll) */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={photoScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setActivePhotoIndex(idx);
            }}
          >
            {photos.map((uri, idx) => (
              <Image
                key={idx}
                source={{ uri: uri || 'https://via.placeholder.com/800x600?text=No+Image' }}
                style={styles.headerImage}
              />
            ))}
          </ScrollView>
          {/* Indicator Dots */}
          {photos.length > 1 && (
            <View style={styles.photoIndicator}>
              {photos.map((_, idx) => (
                <View key={idx} style={[styles.photoDot, idx === activePhotoIndex && styles.photoDotActive]} />
              ))}
            </View>
          )}
          <SafeAreaView style={styles.floatingHeader}>
            <TouchableOpacity style={styles.circleButton} onPress={() => navigation?.goBack?.()}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity style={styles.circleButton} onPress={() => {
                const next = !isSaved; setIsSaved(next);
                showCustomAlert({ title: next ? 'Tersimpan' : 'Dihapus', message: next ? 'Ditambahkan ke bookmark.' : 'Dihapus dari bookmark.', type: next ? 'success' : 'info' });
              }}>
                <Feather name="bookmark" size={18} color={isSaved ? '#10B981' : '#FFFFFF'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} onPress={() => {
                Share.share({ message: `[FindIt UINSA] ${activeItem.judul} di ${activeItem.lokasi}` });
              }}>
                <Feather name="share-2" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        <View style={[styles.contentContainer, isDark && { backgroundColor: colors.background }]}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDark && { color: colors.text }]}>{activeItem.judul}</Text>
            <View style={[styles.badge, statusInfo.badgeStyle]}>
              <Text style={[styles.badgeText, statusInfo.textStyle]}>{statusInfo.label}</Text>
            </View>
          </View>

          <View style={styles.metaRow}>
            <TouchableOpacity style={styles.metaItem} onPress={handleOpenMaps} disabled={!activeItem.latitude}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={[styles.metaText, isDark && { color: colors.textSecondary }]}>{activeItem.lokasi}</Text>
              {activeItem.latitude && <Ionicons name="open-outline" size={12} color="#10B981" />}
            </TouchableOpacity>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#10B981" />
              <Text style={[styles.metaText, isDark && { color: colors.textSecondary }]}>
                {statusInfo.eventLabel}: {formatKejadianDate(activeItem.tanggal_kejadian || activeItem.tanggal)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color="#94A3B8" />
              <Text style={[styles.metaText, isDark && { color: colors.textSecondary }]}>
                Diposting: {getWaktuUpload(activeItem, uploadMeta)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, isDark && { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Deskripsi</Text>
          <Text style={[styles.descriptionText, isDark && { color: colors.textSecondary }]}>
            {activeItem.deskripsi || 'Tidak ada deskripsi tambahan untuk laporan ini.'}
          </Text>

          <View style={[styles.specsBox, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.specRow, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.specLabel, isDark && { color: colors.textSecondary }]}>Kategori</Text>
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{activeItem.nama_kategori}</Text>
            </View>
            <View style={[styles.specRow, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.specLabel, isDark && { color: colors.textSecondary }]}>Status Laporan</Text>
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{activeItem.status}</Text>
            </View>
            <View style={[styles.specRow, isDark && { borderBottomColor: colors.border }]}>
              <Text style={[styles.specLabel, isDark && { color: colors.textSecondary }]}>{statusInfo.eventLabel}</Text>
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{formatKejadianDate(activeItem.tanggal_kejadian || activeItem.tanggal)}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specLabel, isDark && { color: colors.textSecondary }]}>Jumlah Foto</Text>
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{photos.length} foto</Text>
            </View>
          </View>

          {/* Arah Klaim Info */}
          {activeItem.arah_klaim && (
            <View style={[styles.infoBox, isDark && { backgroundColor: '#064E3B' }]}>
              <Ionicons name="information-circle-outline" size={20} color="#047857" />
              <Text style={[styles.infoBoxText, isDark && { color: '#A7F3D0' }]}>{activeItem.arah_klaim}</Text>
            </View>
          )}

          {/* Daftar Klaim (hanya muncul kalau user = owner) */}
          {isOwner && klaimList.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Pengajuan Klaim</Text>
                {pendingKlaimCount > 0 && (
                  <View style={styles.pendingCountBadge}>
                    <Text style={styles.pendingCountText}>{pendingKlaimCount} Pending</Text>
                  </View>
                )}
              </View>
              {klaimList.map((k) => (
                <TouchableOpacity
                  key={k.id_klaim}
                  style={[styles.klaimCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => navigation.navigate('ReviewClaim', { klaim: k, item: activeItem })}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.klaimName, isDark && { color: colors.text }]}>{k.nama_pengklaim}</Text>
                    <Text style={styles.klaimAlasan} numberOfLines={2}>{k.alasan_klaim}</Text>
                    <Text style={styles.klaimTime}>{formatKejadianDate(k.waktu_klaim || k.tanggal_klaim)}</Text>
                  </View>
                  <View style={[
                    styles.klaimStatusBadge,
                    k.status_klaim === 'Diterima' ? styles.klaimDiterima :
                    k.status_klaim === 'Ditolak' ? styles.klaimDitolak : styles.klaimPending,
                  ]}>
                    <Text style={styles.klaimStatusText}>{k.status_klaim}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, isDark && { backgroundColor: colors.card }]}>
        <View style={[styles.bottomBar, isDark && { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.userInfo}>
            <Image
              source={{ uri: (isOwner && currentUserPhoto) ? currentUserPhoto : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200' }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, isDark && { color: colors.text }]}>
                {isOwner && currentUserName ? currentUserName : (activeItem.nama_pengunggah || 'Pengguna')}
              </Text>
              <Text style={[styles.userRole, isDark && { color: colors.textSecondary }]}>
                {isOwner ? 'Laporan Anda' : isFound ? 'Penemu' : 'Pemilik'}
              </Text>
            </View>
          </View>
          <View style={styles.actionButtonsRow}>
            {isOwner ? (
              <TouchableOpacity
                style={styles.claimButtonPrimary}
                onPress={() => navigation.navigate('MyActivity')}
              >
                <Ionicons name="list-outline" size={17} color="#FFFFFF" />
                <Text style={styles.claimButtonPrimaryText}>Kelola ({pendingKlaimCount})</Text>
              </TouchableOpacity>
            ) : isReturned ? (
              <View style={styles.returnedNotice}>
                <Ionicons name="checkmark-circle" size={18} color="#047857" />
                <Text style={styles.returnedText}>Sudah Dikembalikan</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.chatButtonSecondary, isDark && { backgroundColor: colors.card, borderColor: '#047857' }]}
                  onPress={handleStartChat}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#047857" />
                  <Text style={styles.chatButtonSecondaryText}>Chat</Text>
                </TouchableOpacity>
                {isFound ? (
                  <TouchableOpacity
                    style={styles.claimButtonPrimary}
                    onPress={() => navigation.navigate('ClaimForm', { item: activeItem })}
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.claimButtonPrimaryText}>Klaim</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={styles.claimButtonPrimary} onPress={handleStartChat}>
                    <Ionicons name="hand-right-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.claimButtonPrimaryText}>Saya Menemukan</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContent: { paddingBottom: 110 },
  imageContainer: { position: 'relative', width: '100%', height: 340 },
  headerImage: { width: SCREEN_WIDTH, height: 340 },
  photoIndicator: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 },
  photoDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.5)' },
  photoDotActive: { backgroundColor: '#FFFFFF', width: 18 },
  floatingHeader: { position: 'absolute', top: 10, left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rightButtons: { flexDirection: 'row', gap: 10 },
  circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.35)', alignItems: 'center', justifyContent: 'center' },
  contentContainer: { paddingHorizontal: 20, paddingTop: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#0F172A', flex: 1, marginRight: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  badgeFound: { backgroundColor: '#DBEAFE' }, badgeLost: { backgroundColor: '#FEE2E2' }, badgeReturned: { backgroundColor: '#D1FAE5' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextFound: { color: '#2563EB' }, badgeTextLost: { color: '#DC2626' }, badgeTextReturned: { color: '#047857' },
  metaRow: { gap: 6, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontSize: 13, color: '#64748B', flex: 1 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 8 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  descriptionText: { fontSize: 14, color: '#475569', lineHeight: 22, marginBottom: 20 },
  specsBox: { backgroundColor: '#F8FAFC', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 20 },
  specRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  specLabel: { fontSize: 14, color: '#64748B' },
  specValue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  infoBox: { flexDirection: 'row', backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, gap: 10, alignItems: 'center', marginBottom: 16 },
  infoBoxText: { fontSize: 12, color: '#047857', flex: 1, lineHeight: 18 },
  pendingCountBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  pendingCountText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  klaimCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8, gap: 10, alignItems: 'center' },
  klaimName: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  klaimAlasan: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  klaimTime: { fontSize: 10, color: '#94A3B8' },
  klaimStatusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  klaimPending: { backgroundColor: '#FEF3C7' }, klaimDiterima: { backgroundColor: '#D1FAE5' }, klaimDitolak: { backgroundColor: '#FEE2E2' },
  klaimStatusText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  bottomBarContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  bottomBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  userRole: { fontSize: 12, color: '#64748B' },
  actionButtonsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chatButtonSecondary: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  chatButtonSecondaryText: { color: '#047857', fontSize: 14, fontWeight: '700' },
  claimButtonPrimary: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999 },
  claimButtonPrimaryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  returnedNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  returnedText: { color: '#047857', fontSize: 13, fontWeight: '600' },
});