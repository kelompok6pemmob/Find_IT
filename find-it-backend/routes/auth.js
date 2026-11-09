import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import catatAudit from '../utils/audit.js';

const router = Router();
const buatToken = (u) =>
  jwt.sign(
    { id_user: u.id_user, email: u.email, nama: u.nama, id_role: u.id_role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES }
  );

// POST /auth/register → + jenis_pengguna, id_prodi, telepon
router.post('/register', async (req, res) => {
  try {
    const { email, password, nama, jenis_pengguna = 'Mahasiswa', id_prodi = null, telepon = null } = req.body;
    if (!email || !password || !nama)
      return res.status(400).json({ message: 'email, password, nama wajib diisi' });
    if (!['Mahasiswa', 'Dosen', 'Tendik', 'Umum'].includes(jenis_pengguna))
      return res.status(400).json({ message: 'jenis_pengguna tidak valid' });
    if (id_prodi) {
      const [p] = await pool.query('SELECT id_prodi FROM prodi WHERE id_prodi = ?', [id_prodi]);
      if (!p.length) return res.status(400).json({ message: 'id_prodi tidak ditemukan' });
    }
    const [exist] = await pool.query('SELECT id_user FROM `user` WHERE email = ?', [email]);
    if (exist.length) return res.status(409).json({ message: 'Email sudah terdaftar' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      `INSERT INTO \`user\` (email, password_hash, auth_provider, nama, telepon, jenis_pengguna, id_prodi)
       VALUES (?, ?, 'email', ?, ?, ?, ?)`,
      [email, hash, nama, telepon, jenis_pengguna, id_prodi]);
    res.status(201).json({ id_user: r.insertId, email, nama, jenis_pengguna });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM `user` WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Email/password salah' });
    if (user.status_aktif !== 'Aktif')
      return res.status(403).json({ message: 'Akun dinonaktifkan' });
    res.json({
      token: buatToken(user),
      user: { id_user: user.id_user, nama: user.nama, email: user.email, foto_profil: user.foto_profil, id_role: user.id_role, jenis_pengguna: user.jenis_pengguna },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// POST /auth/google → login/daftar via Gmail (US-07), email otomatis terverifikasi
router.post('/google', async (req, res) => {
  try {
    const { google_id, email, nama, foto_profil } = req.body;
    if (!google_id || !email || !nama)
      return res.status(400).json({ message: 'google_id, email, nama wajib diisi' });
    // TODO produksi: verifikasi idToken Google di sini
    let [rows] = await pool.query('SELECT * FROM `user` WHERE google_id = ? OR email = ?', [google_id, email]);
    let user = rows[0];
    if (!user) {
      const [r] = await pool.query(
        `INSERT INTO \`user\` (email, auth_provider, google_id, nama, foto_profil, email_verified)
         VALUES (?, 'google', ?, ?, ?, 1)`,
        [email, google_id, nama, foto_profil]);
      user = { id_user: r.insertId, email, nama, id_role: 1, jenis_pengguna: 'Mahasiswa' };
    } else {
      if (!user.google_id) await pool.query('UPDATE `user` SET google_id = ? WHERE id_user = ?', [google_id, user.id_user]);
      if (!user.email_verified) await pool.query('UPDATE `user` SET email_verified = 1 WHERE id_user = ?', [user.id_user]);
      if (user.status_aktif !== 'Aktif') return res.status(403).json({ message: 'Akun dinonaktifkan' });
    }
    res.json({
      token: buatToken(user),
      user: { id_user: user.id_user, nama: user.nama, email: user.email, foto_profil: user.foto_profil || foto_profil, id_role: user.id_role, jenis_pengguna: user.jenis_pengguna },
    });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /auth/me → profil lengkapku (untuk halaman Profil)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.id_user, u.email, u.email_verified, u.nama, u.foto_profil, u.telepon,
              u.jenis_pengguna, u.status_aktif, u.id_prodi, u.id_role,
              p.nama_prodi, f.id_fakultas, f.nama_fakultas, r.nama_role
       FROM \`user\` u
       LEFT JOIN prodi p ON p.id_prodi = u.id_prodi
       LEFT JOIN fakultas f ON f.id_fakultas = p.id_fakultas
       LEFT JOIN role r ON r.id_role = u.id_role
       WHERE u.id_user = ?`, [req.user.id_user]);
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// PATCH /auth/profil → ubah nama/telepon/prodi/foto profil
router.patch('/profil', authMiddleware, upload.single('foto_profil'), async (req, res) => {
  try {
    const { nama, telepon, id_prodi } = req.body;
    const foto = req.file ? `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}` : null;
    if (id_prodi) {
      const [p] = await pool.query('SELECT id_prodi FROM prodi WHERE id_prodi = ?', [id_prodi]);
      if (!p.length) return res.status(400).json({ message: 'id_prodi tidak ditemukan' });
    }
    await pool.query(
      `UPDATE \`user\` SET
         nama = COALESCE(?, nama),
         telepon = COALESCE(?, telepon),
         id_prodi = COALESCE(?, id_prodi),
         foto_profil = COALESCE(?, foto_profil)
       WHERE id_user = ?`,
      [nama || null, telepon || null, id_prodi || null, foto, req.user.id_user]);
    catatAudit(req.user.id_user, 'UPDATE_PROFIL', 'user', req.user.id_user);
    res.json({ message: 'Profil diperbarui' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;