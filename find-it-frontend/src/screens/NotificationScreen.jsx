import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  getBarangSaya,
  getKlaimMasuk,
  getKontakChatSaya,
} from '../services/finditService';
import { useTheme } from '../context/ThemeContext';

const TABS = ['Semua', 'Klaim', 'Pesan', 'Sistem'];

export default function NotificationScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Semua');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLiveNotifications = async () => {
    try {
      const [posts, claims, chats] = await Promise.all([
        getBarangSaya().catch(() => []),
        getKlaimMasuk().catch(() => []),
        getKontakChatSaya().catch(() => []),
      ]);

      const notifList = [];

      // 1. Notifikasi Klaim Masuk
      if (Array.isArray(claims)) {
        claims.forEach((c) => {
          notifList.push({
            id: `claim_${c.id_klaim}`,
            title: 'Klaim Masuk Butuh Verifikasi',
            description: `${c.nama_pengklaim || 'Seorang pengguna'} mengajukan klaim untuk "${c.judul}". Ketuk untuk meninjau bukti.`,
            time: 'Perlu Tindakan',
            type: 'claim',
            isUnread: c.status_klaim === 'Pending',
            data: c,
          });
        });
      }

      // 2. Notifikasi Pesan Belum Dibaca
      if (Array.isArray(chats)) {
        chats.forEach((ch) => {
          if (ch.jumlah_belum_dibaca > 0) {
            notifList.push({
              id: `chat_${ch.id_user}_${ch.id_barang}`,
              title: `Pesan dari ${ch.nama}`,
              description: ch.pesan_terakhir || `Pesan baru terkait "${ch.judul}"`,
              time: 'Baru',
              type: 'message',
              isUnread: true,
              data: ch,
            });
          }
        });
      }

      // 3. Notifikasi Status Postingan Laporan
      if (Array.isArray(posts)) {
        posts.slice(0, 5).forEach((p) => {
          notifList.push({
            id: `post_${p.id_barang}`,
            title: `Laporan ${p.status} Aktif`,
            description: `Laporan "${p.judul}" berhasil dipublikasikan di area ${p.lokasi}.`,
            time: p.tanggal || 'Aktif',
            type: 'system',
            isUnread: false,
            data: p,
          });
        });
      }

      // Notifikasi Selamat Datang (Default Sistem)
      notifList.push({
        id: 'welcome_system',
        title: 'Selamat Datang di FindIt UINSA!',
        description: 'Bantu sesama mahasiswa menemukan dan mengembalikan barang yang hilang di kampus.',
        time: 'Info',
        type: 'system',
        isUnread: false,
      });

      setNotifications(notifList);
    } catch (e) {
      console.log('Error fetch notif:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveNotifications();
  };

  const renderIcon = (type) => {
    if (type === 'claim') {
      return (
        <View style={[styles.iconSquareGreen, isDark && { backgroundColor: '#064E3B' }]}>
          <Feather name="shield" size={18} color={isDark ? '#34D399' : '#047857'} />
        </View>
      );
    }
    if (type === 'message') {
      return (
        <View style={[styles.iconSquareBlue, isDark && { backgroundColor: '#1E3A8A' }]}>
          <Ionicons name="chatbubble-outline" size={18} color={isDark ? '#93C5FD' : '#2563EB'} />
        </View>
      );
    }
    return (
      <View style={[styles.iconSquareGray, isDark && { backgroundColor: '#334155' }]}>
        <Ionicons name="notifications-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
      </View>
    );
  };

  const filteredNotifs = notifications.filter((item) => {
    if (activeTab === 'Klaim') return item.type === 'claim';
    if (activeTab === 'Pesan') return item.type === 'message';
    if (activeTab === 'Sistem') return item.type === 'system';
    return true;
  });

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
        <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Pusat Notifikasi</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Filter Tabs */}
      <View style={[styles.tabsContainer, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={index}
                  style={styles.tabItem}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.tabText,
                      isDark && !isActive && { color: colors.textSecondary },
                      isActive && styles.tabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Notifications List */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#10B981" />
          </View>
        ) : (
          <View style={styles.listGroup}>
            {filteredNotifs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={48} color={isDark ? '#475569' : '#94A3B8'} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyText, isDark && { color: colors.textSecondary }]}>Tidak ada notifikasi di kategori ini</Text>
              </View>
            ) : (
              filteredNotifs.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notificationCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (item.type === 'message' && item.data) {
                      navigation.navigate('DirectChat', {
                        id_barang: item.data.id_barang,
                        id_penerima: item.data.id_user,
                        nama_penerima: item.data.nama,
                      });
                    } else if (item.type === 'claim' && item.data) {
                      navigation.navigate('ReviewClaim', { claim: item.data });
                    } else {
                      navigation.navigate('MyActivity');
                    }
                  }}
                >
                  {renderIcon(item.type)}

                  <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.titleText, isDark && { color: colors.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.isUnread && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={[styles.descriptionText, isDark && { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.description}
                    </Text>

                    <Text style={[styles.timeText, isDark && { color: colors.textSecondary }]}>{item.time}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
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
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 24,
  },
  tabItem: {
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  tabTextActive: {
    fontWeight: '700',
    color: '#10B981',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
  },
  listGroup: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 14,
    alignItems: 'flex-start',
  },
  iconSquareGreen: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquareBlue: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquareGray: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContent: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginLeft: 6,
  },
  descriptionText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  timeText: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
