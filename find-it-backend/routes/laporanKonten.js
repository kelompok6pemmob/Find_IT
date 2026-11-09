import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { adminMiddleware } from '../middleware/admin.js';
import catatAudit from '../utils/audit.js';
import kirimNotifikasi from '../utils/kirimnotifikasi.js';

const router = Router();
router.use(authMiddleware);

// POST /laporan-konten → laporkan postingan yang tidak pantas
router.post('/', async (req, res) => {
  try {
    const { id_barang, alasan, deskripsi = null } = req.body;
    if (!id_barang || !alasan)
      return res.status(400).json({ message: 'id_barang dan alasan wajib diisi' });
    if (String(alasan).length > 100)
      return res.status(400).json({ message: 'alasan maks 100 karakter' });
    const [b] = await pool.query('SELECT id_user, judul FROM barang WHERE id_barang = ?', [id_barang]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    if (b[0].id_user === req.user.id_user)
      return res.status(400).json({ message: 'Tidak bisa melaporkan postingan sendiri' });
    const [dup] = await pool.query(
      "SELECT id_laporan FROM laporan_konten WHERE id_barang = ? AND id_user_pelapor = ? AND status_laporan = 'Pending'",
      [id_barang, req.user.id_user]);
    if (dup.length) return res.status(409).json({ message: 'Laporanmu untuk postingan ini masih Pending' });
    const [r] = await pool.query(
      'INSERT INTO laporan_konten (id_user_pelapor, id_barang, alasan, deskripsi) VALUES (?, ?, ?, ?)',
      [req.user.id_user, id_barang, alasan, deskripsi]);
    catatAudit(req.user.id_user, 'CREATE_LAPORAN_KONTEN', 'laporan_konten', r.insertId, `Barang #${id_barang}: ${alasan}`);
    res.status(201).json({ id_laporan: r.insertId, message: 'Laporan konten terkirim ke admin' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /laporan-konten/saya → daftar laporanku + statusnya
router.get('/saya', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.id_laporan, l.id_barang, l.alasan, l.deskripsi, l.status_laporan, l.created_at, b.judul
       FROM laporan_konten l JOIN barang b ON b.id_barang = l.id_barang
       WHERE l.id_user_pelapor = ? ORDER BY l.created_at DESC`, [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /laporan-konten/admin/pending → antrian moderasi (ADMIN)
router.get('/admin/pending', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT l.*, u.nama AS nama_pelapor, b.judul, b.id_user AS id_pengunggah_barang, u2.nama AS nama_pengunggah
       FROM laporan_konten l
       JOIN \`user\` u ON u.id_user = l.id_user_pelapor
       JOIN barang b ON b.id_barang = l.id_barang
       JOIN \`user\` u2 ON u2.id_user = b.id_user
       WHERE l.status_laporan IN ('Pending','Diproses')
       ORDER BY l.status_laporan = 'Pending' DESC, l.created_at ASC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /laporan-konten/admin/:id/status → proses/selesaikan laporan (ADMIN)
router.patch('/admin/:id/status', adminMiddleware, async (req, res) => {
  try {
    const { status_laporan } = req.body;
    if (!['Diproses', 'Selesai'].includes(status_laporan))
      return res.status(400).json({ message: "status_laporan harus 'Diproses' atau 'Selesai'" });
    const [l] = await pool.query('SELECT * FROM laporan_konten WHERE id_laporan = ?', [req.params.id]);
    if (!l.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    await pool.query(
      'UPDATE laporan_konten SET status_laporan = ?, id_admin = ? WHERE id_laporan = ?',
      [status_laporan, req.user.id_user, req.params.id]);
    catatAudit(req.user.id_user, 'PROSES_LAPORAN_KONTEN', 'laporan_konten', l[0].id_laporan, status_laporan);
    await kirimNotifikasi({
      id_user: l[0].id_user_pelapor, judul: 'Laporan konten diperbarui',
      pesan: `Laporanmu ${status_laporan === 'Diproses' ? 'sedang diproses oleh admin' : 'selesai ditangani'}. Terima kasih sudah menjaga komunitas Find It.`,
      tipe: 'sistem', id_barang: l[0].id_barang,
    });
    res.json({ message: `Loran konten berstatus ${status_laporan}`.replace('Loran', 'Laporan') });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;