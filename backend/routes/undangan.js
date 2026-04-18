const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const { notifyInvitationShare } = require('../utils/notificationService');
const {
  createInvitation,
  deleteInvitation,
  findInvitationByCode,
  listInvitations,
  updateInvitation,
  updateInvitationByCode
} = require('../utils/invitationStore');

// Send undangan
router.post('/send', requireAdmin, async (req, res) => {
  try {
    const { 
      userId, 
      guestId, 
      guestEmail, 
      guestNama,
      tanggalPernikahan,
      tempatPernikahan,
      jamMulai,
      linkGoogle
    } = req.body;

    if (!guestEmail || !guestNama || !tanggalPernikahan) {
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    const undangan = await createInvitation({
      userId,
      guestId,
      guestEmail,
      guestNama,
      tanggalPernikahan,
      tempatPernikahan,
      jamMulai,
      linkGoogle,
      status: 'sent'
    });
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const shareLink = `${frontendUrl}/rsvp/${undangan.uniqueCode}`;

    await notifyInvitationShare({
      invitation: undangan,
      shareLink
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'invitation.create',
      entityType: 'invitation',
      entityId: String(undangan.id),
      summary: `Undangan dibuat untuk ${undangan.guestNama}`,
      metadata: {
        guestEmail: undangan.guestEmail,
        shareLink
      }
    });

    res.status(201).json({
      message: 'Undangan berhasil dikirim',
      undangan,
      shareLink
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get undangan list
router.get('/list', requireAdmin, async (req, res) => {
  try {
    const undangans = await listInvitations();

    res.json({
      message: 'Daftar undangan',
      total: undangans.length,
      undangans,
      statistik: {
        total: undangans.length,
        sent: undangans.filter(u => u.status === 'sent').length,
        opened: undangans.filter(u => u.openedAt).length,
        responded: undangans.filter(u => u.response).length,
        confirmed: undangans.filter(u => u.response === 'confirmed').length,
        declined: undangans.filter(u => u.response === 'declined').length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RSVP response
router.post('/rsvp/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const { response, jumlahOrang, menu, catatan } = req.body;

    const undangan = await findInvitationByCode(code);
    if (!undangan) {
      return res.status(404).json({ error: 'Undangan tidak ditemukan' });
    }

    if (!['confirmed', 'declined'].includes(response)) {
      return res.status(400).json({ error: 'Response tidak valid' });
    }

    const updatedInvitation = await updateInvitationByCode(code, {
      openedAt: undangan.openedAt || new Date().toISOString(),
      response,
      respondedAt: new Date().toISOString(),
      jumlahOrang: jumlahOrang || 1,
      menu: menu || '',
      catatan: catatan || '',
      status: 'responded'
    });

    await createAuditLog({
      actorId: updatedInvitation.id,
      actorEmail: updatedInvitation.guestEmail,
      actorRole: 'guest',
      action: 'invitation.rsvp',
      entityType: 'invitation',
      entityId: String(updatedInvitation.id),
      summary: `RSVP ${response} dari ${updatedInvitation.guestNama}`,
      metadata: {
        jumlahOrang: updatedInvitation.jumlahOrang
      }
    });

    res.json({
      message: 'RSVP berhasil dicatat. Terima kasih!',
      undangan: updatedInvitation,
      teks: response === 'confirmed' 
        ? 'Kami tunggu kehadiran Anda pada acara istimewa kami'
        : 'Terima kasih atas pemberitahuannya'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get undangan by unique code (for sharing)
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const undangan = await findInvitationByCode(code);

    if (!undangan) {
      return res.status(404).json({ error: 'Undangan tidak ditemukan' });
    }

    // Tandai sebagai dibuka jika belum pernah
    const result = !undangan.openedAt
      ? await updateInvitationByCode(code, { openedAt: new Date().toISOString() })
      : undangan;

    res.json({
      message: 'Detail undangan',
      undangan: result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const invitation = await updateInvitation(req.params.id, req.body || {});

    if (!invitation) {
      return res.status(404).json({ error: 'Undangan tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'invitation.update',
      entityType: 'invitation',
      entityId: String(invitation.id),
      summary: `Undangan ${invitation.guestNama} diperbarui`
    });

    res.json({
      message: 'Undangan berhasil diperbarui',
      undangan: invitation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const invitation = await deleteInvitation(req.params.id);

    if (!invitation) {
      return res.status(404).json({ error: 'Undangan tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'invitation.delete',
      entityType: 'invitation',
      entityId: String(invitation.id),
      summary: `Undangan ${invitation.guestNama} dihapus`
    });

    res.json({
      message: 'Undangan berhasil dihapus',
      undangan: invitation
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
