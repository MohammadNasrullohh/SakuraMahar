const { verifyAuthToken } = require('../utils/auth');
const { findUserById } = require('../utils/userStore');

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan atau token sudah tidak berlaku' });
    }

    req.auth = decoded;
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token tidak valid' });
  }
};

module.exports = requireAuth;
