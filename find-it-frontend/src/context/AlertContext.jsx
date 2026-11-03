import React, { createContext, useContext, useState, useEffect } from 'react';
import CustomAlertModal from '../components/CustomAlertModal';

const AlertContext = createContext(null);

let globalAlertHandler = null;

/**
 * Fungsi global pengganti Alert.alert bawaan sistem.
 * Mendukung pemanggilan format:
 * 1. showCustomAlert(title, message, buttons, type)
 * 2. showCustomAlert({ title, message, buttons, type })
 */
export const showCustomAlert = (titleOrConfig, maybeMessage, maybeButtons, maybeType) => {
  if (typeof titleOrConfig === 'object' && titleOrConfig !== null) {
    if (globalAlertHandler) {
      globalAlertHandler(titleOrConfig);
    }
    return;
  }

  const title = titleOrConfig || 'Pemberitahuan';
  const message = maybeMessage || '';
  const buttons = Array.isArray(maybeButtons) && maybeButtons.length > 0
    ? maybeButtons
    : [{ text: 'Mengerti', style: 'default' }];

  let type = maybeType;
  if (!type) {
    const textToCheck = `${title} ${message}`.toLowerCase();
    if (
      textToCheck.includes('berhasil') ||
      textToCheck.includes('sukses') ||
      textToCheck.includes('diterima') ||
      textToCheck.includes('tersimpan')
    ) {
      type = 'success';
    } else if (
      textToCheck.includes('gagal') ||
      textToCheck.includes('error') ||
      textToCheck.includes('salah') ||
      textToCheck.includes('terputus') ||
      textToCheck.includes('ditolak') ||
      textToCheck.includes('tidak terhubung') ||
      textToCheck.includes('ditolak')
    ) {
      type = 'error';
    } else if (
      textToCheck.includes('perhatian') ||
      textToCheck.includes('peringatan') ||
      textToCheck.includes('belum lengkap') ||
      textToCheck.includes('yakin') ||
      textToCheck.includes('konfirmasi') ||
      textToCheck.includes('hapus') ||
      textToCheck.includes('keluar')
    ) {
      type = 'warning';
    } else {
      type = 'info';
    }
  }

  if (globalAlertHandler) {
    globalAlertHandler({ title, message, buttons, type });
  }
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => {
    globalAlertHandler = (config) => {
      setAlertConfig(config);
    };
    return () => {
      globalAlertHandler = null;
    };
  }, []);

  const hideAlert = () => {
    setAlertConfig(null);
  };

  return (
    <AlertContext.Provider value={{ showAlert: showCustomAlert, hideAlert }}>
      {children}
      <CustomAlertModal
        visible={!!alertConfig}
        config={alertConfig}
        onClose={hideAlert}
      />
    </AlertContext.Provider>
  );
};

export const useCustomAlert = () => useContext(AlertContext);
