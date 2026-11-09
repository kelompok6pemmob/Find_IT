import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import kategoriRoutes from './routes/kategori.js';
import barangRoutes from './routes/barang.js';
import klaimRoutes from './routes/klaim.js';
import pesanRoutes from './routes/pesan.js';
import notificationRoutes from './routes/notification.js';
import akademikRoutes from './routes/akademik.js';
import laporanKontenRoutes from './routes/laporanKonten.js';

const app = express();
app.use(cors());
app.use(express.json());

const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/auth', authRoutes);
app.use('/kategori', kategoriRoutes);
app.use('/barang', barangRoutes);
app.use('/klaim', klaimRoutes);
app.use('/pesan', pesanRoutes);
app.use('/notifikasi', notificationRoutes);
app.use('/akademik', akademikRoutes);
app.use('/laporan-konten', laporanKontenRoutes);

app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ message: err.message });
});

export default app;