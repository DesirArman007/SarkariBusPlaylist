import crypto from 'crypto';
import 'dotenv/config';

export const getAdminSecretKey = () => (process.env.SYS_BUS_SESSION_HASH || process.env.ADMIN_SECRET_KEY || '').replace(/^["']|["']$/g, '').trim();

export const safeCompare = (provided, expected) => {
  if (!provided || !expected) return false;
  const bufA = Buffer.from(provided);
  const bufB = Buffer.from(expected);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufB, bufB);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
};

export const adminAuthMiddleware = (req, res, next) => {
  const expectedKey = getAdminSecretKey();
  const providedKey = (req.headers['x-admin-key'] || '').trim();
  if (!expectedKey || !providedKey || !safeCompare(providedKey, expectedKey)) {
    console.warn("Unauthorized admin attempt blocked!");
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing Admin Secret Key! Access restricted to admins only."
    });
  }
  next();
};
