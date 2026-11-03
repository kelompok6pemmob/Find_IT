import React, { useState } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import SwipeTabWrapper from'../components/SwipeTabWrapper';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';

// Dummy Data Barang Tersimpan
const SAVED_ITEMS = [
  {
    id:'1',
    title:'Kunci Motor Honda',
    location:'Gedung SAC',
    time:'2 jam yang lalu',
    type:'LOST',
    image:'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=300&auto=format&fit=crop',
  },
  {
    id:'2',
    title:'Laptop Asus Silver',
    location:'Lab Komputer FT',
    time:'5 jam yang lalu',
    type:'LOST',
    image:'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=300&auto=format&fit=crop',
  },
  {
    id:'3',
    title:'Dompet Pedro Hi...',
    location:'Perpustakaan UINSA',
    time:'02 Mei 2025 • 14:30',
    type:'FOUND',
    image:'https://images.unsplash.com/photo-1627123424574-724758594e93?q=80&w=300&auto=format&fit=crop',
  },
  {
    id:'4',
    title:'Tumbler Thermos...',
    location:'Gedung FEBI',
    time:'1 hari yang lalu',
    type:'FOUND',
    image:'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=300&auto=format&fit=crop',
  },
  {
    id:'5',
    title:'Kacamata Minus...',
    location:'Masjid UINSA',
    time:'3 hari yang lalu',
    type:'LOST',
    image:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=300&auto=format&fit=crop',
  },
];

export default function SavedItemsScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [savedList, setSavedList] = useState(SAVED_ITEMS);

  const handleRemoveBookmark = (item) => {
    showCustomAlert({
      title:'Hapus dari Simpanan?',
      message: `Apakah kamu ingin menghapus"${item.title}" dari daftar barang tersimpan?`,
      type:'warning',
      buttons: [
        { text:'Batal', style:'cancel' },
        {
          text:'Hapus',
          style:'destructive',
          onPress: () => {
            setSavedList((prev) => prev.filter((i) => i.id !== item.id));
          },
        },
      ],
    });
  };
  const renderSavedCard = ({ item }) => {
    const isFound = item.type ==='FOUND';

    return (
      <TouchableOpacity
        style={[styles.card, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() =>
          navigation.navigate('DetailItem', {
            id_barang: item.id,
            item: {
              id_barang: item.id,
              judul: item.title,
              lokasi: item.location,
              tanggal: item.time,
              status: item.type ==='FOUND' ?'Ditemukan' :'Hilang',
              foto_url: item.image,
              nama_kategori: item.type ==='FOUND' ?'Dokumen / Temuan' :'Barang Hilang',
              nama_pengunggah:'Pengguna UINSA',
              deskripsi: `Laporan barang tersimpan: ${item.title}. Ditemukan/hilang di ${item.location}.`,
            },
          })
        }
      >
        <Image source={{ uri: item.image }} style={styles.itemImage} />

        <View style={styles.cardDetails}>
          <View style={styles.titleRow}>
            <Text style={[styles.itemTitle, isDark && { color: colors.text }]} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={[styles.badge, isFound ? styles.badgeFound : styles.badgeLost]}>
              <Text style={[styles.badgeText, isFound ? styles.badgeTextFound : styles.badgeTextLost]}>
                {item.type}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={14} color="#64748B" />
            <Text style={[styles.infoText, isDark && { color: colors.textSecondary }]} numberOfLines={1}>
              {item.location}
            </Text>
          </View>

          <Text style={[styles.timeText, isDark && { color: colors.textSecondary }]}>{item.time}</Text>
        </View>

        {/* Action Bookmark Active */}
        <TouchableOpacity
          style={styles.bookmarkButton}
          activeOpacity={0.7}
          onPress={() => handleRemoveBookmark(item)}
        >
          <Feather name="bookmark" size={18} color="#10B981" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.card : '#FFFFFF'}
      />

      <SwipeTabWrapper
        onSwipeRight={() => navigation.navigate('ChatTab')}
        onSwipeLeft={() => navigation.navigate('ProfileTab')}
      >
        {/* Header */}
        <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Saved Items</Text>
        </View>

      {/* List Barang */}
      <FlatList
        data={savedList}
        keyExtractor={(item) => item.id}
        renderItem={renderSavedCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={{ alignItems:'center', justifyContent:'center', paddingVertical: 60, paddingHorizontal: 24 }}>
            <Feather name="bookmark" size={48} color="#94A3B8" style={{ marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight:'700', color: isDark ? colors.text : '#0F172A', marginBottom: 8 }}>
              Belum ada barang tersimpan
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? colors.textSecondary : '#64748B', textAlign:'center', lineHeight: 20, marginBottom: 20 }}>
              Simpan laporan barang yang ingin kamu pantau dengan menekan tombol bookmark pada detail barang.
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor:'#10B981',
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderRadius: 9999,
              }}
              onPress={() => navigation.navigate('HomeTab')}
            >
              <Text style={{ color:'#FFFFFF', fontWeight:'600', fontSize: 14 }}>
                Jelajahi Beranda
              </Text>
            </TouchableOpacity>
          </View>
        }
      />
      </SwipeTabWrapper>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:'#F8FAFC',
  },
  header: {
  paddingHorizontal: 20,
  paddingVertical: 14,
  backgroundColor:'#FFFFFF',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight:'700',
    color:'#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 12,
  },
  card: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor:'#F1F5F9',
  },
  itemImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight:'700',
    color:'#0F172A',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeFound: {
    backgroundColor:'#DBEAFE',
  },
  badgeLost: {
    backgroundColor:'#FEE2E2',
  },
  badgeText: {
    fontSize: 10,
    fontWeight:'700',
  },
  badgeTextFound: {
    color:'#2563EB',
  },
  badgeTextLost: {
    color:'#DC2626',
  },
  infoRow: {
    flexDirection:'row',
    alignItems:'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color:'#64748B',
  },
  timeText: {
    fontSize: 11,
    color:'#94A3B8',
  },
  bookmarkButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:'#ECFDF5',
    alignItems:'center',
    justifyContent:'center',
    marginLeft: 8,
  },
});