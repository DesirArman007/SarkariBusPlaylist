// Central backend URL config
// - In development: VITE_API_URL is empty so all /api/* calls go through Vite proxy -> localhost:5000
// - In production (Vercel): VITE_API_URL = https://sarkaribusplaylist.onrender.com
export const API_BASE = import.meta.env.VITE_API_URL || '';
