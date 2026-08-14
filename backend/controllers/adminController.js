import { getAdminSecretKey, safeCompare } from '../middlewares/auth.js';

export const login = (req, res) => {
  const { password } = req.body || {};
  const expectedKey = getAdminSecretKey();

  if (!expectedKey) {
    return res.status(500).json({ success: false, error: "Server configuration error. Contact administrator." });
  }

  if (password && safeCompare(password.trim(), expectedKey)) {
    return res.json({ success: true, message: "Admin authenticated successfully!" });
  }
  return res.status(401).json({ success: false, error: "Invalid Admin Passcode!" });
};
