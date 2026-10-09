import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(authMiddleware);

//_semantik klaim tergantung jenis laporan (F1 vs F2)
const arahKlaim = (statusBarang) =>
  statusBarang === 'Ditemukan'
    ? 'Klaim kepemilikan: pengklaim = pemilik barang, pelapor = penemu (F2)'
    : 'Klaim penemuan: pengklaim = penemu barang, pelapor = pemilik yang kehilangan (F1)';

// POST /barang → buat laporan F1 (Hilang) atau F2 (Ditemukan)
router.post('/', upload.single('foto'), async (req, res) => {
  try {
    const { judul, deskripsi, id_kategori, lokasi, tanggal, status } = req.body;
    if (!judul || !id_kategori || !lokasi || !tanggal)
      return res.status(400).json({ message: 'judul, id_kategori, lokasi, tanggal wajib diisi' });
    if (!['Hilang', 'Ditemukan'].includes(status))
      return res.status(400).json({ message: "status laporan harus 'Hilang' (F1) atau 'Ditemukan' (F2)" });
    const foto_url = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    const [r] = await pool.query(
      `INSERT INTO barang (id_user, id_kategori, judul, deskripsi, lokasi, foto_url, tanggal, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id_user, id_kategori, judul, deskripsi, lokasi, foto_url, tanggal, status]);
    res.status(201).json({ id_barang: r.insertId, status, message: `Laporan ${status} berhasil dibuat` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /barang → feed + filter kategori/lokasi/rentang tanggal/jenis + sorting (US-03, US-06, US-09)
router.get('/', async (req, res) => {
  try {
    const { status, id_kategori, lokasi, dari, sampai, sort = 'terbaru' } = req.query;
    const where = [], params = [];
    if (status)      { where.push('b.status = ?');      params.push(status); }
    if (id_kategori) { where.push('b.id_kategori = ?'); params.push(id_kategori); }
    if (lokasi)      { where.push('b.lokasi LIKE ?');   params.push(`%${lokasi}%`); }
    if (dari)        { where.push('b.tanggal >= ?');    params.push(dari); }
    if (sampai)      { where.push('b.tanggal <= ?');    params.push(sampai); }
    let sql = `SELECT b.*, u.nama AS nama_pengunggah, k.nama_kategori
               FROM barang b
               JOIN \`user\` u ON u.id_user = b.id_user
               JOIN kategori k ON k.id_kategori = b.id_kategori`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += sort === 'lokasi' ? ' ORDER BY b.lokasi ASC, b.tanggal DESC'
         : sort === 'lama'   ? ' ORDER BY b.tanggal ASC'
         :                     ' ORDER BY b.tanggal DESC, b.id_barang DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /barang/:id → detail laporan + daftar klaim masuk (laporan dilihat dari sisi BARANG)
router.get('/:id', async (req, res) => {
  try {
    const [b] = await pool.query(
      `SELECT b.*, u.nama AS nama_pengunggah, k.nama_kategori
       FROM barang b
       JOIN \`user\` u ON u.id_user = b.id_user
       JOIN kategori k ON k.id_kategori = b.id_kategori
       WHERE b.id_barang = ?`, [req.params.id]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    const [klaim] = await pool.query(
      `SELECT k.id_klaim, k.id_user, k.nama_pengklaim, k.alasan_klaim, k.bukti_kepemilikan,
              k.tanggal_klaim, k.status_klaim
       FROM (SELECT kl.*, u.nama AS nama_pengklaim FROM klaim kl
             JOIN \`user\` u ON u.id_user = kl.id_user) k
       WHERE k.id_barang = ? ORDER BY k.tanggal_klaim DESC`, [req.params.id]);
    res.json({ ...b[0], arah_klaim: arahKlaim(b[0].status), klaim });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /barang/:id/status → update status "Sudah Dikembalikan" manual (F5 / US-05), hanya pemilik
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Hilang', 'Ditemukan', 'Dikembalikan'].includes(status))
      return res.status(400).json({ message: 'status tidak valid' });
    const [b] = await pool.query('SELECT * FROM barang WHERE id_barang = ?', [req.params.id]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    if (b[0].id_user !== req.user.id_user)
      return res.status(403).json({ message: 'Hanya pengunggah laporan yang bisa mengubah status' });
    await pool.query('UPDATE barang SET status = ? WHERE id_barang = ?', [status, req.params.id]);
    res.json({ message: `Status laporan diubah menjadi ${status}` });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;