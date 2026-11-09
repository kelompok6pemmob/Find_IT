import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import {
  getNotifikasi, markNotifikasiRead, markAllNotifikasiRead,
} from '../services/finditService';
import { useTheme } from '../context/ThemeContext';
import { showCustomAlert } from '../context/AlertContext';

const TABS = ['Semua', 'Klaim', 'Pesan', 'Sistem'];

export default function NotificationScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [activeTab, setActiveTab] = useState('Semua');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifikasi = async () => {
    try {
      const res = await getNotifikasi();
      if (res?.notifikasi && Array.isArray(res.notifikasi)) {
        setNotifications(res.notifikasi);
        setUnreadCount(res.belum_dibaca || 0);
      } else {
        setNotifications([]);
      }
    } catch (e) {
      console.log('Error fetch notif:', e?.message);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchNotifikasi);
    fetchNotifikasi();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => { setRefreshing(true); fetchNotifikasi(); };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotifikasiRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
      showCustomAlert({ title: 'Selesai', message: 'Semua notifikasi ditandai telah dibaca.', type: 'success' });
    } catch (e) {}
  };

  const handlePressNotif = async (item) => {
    if (!item.is_read) {
      try {
        await markNotifikasiRead(item.id_notifikasi);
        setNotifications((prev) => prev.map((n) => n.id_notifikasi === item.id_notifikasi ? { ...n, is_read: 1 } : n));
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {}
    }

    if (item.tipe === 'chat' && item.id_room) {
      navigation.navigate('DirectChat', { id_room: item.id_room, id_barang: item.id_barang });
    } else if (item.tipe === 'klaim' && item.id_klaim) {
      navigation.navigate('MyActivity');
    } else if (item.tipe === 'klaim' && item.id_barang) {
      navigation.navigate('DetailItem', { id_barang: item.id_barang });
    } else {
      navigation.navigate('MyActivity');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  const renderIcon = (tipe) => {
    if (tipe === 'klaim') {
      return (
        <View style={[styles.iconSquareGreen, isDark && { backgroundColor: '#064E3B' }]}>
          <Feather name="shield" size={18} color={isDark ? '#34D399' : '#047857'} />
        </View>
      );
    }
    if (tipe === 'chat') {
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
    if (activeTab === 'Klaim') return item.tipe === 'klaim';
    if (activeTab === 'Pesan') return item.tipe === 'chat';
    if (activeTab === 'Sistem') return item.tipe === 'sistem';
    return true;
  });

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={[styles.backButton, isDark && { backgroundColor: '#334155' }]} onPress={() => navigation?.goBack?.()}>
          <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Pusat Notifikasi</Text>
          {unreadCount > 0 && <Text style={styles.headerSubtitle}>{unreadCount} belum dibaca</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Tandai Semua</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.tabsContainer, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity key={index} style={styles.tabItem} onPress={() => setActiveTab(tab)}>
                  <Text style={[styles.tabText, isDark && !isActive && { color: colors.textSecondary }, isActive && styles.tabTextActive]}>
                    {tab}
                  </Text>
                  {isActive && <View style={styles.activeIndicator} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
                  key={item.id_notifikasi}
                  style={[
                    styles.notificationCard,
                    isDark && { backgroundColor: colors.card, borderColor: colors.border },
                    !item.is_read && styles.notificationCardUnread,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => handlePressNotif(item)}
                >
                  {renderIcon(item.tipe)}
                  <View style={styles.textContent}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.titleText, isDark && { color: colors.text }]} numberOfLines={1}>
                        {item.judul}
                      </Text>
                      {!item.is_read && <View style={styles.unreadDot} />}
                    </View>
                    <Text style={[styles.descriptionText, isDark && { color: colors.textSecondary }]} numberOfLines={2}>
                      {item.pesan}
                    </Text>
                    <Text style={[styles.timeText, isDark && { color: colors.textSecondary }]}>{formatTime(item.created_at)}</Text>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 60, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A' },
  headerSubtitle: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 2 },
  markAllButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#ECFDF5', borderRadius: 999 },
  markAllText: { fontSize: 12, fontWeight: '600', color: '#047857' },
  tabsContainer: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 24 },
  tabItem: { paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  tabTextActive: { fontWeight: '700', color: '#10B981' },
  activeIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, backgroundColor: '#10B981', borderRadius: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  listGroup: { gap: 12 },
  notificationCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', gap: 14, alignItems: 'flex-start' },
  notificationCardUnread: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0' },
  iconSquareGreen: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#D1FAE5', alignItems: 'center', justifyContent: 'center' },
  iconSquareBlue: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#DBEAFE', alignItems: 'center', justifyContent: 'center' },
  iconSquareGray: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  textContent: { flex: 1, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titleText: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981', marginLeft: 6 },
  descriptionText: { fontSize: 13, color: '#64748B', lineHeight: 18 },
  timeText: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 14, color: '#94A3B8' },
});