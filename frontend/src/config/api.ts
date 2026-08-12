// Central backend URL config
// - In development: VITE_API_URL is empty so all /api/* calls go through Vite proxy -> localhost:5000
// - In production (Vercel): VITE_API_URL = https://sarkaribusplaylist.onrender.com
export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Resolves a URL that may be a relative /uploads/... path (stored by Render's file upload)
 * to an absolute URL pointing at the backend server.
 * External URLs (http/https) are returned unchanged.
 */
export const resolveUploadUrl = (url: string | undefined | null): string => {
  if (!url) return '';
  // Already an absolute URL — return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Relative path from Render uploads — prefix with the backend base URL
  return `${API_BASE}${url}`;
};
