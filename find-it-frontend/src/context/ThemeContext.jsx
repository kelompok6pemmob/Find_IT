import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_STORAGE_KEY = 'app_theme';

const LightThemeColors = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#F1F5F9',
  borderStrong: '#E2E8F0',
  inputBg: '#FFFFFF',
  primary: '#10B981',
  primaryDark: '#047857',
  navBg: '#FFFFFF',
  navBorder: '#F1F5F9',
  statusBar: 'dark-content',
};

const DarkThemeColors = {
  background: '#0F172A',
  card: '#1E293B',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  borderStrong: '#475569',
  inputBg: '#1E293B',
  primary: '#10B981',
  primaryDark: '#059669',
  navBg: '#1E293B',
  navBorder: '#334155',
  statusBar: 'light-content',
};

const ThemeContext = createContext({
  theme: 'light',
  isDark: false,
  colors: LightThemeColors,
  setTheme: async () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState('light');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved) {
          setThemeState(saved);
        }
      } catch (err) {
        console.error('Gagal memuat tema aplikasi:', err);
      } finally {
        setLoaded(true);
      }
    };
    loadSavedTheme();
  }, []);

  const setTheme = async (newTheme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (err) {
      console.error('Gagal menyimpan tema aplikasi:', err);
    }
  };

  const isDark = useMemo(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;
    return systemColorScheme === 'dark';
  }, [theme, systemColorScheme]);

  const colors = useMemo(() => {
    return isDark ? DarkThemeColors : LightThemeColors;
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, setTheme, loaded }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
