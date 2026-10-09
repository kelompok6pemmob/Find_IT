import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';

const router = Router();
const buatToken = (u) =>
  jwt.sign({ id_user: u.id_user, email: u.email, nama: u.nama },
    process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES });

router.post('/register', async (req, res) => {
  try {
    const { email, password, nama } = req.body;
    if (!email || !password || !nama)
      return res.status(400).json({ message: 'email, password, nama wajib diisi' });
    const [exist] = await pool.query('SELECT id_user FROM `user` WHERE email = ?', [email]);
    if (exist.length) return res.status(409).json({ message: 'Email sudah terdaftar' });
    const hash = await bcrypt.hash(password, 10);
    const [r] = await pool.query(
      'INSERT INTO `user` (email, password_hash, auth_provider, nama) VALUES (?, ?, "email", ?)',
      [email, hash, nama]);
    res.status(201).json({ id_user: r.insertId, email, nama });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM `user` WHERE email = ?', [email]);
    const user = rows[0];
    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash)))
      return res.status(401).json({ message: 'Email/password salah' });
    res.json({ token: buatToken(user), user: { id_user: user.id_user, nama: user.nama, email: user.email } });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Login Gmail (US-07). Frontend Expo kirim data hasil Google Sign-In.
// TODO produksi: verifikasi idToken dengan google-auth-library.
router.post('/google', async (req, res) => {
  try {
    const { google_id, email, nama, foto_profil } = req.body;
    if (!google_id || !email || !nama)
      return res.status(400).json({ message: 'google_id, email, nama wajib diisi' });
    let [rows] = await pool.query('SELECT * FROM `user` WHERE google_id = ? OR email = ?', [google_id, email]);
    let user = rows[0];
    if (!user) {
      const [r] = await pool.query(
        'INSERT INTO `user` (email, auth_provider, google_id, nama, foto_profil) VALUES (?, "google", ?, ?, ?)',
        [email, google_id, nama, foto_profil]);
      user = { id_user: r.insertId, email, nama };
    }
    res.json({ token: buatToken(user), user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;