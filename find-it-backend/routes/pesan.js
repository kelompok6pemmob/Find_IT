import { Router } from 'express';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import kirimNotifikasi from '../utils/kirimnotifikasi.js';

const router = Router();
router.use(authMiddleware);

const ambilRoom = async (id_room, me) => {
  const [r] = await pool.query(
    'SELECT * FROM room_chat WHERE id_room = ? AND (id_user1 = ? OR id_user2 = ?)',
    [id_room, me, me]);
  return r[0] || null;
};

// POST /pesan/room → buka/ambil room chat (get-or-create)
router.post('/room', async (req, res) => {
  try {
    const me = req.user.id_user;
    const { id_barang, id_lawan } = req.body;
    if (!id_barang || !id_lawan)
      return res.status(400).json({ message: 'id_barang dan id_lawan wajib diisi' });
    if (Number(id_lawan) === me)
      return res.status(400).json({ message: 'Tidak bisa membuat room dengan diri sendiri' });
    const [b] = await pool.query('SELECT id_barang FROM barang WHERE id_barang = ?', [id_barang]);
    if (!b.length) return res.status(404).json({ message: 'Laporan tidak ditemukan' });
    const [u] = await pool.query("SELECT id_user FROM `user` WHERE id_user = ? AND status_aktif = 'Aktif'", [id_lawan]);
    if (!u.length) return res.status(404).json({ message: 'User lawan tidak ditemukan / tidak aktif' });

    const u1 = Math.min(me, Number(id_lawan));
    const u2 = Math.max(me, Number(id_lawan));
    let [rooms] = await pool.query(
      'SELECT * FROM room_chat WHERE id_barang = ? AND id_user1 = ? AND id_user2 = ?',
      [id_barang, u1, u2]);
    if (!rooms.length) {
      const [r] = await pool.query(
        'INSERT INTO room_chat (id_barang, id_user1, id_user2) VALUES (?, ?, ?)',
        [id_barang, u1, u2]);
      [rooms] = await pool.query('SELECT * FROM room_chat WHERE id_room = ?', [r.insertId]);
    }
    res.status(201).json({ room: rooms[0], id_lawan: Number(id_lawan) });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /pesan/room/saya → daftar percakapan (inbox)
router.get('/room/saya', async (req, res) => {
  try {
    const me = req.user.id_user;
    const [rows] = await pool.query(
      `SELECT r.id_room, r.status_room, r.pesan_terakhir, r.waktu_pesan_terakhir,
              CASE WHEN r.id_user1 = ? THEN r.id_user2 ELSE r.id_user1 END AS id_lawan,
              u.nama AS nama_lawan, u.foto_profil AS foto_lawan,
              b.id_barang, b.judul, b.status AS status_barang, b.id_user AS id_pengunggah_barang,
              fb.foto_url AS foto_barang,
              (SELECT COUNT(*) FROM pesan p
               WHERE p.id_room = r.id_room AND p.id_pengirim != ? AND p.read_at IS NULL AND p.is_deleted = 0) AS belum_dibaca
       FROM room_chat r
       JOIN \`user\` u ON u.id_user = (CASE WHEN r.id_user1 = ? THEN r.id_user2 ELSE r.id_user1 END)
       JOIN barang b ON b.id_barang = r.id_barang
       LEFT JOIN foto_barang fb ON fb.id_barang = b.id_barang AND fb.is_utama = 1
       WHERE r.id_user1 = ? OR r.id_user2 = ?
       ORDER BY r.waktu_pesan_terakhir DESC`,
      [me, me, me, me, me]);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /pesan/room/:id_room → riwayat pesan satu room
router.get('/room/:id_room', async (req, res) => {
  try {
    const me = req.user.id_user;
    const room = await ambilRoom(req.params.id_room, me);
    if (!room) return res.status(404).json({ message: 'Room tidak ditemukan / bukan peserta' });
    const [rows] = await pool.query(
      `SELECT p.id_pesan, p.id_room, p.id_pengirim, p.tipe_pesan, p.isi_pesan, p.attachment_url,
              p.sent_at, p.read_at, p.is_deleted,
              u.nama AS nama_pengirim, u.foto_profil AS foto_pengirim,
              (p.id_pengirim = ?) AS milik_saya
       FROM pesan p JOIN \`user\` u ON u.id_user = p.id_pengirim
       WHERE p.id_room = ?
       ORDER BY p.sent_at ASC, p.id_pesan ASC`,
      [me, req.params.id_room]);
    res.json({ room, pesan: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /pesan → kirim pesan teks/gambar ke room + notifikasi push
router.post('/', upload.single('gambar'), async (req, res) => {
  try {
    const me = req.user.id_user;
    const { id_room, isi_pesan, tipe_pesan = 'teks' } = req.body;
    if (!id_room) return res.status(400).json({ message: 'id_room wajib diisi' });
    const room = await ambilRoom(id_room, me);
    if (!room) return res.status(404).json({ message: 'Room tidak ditemukan / bukan peserta' });
    if (room.status_room !== 'Aktif')
      return res.status(409).json({ message: `Room berstatus ${room.status_room}` });

    const tipe = tipe_pesan === 'gambar' ? 'gambar' : 'teks';
    let attachment_url = null;
    if (tipe === 'gambar') {
      if (!req.file) return res.status(400).json({ message: 'File gambar wajib untuk tipe gambar' });
      attachment_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    const isi = isi_pesan || (tipe === 'gambar' ? '[Gambar]' : '');
    if (!isi) return res.status(400).json({ message: 'isi_pesan wajib diisi untuk teks' });

    const [r] = await pool.query(
      'INSERT INTO pesan (id_room, id_pengirim, tipe_pesan, isi_pesan, attachment_url) VALUES (?, ?, ?, ?, ?)',
      [id_room, me, tipe, isi, attachment_url]);
    await pool.query('UPDATE room_chat SET pesan_terakhir = ? WHERE id_room = ?', [isi, id_room]);

    const idLawan = room.id_user1 === me ? room.id_user2 : room.id_user1;
    await kirimNotifikasi({
      id_user: idLawan, judul: 'Pesan baru',
      pesan: `${req.user.nama}: ${isi.slice(0, 60)}`,
      tipe: 'chat', id_room: room.id_room, id_barang: room.id_barang,
      data: { id_room: room.id_room },
    });
    res.status(201).json({ id_pesan: r.insertId, id_room: room.id_room, tipe_pesan: tipe, message: 'Pesan terkirim' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /pesan/room/:id_room/read → read receipt
router.patch('/room/:id_room/read', async (req, res) => {
  try {
    const me = req.user.id_user;
    const room = await ambilRoom(req.params.id_room, me);
    if (!room) return res.status(404).json({ message: 'Room tidak ditemukan' });
    const [r] = await pool.query(
      'UPDATE pesan SET read_at = NOW() WHERE id_room = ? AND id_pengirim != ? AND read_at IS NULL AND is_deleted = 0',
      [req.params.id_room, me]);
    res.json({ pesan_dibaca: r.affectedRows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;