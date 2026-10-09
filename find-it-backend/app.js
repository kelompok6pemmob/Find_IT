import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import kategoriRoutes from './routes/kategori.js';
import barangRoutes from './routes/barang.js';
import klaimRoutes from './routes/klaim.js';
import pesanRoutes from './routes/pesan.js';

const app = express();
app.use(cors());
app.use(express.json());

// agar foto barang/bukti klaim bisa diakses aplikasi mobile
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
app.use('/kategori', kategoriRoutes);
app.use('/barang', barangRoutes);   // F1, F2, F3, F5
app.use('/klaim', klaimRoutes);     // verifikasi kepemilikan (US-07)
app.use('/pesan', pesanRoutes);      // F4 chat

// error handler global (mis. file upload terlalu besar)
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});

export default app;