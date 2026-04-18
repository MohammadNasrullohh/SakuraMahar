const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog, listAuditLogs } = require('../utils/auditLogStore');
const { listGuests } = require('../utils/guestStore');
const { listInvitations } = require('../utils/invitationStore');
const { listMahars } = require('../utils/maharStore');
const { listMessages } = require('../utils/messageStore');
const { listOrders } = require('../utils/orderStore');
const {
  adminUpdateUser,
  deleteUser,
  getPublicUser,
  getUsers
} = require('../utils/userStore');
const { isReservedAdminEmail } = require('../utils/reservedAdmins');

router.use(requireAdmin);

router.get('/dashboard', async (req, res) => {
  try {
    const [users, mahars, guests, invitations, messages, orders] = await Promise.all([
      getUsers(),
      listMahars(),
      listGuests(),
      listInvitations(),
      listMessages(),
      listOrders()
    ]);

    res.json({
      message: 'Dashboard admin berhasil diambil',
      overview: {
        users: users.length,
        admins: users.filter((user) => user.role === 'admin').length,
        activeUsers: users.filter((user) => user.status === 'active').length,
        mahars: mahars.length,
        completedMahars: mahars.filter((mahar) => mahar.status === 'completed').length,
        guests: guests.length,
        confirmedGuests: guests.filter((guest) => guest.status === 'confirmed').length,
        invitations: invitations.length,
        respondedInvitations: invitations.filter((invitation) => Boolean(invitation.response)).length,
        messages: messages.length,
        unreadMessages: messages.filter((message) => message.status === 'unread').length,
        orders: orders.length,
        openOrders: orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length
      },
      recent: {
        users: users.slice(0, 5).map(getPublicUser),
        mahars: mahars.slice(0, 5),
        guests: guests.slice(0, 5),
        invitations: invitations.slice(0, 5),
        messages: messages.slice(0, 5),
        orders: orders.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await getUsers();

    res.json({
      message: 'Daftar user admin',
      totalUsers: users.length,
      users: users.map(getPublicUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/audit-logs', async (req, res) => {
  try {
    const search = (req.query.search || '').trim().toLowerCase();
    const entityType = (req.query.entityType || '').trim().toLowerCase();
    const action = (req.query.action || '').trim().toLowerCase();
    const logs = await listAuditLogs();
    const filteredLogs = logs.filter((log) => {
      const matchesSearch =
        !search ||
        log.summary.toLowerCase().includes(search) ||
        log.actorEmail.toLowerCase().includes(search) ||
        log.entityType.toLowerCase().includes(search) ||
        log.action.toLowerCase().includes(search);
      const matchesEntityType = !entityType || log.entityType.toLowerCase() === entityType;
      const matchesAction = !action || log.action.toLowerCase() === action;
      return matchesSearch && matchesEntityType && matchesAction;
    });

    res.json({
      message: 'Audit log berhasil diambil',
      total: filteredLogs.length,
      logs: filteredLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id', async (req, res) => {
  try {
    const updatedUser = await adminUpdateUser(req.params.id, req.body || {});

    if (!updatedUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'admin.user.update',
      entityType: 'user',
      entityId: String(updatedUser.id),
      summary: `Admin memperbarui user ${updatedUser.email}`,
      metadata: {
        status: updatedUser.status,
        role: updatedUser.role
      }
    });

    res.json({
      message: 'User berhasil diperbarui',
      user: getPublicUser(updatedUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const users = await getUsers();
    const targetUser = users.find((user) => String(user.id) === String(req.params.id));

    if (!targetUser) {
      return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    if (String(targetUser.id) === String(req.user.id)) {
      return res.status(400).json({ error: 'Akun admin yang sedang dipakai tidak bisa dihapus' });
    }

    if (isReservedAdminEmail(targetUser.email)) {
      return res.status(400).json({ error: 'Admin utama tidak bisa dihapus' });
    }

    const deletedUser = await deleteUser(req.params.id);

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'admin.user.delete',
      entityType: 'user',
      entityId: String(deletedUser.id),
      summary: `Admin menghapus user ${deletedUser.email}`
    });

    res.json({
      message: 'User berhasil dihapus',
      user: getPublicUser(deletedUser)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
