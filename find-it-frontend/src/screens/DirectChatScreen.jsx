import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView,
  StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';
import {
  openOrCreateRoom, getPesanByRoom, sendPesanKeRoom, sendPesanGambarKeRoom,
  markRoomAsRead, formatPhotoUrl, formatKejadianDate, getWaktuUpload,
} from '../services/finditService';
import { pickImageWithActionSheet } from '../utils/pickImage';

export default function DirectChatScreen({ navigation, route }) {
  const { isDark, colors } = useTheme();
  const {
    id_room: paramRoomId,
    id_barang: paramBarangId,
    id_penerima: paramPenerimaId,
    nama_penerima: paramNamaPenerima,
    item,
  } = route?.params || {};

  const [idRoom, setIdRoom] = useState(paramRoomId || null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentUserName, setCurrentUserName] = useState('');
  const [message, setMessage] = useState('');
  const [messagesList, setMessagesList] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [loadingRoom, setLoadingRoom] = useState(!paramRoomId);
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef();

  const activeItem = item || {
    id_barang: paramBarangId,
    judul: 'Laporan Barang',
    lokasi: 'UINSA',
    status: 'Ditemukan',
    foto_utama: null,
    nama_pengunggah: paramNamaPenerima,
  };

  const recipientName = paramNamaPenerima || activeItem.nama_pengunggah || 'Pengguna';

  // 1. Muat user login
  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.id_user) setCurrentUserId(parsed.id_user);
          if (parsed.nama) setCurrentUserName(parsed.nama);
        }
      } catch (e) {}
    };
    loadUser();
  }, []);

  // 2. Buka/buat room kalau belum punya idRoom
  useEffect(() => {
    if (idRoom || !paramBarangId || !paramPenerimaId) return;
    const initRoom = async () => {
      try {
        const res = await openOrCreateRoom(paramBarangId, paramPenerimaId);
        if (res?.room?.id_room) setIdRoom(res.room.id_room);
      } catch (err) {
        showCustomAlert({ title: 'Gagal Membuka Chat', message: err?.response?.data?.message || 'Tidak dapat membuka room chat.', type: 'error' });
      } finally {
        setLoadingRoom(false);
      }
    };
    initRoom();
  }, [paramBarangId, paramPenerimaId, idRoom]);

  // 3. Fetch pesan dalam room
  const fetchMessages = async () => {
    if (!idRoom) return;
    try {
      const res = await getPesanByRoom(idRoom);
      if (res?.pesan && Array.isArray(res.pesan)) {
        setMessagesList(res.pesan);
        setRoomData(res.room);
        markRoomAsRead(idRoom).catch(() => {});
      }
    } catch (err) {
      console.log('Fetch messages error:', err?.message);
    }
  };

  useEffect(() => {
    if (!idRoom || !currentUserId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, [idRoom, currentUserId]);

  // Auto scroll ke bawah saat pesan baru
  useEffect(() => {
    if (messagesList.length > 0 && scrollViewRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messagesList.length]);

  const handleSendMessage = async () => {
    if (!message.trim() || !idRoom || sending) return;
    const textToSend = message.trim();
    setMessage('');
    setSending(true);

    // Optimistic UI
    const tempId = `temp_${Date.now()}`;
    setMessagesList((prev) => [
      ...prev,
      {
        id_pesan: tempId, id_pengirim: currentUserId, tipe_pesan: 'teks',
        isi_pesan: textToSend, sent_at: new Date().toISOString(), read_at: null,
        is_deleted: 0, nama_pengirim: currentUserName, milik_saya: 1,
      },
    ]);

    try {
      await sendPesanKeRoom(idRoom, textToSend, 'teks');
      await fetchMessages();
    } catch (err) {
      showCustomAlert({ title: 'Gagal Mengirim', message: 'Pesan belum terkirim. Periksa koneksi.', type: 'warning' });
    } finally {
      setSending(false);
    }
  };

  const handlePickAttachment = async () => {
    if (!idRoom) return;
    const asset = await pickImageWithActionSheet({ title: 'Kirim Gambar', allowCamera: true });
    if (!asset) return;
    setSending(true);

    // Optimistic UI
    const tempId = `temp_img_${Date.now()}`;
    setMessagesList((prev) => [
      ...prev,
      {
        id_pesan: tempId, id_pengirim: currentUserId, tipe_pesan: 'gambar',
        isi_pesan: '[Gambar]', attachment_url: asset.uri,
        sent_at: new Date().toISOString(), milik_saya: 1,
      },
    ]);

    try {
      await sendPesanGambarKeRoom(idRoom, asset, '');
      await fetchMessages();
    } catch (err) {
      showCustomAlert({ title: 'Gagal Mengirim Gambar', message: err?.response?.data?.message || 'Gambar gagal dikirim.', type: 'warning' });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  if (loadingRoom) {
    return (
      <View style={[styles.container, isDark && { backgroundColor: colors.background }, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={{ marginTop: 12, color: isDark ? colors.textSecondary : '#64748B' }}>Membuka percakapan...</Text>
      </View>
    );
  }

  const statusRoomAktif = roomData?.status_room === 'Aktif' || !roomData?.status_room;

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? colors.card : '#FFFFFF'} />
      <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={[styles.backButton, isDark && { backgroundColor: '#334155' }]} onPress={() => navigation?.goBack?.()}>
            <Ionicons name="arrow-back" size={20} color={isDark ? colors.text : '#0F172A'} />
          </TouchableOpacity>
          <View style={styles.userProfile}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200' }}
              style={styles.avatar}
            />
            <View>
              <Text style={[styles.userName, isDark && { color: colors.text }]}>{recipientName}</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusText}>
                  {roomData?.status_room === 'Selesai' ? 'Selesai' : roomData?.status_room === 'Dibekukan' ? 'Dibekukan' : 'Online'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView ref={scrollViewRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Card Context Item */}
          <TouchableOpacity
            style={[styles.itemCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('DetailItem', { id_barang: activeItem.id_barang, item: activeItem })}
          >
            <Image
              source={{ uri: formatPhotoUrl(activeItem.foto_utama || activeItem.foto_url) || 'https://via.placeholder.com/200' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemSubtitle}>
                {activeItem.status === 'Ditemukan' ? 'Laporan Penemuan' : activeItem.status === 'Dikembalikan' ? 'Laporan Selesai' : 'Laporan Kehilangan'}
              </Text>
              <Text style={[styles.itemTitle, isDark && { color: colors.text }]}>{activeItem.judul}</Text>
              <Text style={styles.itemMeta}>{activeItem.lokasi}</Text>
            </View>
          </TouchableOpacity>

          {messagesList.length === 0 ? (
            <View style={styles.emptyChatBox}>
              <Ionicons name="chatbubbles-outline" size={36} color="#CBD5E1" />
              <Text style={[styles.emptyChatTitle, isDark && { color: colors.textSecondary }]}>Belum ada riwayat pesan</Text>
              <Text style={[styles.emptyChatSubtitle, isDark && { color: colors.textSecondary }]}>
                Kirim pesan pertama kamu kepada {recipientName} mengenai laporan ini.
              </Text>
            </View>
          ) : (
            messagesList.map((msg) => {
              const isMe = msg.id_pengirim === currentUserId || msg.milik_saya === 1;
              const isDeleted = msg.is_deleted === 1;
              return (
                <View
                  key={msg.id_pesan}
                  style={[styles.messageBubble, isMe ? styles.senderBubble : [styles.receiverBubble, isDark && { backgroundColor: colors.card, borderColor: colors.border }]]}
                >
                  {msg.tipe_pesan === 'gambar' && msg.attachment_url && !isDeleted && (
                    <Image
                      source={{ uri: formatPhotoUrl(msg.attachment_url) }}
                      style={{ width: 200, height: 150, borderRadius: 10, marginBottom: 6 }}
                      resizeMode="cover"
                    />
                  )}
                  {isDeleted ? (
                    <Text style={{ fontStyle: 'italic', color: '#94A3B8' }}>🚫 Pesan telah dihapus</Text>
                  ) : (
                    <Text style={isMe ? styles.senderText : [styles.receiverText, isDark && { color: colors.text }]}>
                      {msg.isi_pesan}
                    </Text>
                  )}
                  <View style={styles.timeCheckRow}>
                    <Text style={isMe ? styles.senderTime : [styles.receiverTime, isDark && { color: colors.textSecondary }]}>
                      {formatTime(msg.sent_at)}
                    </Text>
                    {isMe && msg.read_at && <Ionicons name="checkmark-done" size={14} color="#A7F3D0" />}
                    {isMe && !msg.read_at && <Ionicons name="checkmark" size={14} color="#E6F4EA" />}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.bottomContainer, isDark && { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {!statusRoomAktif ? (
            <View style={styles.disabledBar}>
              <Text style={{ color: '#64748B', fontSize: 13 }}>
                Room ini {roomData?.status_room === 'Selesai' ? 'telah selesai' : 'sedang dibekukan'}.
              </Text>
            </View>
          ) : (
            <View style={styles.inputBar}>
              <TouchableOpacity style={styles.attachmentButton} onPress={handlePickAttachment}>
                <Feather name="paperclip" size={20} color="#64748B" />
              </TouchableOpacity>
              <TextInput
                style={[styles.chatInput, isDark && { backgroundColor: '#334155', color: colors.text }]}
                placeholder="Ketik pesanmu disini..."
                placeholderTextColor="#94A3B8"
                value={message}
                onChangeText={setMessage}
                onSubmitEditing={handleSendMessage}
                editable={!sending}
              />
              <TouchableOpacity
                style={[styles.sendButton, sending && { opacity: 0.5 }]}
                activeOpacity={0.85}
                onPress={handleSendMessage}
                disabled={sending || !message.trim()}
              >
                {sending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={16} color="#FFFFFF" />}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  userProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userName: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  statusText: { fontSize: 12, color: '#10B981', fontWeight: '500' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 20 },
  itemCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: 12 },
  itemImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemSubtitle: { fontSize: 12, color: '#047857', fontWeight: '600', marginBottom: 2 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  itemMeta: { fontSize: 12, color: '#64748B' },
  emptyChatBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36, paddingHorizontal: 20, gap: 8 },
  emptyChatTitle: { fontSize: 14, fontWeight: '700', color: '#64748B' },
  emptyChatSubtitle: { fontSize: 12, color: '#94A3B8', textAlign: 'center', lineHeight: 18 },
  messageBubble: { maxWidth: '82%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12 },
  senderBubble: { alignSelf: 'flex-end', backgroundColor: '#10B981', borderBottomRightRadius: 2 },
  receiverBubble: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', borderBottomLeftRadius: 2 },
  senderText: { color: '#FFFFFF', fontSize: 14 },
  receiverText: { color: '#0F172A', fontSize: 14 },
  timeCheckRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  senderTime: { fontSize: 10, color: '#E6F4EA' },
  receiverTime: { fontSize: 10, color: '#94A3B8' },
  bottomContainer: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 12 },
  disabledBar: { alignItems: 'center', paddingVertical: 8 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  attachmentButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  chatInput: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 999, paddingHorizontal: 16, height: 42, fontSize: 14, color: '#0F172A' },
  sendButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center' },
});