import React, { useEffect, useState } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Share,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import AsyncStorage from'@react-native-async-storage/async-storage';
import {
  getBarangDetail,
  formatPhotoUrl,
  formatKejadianDate,
  getWaktuUpload,
  getPostUploadTimes,
} from'../services/finditService';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';

const DEFAULT_DETAIL_ITEM = {
  id_barang: 1,
  judul:'Wallet Hitam Pedro',
  nama_kategori:'Dokumen',
  id_kategori: 2,
  lokasi:'Perpustakaan UINSA',
  tanggal:'02 Mei 2025 • 14:30',
  status:'Ditemukan',
  foto_url:'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=800&auto=format&fit=crop',
  deskripsi:'Ditemukan dompet kulit hitam merk Pedro di lantai 2 perpustakaan pusat UINSA. Di dalamnya terdapat KTM dan beberapa kartu identitas lainnya. Bagi yang merasa kehilangan, silakan ajukan klaim dengan menyertakan bukti kepemilikan yang valid.',
  nama_pengunggah:'Budi S.',
  id_user: 10,
};

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return'';
  if (
    dateStr.includes('•') ||
    dateStr.includes('yang lalu') ||
    dateStr.includes('Kemarin') ||
    dateStr.includes('Hari ini')
  ) {
    return dateStr;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const hours = String(d.getHours()).padStart(2,'0');
    const mins = String(d.getMinutes()).padStart(2,'0');
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} • ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
};

