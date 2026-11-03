import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function WelcomeScreen({ navigation }) {
  const { isDark, colors } = useTheme();

  const handleBypassToDashboard = async () => {
    const dummyUser = {
      nama: 'Nadia Azzahra',
      email: 'nadia.azzh@uinsa.ac.id',
      foto_profil: null,
    };
    await AsyncStorage.setItem('user_token', 'dummy_bypass_token_123');
    await AsyncStorage.setItem('user_data', JSON.stringify(dummyUser));
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.background : '#ffffff'}
      />

      {/* Bagian Atas/Tengah: Logo & Deskripsi */}
      <View style={styles.contentContainer}>
        <Image
          source={require('../../assets/logo-find_it.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={[styles.title, isDark && { color: colors.text }]}>Welcome to UINSA Lost & Found</Text>
        <Text style={[styles.description, isDark && { color: colors.textSecondary }]}>
          Join the community to report or find your items on Sunan Ampel State Islamic University campus.
        </Text>
      </View>

      {/* Bagian Bawah: Tombol Register, Login & Bypass */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.registerButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginButton, isDark && { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={[styles.loginText, isDark && { color: colors.text }]}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.bypassButton,
            isDark && { backgroundColor: '#064E3B', borderColor: '#047857' },
          ]}
          activeOpacity={0.8}
          onPress={handleBypassToDashboard}
        >
          <Ionicons name="flash-outline" size={16} color={isDark ? '#34D399' : '#047857'} style={{ marginRight: 6 }} />
          <Text style={[styles.bypassText, isDark && { color: '#34D399' }]}>Bypass Langsung ke Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 28,
  },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 10,
  },
  registerButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '600',
  },
  bypassButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 14,
    borderRadius: 9999,
    marginTop: 4,
  },
  bypassText: {
    color: '#047857',
    fontSize: 15,
    fontWeight: '600',
  },
});
