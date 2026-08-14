import 'dotenv/config';

export const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'https://sarkari-bus-playlist.vercel.app',
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const vercelPreviewRegex = /^https:\/\/sarkari-bus-playlist(-[a-z0-9]+)*\.vercel\.app$/;

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (vercelPreviewRegex.test(origin)) return true;
  return false;
};
