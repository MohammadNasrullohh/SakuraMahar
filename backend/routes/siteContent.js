const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const { listGuests } = require('../utils/guestStore');
const { listInvitations } = require('../utils/invitationStore');
const { listMahars } = require('../utils/maharStore');
const { listMessages } = require('../utils/messageStore');
const { listOrders } = require('../utils/orderStore');
const { getSiteContent, saveSiteContent } = require('../utils/siteContentStore');
const { getUsers } = require('../utils/userStore');

const buildSummary = async () => {
  const [users, mahars, guests, invitations, messages, orders] = await Promise.all([
    getUsers(),
    listMahars(),
    listGuests(),
    listInvitations(),
    listMessages(),
    listOrders()
  ]);

  return {
    users: users.length,
    admins: users.filter((user) => user.role === 'admin').length,
    mahars: mahars.length,
    guests: guests.length,
    invitations: invitations.length,
    respondedInvitations: invitations.filter((invitation) => Boolean(invitation.response)).length,
    messages: messages.length,
    unreadMessages: messages.filter((message) => message.status === 'unread').length,
    orders: orders.length,
    openOrders: orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length
  };
};

router.get('/', async (req, res) => {
  try {
    const [content, summary] = await Promise.all([getSiteContent(), buildSummary()]);

    res.json({
      message: 'Konten situs berhasil diambil',
      content,
      summary
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', requireAdmin, async (req, res) => {
  try {
    const content = await saveSiteContent(req.body || {});

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'site_content.update',
      entityType: 'siteContent',
      entityId: 'public',
      summary: 'Konten situs publik diperbarui'
    });

    res.json({
      message: 'Konten situs berhasil diperbarui',
      content
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