export default function DetailItemScreen({ route, navigation }) {
  const { isDark, colors } = useTheme();
  // Ambil id_barang atau item data langsung yang dikirim dari Screen sebelumnya
  const { id_barang, item: paramItem } = route.params || {};

  const [itemData, setItemData] = useState(paramItem || null);
  const [loading, setLoading] = useState(!paramItem && !!id_barang);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [currentUserPhoto, setCurrentUserPhoto] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({});

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
          if (data && isMounted) {
            setItemData(data);
          }
        }
      } catch (error) {
        console.log('Backend detail offline, using fallback item');
        if (isMounted && !itemData) {
          setItemData(paramItem || DEFAULT_DETAIL_ITEM);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          // If still null, fallback to default
          setItemData((prev) => prev || paramItem || DEFAULT_DETAIL_ITEM);
        }
      }
    };

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [id_barang]);

  const activeItem = itemData || paramItem || DEFAULT_DETAIL_ITEM;
  const isFound = activeItem.status === 'Ditemukan';
  const photoUrl = formatPhotoUrl(activeItem.foto_url);
  const isOwner = Boolean(
    currentUserId &&
      activeItem.id_user &&
      Number(currentUserId) === Number(activeItem.id_user)
  );

  const getStatusBadge = (status) => {
    if (status === 'Dikembalikan') {
      return {
        label: 'DIKEMBALIKAN',
        badgeStyle: styles.badgeReturned,
        textStyle: styles.badgeTextReturned,
        eventLabel: 'Tanggal Dikembalikan',
      };
    }
    if (status === 'Ditemukan') {
      return {
        label: 'FOUND',
        badgeStyle: styles.badgeFound,
        textStyle: styles.badgeTextFound,
        eventLabel: 'Tanggal Ditemukan',
      };
    }
    return {
      label: 'LOST',
      badgeStyle: styles.badgeLost,
      textStyle: styles.badgeTextLost,
      eventLabel: 'Tanggal Kehilangan',
    };
  };

  const statusInfo = getStatusBadge(activeItem.status);

  return (
    <View style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Gambar Header */}
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri:
                photoUrl ||'https://via.placeholder.com/800x600?text=No+Image',
            }}
            style={styles.headerImage}
          />

          {/* Floating Buttons Bar */}
          <SafeAreaView style={styles.floatingHeader}>
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() => navigation?.goBack?.()}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.rightButtons}>
              <TouchableOpacity
                style={styles.circleButton}
                activeOpacity={0.8}
                onPress={() => {
                  const nextSaved = !isSaved;
                  setIsSaved(nextSaved);
                  showCustomAlert({
                    title: nextSaved ?'Tersimpan di Bookmark' :'Dihapus dari Bookmark',
                    message: nextSaved
                      ?'Barang ini telah ditambahkan ke daftar simpanan kamu agar mudah dipantau.'
                      :'Barang telah dihapus dari daftar simpanan kamu.',
                    type: nextSaved ?'success' :'info',
                  });
                }}
              >
                <Feather
                  name="bookmark"
                  size={18}
                  color={isSaved ?'#10B981' :'#FFFFFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.circleButton}
                activeOpacity={0.8}
                onPress={() => {
                  Share.share({
                    message: `[FindIt UINSA] Cek laporan barang ini: ${activeItem.judul} di ${activeItem.lokasi}`,
                  });
                }}
              >
                <Feather name="share-2" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Content Section */}
        <View style={[styles.contentContainer, isDark && { backgroundColor: colors.background }]}>
          {/* Title & Badge Row */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, isDark && { color: colors.text }]}>{activeItem.judul}</Text>
            <View style={[styles.badge, statusInfo.badgeStyle]}>
              <Text style={[styles.badgeText, statusInfo.textStyle]}>
                {statusInfo.label}
              </Text>
            </View>
          </View>

          {/* Location & Date */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color="#64748B" />
              <Text style={[styles.metaText, isDark && { color: colors.textSecondary }]}>{activeItem.lokasi}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="calendar-outline" size={16} color="#10B981" />
              <Text style={[styles.metaText, isDark && { color: colors.textSecondary }]}>
                {statusInfo.eventLabel}: {formatKejadianDate(activeItem.tanggal)}
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

          {/* Description */}
          <Text style={[styles.sectionTitle, isDark && { color: colors.text }]}>Deskripsi</Text>
          <Text style={[styles.descriptionText, isDark && { color: colors.textSecondary }]}>
            {activeItem.deskripsi ||'Tidak ada deskripsi tambahan untuk laporan ini.'}
          </Text>

          {/* Specifications Box */}
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
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{formatKejadianDate(activeItem.tanggal)}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={[styles.specLabel, isDark && { color: colors.textSecondary }]}>Waktu Diposting</Text>
              <Text style={[styles.specValue, isDark && { color: colors.text }]}>{getWaktuUpload(activeItem, uploadMeta)}</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            <View style={[styles.tagChip, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tagText, isDark && { color: colors.textSecondary }]}>#{activeItem.nama_kategori}</Text>
            </View>
            <View style={[styles.tagChip, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.tagText, isDark && { color: colors.textSecondary }]}>#{activeItem.lokasi}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom User Bar */}
      <SafeAreaView edges={['bottom']} style={[styles.bottomBarContainer, isDark && { backgroundColor: colors.card }]}>
        <View style={[styles.bottomBar, isDark && { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={styles.userInfo}
            activeOpacity={0.8}
            onPress={() => {
              if (isOwner) {
                navigation.navigate('MyActivity');
              } else {
                navigation.navigate('DirectChat', {
                  id_barang: activeItem.id_barang,
                  id_penerima: activeItem.id_user,
                  nama_penerima: activeItem.nama_pengunggah,
                  item: activeItem,
                  role: isFound ? 'claimer' : 'finder',
                });
              }
            }}
          >
            <Image
              source={{
                uri:
                  (isOwner && currentUserPhoto)
                    ? currentUserPhoto
                    : formatPhotoUrl(activeItem.foto_profil_pengunggah) ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, isDark && { color: colors.text }]}>
                {isOwner && currentUserName ? currentUserName : (activeItem.nama_pengunggah || 'Pengguna')}
              </Text>
              <Text style={[styles.userRole, isDark && { color: colors.textSecondary }]}>
                {isOwner
                  ? 'Laporan Anda'
                  : isFound
                  ? 'Penemu / Finder'
                  : 'Pemilik / Owner'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.actionButtonsRow}>
            {isOwner ? (
              <TouchableOpacity
                style={[styles.claimButtonPrimary, { backgroundColor: '#10B981', paddingHorizontal: 16 }]}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('MyActivity')}
              >
                <Ionicons name="create-outline" size={17} color="#FFFFFF" />
                <Text style={styles.claimButtonPrimaryText}>Kelola Status</Text>
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.chatButtonSecondary, isDark && { backgroundColor: colors.card, borderColor: '#047857' }]}
                  activeOpacity={0.85}
                  onPress={() =>
                    navigation.navigate('DirectChat', {
                      id_barang: activeItem.id_barang,
                      id_penerima: activeItem.id_user,
                      nama_penerima: activeItem.nama_pengunggah,
                      item: activeItem,
                      role: isFound ? 'claimer' : 'finder',
                    })
                  }
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#047857" />
                  <Text style={styles.chatButtonSecondaryText}>Chat</Text>
                </TouchableOpacity>

                {isFound ? (
                  <TouchableOpacity
                    style={styles.claimButtonPrimary}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('ClaimForm', {
                        item: activeItem,
                      })
                    }
                  >
                    <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
                    <Text style={styles.claimButtonPrimaryText}>Klaim</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.claimButtonPrimary}
                    activeOpacity={0.85}
                    onPress={() =>
                      navigation.navigate('DirectChat', {
                        id_barang: activeItem.id_barang,
                        id_penerima: activeItem.id_user,
                        nama_penerima: activeItem.nama_pengunggah,
                        item: activeItem,
                        role: 'finder',
                      })
                    }
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
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
  container: {
    flex: 1,
    backgroundColor:'#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#FFFFFF',
  },
  emptyText: {
    fontSize: 14,
    color:'#64748B',
  },
  backLink: {
    marginTop: 12,
  },
  backLinkText: {
    color:'#10B981',
    fontWeight:'700',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  imageContainer: {
    position:'relative',
    width:'100%',
    height: 340,
  },
  headerImage: {
    width:'100%',
    height:'100%',
  },
  floatingHeader: {
    position:'absolute',
    top: 10,
    left: 20,
    right: 20,
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
  },
  rightButtons: {
    flexDirection:'row',
    gap: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor:'rgba(0, 0, 0, 0.35)',
    alignItems:'center',
    justifyContent:'center',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  titleRow: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight:'700',
    color:'#0F172A',
    flex: 1,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeFound: {
    backgroundColor:'#DBEAFE',
  },
  badgeLost: {
    backgroundColor:'#FEE2E2',
  },
  badgeReturned: {
    backgroundColor:'#D1FAE5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight:'700',
  },
  badgeTextFound: {
    color:'#2563EB',
  },
  badgeTextLost: {
    color:'#DC2626',
  },
  badgeTextReturned: {
    color:'#047857',
  },
  metaRow: {
    gap: 6,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color:'#64748B',
  },
  divider: {
    height: 1,
    backgroundColor:'#F1F5F9',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight:'700',
    color:'#0F172A',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color:'#475569',
    lineHeight: 22,
    marginBottom: 20,
  },
  specsBox: {
    backgroundColor:'#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  specRow: {
    flexDirection:'row',
    justifyContent:'space-between',
    alignItems:'center',
  },
  specLabel: {
    fontSize: 14,
    color:'#64748B',
  },
  specValue: {
    fontSize: 14,
    fontWeight:'700',
    color:'#0F172A',
  },
  tagsContainer: {
    flexDirection:'row',
    flexWrap:'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor:'#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tagText: {
    fontSize: 13,
    color:'#475569',
    fontWeight:'500',
  },
  bottomBarContainer: {
    position:'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor:'#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:'#F1F5F9',
  },
  bottomBar: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  userInfo: {
    flexDirection:'row',
    alignItems:'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userName: {
    fontSize: 15,
    fontWeight:'700',
    color:'#0F172A',
  },
  userRole: {
    fontSize: 12,
    color:'#64748B',
  },
  actionButtonsRow: {
    flexDirection:'row',
    alignItems:'center',
    gap: 8,
  },
  chatButtonSecondary: {
    backgroundColor:'#ECFDF5',
    borderWidth: 1,
    borderColor:'#10B981',
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
  },
  chatButtonSecondaryText: {
    color:'#047857',
    fontSize: 14,
    fontWeight:'700',
  },
  claimButtonPrimary: {
    backgroundColor:'#10B981',
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  claimButtonPrimaryText: {
    color:'#FFFFFF',
    fontSize: 14,
    fontWeight:'700',
  },
});