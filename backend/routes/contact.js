const express = require('express');
const router = express.Router();
const validator = require('validator');
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const { notifyMessageResponse } = require('../utils/notificationService');
const {
  createMessage,
  deleteMessage,
  findMessageById,
  listMessages,
  updateMessage
} = require('../utils/messageStore');

// Send contact message
router.post('/send', async (req, res) => {
  try {
    const { nama, email, noTelepon, subjek, pesan } = req.body;

    // Validasi
    if (!nama || !email || !pesan) {
      return res.status(400).json({ error: 'Nama, email, dan pesan harus diisi' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Email tidak valid' });
    }

    if (pesan.length < 10) {
      return res.status(400).json({ error: 'Pesan minimal 10 karakter' });
    }

    const message = await createMessage({
      nama,
      email,
      noTelepon,
      subjek,
      pesan
    });

    await createAuditLog({
      actorId: null,
      actorEmail: email,
      actorRole: 'public',
      action: 'contact.create',
      entityType: 'message',
      entityId: String(message.id),
      summary: `Pesan baru dari ${nama}`
    });

    res.status(201).json({
      message: 'Pesan berhasil dikirim! Terima kasih sudah menghubungi kami. Kami akan segera merespons.',
      data: {
        id: message.id,
        timestamp: message.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all messages (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const messages = await listMessages();

    res.json({
      message: 'Daftar pesan',
      total: messages.length,
      unread: messages.filter(m => m.status === 'unread').length,
      messages
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get message details
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const message = await findMessageById(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan' });
    }

    // Mark as read
    const result = message.status === 'unread'
      ? await updateMessage(req.params.id, { status: 'read', readAt: new Date().toISOString() })
      : message;

    res.json({
      message: 'Detail pesan',
      data: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send response to message
router.post('/:id/respond', requireAdmin, async (req, res) => {
  try {
    const { response } = req.body;

    const message = await findMessageById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan' });
    }

    if (!response) {
      return res.status(400).json({ error: 'Response tidak boleh kosong' });
    }

    const updatedMessage = await updateMessage(req.params.id, {
      response,
      status: 'responded',
      readAt: message.readAt || new Date().toISOString(),
      respondedAt: new Date().toISOString()
    });

    await notifyMessageResponse({
      message,
      response
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'contact.respond',
      entityType: 'message',
      entityId: String(updatedMessage.id),
      summary: `Pesan ${message.email} dibalas admin`
    });

    res.json({
      message: 'Response berhasil dikirim',
      data: updatedMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedMessage = await deleteMessage(req.params.id);

    if (!deletedMessage) {
      return res.status(404).json({ error: 'Pesan tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'contact.delete',
      entityType: 'message',
      entityId: String(deletedMessage.id),
      summary: `Pesan ${deletedMessage.email} dihapus`
    });

    res.json({
      message: 'Pesan berhasil dihapus',
      data: deletedMessage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
