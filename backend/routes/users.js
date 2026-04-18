const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');
const requireAdmin = require('../middleware/requireAdmin');
const { getPublicUser, getUsers, updateUser } = require('../utils/userStore');

// Get user profile
router.get('/profile', requireAuth, (req, res) => {
  try {
    res.json({
      message: 'Profile berhasil diambil',
      user: getPublicUser(req.user)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const nama = (req.body.nama || req.user.nama || '').trim();
    const noTelepon = (req.body.noTelepon || '').trim();
    const alamat = (req.body.alamat || '').trim();
    const kota = (req.body.kota || '').trim();
    const provinsi = (req.body.provinsi || '').trim();

    if (!nama) {
      return res.status(400).json({ error: 'Nama wajib diisi' });
    }

    const updatedUser = await updateUser(req.user.id, {
      nama,
      noTelepon,
      alamat,
      kota,
      provinsi
    });

    if (!updatedUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    res.json({
      message: 'Profile berhasil diupdate',
      user: getPublicUser(updatedUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await getUsers();

    res.json({
      message: 'Daftar user',
      totalUsers: users.length,
      users: users.map(getPublicUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
