const express = require('express');
const validator = require('validator');
const requireAdmin = require('../middleware/requireAdmin');
const { verifyAuthToken } = require('../utils/auth');
const { createAuditLog } = require('../utils/auditLogStore');
const {
  createOrder,
  deleteOrder,
  findOrderById,
  listOrders,
  updateOrder
} = require('../utils/orderStore');
const { findUserById } = require('../utils/userStore');

const router = express.Router();

const VALID_STATUSES = ['new', 'reviewing', 'contacted', 'confirmed', 'completed', 'cancelled'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

const resolveOptionalAuthUser = async (req) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return null;
  }

  try {
    const decoded = verifyAuthToken(token);
    const user = await findUserById(decoded.id);
    return user || null;
  } catch (error) {
    return null;
  }
};

const normalizeFieldSnapshot = (fields) =>
  (Array.isArray(fields) ? fields : [])
    .map((field) => ({
      key: String(field?.key || '').trim(),
      label: String(field?.label || field?.key || '').trim(),
      type: String(field?.type || 'text').trim(),
      value: '',
      required: Boolean(field?.required)
    }))
    .filter((field) => field.key);

router.get('/', requireAdmin, async (req, res) => {
  try {
    const orders = await listOrders();

    res.json({
      message: 'Daftar order berhasil diambil',
      total: orders.length,
      orders
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const productId =
      req.body.productId === undefined || req.body.productId === null
        ? (
          req.body.packageId === undefined || req.body.packageId === null
            ? ''
            : String(req.body.packageId).trim()
        )
        : String(req.body.productId).trim();
    const productName = String(req.body.productName || req.body.packageName || '').trim();
    const productCategory = String(req.body.productCategory || '').trim();
    const productImage = String(req.body.productImage || '').trim();
    const packageId =
      req.body.packageId === undefined || req.body.packageId === null
        ? ''
        : String(req.body.packageId).trim();
    const packageName = String(req.body.packageName || productName || '').trim();
    const customerName = String(req.body.customerName || req.body.nama || '').trim();
    const customerEmail = String(req.body.customerEmail || req.body.email || '').trim().toLowerCase();
    const customerPhone = String(req.body.customerPhone || req.body.noTelepon || '').trim();
    const customerNotes = String(req.body.customerNotes || '').trim();
    const status = String(req.body.status || 'new').trim().toLowerCase();
    const priority = String(req.body.priority || 'normal').trim().toLowerCase();
    const formData = req.body.formData && typeof req.body.formData === 'object' ? req.body.formData : {};
    const fieldSnapshot = normalizeFieldSnapshot(req.body.fields || req.body.fieldSnapshot).map((field) => ({
      ...field,
      value:
        formData[field.key] === undefined || formData[field.key] === null
          ? ''
          : String(formData[field.key]).trim()
    }));

    if (!productName) {
      return res.status(400).json({ error: 'Nama produk wajib diisi.' });
    }

    if (!customerName || !customerEmail) {
      return res.status(400).json({ error: 'Nama dan email customer wajib diisi.' });
    }

    if (!validator.isEmail(customerEmail)) {
      return res.status(400).json({ error: 'Email customer tidak valid.' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Status order tidak valid.' });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: 'Prioritas order tidak valid.' });
    }

    const sessionUser = await resolveOptionalAuthUser(req);
    const order = await createOrder({
      source: 'checkout',
      userId: sessionUser?.id || null,
      userEmail: sessionUser?.email || customerEmail,
      customerName,
      customerEmail,
      customerPhone,
      productId,
      productName,
      productCategory,
      productImage,
      productPrice: req.body.productPrice || req.body.packagePrice || '',
      productPopular: Boolean(req.body.productPopular ?? req.body.packagePopular),
      packageId,
      packageName,
      packagePrice: req.body.packagePrice || req.body.productPrice || '',
      packageDuration: req.body.packageDuration || '',
      packagePopular: Boolean(req.body.packagePopular ?? req.body.productPopular),
      status,
      priority,
      customerNotes,
      adminNotes: '',
      formData,
      fieldSnapshot
    });

    await createAuditLog({
      actorId: sessionUser?.id || null,
      actorEmail: sessionUser?.email || customerEmail,
      actorRole: sessionUser?.role || 'public',
      action: 'order.create',
      entityType: 'order',
      entityId: String(order.id),
      summary: `Order baru ${order.orderCode} untuk produk ${order.productName || order.packageName}`,
      metadata: {
        productId: order.productId || order.packageId,
        productName: order.productName || order.packageName,
        status: order.status,
        priority: order.priority
      }
    });

    res.status(201).json({
      message: `Order ${order.orderCode} berhasil dibuat. Tim kami akan segera menghubungi Anda.`,
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const currentOrder = await findOrderById(req.params.id);

    if (!currentOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan.' });
    }

    const nextStatus = String(req.body.status || currentOrder.status).trim().toLowerCase();
    const nextPriority = String(req.body.priority || currentOrder.priority).trim().toLowerCase();

    if (!VALID_STATUSES.includes(nextStatus)) {
      return res.status(400).json({ error: 'Status order tidak valid.' });
    }

    if (!VALID_PRIORITIES.includes(nextPriority)) {
      return res.status(400).json({ error: 'Prioritas order tidak valid.' });
    }

    const order = await updateOrder(req.params.id, {
      status: nextStatus,
      priority: nextPriority,
      adminNotes: req.body.adminNotes ?? currentOrder.adminNotes
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'order.update',
      entityType: 'order',
      entityId: String(order.id),
      summary: `Order ${order.orderCode} diperbarui`,
      metadata: {
        status: order.status,
        priority: order.priority
      }
    });

    res.json({
      message: 'Order berhasil diperbarui.',
      order
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const deletedOrder = await deleteOrder(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({ error: 'Order tidak ditemukan.' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'order.delete',
      entityType: 'order',
      entityId: String(deletedOrder.id),
      summary: `Order ${deletedOrder.orderCode} dihapus`,
      metadata: {
        productName: deletedOrder.productName || deletedOrder.packageName
      }
    });

    res.json({
      message: 'Order berhasil dihapus.',
      order: deletedOrder
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
