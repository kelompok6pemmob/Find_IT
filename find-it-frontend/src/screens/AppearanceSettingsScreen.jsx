import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { showCustomAlert } from '../context/AlertContext';
import { useTheme } from '../context/ThemeContext';

export default function AppearanceSettingsScreen({ navigation }) {
  const { theme: selectedTheme, setTheme, isDark } = useTheme();

  const handleChangeTheme = async (theme) => {
    await setTheme(theme);
    const label =
      theme === 'dark'
        ? 'Mode Gelap'
        : theme === 'light'
        ? 'Mode Terang'
        : 'Ikuti Sistem';
    showCustomAlert({
      title: 'Tampilan Diperbarui',
      message: `Tema aplikasi berhasil diubah ke ${label} dan tersimpan secara permanen.`,
      type: 'success',
    });
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        isDark && { backgroundColor: '#0F172A' },
      ]}
    >
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#1E293B' : '#FFFFFF'}
      />

      {/* Header */}
      <View
        style={[
          styles.header,
          isDark && { backgroundColor: '#1E293B', borderBottomColor: '#334155' },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            isDark && { backgroundColor: '#334155' },
          ]}
          onPress={() => navigation?.goBack?.()}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={isDark ? '#F8FAFC' : '#0F172A'}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            isDark && { color: '#F8FAFC' },
          ]}
        >
          Pengaturan Tampilan
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              isDark && { color: '#F8FAFC' },
            ]}
          >
            Tema aplikasi
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              isDark && { color: '#94A3B8' },
            ]}
          >
            Pilih tampilan FindIt yang nyaman untukmu.
          </Text>
        </View>

        {/* Theme Radio Card List */}
        <View
          style={[
            styles.themeCard,
            isDark && { backgroundColor: '#1E293B', borderColor: '#334155' },
          ]}
        >
          {/* Ikuti sistem */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              styles.optionBorder,
              isDark && { borderBottomColor: '#334155' },
            ]}
            activeOpacity={0.8}
            onPress={() => handleChangeTheme('system')}
          >
            <View
              style={[
                styles.iconSquare,
                isDark && { backgroundColor: '#334155' },
              ]}
            >
              <Feather
                name="smartphone"
                size={18}
                color={isDark ? '#94A3B8' : '#475569'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.optionTitle,
                  isDark && { color: '#F8FAFC' },
                ]}
              >
                Ikuti sistem
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  isDark && { color: '#94A3B8' },
                ]}
              >
                Otomatis beralih terang atau gelap sesuai tema perangkat.
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedTheme === 'system' && styles.radioButtonActive,
                isDark && { borderColor: '#475569' },
                selectedTheme === 'system' && { borderColor: '#10B981' },
              ]}
            >
              {selectedTheme === 'system' && (
                <View style={styles.radioDotInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Mode terang */}
          <TouchableOpacity
            style={[
              styles.themeOption,
              styles.optionBorder,
              isDark && { borderBottomColor: '#334155' },
            ]}
            activeOpacity={0.8}
            onPress={() => handleChangeTheme('light')}
          >
            <View style={styles.iconSquareGreen}>
              <Feather name="sun" size={18} color="#047857" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                <Text
                  style={[
                    styles.optionTitle,
                    isDark && { color: '#F8FAFC' },
                  ]}
                >
                  Mode terang
                </Text>
                <View style={styles.defaultTag}>
                  <Text style={styles.defaultTagText}>Default</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.optionDescription,
                  isDark && { color: '#94A3B8' },
                ]}
              >
                Selalu terang, apa pun tema perangkat.
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedTheme === 'light' && styles.radioButtonActive,
                isDark && { borderColor: '#475569' },
                selectedTheme === 'light' && { borderColor: '#10B981' },
              ]}
            >
              {selectedTheme === 'light' && (
                <View style={styles.radioDotInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Mode gelap */}
          <TouchableOpacity
            style={styles.themeOption}
            activeOpacity={0.8}
            onPress={() => handleChangeTheme('dark')}
          >
            <View
              style={[
                styles.iconSquare,
                isDark && { backgroundColor: '#334155' },
              ]}
            >
              <Feather
                name="moon"
                size={18}
                color={isDark ? '#F8FAFC' : '#475569'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.optionTitle,
                  isDark && { color: '#F8FAFC' },
                ]}
              >
                Mode gelap
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  isDark && { color: '#94A3B8' },
                ]}
              >
                Selalu gelap, nyaman saat minim cahaya.
              </Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedTheme === 'dark' && styles.radioButtonActive,
                isDark && { borderColor: '#475569' },
                selectedTheme === 'dark' && { borderColor: '#10B981' },
              ]}
            >
              {selectedTheme === 'dark' && (
                <View style={styles.radioDotInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Section Preview */}
        <View style={styles.sectionHeaderBetween}>
          <Text
            style={[
              styles.sectionTitle,
              isDark && { color: '#F8FAFC' },
            ]}
          >
            Pratinjau tampilan
          </Text>
          <Text
            style={[
              styles.previewSubtext,
              isDark && { color: '#94A3B8' },
            ]}
          >
            Contoh kartu
          </Text>
        </View>

        {/* Preview Cards Grid */}
        <View style={styles.previewGrid}>
          {/* Card Terang */}
          <View style={styles.previewCardWrapper}>
            <View style={styles.lightPreviewCard}>
              <View style={styles.previewCardHeader}>
                <Text style={styles.previewLogoLight}>FindIt</Text>
                <Feather name="sun" size={14} color="#10B981" />
              </View>
              <View style={styles.lightInnerCard}>
                <Text style={styles.previewItemTitleLight}>Kunci ditemukan</Text>
                <Text style={styles.previewItemMetaLight}>Perpustakaan UINSA</Text>
                <View style={styles.previewBadgeLight}>
                  <Ionicons name="checkmark" size={12} color="#047857" />
                  <Text style={styles.previewBadgeTextLight}>Ditemukan</Text>
                </View>
              </View>
            </View>
            <Text
              style={[
                styles.previewLabel,
                isDark && { color: '#94A3B8' },
              ]}
            >
              Terang
            </Text>
          </View>

          {/* Card Gelap */}
          <View style={styles.previewCardWrapper}>
            <View style={styles.darkPreviewCard}>
              <View style={styles.previewCardHeader}>
                <Text style={styles.previewLogoDark}>FindIt</Text>
                <Feather name="moon" size={14} color="#10B981" />
              </View>
              <View style={styles.darkInnerCard}>
                <Text style={styles.previewItemTitleDark}>Kunci ditemukan</Text>
                <Text style={styles.previewItemMetaDark}>Perpustakaan UINSA</Text>
                <View style={styles.previewBadgeDark}>
                  <Ionicons name="checkmark" size={12} color="#10B981" />
                  <Text style={styles.previewBadgeTextDark}>Ditemukan</Text>
                </View>
              </View>
            </View>
            <Text
              style={[
                styles.previewLabel,
                isDark && { color: '#94A3B8' },
              ]}
            >
              Gelap
            </Text>
          </View>
        </View>

        {/* Info Box */}
        <View
          style={[
            styles.infoBox,
            isDark && {
              backgroundColor: '#064E3B',
              borderColor: '#047857',
            },
          ]}
        >
          <Feather name="eye" size={20} color={isDark ? '#34D399' : '#047857'} />
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.infoTitle,
                isDark && { color: '#34D399' },
              ]}
            >
              Pilih Tampilan Nyamanmu
            </Text>
            <Text
              style={[
                styles.infoDescription,
                isDark && { color: '#A7F3D0' },
              ]}
            >
              Sesuaikan tema aplikasi agar makin nyaman di mata. Baik terang maupun gelap, teks dan tata letak tetap jelas serta konsisten.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  headerRightPlaceholder: {
    width: 36,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
    gap: 16,
  },
  sectionHeader: {
    gap: 4,
  },
  sectionHeaderBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  previewSubtext: {
    fontSize: 12,
    color: '#94A3B8',
  },
  themeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  optionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  iconSquare: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconSquareGreen: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  defaultTag: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#047857',
  },
  optionDescription: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  radioButton: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonActive: {
    borderColor: '#10B981',
  },
  radioDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
  },
  previewGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  previewCardWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  lightPreviewCard: {
    width: '100%',
    backgroundColor: '#F1F5F9',
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  darkPreviewCard: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 12,
    gap: 10,
  },
  previewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewLogoLight: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewLogoDark: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  lightInnerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  darkInnerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  previewItemTitleLight: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  previewItemTitleDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewItemMetaLight: {
    fontSize: 9,
    color: '#64748B',
  },
  previewItemMetaDark: {
    fontSize: 9,
    color: '#94A3B8',
  },
  previewBadgeLight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  previewBadgeTextLight: {
    fontSize: 9,
    fontWeight: '700',
    color: '#047857',
  },
  previewBadgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  previewBadgeTextDark: {
    fontSize: 9,
    fontWeight: '700',
    color: '#34D399',
  },
  previewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#047857',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 12,
    color: '#047857',
    lineHeight: 18,
  },
});
