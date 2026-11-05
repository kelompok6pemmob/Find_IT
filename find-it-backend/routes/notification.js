
import { Router } from 'express';
import { pool } from '../db.js';

import sendPushNotification from '../utils/sendPushNotification.js';

const router = Router();

// Simpan Expo Push Token
router.post('/token', async (req, res) => {
  try {
    const { id_user, expo_push_token } = req.body;

    if (!id_user || !expo_push_token) {
      return res.status(400).json({
        message: 'id_user dan expo_push_token wajib diisi',
      });
    }

    await pool.query(
      'UPDATE `user` SET expo_push_token = ? WHERE id_user = ?',
      [expo_push_token, id_user]
    );

    res.json({ message: 'Expo token berhasil disimpan' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Ambil notifikasi user
router.get('/', async (req, res) => {
  try {
    const { id_user } = req.query;

    if (!id_user) {
      return res.status(400).json({
        message: 'id_user wajib diisi',
      });
    }

    const [rows] = await pool.query(
      `SELECT * FROM notifikasi
       WHERE id_user = ?
       ORDER BY created_at DESC`,
      [id_user]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Tandai notifikasi sudah dibaca
router.patch('/:id/read', async (req, res) => {
  try {
    const { id_user } = req.body;
    const { id } = req.params;

    await pool.query(
      `UPDATE notifikasi
       SET is_read = 1
       WHERE id_notifikasi = ? AND id_user = ?`,
      [id, id_user]
    );

    res.json({ message: 'Notifikasi sudah dibaca' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Kirim notifikasi percobaan
router.post('/test-push', async (req, res) => {
  try {
    const { id_user } = req.body;

    if (!id_user) {
      return res.status(400).json({
        success: false,
        message: 'id_user wajib diisi',
      });
    }

    // Ambil Expo Push Token pengguna
    const [users] = await pool.query(
      'SELECT expo_push_token FROM `user` WHERE id_user = ?',
      [id_user]
    );

    if (users.length === 0 || !users[0].expo_push_token) {
      return res.status(404).json({
        success: false,
        message: 'Expo Push Token tidak ditemukan',
      });
    }

    const expoPushToken = users[0].expo_push_token;

    // Simpan notifikasi ke database
    await pool.query(
      `INSERT INTO notifikasi (id_user, judul, pesan, tipe)
       VALUES (?, ?, ?, ?)`,
      [
        id_user,
        'Tes Push Notification',
        'Push Notification Find It berhasil dikirim!',
        'info',
      ]
    );

    // Kirim push notification ke HP
    const result = await sendPushNotification(
      expoPushToken,
      'Tes Push Notification',
      'Push Notification Find It berhasil dikirim!',
      { type: 'test' }
    );

    return res.json({
      success: true,
      message: 'Notifikasi berhasil diproses',
      result,
    });
  } catch (error) {
    console.error('Test push error:', error);

    return res.status(500).json({
      success: false,
      message: 'Gagal mengirim notifikasi',
      error: error.message,
    });
  }
});

export default router;
