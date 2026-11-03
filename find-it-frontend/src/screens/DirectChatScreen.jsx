import React, { useState, useEffect, useRef } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather } from'@expo/vector-icons';
import * as ImagePicker from'expo-image-picker';
import AsyncStorage from'@react-native-async-storage/async-storage';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import {
  getPesanByBarang,
  sendPesan,
  markPesanAsRead,
  formatPhotoUrl,
  formatKejadianDate,
  getWaktuUpload,
} from'../services/finditService';

export default function DirectChatScreen({ navigation, route }) {
  const { isDark, colors } = useTheme();
  const {
    id_barang,
    id_penerima,
    nama_penerima,
    role = 'finder',
    item,
    claimStatus: paramClaimStatus,
  } = route?.params || {};

  const [claimStatus, setClaimStatus] = useState(paramClaimStatus ||'chatting');
  const [currentUserId, setCurrentUserId] = useState(null);
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const scrollViewRef = useRef();

  const activeItem = item || {
    id_barang: id_barang,
    judul:'Laporan Barang',
    lokasi:'UINSA Kampus',
    tanggal:'Hari ini',
    status:'Ditemukan',
    foto_url: null,
  };

  const recipientName =
    nama_penerima ||
    activeItem.nama_pengunggah ||
    (role === 'finder' ? 'Penemu Barang' : 'Pemilik Barang');

  // Load user data dari AsyncStorage
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id_user) setCurrentUserId(parsed.id_user);
        }
      } catch (e) {}
    };
    loadCurrentUser();
  }, []);

  // Fetch riwayat percakapan dari backend
  const fetchMessages = async (userId) => {
    const myId = userId || currentUserId;
    if (!id_barang || !id_penerima) return;
    try {
      const data = await getPesanByBarang(id_barang, id_penerima);
      if (Array.isArray(data)) {
        const formatted = data.map((msg) => {
          const isMe = msg.id_pengirim === myId;
          const d = new Date(msg.timestamp);
          const timeStr = !isNaN(d.getTime())
            ? `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
            :'';
          return {
            id: String(msg.id_pesan),
            sender: isMe ?'sender' :'receiver',
            text: msg.isi_pesan,
            time: timeStr,
          };
        });
        setMessagesList(formatted);
      }
      // Tandai sudah dibaca
      markPesanAsRead(id_barang).catch(() => {});
    } catch (err) {
      console.log('Error fetchMessages:', err?.message);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchMessages(currentUserId);
      const interval = setInterval(() => {
        fetchMessages(currentUserId);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUserId, id_barang, id_penerima]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    const textToSend = message.trim();
    setMessage('');

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;

    // Optimistic UI update
    const optimisticId = Date.now().toString();
    setMessagesList((prev) => [
      ...prev,
      {
        id: optimisticId,
        sender:'sender',
        text: textToSend,
        time: timeStr,
      },
    ]);

    try {
      if (id_barang && id_penerima) {
        await sendPesan(id_barang, id_penerima, textToSend);
      }
    } catch (err) {
      console.log('Kirim pesan via backend gagal, pesan tersimpan lokal:', err?.message);
    }
  };

  const handlePickAttachment = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showCustomAlert({ title: 'Izin Ditolak', message: 'Akses galeri dibutuhkan untuk mengirim foto bukti.', type: 'warning' });
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
        
        setMessagesList((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender:'sender',
            text:' Foto bukti terlampir',
            imageUri: result.assets[0].uri,
            time: timeStr,
          },
        ]);
      }
    } catch (e) {
      showCustomAlert({ title: 'Gagal Melampirkan', message: 'Tidak dapat memproses foto lampiran.', type: 'error' });
    }
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.card : '#FFFFFF'}
      />

      {/* Header */}
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backButton, isDark && { backgroundColor: isDark ? '#334155' : '#F8FAFC' }]}
            onPress={() => navigation?.goBack?.()}
          >
            <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
          </TouchableOpacity>

          <View style={styles.userProfile}>
            <Image
              source={{
                uri: role ==='finder'
                  ?'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
                  :'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
              }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, isDark && { color: colors.text }]}>
                {recipientName}
              </Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>Online</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS ==='ios' ?'padding' :'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Card Context Item */}
          <TouchableOpacity
            style={[styles.itemCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() =>
              navigation.navigate('DetailItem', {
                id_barang: activeItem.id_barang,
                item: activeItem,
              })
            }
          >
            <Image
              source={{
                uri: formatPhotoUrl(activeItem.foto_url) ||'https://via.placeholder.com/200?text=No+Photo',
              }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemSubtitle}>
                {activeItem.status === 'Ditemukan'
                  ? 'Laporan Penemuan • ' + (activeItem.nama_pengunggah || recipientName)
                  : activeItem.status === 'Dikembalikan'
                  ? 'Laporan Selesai • ' + (activeItem.nama_pengunggah || recipientName)
                  : 'Laporan Kehilangan • ' + (activeItem.nama_pengunggah || recipientName)}
              </Text>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>{activeItem.judul || 'Laporan Barang'}</Text>
              <Text style={styles.itemMeta}>{activeItem.lokasi || 'UINSA Kampus'}</Text>
              <Text style={styles.itemMeta}>
                {activeItem.status === 'Ditemukan' ? 'Ditemukan' : activeItem.status === 'Dikembalikan' ? 'Dikembalikan' : 'Kehilangan'}: {formatKejadianDate(activeItem.tanggal)} • Diposting: {getWaktuUpload(activeItem)}
              </Text>
            </View>
            <View
              style={[
                styles.foundBadge,
                activeItem.status === 'Dikembalikan'
                  ? styles.badgeReturned
                  : activeItem.status === 'Hilang'
                  ? styles.badgeLost
                  : styles.badgeFound,
              ]}
            >
              <Text
                style={[
                  styles.foundBadgeText,
                  activeItem.status === 'Dikembalikan'
                    ? styles.badgeTextReturned
                    : activeItem.status === 'Hilang'
                    ? styles.badgeTextLost
                    : styles.badgeTextFound,
                ]}
              >
                {activeItem.status === 'Dikembalikan' ? 'SELESAI' : activeItem.status === 'Ditemukan' ? 'FOUND' : 'LOST'}
              </Text>
            </View>
          </TouchableOpacity>

          {/* DYNAMIC BANNER STATUS */}
          
          {/* 1. POV Penemu - Chat Awal (Belum ada klaim) */}
          {role ==='finder' && claimStatus ==='chatting' && (
            <View style={styles.bannerNoticeStateA}>
              <Ionicons name="shield-checkmark-outline" size={20} color="#047857" />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerTitleA}>Verifikasi sebelum menyetujui</Text>
                <Text style={styles.bannerTextA}>
                  Tanyakan ciri barang dan cocokkan bukti kepemilikan sebelum menyetujui klaim.
                </Text>
              </View>
            </View>
          )}

          {/* 2. POV Penemu - Klaim Diajukan (Menunggu Review Penemu) */}
          {role ==='finder' && claimStatus ==='submitted' && (
            <View style={styles.bannerCardStateB}>
              <View style={styles.pendingBadge}>
                <Feather name="clock" size={14} color="#92400E" />
                <Text style={styles.pendingText}>Menunggu verifikasi Anda</Text>
              </View>
              <Text style={styles.bannerTextB}>
                {recipientName} mengajukan klaim. Periksa bukti sebelum menyetujui.
              </Text>
              <TouchableOpacity
                style={styles.actionButtonB}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ReviewClaim')}
              >
                <Text style={styles.actionTextB}>Tinjau & Verifikasi Klaim</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}

          {/* 3. POV Penemu - Klaim Disetujui (Menunggu Serah Terima) */}
          {role ==='finder' && claimStatus ==='approved' && (
            <View style={styles.bannerCardStateC}>
              <View style={styles.approvedBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#047857" />
                <Text style={styles.approvedText}>Klaim Disetujui</Text>
              </View>
              <Text style={styles.bannerTextC}>
                Barang belum diserahkan. Tandai dikembalikan hanya setelah serah terima langsung.
              </Text>
              <TouchableOpacity
                style={styles.actionButtonC}
                activeOpacity={0.85}
                onPress={() => {
                  showCustomAlert({
                    title:'Konfirmasi Serah Terima',
                    message:'Apakah barang ini sudah diserahterimakan langsung secara aman kepada pemiliknya?',
                    type:'success',
                    buttons: [
                      { text:'Batal', style:'cancel' },
                      {
                        text:'Ya, Sudah Diserahkan',
                        style:'default',
                        onPress: () => {
                          setClaimStatus('returned');
                          showCustomAlert({
                            title:'Serah Terima Selesai!',
                            message:'Terima kasih telah membantu sesama mahasiswa UINSA. Status barang kini telah selesai.',
                            type:'success',
                          });
                        },
                      },
                    ],
                  });
                }}
              >
                <Text style={styles.actionTextC}>Tandai Sudah Dikembalikan</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <View style={styles.dateChip}>
              <Text style={styles.dateText}>{formatKejadianDate(new Date().toISOString())}</Text>
            </View>
          </View>

          {/* Bubble Chat List */}
          {messagesList.length === 0 ? (
            <View style={styles.emptyChatBox}>
              <Ionicons name="chatbubbles-outline" size={36} color="#CBD5E1" />
              <Text style={styles.emptyChatTitle}>Belum ada riwayat pesan</Text>
              <Text style={styles.emptyChatSubtitle}>
                Kirim pesan pertama kamu kepada {recipientName} mengenai laporan ini.
              </Text>
            </View>
          ) : (
            messagesList.map((msg) => {
              const isMe = msg.sender ==='sender';
              return (
                <View
                  key={msg.id}
                  style={[
                    styles.messageBubble,
                    isMe ? styles.senderBubble : [styles.receiverBubble, isDark && { backgroundColor: colors.card, borderColor: colors.border }],
                  ]}
                >
                  {msg.imageUri && (
                    <Image
                      source={{ uri: msg.imageUri }}
                      style={{ width: 180, height: 130, borderRadius: 10, marginBottom: 6 }}
                      resizeMode="cover"
                    />
                  )}
                  <Text style={isMe ? styles.senderText : [styles.receiverText, isDark && { color: colors.text }]}>
                    {msg.text}
                  </Text>
                  {isMe ? (
                    <View style={styles.timeCheckRow}>
                      <Text style={styles.senderTime}>{msg.time}</Text>
                      <Ionicons name="checkmark-done" size={15} color="#E6F4EA" />
                    </View>
                  ) : (
                    <Text style={styles.receiverTime}>{msg.time}</Text>
                  )}
                </View>
              );
            })
          )}

          {/* Card Bukti Klaim Terkirim (Muncul di Chat jika status submitted) */}
          {claimStatus ==='submitted' && (
            <TouchableOpacity
              style={styles.attachmentCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('ReviewClaim')}
            >
              <View style={styles.attachmentIconBox}>
                <Ionicons name="copy-outline" size={20} color="#047857" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.attachmentTitle}>Bukti klaim terkirim • 10:29</Text>
                <Text style={styles.attachmentSubtitle}>2 foto + penjelasan kepemilikan (Ketuk untuk tinjau)</Text>
              </View>
              <Feather name="chevron-right" size={18} color="#047857" />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Bottom Bar Input & Tombol Klaim (Khusus Pemilik/Claimer) */}
        <View style={[styles.bottomContainer, isDark && { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {/* Tombol Ajukan Klaim hanya muncul buat si Pemilik dan kalo belum pernah klaim */}
          {role ==='claimer' && claimStatus ==='chatting' && (
            <View style={styles.claimActionWrapper}>
              <TouchableOpacity
                style={styles.claimButton}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('ClaimForm')}
              >
                <Text style={styles.claimButtonText}>Ajukan Klaim Barang</Text>
              </TouchableOpacity>
              <Text style={styles.claimHelperText}>
                Klaim menunggu verifikasi kepemilikan oleh penemu.
              </Text>
            </View>
          )}

          {/* Input Chat Area */}
          <View style={styles.inputBar}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={handlePickAttachment}
            >
              <Feather name="paperclip" size={20} color="#64748B" />
            </TouchableOpacity>

            <TextInput
              style={[styles.chatInput, isDark && { backgroundColor: isDark ? "#334155" : "#F8FAFC", color: colors.text }]}
              placeholder="Ketik pesanmu disini..."
              placeholderTextColor="#94A3B8"
              value={message}
              onChangeText={setMessage}
              onSubmitEditing={handleSendMessage}
            />

            <TouchableOpacity
              style={styles.sendButton}
              activeOpacity={0.85}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor:'#F8FAFC' },
  header: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor:'#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor:'#F1F5F9',
  },
  headerLeft: { flexDirection:'row', alignItems:'center', gap: 12 },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:'#F8FAFC',
    alignItems:'center',
    justifyContent:'center',
  },
  userProfile: { flexDirection:'row', alignItems:'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userName: { fontSize: 16, fontWeight:'700', color:'#0F172A' },
  statusRow: { flexDirection:'row', alignItems:'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor:'#10B981' },
  statusText: { fontSize: 12, color:'#10B981', fontWeight:'500' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
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
  itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemSubtitle: { fontSize: 12, color:'#047857', fontWeight:'600', marginBottom: 2 },
  itemTitle: { fontSize: 15, fontWeight:'700', color:'#0F172A', marginBottom: 2 },
  itemMeta: { fontSize: 12, color:'#64748B' },
  foundBadge: {
    backgroundColor:'#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf:'flex-start',
  },
  foundBadgeText: { color:'#2563EB', fontSize: 10, fontWeight:'700' },
  badgeFound: { backgroundColor:'#DBEAFE' },
  badgeLost: { backgroundColor:'#FEE2E2' },
  badgeReturned: { backgroundColor:'#D1FAE5' },
  badgeTextFound: { color:'#2563EB' },
  badgeTextLost: { color:'#DC2626' },
  badgeTextReturned: { color:'#047857' },
  bannerNoticeStateA: {
    flexDirection:'row',
    backgroundColor:'#ECFDF5',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  bannerTitleA: { fontSize: 13, fontWeight:'700', color:'#047857', marginBottom: 2 },
  bannerTextA: { fontSize: 12, color:'#047857', lineHeight: 16 },
  bannerCardStateB: {
    backgroundColor:'#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor:'#10B981',
    marginBottom: 16,
    gap: 10,
  },
  pendingBadge: {
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
    backgroundColor:'#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf:'flex-start',
  },
  pendingText: { fontSize: 12, fontWeight:'700', color:'#92400E' },
  bannerTextB: { fontSize: 13, color:'#475569' },
  actionButtonB: {
    backgroundColor:'#10B981',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center',
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  actionTextB: { color:'#FFFFFF', fontSize: 15, fontWeight:'600' },
  bannerCardStateC: {
    backgroundColor:'#ECFDF5',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  approvedBadge: {
    flexDirection:'row',
    alignItems:'center',
    gap: 6,
    backgroundColor:'#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf:'flex-start',
  },
  approvedText: { fontSize: 12, fontWeight:'700', color:'#047857' },
  bannerTextC: { fontSize: 12, color:'#047857', lineHeight: 16 },
  actionButtonC: {
    backgroundColor:'#FFFFFF',
    borderWidth: 1,
    borderColor:'#10B981',
    alignItems:'center',
    justifyContent:'center',
    paddingVertical: 12,
    borderRadius: 999,
  },
  actionTextC: { color:'#047857', fontSize: 14, fontWeight:'700' },
  dateDivider: { alignItems:'center', marginBottom: 16 },
  emptyChatBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyChatTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  emptyChatSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  dateChip: { backgroundColor:'#E2E8F0', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 },
  dateText: { fontSize: 11, fontWeight:'600', color:'#475569' },
  messageBubble: { maxWidth:'82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  senderBubble: { alignSelf:'flex-end', backgroundColor:'#10B981', borderBottomRightRadius: 2 },
  receiverBubble: { alignSelf:'flex-start', backgroundColor:'#FFFFFF', borderWidth: 1, borderColor:'#F1F5F9', borderBottomLeftRadius: 2 },
  senderText: { color:'#FFFFFF', fontSize: 14 },
  receiverText: { color:'#0F172A', fontSize: 14 },
  timeCheckRow: { flexDirection:'row', alignItems:'center', justifyContent:'flex-end', gap: 4 },
  senderTime: { fontSize: 10, color:'#E6F4EA' },
  receiverTime: { fontSize: 10, color:'#94A3B8', alignSelf:'flex-end' },
  attachmentCard: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#F1F5F9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  attachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor:'#FFFFFF',
    alignItems:'center',
    justifyContent:'center',
  },
  attachmentTitle: { fontSize: 13, fontWeight:'700', color:'#0F172A' },
  attachmentSubtitle: { fontSize: 11, color:'#64748B' },
  bottomContainer: {
    backgroundColor:'#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:'#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  claimActionWrapper: { marginBottom: 10 },
  claimButton: {
    backgroundColor:'#10B981',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems:'center',
    justifyContent:'center',
    marginBottom: 6,
  },
  claimButtonText: { color:'#FFFFFF', fontSize: 15, fontWeight:'600' },
  claimHelperText: { fontSize: 11, color:'#64748B', textAlign:'center' },
  inputBar: { flexDirection:'row', alignItems:'center', gap: 8 },
  attachmentButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:'#F8FAFC',
    alignItems:'center',
    justifyContent:'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor:'#F1F5F9',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 42,
    fontSize: 14,
    color:'#0F172A',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:'#10B981',
    alignItems:'center',
    justifyContent:'center',
  },
});