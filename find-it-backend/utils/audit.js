import { pool } from '../db.js';
const catatAudit = async (id_user, aktivitas, tabel_referensi, id_referensi, deskripsi = null) => {
  try {
    await pool.query(
      'INSERT INTO audit_log (id_user, aktivitas, tabel_referensi, id_referensi, deskripsi) VALUES (?, ?, ?, ?, ?)',
      [id_user, aktivitas, tabel_referensi, id_referensi, deskripsi]);
  } catch (e) { console.error('audit gagal:', e.message); }
};
export default catatAudit;