import multer from 'multer';
import fs from 'fs';

if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) =>
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // maks 5 MB
  fileFilter: (req, file, cb) => {
    const ok = /jpeg|jpg|png|webp/.test(file.originalname.toLowerCase());
    ok ? cb(null, true) : cb(new Error('Hanya file gambar yang diizinkan'));
  },
});