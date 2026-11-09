import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import catatAudit from '../utils/audit.js';
import kirimNotifikasi from '../utils/kirimnotifikasi.js';

const router = Router();

// GET /kategori → hanya kategori Disetujui & aktif (untuk picker publik)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id_kategori, nama_kategori FROM kategori WHERE status_verifikasi = 'Disetujui' AND is_active = 1 ORDER BY nama_kategori");
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /kategori/usul → user mengusulkan kategori baru (status Pending)
router.post('/usul', authMiddleware, async (req, res) => {
  try {
    const nama = (req.body.nama_kategori || '').trim();
    if (!nama || nama.length > 100)
      return res.status(400).json({ message: 'nama_kategori wajib diisi (maks 100 karakter)' });
    const [ada] = await pool.query('SELECT * FROM kategori WHERE nama_kategori = ?', [nama]);
    if (ada.length) {
      const k = ada[0];
      if (k.status_verifikasi === 'Disetujui' && k.is_active === 1)
        return res.status(409).json({ message: 'Kategori sudah ada dan aktif' });
      if (k.status_verifikasi === 'Pending')
        return res.status(409).json({ message: 'Kategori tersebut sedang menunggu verifikasi' });
      // sebelumnya Ditolak / nonaktif → ajukan ulang (unik key nama_kategori!)
      await pool.query(
        "UPDATE kategori SET status_verifikasi = 'Pending', id_user_pembuat = ? WHERE id_kategori = ?",
        [req.user.id_user, k.id_kategori]);
      catatAudit(req.user.id_user, 'USUL_KATEGORI_ULANG', 'kategori', k.id_kategori, nama);
      return res.status(201).json({ id_kategori: k.id_kategori, status_verifikasi: 'Pending', message: 'Kategori diajukan ulang dan menunggu verifikasi' });
    }
    const [r] = await pool.query(
      "INSERT INTO kategori (nama_kategori, id_user_pembuat, status_verifikasi) VALUES (?, ?, 'Pending')",
      [nama, req.user.id_user]);
    catatAudit(req.user.id_user, 'USUL_KATEGORI', 'kategori', r.insertId, nama);
    res.status(201).json({ id_kategori: r.insertId, status_verifikasi: 'Pending', message: 'Kategori diusulkan dan menunggu verifikasi admin' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /kategori/usul/saya → daftar usulan kategoriku + statusnya
router.get('/usul/saya', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id_kategori, nama_kategori, status_verifikasi, is_active, created_at FROM kategori WHERE id_user_pembuat = ? ORDER BY created_at DESC',
      [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /kategori/admin/pending → antrian verifikasi (ADMIN)
router.get('/admin/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT k.*, u.nama AS nama_pengusul
       FROM kategori k LEFT JOIN \`user\` u ON u.id_user = k.id_user_pembuat
       WHERE k.status_verifikasi = 'Pending' ORDER BY k.created_at ASC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /kategori/admin/:id/verifikasi → terima/tolak usulan (ADMIN)
router.patch('/admin/:id/verifikasi', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { status_verifikasi } = req.body;
    if (!['Disetujui', 'Ditolak'].includes(status_verifikasi))
      return res.status(400).json({ message: "status_verifikasi harus 'Disetujui' atau 'Ditolak'" });
    const [k] = await pool.query('SELECT * FROM kategori WHERE id_kategori = ?', [req.params.id]);
    if (!k.length) return res.status(404).json({ message: 'Kategori tidak ditemukan' });
    if (k[0].status_verifikasi !== 'Pending')
      return res.status(409).json({ message: 'Kategori sudah diverifikasi sebelumnya' });
    await pool.query('UPDATE kategori SET status_verifikasi = ? WHERE id_kategori = ?', [status_verifikasi, req.params.id]);
    catatAudit(req.user.id_user, 'VERIFIKASI_KATEGORI', 'kategori', k[0].id_kategori, status_verifikasi);
    if (k[0].id_user_pembuat) {
      await kirimNotifikasi({
        id_user: k[0].id_user_pembuat, judul: `Usulan kategori ${status_verifikasi.toLowerCase()}`,
        pesan: `Kategori "${k[0].nama_kategori}" ${status_verifikasi === 'Disetujui' ? 'disetujui dan sudah bisa dipakai' : 'ditolak oleh admin'}.`,
        tipe: 'sistem',
      });
    }
    res.json({ message: `Kategori ${status_verifikasi.toLowerCase()}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /kategori/admin/:id/aktif → toggle is_active (ADMIN)
router.patch('/admin/:id/aktif', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { is_active } = req.body;
    if (![0, 1, true, false].includes(is_active))
      return res.status(400).json({ message: 'is_active harus 0 atau 1' });
    await pool.query('UPDATE kategori SET is_active = ? WHERE id_kategori = ?', [is_active ? 1 : 0, req.params.id]);
    catatAudit(req.user.id_user, 'TOGGLE_KATEGORI_AKTIF', 'kategori', req.params.id, String(is_active));
    res.json({ message: 'Status aktif kategori diperbarui' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;