import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function CustomAlertModal({ visible, config, onClose }) {
  const { isDark, colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(0.85)).current;
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0.85);
      opacityValue.setValue(0);
    }
  }, [visible]);

  if (!visible || !config) return null;

  const {
    title = 'Pemberitahuan',
    message = '',
    buttons = [{ text: 'Mengerti', style: 'default' }],
    type = 'info',
  } = config;

  // Konfigurasi Ikon & Warna berdasarkan Tipe
  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          icon: <Ionicons name="checkmark-circle" size={34} color="#10B981" />,
          bgColor: '#ECFDF5',
          borderColor: '#A7F3D0',
          accentColor: '#10B981',
        };
      case 'error':
        return {
          icon: <Ionicons name="alert-circle" size={34} color="#EF4444" />,
          bgColor: '#FEF2F2',
          borderColor: '#FECACA',
          accentColor: '#EF4444',
        };
      case 'warning':
        return {
          icon: <Feather name="alert-triangle" size={30} color="#F59E0B" />,
          bgColor: '#FFFBEB',
          borderColor: '#FDE68A',
          accentColor: '#F59E0B',
        };
      default:
        return {
          icon: <Ionicons name="information-circle" size={34} color="#059669" />,
          bgColor: '#ECFDF5',
          borderColor: '#D1FAE5',
          accentColor: '#059669',
        };
    }
  };

  const currentType = getTypeConfig();

  const handleButtonPress = (btn) => {
    onClose();
    if (btn.onPress) {
      // Tunggu modal close sedikit agar transisi smooth
      setTimeout(() => {
        btn.onPress();
      }, 100);
    }
  };

  const isMultiButton = buttons.length > 1;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.cardContainer,
            isDark && { backgroundColor: '#1E293B', shadowColor: '#000000', borderColor: '#334155', borderWidth: 1 },
            {
              opacity: opacityValue,
              transform: [{ scale: scaleValue }],
            },
          ]}
        >
          {/* Top Decorative Icon */}
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: currentType.bgColor,
                borderColor: currentType.borderColor,
              },
            ]}
          >
            {currentType.icon}
          </View>

          {/* Title */}
          <Text style={[styles.titleText, isDark && { color: '#F8FAFC' }]}>{title}</Text>

          {/* Message */}
          {message ? <Text style={[styles.messageText, isDark && { color: '#94A3B8' }]}>{message}</Text> : null}

          {/* Buttons */}
          <View
            style={[
              styles.buttonRow,
              isMultiButton && buttons.length === 2 ? styles.buttonRowTwo : styles.buttonCol,
            ]}
          >
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';

              let btnBg = '#10B981';
              let textColor = '#FFFFFF';

              if (isCancel) {
                btnBg = isDark ? '#334155' : '#F1F5F9';
                textColor = isDark ? '#F8FAFC' : '#475569';
              } else if (isDestructive) {
                btnBg = isDark ? '#7F1D1D' : '#FEE2E2';
                textColor = isDark ? '#FCA5A5' : '#DC2626';
              }

              return (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.82}
                  style={[
                    styles.button,
                    isMultiButton && buttons.length === 2 && styles.buttonFlex,
                    { backgroundColor: btnBg },
                  ]}
                  onPress={() => handleButtonPress(btn)}
                >
                  <Text style={[styles.buttonText, { color: textColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: Math.min(width - 48, 360),
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    elevation: 14,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  messageText: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  buttonRow: {
    width: '100%',
    gap: 10,
  },
  buttonRowTwo: {
    flexDirection: 'row',
  },
  buttonCol: {
    flexDirection: 'column',
  },
  buttonFlex: {
    flex: 1,
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
});
