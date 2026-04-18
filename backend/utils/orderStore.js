const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'orders.json';
const DEFAULT_STORE = { orders: [] };
const COLLECTION_NAME = 'orders';

const sanitizeFieldSnapshot = (field = {}) => ({
  key: String(field.key || '').trim(),
  label: String(field.label || field.key || '').trim(),
  type: String(field.type || 'text').trim(),
  value:
    field.value === undefined || field.value === null ? '' : String(field.value).trim(),
  required: Boolean(field.required)
});

const sanitizeFormData = (formData = {}) =>
  Object.fromEntries(
    Object.entries(formData && typeof formData === 'object' ? formData : {}).map(([key, value]) => [
      String(key).trim(),
      value === undefined || value === null ? '' : String(value).trim()
    ])
  );

const sanitizeOrder = (order = {}) => ({
  id: Number(order.id),
  orderCode: String(order.orderCode || '').trim(),
  source: String(order.source || 'checkout').trim(),
  userId: order.userId === null || order.userId === undefined || order.userId === ''
    ? null
    : Number(order.userId),
  userEmail: String(order.userEmail || '').trim().toLowerCase(),
  customerName: String(order.customerName || '').trim(),
  customerEmail: String(order.customerEmail || '').trim().toLowerCase(),
  customerPhone: String(order.customerPhone || '').trim(),
  productId:
    order.productId === null || order.productId === undefined ? String(order.packageId || '').trim() : String(order.productId).trim(),
  productName: String(order.productName || order.packageName || '').trim(),
  productCategory: String(order.productCategory || '').trim(),
  productImage: String(order.productImage || '').trim(),
  productPrice: String(order.productPrice || order.packagePrice || '').trim(),
  productPopular: Boolean(order.productPopular ?? order.packagePopular),
  packageId:
    order.packageId === null || order.packageId === undefined ? String(order.productId || '').trim() : String(order.packageId).trim(),
  packageName: String(order.packageName || order.productName || '').trim(),
  packagePrice: String(order.packagePrice || order.productPrice || '').trim(),
  packageDuration: String(order.packageDuration || '').trim(),
  packagePopular: Boolean(order.packagePopular ?? order.productPopular),
  status: String(order.status || 'new').trim().toLowerCase(),
  priority: String(order.priority || 'normal').trim().toLowerCase(),
  customerNotes: String(order.customerNotes || '').trim(),
  adminNotes: String(order.adminNotes || '').trim(),
  formData: sanitizeFormData(order.formData),
  fieldSnapshot: Array.isArray(order.fieldSnapshot)
    ? order.fieldSnapshot.map(sanitizeFieldSnapshot)
    : [],
  createdAt: order.createdAt || new Date().toISOString(),
  updatedAt: order.updatedAt || order.createdAt || new Date().toISOString(),
  contactedAt: order.contactedAt || null,
  completedAt: order.completedAt || null
});

const createOrderCode = () =>
  `ORD-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 900 + 100)}`;

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    orders: Array.isArray(data.orders) ? data.orders.map(sanitizeOrder) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    orders: store.orders.map(sanitizeOrder)
  });
};

const listOrders = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeOrder)) || [];
  }

  const store = await readStore();
  return store.orders.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const findOrderById = async (id) => {
  if (isFirebaseEnabled()) {
    return (await getDocumentById(COLLECTION_NAME, id, sanitizeOrder)) || null;
  }

  const orders = await listOrders();
  return orders.find((order) => String(order.id) === String(id)) || null;
};

const createOrder = async (payload) => {
  const timestamp = new Date().toISOString();
  const order = sanitizeOrder({
    ...payload,
    orderCode: payload.orderCode || createOrderCode(),
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, order, sanitizeOrder);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.orders.reduce((highestId, currentOrder) => Math.max(highestId, Number(currentOrder.id) || 0), 0) + 1;
    const newOrder = sanitizeOrder({
      ...order,
      id: nextId
    });

    store.orders.push(newOrder);
    await writeStore(store);

    return newOrder;
  });
};

const updateOrder = async (id, updates) => {
  const applyOrderUpdates = (currentOrder) => {
    const nextStatus = String(updates.status ?? currentOrder.status ?? 'new').trim().toLowerCase();

    return sanitizeOrder({
      ...currentOrder,
      ...updates,
      id: currentOrder.id,
      orderCode: currentOrder.orderCode,
      createdAt: currentOrder.createdAt,
      status: nextStatus,
      contactedAt:
        updates.contactedAt !== undefined
          ? updates.contactedAt
          : nextStatus === 'contacted' && !currentOrder.contactedAt
            ? new Date().toISOString()
            : currentOrder.contactedAt,
      completedAt:
        updates.completedAt !== undefined
          ? updates.completedAt
          : nextStatus === 'completed' && !currentOrder.completedAt
            ? new Date().toISOString()
            : nextStatus !== 'completed'
              ? null
              : currentOrder.completedAt,
      updatedAt: new Date().toISOString()
    });
  };

  if (isFirebaseEnabled()) {
    const currentOrder = await findOrderById(id);

    if (!currentOrder) {
      return null;
    }

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      applyOrderUpdates(currentOrder),
      sanitizeOrder
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const orderIndex = store.orders.findIndex((order) => String(order.id) === String(id));

    if (orderIndex === -1) {
      return null;
    }

    const currentOrder = store.orders[orderIndex];
    const updatedOrder = applyOrderUpdates(currentOrder);

    store.orders[orderIndex] = updatedOrder;
    await writeStore(store);

    return updatedOrder;
  });
};

const deleteOrder = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, id, sanitizeOrder);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const orderIndex = store.orders.findIndex((order) => String(order.id) === String(id));

    if (orderIndex === -1) {
      return null;
    }

    const [deletedOrder] = store.orders.splice(orderIndex, 1);
    await writeStore(store);

    return sanitizeOrder(deletedOrder);
  });
};

module.exports = {
  createOrder,
  deleteOrder,
  findOrderById,
  listOrders,
  sanitizeOrder,
  updateOrder
};
