import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity, FlatList,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getChatRoomsSaya, formatPhotoUrl } from '../services/finditService';
import SwipeTabWrapper from '../components/SwipeTabWrapper';
import { useTheme } from '../context/ThemeContext';

const FILTER_TABS = ['Semua', 'Belum Dibaca', 'Klaim Aktif'];

export default function ChatListScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchChatRooms = async () => {
    try {
      const data = await getChatRoomsSaya();
      if (Array.isArray(data)) setChats(data);
      else setChats([]);
    } catch (error) {
      console.log('Chat rooms error:', error?.message);
      setChats([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchChatRooms);
    fetchChatRooms();
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => { setRefreshing(true); fetchChatRooms(); };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const filteredChats = chats.filter((item) => {
    const matchSearch =
      item.nama_lawan?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.judul?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (activeFilter === 'Belum Dibaca') return item.belum_dibaca > 0;
    if (activeFilter === 'Klaim Aktif') return item.status_barang !== 'Dikembalikan';
    return true;
  });

  const renderChatItem = ({ item }) => {
    const avatarUrl = formatPhotoUrl(item.foto_lawan);
    const itemPhotoUrl = formatPhotoUrl(item.foto_barang);
    return (
      <TouchableOpacity
        style={[styles.chatCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() =>
          navigation.navigate('DirectChat', {
            id_room: item.id_room,
            id_barang: item.id_barang,
            id_penerima: item.id_lawan,
            nama_penerima: item.nama_lawan,
            item: {
              id_barang: item.id_barang,
              judul: item.judul,
              lokasi: '',
              status: item.status_barang,
              foto_utama: item.foto_barang,
              nama_pengunggah: item.nama_lawan,
            },
          })
        }
      >
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.initialAvatar, { backgroundColor: isDark ? '#1E3A8A' : '#DBEAFE' }]}>
              <Text style={[styles.initialText, { color: isDark ? '#93C5FD' : '#1E40AF' }]}>
                {getInitials(item.nama_lawan)}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.chatDetails}>
          <View style={styles.nameRow}>
            <Text style={[styles.userName, isDark && { color: colors.text }]} numberOfLines={1}>
              {item.nama_lawan}
            </Text>
            <View style={styles.rightMeta}>
              {item.belum_dibaca > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.belum_dibaca}</Text>
                </View>
              )}
              <Text style={[styles.timeText, isDark && { color: colors.textSecondary }]}>
                {formatTime(item.waktu_pesan_terakhir)}
              </Text>
            </View>
          </View>
          <View style={styles.itemTagRow}>
            <View style={[styles.itemTitleChip, isDark && { backgroundColor: '#334155' }]}>
              <Text style={[styles.itemTitleText, isDark && { color: '#34D399' }]} numberOfLines={1}>
                {item.judul}
              </Text>
            </View>
            {item.status_barang && (
              <Text style={[
                styles.statusTagText,
                item.status_barang === 'Dikembalikan' ? styles.statusDone : styles.statusClaimActive,
              ]}>
                {item.status_barang === 'Dikembalikan' ? 'Selesai' : item.status_barang}
              </Text>
            )}
          </View>
          <Text style={[styles.lastMessage, isDark && { color: colors.textSecondary }]} numberOfLines={1}>
            {item.pesan_terakhir || 'Belum ada pesan'}
          </Text>
        </View>
        <Image
          source={{ uri: itemPhotoUrl || 'https://via.placeholder.com/100?text=Barang' }}
          style={styles.itemThumbnail}
        />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />
      <SwipeTabWrapper onSwipeRight={() => navigation.navigate('HomeTab')} onSwipeLeft={() => navigation.navigate('SavedTab')}>
        <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Pesan</Text>
        </View>
        <View style={[styles.searchContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
          <TextInput
            placeholder="Cari nama atau judul barang..."
            placeholderTextColor="#94A3B8"
            style={[styles.searchInput, isDark && { color: colors.text }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterBar}>
          {FILTER_TABS.map((tab, index) => {
            const isActive = activeFilter === tab;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.filterChip,
                  isDark && !isActive && { backgroundColor: colors.card, borderColor: colors.border },
                  isActive && styles.filterChipActive,
                ]}
                onPress={() => setActiveFilter(tab)}
              >
                <Text style={[
                  styles.filterText,
                  isDark && !isActive && { color: colors.textSecondary },
                  isActive && styles.filterTextActive,
                ]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {loading ? (
          <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#10B981" /></View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={(item) => `room_${item.id_room}`}
            renderItem={renderChatItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="chatbubble-ellipses-outline" size={48} color="#10B981" />
                </View>
                <Text style={[styles.emptyTitle, isDark && { color: colors.text }]}>Belum ada pesan masuk</Text>
                <Text style={[styles.emptySubtitle, isDark && { color: colors.textSecondary }]}>
                  Mulai chat dari detail barang untuk bertanya kepada pemilik atau penemu.
                </Text>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => navigation.navigate('HomeTab')}
                >
                  <Text style={styles.emptyButtonText}>Cari Barang di Beranda</Text>
                </TouchableOpacity>
              </View>
            }
          />
        )}
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#0F172A' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, marginTop: 12, marginBottom: 12, paddingHorizontal: 14, borderRadius: 16, height: 48, borderWidth: 1, borderColor: '#F1F5F9' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  filterBar: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#64748B' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '600' },
  listContent: { paddingHorizontal: 20, paddingBottom: 90, gap: 12 },
  chatCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  avatarContainer: { marginRight: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  initialAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  initialText: { fontSize: 15, fontWeight: '700' },
  chatDetails: { flex: 1, marginRight: 10 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  userName: { fontSize: 15, fontWeight: '700', color: '#0F172A', flex: 1 },
  rightMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadBadge: { backgroundColor: '#10B981', minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  unreadText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  timeText: { fontSize: 11, color: '#10B981', fontWeight: '500' },
  itemTagRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  itemTitleChip: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, maxWidth: '70%' },
  itemTitleText: { fontSize: 11, fontWeight: '600', color: '#047857' },
  statusTagText: { fontSize: 11, fontWeight: '600' },
  statusClaimActive: { color: '#047857' },
  statusDone: { color: '#64748B' },
  lastMessage: { fontSize: 12, color: '#64748B' },
  itemThumbnail: { width: 44, height: 44, borderRadius: 8 },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center', paddingHorizontal: 32 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginBottom: 8, textAlign: 'center' },
  emptySubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 20 },
  emptyButton: { marginTop: 16, backgroundColor: '#10B981', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999 },
  emptyButtonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
});