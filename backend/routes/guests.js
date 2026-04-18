const express = require('express');
const router = express.Router();
const validator = require('validator');
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const {
  createGuest,
  deleteGuest,
  findGuestById,
  listGuests,
  updateGuest
} = require('../utils/guestStore');

// Add guest
router.post('/add', requireAdmin, async (req, res) => {
  try {
    const { userId, nama, email, noTelepon, status } = req.body;

    if (!nama || !email) {
      return res.status(400).json({ error: 'Nama dan email harus diisi' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email tidak valid' });
    }

    const newGuest = await createGuest({
      userId,
      nama,
      email,
      noTelepon,
      status
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'guest.create',
      entityType: 'guest',
      entityId: String(newGuest.id),
      summary: `Admin menambahkan tamu ${newGuest.nama}`
    });

    res.status(201).json({
      message: 'Tamu berhasil ditambahkan',
      guest: newGuest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get guest list
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const guests = await listGuests();

    res.json({
      message: 'Daftar tamu',
      total: guests.length,
      guests,
      statistik: {
        total: guests.length,
        pending: guests.filter(g => g.status === 'pending').length,
        confirmed: guests.filter(g => g.status === 'confirmed').length,
        declined: guests.filter(g => g.status === 'declined').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update guest status
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { status, kehadiran, jumlahOrang, menu, catatan } = req.body;

    const guest = await findGuestById(req.params.id);
    if (!guest) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    const updatedGuest = await updateGuest(req.params.id, {
      status: status || guest.status,
      kehadiran: kehadiran !== undefined ? kehadiran : guest.kehadiran,
      jumlahOrang: jumlahOrang || guest.jumlahOrang,
      menu: menu || guest.menu,
      catatan: catatan || guest.catatan
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'guest.status.update',
      entityType: 'guest',
      entityId: String(updatedGuest.id),
      summary: `Status tamu ${updatedGuest.nama} diperbarui menjadi ${updatedGuest.status}`
    });

    res.json({
      message: 'Status tamu berhasil diupdate',
      guest: updatedGuest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const guest = await updateGuest(req.params.id, req.body || {});

    if (!guest) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'guest.update',
      entityType: 'guest',
      entityId: String(guest.id),
      summary: `Data tamu ${guest.nama} diperbarui`
    });

    res.json({
      message: 'Data tamu berhasil diperbarui',
      guest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete guest
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedGuest = await deleteGuest(req.params.id);

    if (!deletedGuest) {
      return res.status(404).json({ error: 'Tamu tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'guest.delete',
      entityType: 'guest',
      entityId: String(deletedGuest.id),
      summary: `Tamu ${deletedGuest.nama} dihapus`
    });

    res.json({
      message: 'Tamu berhasil dihapus',
      guest: deletedGuest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
