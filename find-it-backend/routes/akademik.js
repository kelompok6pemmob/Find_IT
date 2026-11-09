import { Router } from 'express';
import { pool } from '../db.js';

const router = Router();

// GET /akademik/fakultas → daftar fakultas (picker registrasi)
router.get('/fakultas', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_fakultas, nama_fakultas FROM fakultas ORDER BY id_fakultas');
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// GET /akademik/prodi?id_fakultas= → daftar prodi (cascading picker)
router.get('/prodi', async (req, res) => {
  try {
    const { id_fakultas } = req.query;
    if (id_fakultas) {
      const [rows] = await pool.query(
        'SELECT id_prodi, nama_prodi FROM prodi WHERE id_fakultas = ? ORDER BY nama_prodi', [id_fakultas]);
      return res.json(rows);
    }
    const [rows] = await pool.query(
      `SELECT p.id_prodi, p.nama_prodi, p.id_fakultas, f.nama_fakultas
       FROM prodi p JOIN fakultas f ON f.id_fakultas = p.id_fakultas
       ORDER BY f.nama_fakultas, p.nama_prodi`);
    res.json(rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
});

export default router;