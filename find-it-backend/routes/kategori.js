import { Router } from 'express';
import { pool } from '../db.js';
const router = Router();

router.get('/', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM kategori ORDER BY id_kategori');
  res.json(rows);
});

export default router;