import { pool } from '../db.js';
import sendPushNotification from './sendPushNotification.js';

const kirimNotifikasi = async ({
  id_user, judul, pesan, tipe = 'sistem',
  id_barang = null, id_klaim = null, id_room = null, data = {},
}) => {
  try {
    const [n] = await pool.query(
      `INSERT INTO notifikasi (id_user, judul, pesan, tipe, id_barang, id_klaim, id_room)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id_user, judul, pesan, tipe, id_barang, id_klaim, id_room]);
    const [devices] = await pool.query(
      'SELECT expo_push_token FROM user_device WHERE id_user = ? AND is_active = 1', [id_user]);
    await Promise.all(devices.map((d) =>
      sendPushNotification(d.expo_push_token, judul, pesan, { ...data, id_notifikasi: n.insertId })));
    return n.insertId;
  } catch (e) {
    console.error('kirimNotifikasi gagal:', e.message);
    return null;
  }
};
export default kirimNotifikasi;