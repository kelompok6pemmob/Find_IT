import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import sendPushNotification from '../utils/sendPushNotification.js';

const router = Router();
router.use(authMiddleware);

// POST /notifikasi/token
router.post('/token', async (req, res) => {
  try {
    const { expo_push_token, platform = 'Android' } = req.body;
    if (!expo_push_token || typeof expo_push_token !== 'string') {
      return res.status(400).json({ message: 'expo_push_token wajib berupa string' });
    }
    // Validasi format token Expo
    if (!expo_push_token.startsWith('ExponentPushToken[')) {
      return res.status(400).json({ message: 'Format expo_push_token tidak valid' });
    }
    const [ada] = await pool.query(
      'SELECT id_device FROM user_device WHERE id_user = ? AND expo_push_token = ?',
      [req.user.id_user, expo_push_token]);
    if (ada.length) {
      await pool.query(
        'UPDATE user_device SET is_active = 1, last_active_at = NOW() WHERE id_device = ?',
        [ada[0].id_device]);
    } else {
      await pool.query(
        'INSERT INTO user_device (id_user, expo_push_token, platform) VALUES (?, ?, ?)',
        [req.user.id_user, expo_push_token, platform]);
    }
    console.log(`✅ Token disimpan untuk user ${req.user.id_user}: ${expo_push_token.slice(0, 30)}...`);
    res.json({ message: 'Perangkat terdaftar' });
  } catch (e) {
    console.error('❌ Error simpan token:', e.message);
    res.status(500).json({ message: e.message });
  }
});

// GET /notifikasi
router.get('/', async (req, res) => {
  try {
    const { hanya_belum_dibaca, tipe } = req.query;
    const where = ['id_user = ?'], params = [req.user.id_user];
    if (hanya_belum_dibaca === '1') where.push('is_read = 0');
    if (tipe) { where.push('tipe = ?'); params.push(tipe); }
    const [rows] = await pool.query(
      `SELECT * FROM notifikasi WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT 100`,
      params);
    const [[hit]] = await pool.query(
      'SELECT COUNT(*) AS jumlah FROM notifikasi WHERE id_user = ? AND is_read = 0',
      [req.user.id_user]);
    res.json({ belum_dibaca: hit.jumlah, notifikasi: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /notifikasi/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const [r] = await pool.query(
      'UPDATE notifikasi SET is_read = 1 WHERE id_user = ? AND is_read = 0',
      [req.user.id_user]);
    res.json({ notifikasi_dibaca: r.affectedRows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /notifikasi/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const [r] = await pool.query(
      'UPDATE notifikasi SET is_read = 1 WHERE id_notifikasi = ? AND id_user = ?',
      [req.params.id, req.user.id_user]);
    if (!r.affectedRows) return res.status(404).json({ message: 'Notifikasi tidak ditemukan' });
    res.json({ message: 'Notifikasi sudah dibaca' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;