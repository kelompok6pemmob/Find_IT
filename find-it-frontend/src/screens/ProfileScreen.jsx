import React, { useState, useEffect } from'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from'react-native';
import { SafeAreaView } from'react-native-safe-area-context';
import { Ionicons, Feather, Octicons } from'@expo/vector-icons';
import AsyncStorage from'@react-native-async-storage/async-storage';
import { formatPhotoUrl } from'../services/finditService';
import { showCustomAlert } from'../context/AlertContext';
import { useTheme } from'../context/ThemeContext';
import SwipeTabWrapper from'../components/SwipeTabWrapper';

const MENU_ITEMS = [
  { id:'1', title:'Aktivitas Saya', icon:'history', type:'Octicons', route:'MyActivity' },
  { id:'2', title:'Pusat Notifikasi', icon:'bell', type:'Feather', route:'Notifications' },
  { id:'3', title:'Keamanan Akun', icon:'lock', type:'Feather', route:'AccountSecurity' },
  { id:'4', title:'Pengaturan Notifikasi', icon:'settings', type:'Feather', route:'NotificationSettings' },
  { id:'5', title:'Tampilan (Appearance)', icon:'eye', type:'Feather', route:'AppearanceSettings' },
  { id:'6', title:'Bantuan & Dukungan', icon:'help-circle', type:'Feather', route:'HelpSupport' },
  { id:'7', title:'Tentang FindIt UINSA', icon:'info', type:'Feather', route:'About' },
];

export default function ProfileScreen({ navigation }) {
  const { isDark, colors } = useTheme();
  const [userData, setUserData] = useState({
    nama: 'Mahasiswa UINSA',
    email: 'user@uinsa.ac.id',
    prodi: '',
    fakultas: '',
    foto_profil: null,
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const saved = await AsyncStorage.getItem('user_data');
        if (saved) {
          const parsed = JSON.parse(saved);
          setUserData({
            nama: parsed.nama || 'Mahasiswa UINSA',
            email: parsed.email || 'user@uinsa.ac.id',
            prodi: parsed.prodi || '',
            fakultas: parsed.fakultas || '',
            foto_profil: parsed.foto_profil || null,
          });
        }
      } catch (err) {
        console.log('Error loading profile:', err);
      }
    };

    const unsubscribe = navigation.addListener('focus', loadProfile);
    loadProfile();
    return unsubscribe;
  }, [navigation]);

  const handleLogout = () => {
    showCustomAlert({
      title:'Ingin Keluar dari Akun?',
      message:'Sesi login kamu akan diakhiri. Seluruh data profil dan pengaturanmu tetap tersimpan aman di perangkat.',
      type:'warning',
      buttons: [
        { text:'Tetap di Sini', style:'cancel' },
        {
          text:'Ya, Keluar Akun',
          style:'destructive',
          onPress: async () => {
            try {
              const currentSaved = await AsyncStorage.getItem('user_data');
              if (currentSaved) {
                const curUser = JSON.parse(currentSaved);
                const vaultRaw = await AsyncStorage.getItem('user_profiles_vault');
                const vault = vaultRaw ? JSON.parse(vaultRaw) : {};
                if (curUser.email) {
                  vault[curUser.email.toLowerCase().trim()] = curUser;
                }
                if (curUser.id_user) {
                  vault[`id_${curUser.id_user}`] = curUser;
                }
                await AsyncStorage.setItem('user_profiles_vault', JSON.stringify(vault));
              }
            } catch (errVault) {}
            await AsyncStorage.removeItem('user_token');
            await AsyncStorage.removeItem('user_data');
            navigation.reset({
              index: 0,
              routes: [{ name:'Welcome' }],
            });
          },
        },
      ],
    });
  };

  const renderIcon = (type, name) => {
    const iconColor = isDark ? colors.text : '#0F172A';
    if (type ==='Octicons') {
      return <Octicons name={name} size={20} color={iconColor} />;
    }
    return <Feather name={name} size={20} color={iconColor} />;
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.card : '#FFFFFF'}
      />

      <SwipeTabWrapper onSwipeRight={() => navigation.navigate('SavedTab')}>
        {/* Header */}
        <View style={[styles.header, isDark && { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, isDark && { color: colors.text }]}>Profile & Settings</Text>
        </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={[styles.profileCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Image
            source={{
              uri:
                formatPhotoUrl(userData.foto_profil) ||'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=300&auto=format&fit=crop',
            }}
            style={styles.avatar}
          />
          <Text style={[styles.userName, isDark && { color: colors.text }]}>{userData.nama}</Text>
          <Text style={[styles.userSubtitle, isDark && { color: '#34D399' }]}>
            {userData.prodi
              ? `${userData.prodi} • ${userData.fakultas || 'UINSA'}`
              : userData.email}
          </Text>
          {userData.prodi ? (
            <Text style={[styles.userEmailText, isDark && { color: colors.textSecondary }]}>{userData.email}</Text>
          ) : null}

          <TouchableOpacity
            style={[styles.editProfileButton, isDark && { backgroundColor: colors.card, borderColor: colors.borderStrong }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Octicons name="pencil" size={14} color={isDark ? colors.text : '#0F172A'} style={styles.editIcon} />
            <Text style={[styles.editProfileText, isDark && { color: colors.text }]}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items Card */}
        <View style={[styles.menuCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}>
          {MENU_ITEMS.map((item, index) => {
            const isLast = index === MENU_ITEMS.length - 1;
            return (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  !isLast && styles.menuItemBorder,
                  !isLast && isDark && { borderBottomColor: colors.border },
                ]}
                activeOpacity={0.7}
                onPress={() => item.route && navigation.navigate(item.route)}
              >
                <View style={styles.menuItemLeft}>
                  {renderIcon(item.type, item.icon)}
                  <Text style={[styles.menuItemTitle, isDark && { color: colors.text }]}>{item.title}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={isDark ? '#64748B' : '#94A3B8'} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutCard, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
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
    height: 52,
  backgroundColor:'#FFFFFF',
  justifyContent:'center',
  alignItems:'center',
  borderBottomWidth: 1,
  borderBottomColor:'#F1F5F9',
 },
  headerTitle: {
  fontSize: 20, 
  fontWeight:'700',
  color:'#0F172A',
  textAlign:'center',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 90,
    gap: 16,
  },
  profileCard: {
    backgroundColor:'#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    alignItems:'center',
    borderWidth: 1,
    borderColor:'#F1F5F9',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  userName: {
    fontSize: 20,
    fontWeight:'700',
    color:'#0F172A',
    marginBottom: 2,
  },
  userSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#047857',
    marginBottom: 4,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  userEmailText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  userHandle: {
    fontSize: 14,
    color:'#64748B',
    marginBottom: 14,
  },
  editProfileButton: {
    flexDirection:'row',
    alignItems:'center',
    borderWidth: 1,
    borderColor:'#E2E8F0',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor:'#FFFFFF',
  },
  editIcon: {
    marginRight: 6,
  },
  editProfileText: {
    fontSize: 13,
    fontWeight:'600',
    color:'#0F172A',
  },
  menuCard: {
    backgroundColor:'#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor:'#F1F5F9',
  },
  menuItem: {
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'space-between',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor:'#F8FAFC',
  },
  menuItemLeft: {
    flexDirection:'row',
    alignItems:'center',
    gap: 12,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight:'600',
    color:'#0F172A',
  },
  logoutCard: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor:'#F1F5F9',
  },
  logoutText: {
    fontSize: 15,
    fontWeight:'600',
    color:'#EF4444',
  },
});