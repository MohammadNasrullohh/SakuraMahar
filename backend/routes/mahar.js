const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const {
  addPaymentToMahar,
  createMahar,
  deleteMahar,
  findMaharById,
  listMahars,
  updateMahar
} = require('../utils/maharStore');

// Create mahar
router.post('/create', requireAdmin, async (req, res) => {
  try {
    const { 
      userId, 
      jumlah, 
      deskripsi, 
      metodePerayaan, 
      tanggalPerayaan,
      nama,
      email
    } = req.body;

    if (!jumlah || !metodePerayaan) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const mahar = await createMahar({
      userId,
      jumlah,
      deskripsi,
      metodePerayaan,
      tanggalPerayaan,
      status: 'active',
      nama,
      email
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'mahar.create',
      entityType: 'mahar',
      entityId: String(mahar.id),
      summary: `Mahar baru dibuat untuk ${mahar.nama || mahar.email || `#${mahar.id}`}`
    });

    res.status(201).json({
      message: 'Mahar berhasil dibuat',
      mahar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get mahar details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const mahar = await findMaharById(req.params.id);

    if (!mahar) {
      return res.status(404).json({ error: 'Mahar tidak ditemukan' });
    }

    res.json({
      message: 'Detail mahar',
      mahar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all mahars
router.get('/', requireAdmin, async (req, res) => {
  try {
    const mahars = await listMahars();

    res.json({
      message: 'Daftar semua mahar',
      total: mahars.length,
      mahars
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Record pembayaran
router.post('/:id/bayar', requireAdmin, async (req, res) => {
  try {
    const { jumlah, metode, bukti } = req.body;

    if (!jumlah || !metode) {
      return res.status(400).json({ error: 'Data pembayaran tidak lengkap' });
    }

    const paymentResult = await addPaymentToMahar(req.params.id, {
      jumlah,
      metode,
      bukti
    });

    if (!paymentResult) {
      return res.status(404).json({ error: 'Mahar tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'mahar.payment.create',
      entityType: 'mahar',
      entityId: String(paymentResult.mahar.id),
      summary: `Pembayaran mahar dicatat untuk #${paymentResult.mahar.id}`,
      metadata: {
        jumlah: paymentResult.pembayaran.jumlah,
        metode: paymentResult.pembayaran.metode
      }
    });

    res.status(201).json({
      message: 'Pembayaran berhasil dicatat',
      pembayaran: paymentResult.pembayaran,
      totalTerbayar: paymentResult.totalTerbayar,
      sisaTagihan: paymentResult.sisaTagihan,
      mahar: paymentResult.mahar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const mahar = await updateMahar(req.params.id, req.body || {});

    if (!mahar) {
      return res.status(404).json({ error: 'Mahar tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'mahar.update',
      entityType: 'mahar',
      entityId: String(mahar.id),
      summary: `Mahar #${mahar.id} diperbarui`
    });

    res.json({
      message: 'Mahar berhasil diperbarui',
      mahar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const mahar = await deleteMahar(req.params.id);

    if (!mahar) {
      return res.status(404).json({ error: 'Mahar tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'mahar.delete',
      entityType: 'mahar',
      entityId: String(mahar.id),
      summary: `Mahar #${mahar.id} dihapus`
    });

    res.json({
      message: 'Mahar berhasil dihapus',
      mahar
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
