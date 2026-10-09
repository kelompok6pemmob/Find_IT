import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// Semua endpoint chat wajib login
router.use(authMiddleware);

// POST /pesan → kirim pesan dalam konteks satu laporan barang (F4 / US-04)
// Body: { id_penerima, id_barang, isi_pesan }
router.post('/', async (req, res) => {
  try {
    const { id_penerima, id_barang, isi_pesan } = req.body;

    if (!id_penerima || !id_barang || !isi_pesan)
      return res.status(400).json({ message: 'id_penerima, id_barang, isi_pesan wajib diisi' });

    if (id_penerima === req.user.id_user)
      return res.status(400).json({ message: 'Tidak bisa mengirim pesan ke diri sendiri' });

    // Pastikan laporan barangnya ada
    const [b] = await pool.query('SELECT id_barang FROM barang WHERE id_barang = ?', [id_barang]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });

    // Pastikan penerima benar-benar user yang valid
    const [u] = await pool.query('SELECT id_user FROM `user` WHERE id_user = ? AND status_aktif = "Aktif"', [id_penerima]);
    if (!u.length) return res.status(404).json({ message: 'Penerima tidak ditemukan atau tidak aktif' });

    const [r] = await pool.query(
      'INSERT INTO pesan (id_pengirim, id_penerima, id_barang, isi_pesan) VALUES (?, ?, ?, ?)',
      [req.user.id_user, id_penerima, id_barang, isi_pesan]
    );

    res.status(201).json({
      id_pesan: r.insertId,
      id_pengirim: req.user.id_user,
      id_penerima,
      id_barang,
      isi_pesan,
      timestamp: new Date(),
      status_baca: false,
      message: 'Pesan terkirim'
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /pesan/:id_barang?dengan=<id_user_lawan>
// → ambil riwayat obrolan antara aku dan lawan bicara, khusus untuk laporan barang tsb
router.get('/:id_barang', async (req, res) => {
  try {
    const me = req.user.id_user;
    const idLawan = req.query.dengan;

    if (!idLawan)
      return res.status(400).json({ message: 'Query ?dengan=<id_user_lawan> wajib diisi' });

    if (idLawan == me)
      return res.status(400).json({ message: 'id lawan bicara tidak boleh sama dengan diri sendiri' });

    const [rows] = await pool.query(
      `SELECT p.*, u.nama AS nama_pengirim, u.foto_profil AS foto_pengirim
       FROM pesan p
       JOIN \`user\` u ON u.id_user = p.id_pengirim
       WHERE p.id_barang = ?
         AND ((p.id_pengirim = ? AND p.id_penerima = ?)
           OR (p.id_pengirim = ? AND p.id_penerima = ?))
       ORDER BY p.timestamp ASC`,
      [req.params.id_barang, me, idLawan, idLawan, me]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /pesan/kontak/saya → daftar lawan bicara (kontak chat) milik user saat ini
// Berguna untuk menampilkan list percakapan di aplikasi mobile
router.get('/kontak/saya', async (req, res) => {
  try {
    const me = req.user.id_user;
    const [rows] = await pool.query(
      `SELECT
         u.id_user,
         u.nama,
         u.foto_profil,
         b.id_barang,
         b.judul,
         b.status AS status_barang,
         MAX(p.timestamp) AS waktu_terakhir,
         (SELECT isi_pesan FROM pesan
          WHERE (id_pengirim = p.id_pengirim AND id_penerima = p.id_penerima)
             OR (id_pengirim = p.id_penerima AND id_penerima = p.id_pengirim)
          ORDER BY timestamp DESC LIMIT 1) AS pesan_terakhir,
         (SELECT COUNT(*) FROM pesan
          WHERE id_penerima = ? AND id_pengirim = u.id_user AND status_baca = FALSE) AS jumlah_belum_dibaca
       FROM pesan p
       JOIN \`user\` u ON u.id_user = CASE WHEN p.id_pengirim = ? THEN p.id_penerima ELSE p.id_pengirim END
       JOIN barang b ON b.id_barang = p.id_barang
       WHERE p.id_pengirim = ? OR p.id_penerima = ?
       GROUP BY u.id_user, b.id_barang
       ORDER BY waktu_terakhir DESC`,
      [me, me, me, me]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// PATCH /pesan/:id_barang/read → tandai semua pesan masuk di barang tsb sebagai sudah dibaca
router.patch('/:id_barang/read', async (req, res) => {
  try {
    const [r] = await pool.query(
      'UPDATE pesan SET status_baca = TRUE WHERE id_barang = ? AND id_penerima = ? AND status_baca = FALSE',
      [req.params.id_barang, req.user.id_user]
    );
    res.json({ pesan_dibaca: r.affectedRows });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// DELETE /pesan/:id → hapus satu pesan (opsional, untuk user hapus pesan miliknya sendiri)
router.delete('/:id', async (req, res) => {
  try {
    const [p] = await pool.query('SELECT * FROM pesan WHERE id_pesan = ?', [req.params.id]);
    if (!p.length) return res.status(404).json({ message: 'Pesan tidak ditemukan' });
    if (p[0].id_pengirim !== req.user.id_user)
      return res.status(403).json({ message: 'Hanya pengirim yang bisa menghapus pesannya' });

    await pool.query('DELETE FROM pesan WHERE id_pesan = ?', [req.params.id]);
    res.json({ message: 'Pesan dihapus' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

export default router;