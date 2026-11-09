import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import catatAudit from '../utils/audit.js';
import kirimNotifikasi from '../utils/kirimnotifikasi.js';

const router = Router();
router.use(authMiddleware);
// CATATAN PRIVASI: nomor_telepon_jaminan bersifat WRITE-ONLY,
// tidak pernah di-SELECT oleh endpoint mana pun sesuai keputusan kelompok.

// POST /klaim → klaim laporan F1 maupun F2
router.post('/', upload.single('bukti'), async (req, res) => {
  try {
    const { id_barang, alasan_klaim, nomor_telepon_jaminan } = req.body;
    if (!id_barang || !alasan_klaim || !nomor_telepon_jaminan)
      return res.status(400).json({ message: 'id_barang, alasan_klaim, nomor_telepon_jaminan wajib diisi' });
    if (!/^[0-9+ -]{8,20}$/.test(nomor_telepon_jaminan))
      return res.status(400).json({ message: 'nomor_telepon_jaminan tidak valid (8-20 karakter angka)' });
    const [b] = await pool.query('SELECT * FROM barang WHERE id_barang = ?', [id_barang]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    if (b[0].id_user === req.user.id_user)
      return res.status(400).json({ message: 'Tidak bisa mengklaim laporan sendiri' });
    if (b[0].status === 'Dikembalikan')
      return res.status(409).json({ message: 'Barang sudah dikembalikan, klaim ditutup' });
    const [dup] = await pool.query(
      "SELECT id_klaim FROM klaim WHERE id_barang = ? AND id_user = ? AND status_klaim = 'Pending'",
      [id_barang, req.user.id_user]);
    if (dup.length) return res.status(409).json({ message: 'Klaim Pending kamu sudah ada di laporan ini' });

    const bukti = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    const [r] = await pool.query(
      `INSERT INTO klaim (id_barang, id_user, alasan_klaim, bukti_kepemilikan, nomor_telepon_jaminan)
       VALUES (?, ?, ?, ?, ?)`,
      [id_barang, req.user.id_user, alasan_klaim, bukti, nomor_telepon_jaminan]);
    catatAudit(req.user.id_user, 'CREATE_KLAIM', 'klaim', r.insertId, `Klaim barang #${id_barang}`);
    await kirimNotifikasi({
      id_user: b[0].id_user, judul: 'Klaim baru masuk',
      pesan: `${req.user.nama} mengajukan klaim pada laporan "${b[0].judul}".`,
      tipe: 'klaim', id_barang: b[0].id_barang, id_klaim: r.insertId,
    });
    res.status(201).json({
      id_klaim: r.insertId, jenis_laporan: b[0].status,
      message: b[0].status === 'Ditemukan'
        ? 'Klaim kepemilikan diajukan ke penemu barang'
        : 'Klaim penemuan diajukan ke pemilik yang kehilangan',
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /klaim/saya → laporan dilihat dari ARAH KLAIM (tanpa nomor telepon jaminan)
router.get('/saya', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT k.id_klaim, k.id_barang, k.alasan_klaim, k.bukti_kepemilikan,
              k.status_klaim, k.created_at AS waktu_klaim, k.updated_at,
              b.judul, b.deskripsi, b.lokasi, b.tanggal_kejadian, b.status AS status_barang,
              b.id_user AS id_pengunggah, u.nama AS nama_pengunggah, kat.nama_kategori,
              fb.foto_url AS foto_utama
       FROM klaim k
       JOIN barang b   ON b.id_barang = k.id_barang
       JOIN \`user\` u ON u.id_user = b.id_user
       JOIN kategori kat ON kat.id_kategori = b.id_kategori
       LEFT JOIN foto_barang fb ON fb.id_barang = b.id_barang AND fb.is_utama = 1
       WHERE k.id_user = ?
       ORDER BY k.created_at DESC`, [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /klaim/masuk → klaim yang masuk ke laporan miliku (arah PELAPOR)
router.get('/masuk', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT k.id_klaim, k.id_barang, k.id_user, k.alasan_klaim, k.bukti_kepemilikan,
              k.nomor_telepon_jaminan,
              k.status_klaim, k.created_at AS waktu_klaim,
              b.judul, b.lokasi, b.status AS status_barang,
              u.nama AS nama_pengklaim, u.foto_profil AS foto_pengklaim,
              fb.foto_url AS foto_utama
       FROM klaim k
       JOIN barang b   ON b.id_barang = k.id_barang
       JOIN \`user\` u ON u.id_user = k.id_user
       LEFT JOIN foto_barang fb ON fb.id_barang = b.id_barang AND fb.is_utama = 1
       WHERE b.id_user = ?
       ORDER BY k.status_klaim = 'Pending' DESC, k.created_at DESC`, [req.user.id_user]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /klaim/:id/status → terima/tolak (transaksi) + notifikasi ke pengklaim
router.patch('/:id/status', async (req, res) => {
  const { status_klaim } = req.body;
  if (!['Diterima', 'Ditolak'].includes(status_klaim))
    return res.status(400).json({ message: "status_klaim harus 'Diterima' atau 'Ditolak'" });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [k] = await conn.query(
      `SELECT k.*, b.id_user AS id_pelapor, b.judul FROM klaim k
       JOIN barang b ON b.id_barang = k.id_barang
       WHERE k.id_klaim = ? FOR UPDATE`, [req.params.id]);
    if (!k.length) { await conn.rollback(); return res.status(404).json({ message: 'Klaim tidak ditemukan' }); }
    if (k[0].id_pelapor !== req.user.id_user) { await conn.rollback(); return res.status(403).json({ message: 'Hanya pemilik laporan yang bisa memutuskan klaim' }); }
    if (k[0].status_klaim !== 'Pending') { await conn.rollback(); return res.status(409).json({ message: 'Klaim sudah diputuskan sebelumnya' }); }

    await conn.query('UPDATE klaim SET status_klaim = ? WHERE id_klaim = ?', [status_klaim, req.params.id]);
    if (status_klaim === 'Diterima') {
      await conn.query("UPDATE barang SET status = 'Dikembalikan' WHERE id_barang = ?", [k[0].id_barang]);
      await conn.query(
        `UPDATE klaim SET status_klaim = 'Ditolak'
         WHERE id_barang = ? AND id_klaim <> ? AND status_klaim = 'Pending'`,
        [k[0].id_barang, req.params.id]);
    }
    await conn.commit();
    catatAudit(req.user.id_user, 'PUTUSAN_KLAIM', 'klaim', k[0].id_klaim, status_klaim);
    await kirimNotifikasi({
      id_user: k[0].id_user, judul: `Klaim ${status_klaim.toLowerCase()}`,
      pesan: status_klaim === 'Diterima'
        ? `Selamat! Klaimmu pada "${k[0].judul}" diterima. Barang ditandai Dikembalikan.`
        : `Klaimmu pada "${k[0].judul}" ditolak oleh pelapor.`,
      tipe: 'klaim', id_barang: k[0].id_barang, id_klaim: k[0].id_klaim,
    });
    res.json({ message: `Klaim ${status_klaim.toLowerCase()}${status_klaim === 'Diterima' ? ', status barang menjadi Dikembalikan' : ''}` });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally { conn.release(); }
});

export default router;