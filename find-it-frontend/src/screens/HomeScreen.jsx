import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, FlatList, StatusBar, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Octicons } from '@expo/vector-icons';
import { getBarangList, getKategori, formatPhotoUrl, formatKejadianDate, getWaktuUpload, getPostUploadTimes } from '../services/finditService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SwipeTabWrapper from '../components/SwipeTabWrapper';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

// PERBAIKAN ID KATEGORI SESUAI find_it.sql
const BASE_CATEGORIES = [
  { label: 'All', value: 'ALL', id_kategori: null },
  { label: 'Lost', value: 'Hilang', id_kategori: null },
  { label: 'Found', value: 'Ditemukan', id_kategori: null },
];

const INITIAL_CATEGORIES = [
  { label: 'All', value: 'ALL', id_kategori: null },
  { label: 'Lost', value: 'Hilang', id_kategori: null },
  { label: 'Found', value: 'Ditemukan', id_kategori: null },
  { label: 'Elektronik', value: 'ALL', id_kategori: 1 },
  { label: 'Dokumen', value: 'ALL', id_kategori: 4 }, // ID 4 = Dokumen dan Identitas
  { label: 'Kunci', value: 'ALL', id_kategori: 6 },   // ID 6 = Kunci
];

export default function HomeScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState(INITIAL_CATEGORIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('Mahasiswa UINSA');
  const [userPhoto, setUserPhoto] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({});

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id_user) setCurrentUserId(parsed.id_user);
          if (parsed.nama) setUserName(parsed.nama);
          if (parsed.foto_profil) setUserPhoto(formatPhotoUrl(parsed.foto_profil));
        }
        const meta = await getPostUploadTimes();
        setUploadMeta(meta);
      } catch (e) {}
    };
    const unsubscribe = navigation.addListener('focus', loadUserData);
    loadUserData();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const fetchDynamicCategories = async () => {
      try {
        const data = await getKategori();
        if (Array.isArray(data) && data.length > 0) {
          const formattedBackendCats = data.map((k) => ({
            label: k.nama_kategori, value: 'ALL', id_kategori: k.id_kategori,
          }));
          setCategories([...BASE_CATEGORIES, ...formattedBackendCats]);
        }
      } catch (err) {}
    };
    fetchDynamicCategories();
  }, []);

  const fetchBarang = async () => {
    try {
      const params = {};
      if (activeCategory.value !== 'ALL') params.status = activeCategory.value;
      if (activeCategory.id_kategori) params.id_kategori = activeCategory.id_kategori;
      const data = await getBarangList(params);
      if (Array.isArray(data)) setItems(data);
    } catch (error) {
      console.log('Error fetch barang:', error?.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBarang(); }, [activeCategory]);

  const onRefresh = () => { setRefreshing(true); fetchBarang(); };

  const filteredItems = items.filter(
    (item) => item.judul?.toLowerCase().includes(searchQuery.toLowerCase()) || item.lokasi?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadgeInfo = (status) => {
    if (status === 'Dikembalikan') return { label: 'DIKEMBALIKAN', badgeStyle: styles.badgeReturned, eventLabel: 'Dikembalikan' };
    if (status === 'Ditemukan') return { label: 'FOUND', badgeStyle: styles.badgeFound, eventLabel: 'Ditemukan' };
    return { label: 'LOST', badgeStyle: styles.badgeLost, eventLabel: 'Kehilangan' };
  };

  const renderItemCard = ({ item }) => {
    const statusInfo = getStatusBadgeInfo(item.status);
    // PERBAIKAN: Gunakan foto_utama (fallback ke foto_url jika ada)
    const imageUrl = formatPhotoUrl(item.foto_utama || item.foto_url);
    const isMyPost = Boolean(currentUserId && item.id_user && Number(item.id_user) === Number(currentUserId));
    const authorName = isMyPost && userName ? `${userName} (Saya)` : (item.nama_pengunggah || 'Mahasiswa');

    return (
      <TouchableOpacity
        style={[styles.card, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.9}
        onPress={() => navigation.navigate('DetailItem', { id_barang: item.id_barang, item: item })}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUrl || 'https://via.placeholder.com/300x200?text=No+Image' }} style={styles.cardImage} />
          <View style={[styles.badge, statusInfo.badgeStyle]}>
            <Text style={styles.badgeText}>{statusInfo.label}</Text>
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, isDark && { color: colors.text }]} numberOfLines={1}>{item.judul}</Text>
          <View style={styles.authorRow}>
            <Ionicons name="person-circle-outline" size={13} color={isDark ? '#34D399' : '#047857'} />
            <Text style={[styles.authorText, isDark && { color: '#34D399' }]} numberOfLines={1}>{authorName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={13} color="#64748B" />
            <Text style={styles.infoText} numberOfLines={1}>{item.lokasi}</Text>
          </View>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={12} color="#10B981" />
            {/* PERBAIKAN: Gunakan tanggal_kejadian */}
            <Text style={[styles.eventDateText, isDark && { color: colors.textSecondary }]} numberOfLines={1}>
              {statusInfo.eventLabel}: {formatKejadianDate(item.tanggal_kejadian || item.tanggal)}
            </Text>
          </View>
          <View style={styles.timeRow}>
            <Ionicons name="time-outline" size={11} color="#94A3B8" />
            <Text style={styles.timeText} numberOfLines={1}>Diposting {getWaktuUpload(item, uploadMeta)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.background : '#F8FAFC'} />
      <SwipeTabWrapper onSwipeLeft={() => navigation.navigate('ChatTab')}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.userInfo} activeOpacity={0.8} onPress={() => navigation.navigate('ProfileTab')}>
              <Image source={{ uri: userPhoto || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200' }} style={styles.avatar} />
              <View>
                <Text style={[styles.greeting, isDark && { color: colors.textSecondary }]}>Selamat Datang!</Text>
                <Text style={[styles.userName, isDark && { color: colors.text }]}>Hello, {userName}</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.notificationButton, isDark && { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigation.navigate('Notifications')}>
              <Ionicons name="notifications-outline" size={22} color={isDark ? colors.text : '#0F172A'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.searchContainer, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search-outline" size={20} color="#94A3B8" style={styles.searchIcon} />
            <TextInput placeholder="Search lost or found items..." placeholderTextColor="#94A3B8" style={[styles.searchInput, isDark && { color: colors.text }]} value={searchQuery} onChangeText={setSearchQuery} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryContainer}>
            {categories.map((cat, index) => {
              const isActive = activeCategory.label === cat.label;
              return (
                <TouchableOpacity key={index} style={[styles.categoryChip, isDark && !isActive && { backgroundColor: colors.card, borderColor: colors.border }, isActive && styles.categoryChipActive]} onPress={() => setActiveCategory(cat)}>
                  <Text style={[styles.categoryText, isDark && !isActive && { color: colors.textSecondary }, isActive && styles.categoryTextActive]}>{cat.label}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {loading ? (
            <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#10B981" /></View>
          ) : (
            <FlatList data={filteredItems} keyExtractor={(item) => item.id_barang.toString()} renderItem={renderItemCard} numColumns={2} scrollEnabled={false} columnWrapperStyle={styles.gridRow} contentContainerStyle={styles.gridContainer} ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Tidak ada barang ditemukan</Text></View>} />
          )}
        </ScrollView>
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 90 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 12, marginBottom: 20 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  greeting: { fontSize: 12, color: '#64748B' },
  userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  notificationButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 20, paddingHorizontal: 14, borderRadius: 16, height: 50, marginBottom: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#0F172A' },
  categoryContainer: { paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  categoryChip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  categoryText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  categoryTextActive: { color: '#FFFFFF', fontWeight: '600' },
  gridContainer: { paddingHorizontal: 20 },
  gridRow: { justifyContent: 'space-between', marginBottom: 16 },
  card: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9' },
  imageContainer: { position: 'relative', width: '100%', height: 130 },
  cardImage: { width: '100%', height: '100%' },
  badge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeFound: { backgroundColor: '#3B82F6' },
  badgeLost: { backgroundColor: '#EF4444' },
  badgeReturned: { backgroundColor: '#10B981' },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  cardContent: { padding: 12 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  authorText: { fontSize: 11, color: '#047857', fontWeight: '600', flex: 1 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  infoText: { fontSize: 11, color: '#64748B', flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 },
  eventDateText: { fontSize: 11, color: '#334155', fontWeight: '500', flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  timeText: { fontSize: 10, color: '#94A3B8' },
  loadingContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#94A3B8' },
});