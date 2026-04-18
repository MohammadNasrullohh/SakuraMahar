const requireAuth = require('./requireAuth');

const requireAdmin = (req, res, next) =>
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Akses admin diperlukan' });
    }

    return next();
  });

module.exports = requireAdmin;
