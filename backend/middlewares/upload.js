import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_AUDIO_EXTENSIONS = /\.(mp3|wav|ogg|flac|aac|m4a|wma)$/i;
const ALLOWED_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const prefix = file.fieldname === 'coverFile' ? 'cover' : 'audio';
    cb(null, `${prefix}-${uniqueSuffix}${ext}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'songFile' && ALLOWED_AUDIO_EXTENSIONS.test(ext)) {
      return cb(null, true);
    }
    if (file.fieldname === 'coverFile' && ALLOWED_IMAGE_EXTENSIONS.test(ext)) {
      return cb(null, true);
    }
    cb(new Error(`Invalid file type: ${ext}. Only audio (mp3, wav, ogg, flac, aac, m4a) and image (jpg, png, webp, gif) files are allowed.`));
  }
});
