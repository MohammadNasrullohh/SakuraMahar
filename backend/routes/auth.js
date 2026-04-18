const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { signUserToken, verifyAuthToken } = require('../utils/auth');
const requireAuth = require('../middleware/requireAuth');
const { createAuditLog } = require('../utils/auditLogStore');
const {
  consumePasswordReset,
  createPasswordReset,
  findValidPasswordReset
} = require('../utils/passwordResetStore');
const { notifyPasswordReset } = require('../utils/notificationService');
const {
  createUser,
  findUserByEmail,
  findUserById,
  getPublicUser,
  setUserPassword
} = require('../utils/userStore');

const normalizeEmail = (email = '') => email.trim().toLowerCase();
const resolveFrontendUrl = (req) =>
  process.env.FRONTEND_URL ||
  `${req.get('x-forwarded-proto') || req.protocol}://${req.get('host')}`;

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const nama = (req.body.nama || '').trim();
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';
    const noTelepon = (req.body.noTelepon || '').trim();

    // Validasi input
    if (!nama || !email || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'Semua field harus diisi' 
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ 
        error: 'Email tidak valid' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Password tidak cocok' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password minimal 6 karakter' 
      });
    }

    // Cek user sudah exist
    const userExists = await findUserByEmail(email);
    if (userExists) {
      return res.status(400).json({ 
        error: 'Email sudah terdaftar' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const newUser = await createUser({
      nama,
      email,
      password: hashedPassword,
      noTelepon
    });

    // Generate token
    const token = signUserToken(newUser);

    res.status(201).json({
      message: 'Registrasi berhasil',
      token,
      user: getPublicUser(newUser)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email dan password harus diisi' 
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        error: 'Email atau password salah' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Email atau password salah' 
      });
    }

    const token = signUserToken(user);

    res.json({
      message: 'Login berhasil',
      token,
      user: getPublicUser(user)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token endpoint
router.post('/verify', async (req, res) => {
  try {
    const token = req.body.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).json({ error: 'Token diperlukan' });
    }

    const decoded = verifyAuthToken(token);
    const user = await findUserById(decoded.id);

    if (!user) {
      return res.status(401).json({ valid: false, error: 'User tidak ditemukan' });
    }

    return res.json({
      valid: true,
      token: signUserToken(user),
      user: getPublicUser(user)
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Token tidak valid' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email tidak valid.' });
    }

    const user = await findUserByEmail(email);

    if (user) {
      const resetRecord = await createPasswordReset({
        userId: user.id,
        email: user.email
      });
      const resetUrl = `${resolveFrontendUrl(req)}/reset-password?token=${resetRecord.id}`;

      await notifyPasswordReset({
        user,
        resetUrl
      });

      await createAuditLog({
        actorId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'auth.forgot_password',
        entityType: 'user',
        entityId: String(user.id),
        summary: `Permintaan reset password untuk ${user.email}`
      });
    }

    res.json({
      message: 'Jika email terdaftar, link reset password sudah dikirim.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const token = (req.body.token || '').trim();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!token) {
      return res.status(400).json({ error: 'Token reset tidak ditemukan.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter.' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password tidak cocok.' });
    }

    const resetRecord = await findValidPasswordReset(token);

    if (!resetRecord) {
      return res.status(400).json({ error: 'Token reset tidak valid atau sudah kedaluwarsa.' });
    }

    const user = await findUserById(resetRecord.userId);

    if (!user) {
      return res.status(404).json({ error: 'User tidak ditemukan.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await setUserPassword(user.id, hashedPassword);
    await consumePasswordReset(token);

    await createAuditLog({
      actorId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'auth.reset_password',
      entityType: 'user',
      entityId: String(user.id),
      summary: `Password direset untuk ${user.email}`
    });

    res.json({
      message: 'Password berhasil diatur ulang. Silakan login kembali.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword || '';
    const newPassword = req.body.newPassword || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'Semua field password harus diisi.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password baru minimal 6 karakter.' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'Konfirmasi password baru tidak cocok.' });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, req.user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Password saat ini salah.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await setUserPassword(req.user.id, hashedPassword);

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'auth.change_password',
      entityType: 'user',
      entityId: String(req.user.id),
      summary: `Password diubah untuk ${req.user.email}`
    });

    res.json({
      message: 'Password berhasil diubah.',
      user: getPublicUser(updatedUser),
      token: signUserToken(updatedUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
