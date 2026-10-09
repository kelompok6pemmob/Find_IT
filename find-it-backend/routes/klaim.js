import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(authMiddleware);

// POST /klaim → ajukan klaim terhadap laporan Hilang (F1) maupun Ditemukan (F2)
router.post('/', upload.single('bukti'), async (req, res) => {
  try {
    const { id_barang, alasan_klaim } = req.body;
    if (!id_barang || !alasan_klaim)
      return res.status(400).json({ message: 'id_barang dan alasan_klaim wajib diisi' });
    const [b] = await pool.query('SELECT * FROM barang WHERE id_barang = ?', [id_barang]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    if (b[0].id_user === req.user.id_user)
      return res.status(400).json({ message: 'Tidak bisa mengklaim laporan sendiri' });
    if (b[0].status === 'Dikembalikan')
      return res.status(409).json({ message: 'Barang sudah dikembalikan, klaim ditutup' });
    const [dup] = await pool.query(
      'SELECT id_klaim FROM klaim WHERE id_barang = ? AND id_user = ? AND status_klaim = "Pending"',
      [id_barang, req.user.id_user]);
    if (dup.length) return res.status(409).json({ message: 'Klaim Pending kamu sudah ada di laporan ini' });

    const bukti = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    const [r] = await pool.query(
      `INSERT INTO klaim (id_barang, id_user, alasan_klaim, bukti_kepemilikan, tanggal_klaim)
       VALUES (?, ?, ?, ?, CURDATE())`,
      [id_barang, req.user.id_user, alasan_klaim, bukti]);
    res.status(201).json({
      id_klaim: r.insertId,
      jenis_laporan: b[0].status, // 'Hilang' (F1) atau 'Ditemukan' (F2)
      message: b[0].status === 'Ditemukan'
        ? 'Klaim kepemilikan diajukan ke penemu barang'
        : 'Klaim penemuan diajukan ke pemilik yang kehilangan',
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /klaim/saya → laporan dilihat dari sisi KLAIM (pengklaim melihat laporan lengkap yang diklaim)
router.get('/saya', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT k.*, b.judul, b.deskripsi, b.lokasi, b.foto_url, b.tanggal,
              b.status AS status_barang, b.id_user AS id_pengunggah,
              u.nama AS nama_pengunggah, kat.nama_kategori
       FROM klaim k
       JOIN barang b   ON b.id_barang = k.id_barang
       JOIN \`user\` u ON u.id_user = b.id_user
       JOIN kategori kat ON kat.id_kategori = b.id_kategori
       WHERE k.id_user = ?
       ORDER BY k.tanggal_klaim DESC`, [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /klaim/masuk → klaim yang masuk ke laporan miliku (sisi pelapor F1/F2)
router.get('/masuk', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT k.*, b.judul, b.status AS status_barang, u.nama AS nama_pengklaim
       FROM klaim k
       JOIN barang b   ON b.id_barang = k.id_barang
       JOIN \`user\` u ON u.id_user = k.id_user
       WHERE b.id_user = ?
       ORDER BY k.status_klaim = 'Pending' DESC, k.tanggal_klaim DESC`, [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /klaim/:id/status → pemilik laporan menerima/menolak klaim.
// Jika Diterima → barang otomatis 'Dikembalikan' + klaim pending lain ditutup (TRANSAKSI = andal)
router.patch('/:id/status', async (req, res) => {
  const { status_klaim } = req.body;
  if (!['Diterima', 'Ditolak'].includes(status_klaim))
    return res.status(400).json({ message: "status_klaim harus 'Diterima' atau 'Ditolak'" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [k] = await conn.query(
      `SELECT k.*, b.id_user AS id_pelapor FROM klaim k
       JOIN barang b ON b.id_barang = k.id_barang
       WHERE k.id_klaim = ? FOR UPDATE`, [req.params.id]);
    if (!k.length) { await conn.rollback(); return res.status(404).json({ message: 'Klaim tidak ditemukan' }); }
    if (k[0].id_pelapor !== req.user.id_user) { await conn.rollback(); return res.status(403).json({ message: 'Hanya pemilik laporan yang bisa memutuskan klaim' }); }
    if (k[0].status_klaim !== 'Pending') { await conn.rollback(); return res.status(409).json({ message: 'Klaim sudah diputuskan sebelumnya' }); }

    await conn.query('UPDATE klaim SET status_klaim = ? WHERE id_klaim = ?', [status_klaim, req.params.id]);
    if (status_klaim === 'Diterima') {
      await conn.query(`UPDATE barang SET status = 'Dikembalikan' WHERE id_barang = ?`, [k[0].id_barang]);
      await conn.query(`UPDATE klaim SET status_klaim = 'Ditolak'
                        WHERE id_barang = ? AND id_klaim <> ? AND status_klaim = 'Pending'`,
                        [k[0].id_barang, req.params.id]);
    }
    await conn.commit();
    res.json({ message: `Klaim ${status_klaim.toLowerCase()}${status_klaim === 'Diterima' ? ', status barang menjadi Dikembalikan' : ''}` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally { conn.release(); }
});

export default router;