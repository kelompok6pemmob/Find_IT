import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, StatusBar, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

export default function SplashScreen({ navigation }) {
  const { isDark, colors } = useTheme();

  // Inisialisasi nilai animasi untuk 3 titik
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Membuat sequence animasi naik-turun
    const createDotAnimation = (dot) => {
      return Animated.sequence([
        Animated.timing(dot, {
          toValue: -8, // Titik melompat ke atas sejauh 8 pixel
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(dot, {
          toValue: 0, // Titik kembali ke posisi semula
          duration: 300,
          useNativeDriver: true,
        }),
      ]);
    };

    // Menjalankan animasi secara looping dan berurutan (stagger)
    Animated.loop(
      Animated.stagger(150, [
        createDotAnimation(dot1),
        createDotAnimation(dot2),
        createDotAnimation(dot3),
      ])
    ).start();

    // Timer untuk pindah halaman
    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('user_token');
        if (token) {
          navigation.replace('MainTabs');
        } else {
          navigation.replace('Welcome');
        }
      } catch (e) {
        navigation.replace('Welcome');
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation, dot1, dot2, dot3]);

  const handleSkip = () => {
    navigation.replace('Welcome');
  };

  return (
    <TouchableOpacity
      style={{ flex: 1 }}
      activeOpacity={1}
      onPress={handleSkip}
    >
      <SafeAreaView style={[styles.container, isDark && { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={isDark ? 'light-content' : 'dark-content'}
          backgroundColor={isDark ? colors.background : '#ffffff'}
        />

        {/* Bagian Tengah (Logo & Judul) */}
        <View style={styles.centerContent}>
          <Image
            source={require('../../assets/logo-find_it.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={[styles.title, isDark && { color: colors.text }]}>FindIt</Text>
          <Text style={[styles.subtitle, isDark && { color: colors.textSecondary }]}>LOST & FOUND UINSA</Text>
        </View>

        {/* Bagian Bawah (Indicator & Text Loading) */}
        <View style={styles.bottomContent}>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, styles.dotActive, { transform: [{ translateY: dot1 }] }]} />
            <Animated.View style={[styles.dot, styles.dotInactive, { transform: [{ translateY: dot2 }] }]} />
            <Animated.View style={[styles.dot, styles.dotLight, { transform: [{ translateY: dot3 }] }]} />
          </View>
          <Text style={[styles.loadingText, isDark && { color: colors.textSecondary }]}>Menghubungkan ke Aplikasi...</Text>
        </View>
      </SafeAreaView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 1.2,
  },
  bottomContent: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    height: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: '#059669',
  },
  dotInactive: {
    backgroundColor: '#6EE7B7',
  },
  dotLight: {
    backgroundColor: '#D1FAE5',
  },
  loadingText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
