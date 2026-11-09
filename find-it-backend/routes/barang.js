import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = Router();
router.use(authMiddleware);

const arahKlaim = (statusBarang) =>
  statusBarang === 'Ditemukan'
    ? 'Klaim kepemilikan: pengklaim = pemilik barang, pelapor = penemu (F2)'
    : 'Klaim penemuan: pengklaim = penemu barang, pelapor = pemilik yang kehilangan (F1)';

// POST /barang → multi-foto + lat/lng
router.post('/', upload.array('foto', 5), async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const { judul, deskripsi, id_kategori, lokasi, latitude, longitude, tanggal_kejadian, status } = req.body;
    if (!judul || !id_kategori || !lokasi || !tanggal_kejadian)
      return res.status(400).json({ message: 'judul, id_kategori, lokasi, tanggal_kejadian wajib diisi' });
    if (!['Hilang', 'Ditemukan'].includes(status))
      return res.status(400).json({ message: "status harus 'Hilang' atau 'Ditemukan'" });
    const [k] = await conn.query(
      "SELECT id_kategori FROM kategori WHERE id_kategori = ? AND status_verifikasi = 'Disetujui' AND is_active = 1",
      [id_kategori]);
    if (!k.length) return res.status(400).json({ message: 'Kategori tidak valid' });
    const lat = latitude === undefined || latitude === '' ? null : Number(latitude);
    const lng = longitude === undefined || longitude === '' ? null : Number(longitude);

    await conn.beginTransaction();
    const [r] = await conn.query(
      `INSERT INTO barang (id_user, id_kategori, judul, deskripsi, lokasi, latitude, longitude, tanggal_kejadian, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id_user, id_kategori, judul, deskripsi, lokasi, lat, lng, tanggal_kejadian, status]);
    const files = req.files || [];
    for (let i = 0; i < files.length; i++) {
      await conn.query(
        'INSERT INTO foto_barang (id_barang, foto_url, is_utama, urutan_foto) VALUES (?, ?, ?, ?)',
        [r.insertId, `${req.protocol}://${req.get('host')}/uploads/${files[i].filename}`, i === 0 ? 1 : 0, i + 1]);
    }
    await conn.commit();
    res.status(201).json({ id_barang: r.insertId, status, jumlah_foto: files.length, message: `Laporan ${status} berhasil dibuat` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally { conn.release(); }
});

// GET /barang → feed dengan foto utama
router.get('/', async (req, res) => {
  try {
    const { status, id_kategori, lokasi, dari, sampai, sort = 'terbaru' } = req.query;
    const where = [], params = [];
    if (status)      { where.push('b.status = ?');          params.push(status); }
    if (id_kategori) { where.push('b.id_kategori = ?');     params.push(id_kategori); }
    if (lokasi)      { where.push('b.lokasi LIKE ?');       params.push(`%${lokasi}%`); }
    if (dari)        { where.push('b.tanggal_kejadian >= ?'); params.push(dari); }
    if (sampai)      { where.push('b.tanggal_kejadian <= ?'); params.push(sampai); }
    let sql = `SELECT b.*, u.nama AS nama_pengunggah, k.nama_kategori,
                      fb.foto_url AS foto_utama,
                      (SELECT COUNT(*) FROM foto_barang f2 WHERE f2.id_barang = b.id_barang) AS jumlah_foto
               FROM barang b
               JOIN \`user\` u ON u.id_user = b.id_user
               JOIN kategori k ON k.id_kategori = b.id_kategori
               LEFT JOIN foto_barang fb ON fb.id_barang = b.id_barang AND fb.is_utama = 1`;
    if (where.length) sql += ' WHERE ' + where.join(' AND ');
    sql += sort === 'lokasi' ? ' ORDER BY b.lokasi ASC, b.created_at DESC'
         : sort === 'lama'   ? ' ORDER BY b.tanggal_kejadian ASC'
         :                     ' ORDER BY b.created_at DESC, b.id_barang DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /barang/:id → detail + galeri + klaim
router.get('/:id', async (req, res) => {
  try {
    const [b] = await pool.query(
      `SELECT b.*, u.nama AS nama_pengunggah, k.nama_kategori
       FROM barang b
       JOIN \`user\` u ON u.id_user = b.id_user
       JOIN kategori k ON k.id_kategori = b.id_kategori
       WHERE b.id_barang = ?`, [req.params.id]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    const [foto] = await pool.query(
      'SELECT id_foto, foto_url, is_utama, urutan_foto FROM foto_barang WHERE id_barang = ? ORDER BY urutan_foto',
      [req.params.id]);
    const [klaim] = await pool.query(
      `SELECT k.id_klaim, k.id_user, u.nama AS nama_pengklaim, u.foto_profil AS foto_pengklaim,
              k.alasan_klaim, k.bukti_kepemilikan, k.nomor_telepon_jaminan,
              k.created_at AS waktu_klaim, k.status_klaim
       FROM klaim k JOIN \`user\` u ON u.id_user = k.id_user
       WHERE k.id_barang = ? ORDER BY k.created_at DESC`, [req.params.id]);
    res.json({ ...b[0], arah_klaim: arahKlaim(b[0].status), foto, klaim });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /barang/:id/status
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