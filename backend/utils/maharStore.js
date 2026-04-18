const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'mahars.json';
const DEFAULT_STORE = { mahars: [] };
const COLLECTION_NAME = 'mahars';

const sanitizePayment = (payment = {}, index = 0) => ({
  id: Number(payment.id || index + 1),
  jumlah: Number(payment.jumlah || 0),
  metode: payment.metode || '',
  bukti: payment.bukti || '',
  status: payment.status || 'pending',
  tanggal: payment.tanggal || new Date().toISOString()
});

const sanitizeMahar = (mahar = {}) => ({
  id: Number(mahar.id),
  userId: mahar.userId || null,
  nama: mahar.nama || '',
  email: mahar.email || '',
  jumlah: Number(mahar.jumlah || 0),
  deskripsi: mahar.deskripsi || '',
  metodePerayaan: mahar.metodePerayaan || '',
  tanggalPerayaan: mahar.tanggalPerayaan || new Date().toISOString(),
  status: mahar.status || 'active',
  createdAt: mahar.createdAt || new Date().toISOString(),
  updatedAt: mahar.updatedAt || mahar.createdAt || new Date().toISOString(),
  pembayaran: Array.isArray(mahar.pembayaran)
    ? mahar.pembayaran.map((payment, index) => sanitizePayment(payment, index))
    : []
});

const calculateStatus = (mahar) => {
  const totalTerbayar = mahar.pembayaran.reduce((sum, payment) => sum + Number(payment.jumlah || 0), 0);

  return {
    totalTerbayar,
    sisaTagihan: Math.max(0, Number(mahar.jumlah || 0) - totalTerbayar),
    status:
      totalTerbayar >= Number(mahar.jumlah || 0) && Number(mahar.jumlah || 0) > 0
        ? 'completed'
        : mahar.status || 'active'
  };
};

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    mahars: Array.isArray(data.mahars) ? data.mahars.map(sanitizeMahar) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    mahars: store.mahars.map(sanitizeMahar)
  });
};

const normalizeListedMahar = (mahar) => {
  const summary = calculateStatus(mahar);
  return sanitizeMahar({
    ...mahar,
    status: summary.status
  });
};

const listMahars = async () => {
  if (isFirebaseEnabled()) {
    const mahars = (await listCollectionDocuments(COLLECTION_NAME, sanitizeMahar)) || [];
    return mahars.map(normalizeListedMahar);
  }

  const store = await readStore();
  return store.mahars
    .map(normalizeListedMahar)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const findMaharById = async (id) => {
  if (isFirebaseEnabled()) {
    const mahar = await getDocumentById(COLLECTION_NAME, id, sanitizeMahar);
    return mahar ? normalizeListedMahar(mahar) : null;
  }

  const mahars = await listMahars();
  return mahars.find((mahar) => String(mahar.id) === String(id)) || null;
};

const createMahar = async (payload) => {
  const timestamp = new Date().toISOString();
  const newMahar = sanitizeMahar({
    ...payload,
    status: payload.status || 'active',
    createdAt: timestamp,
    updatedAt: timestamp,
    pembayaran: Array.isArray(payload.pembayaran) ? payload.pembayaran : []
  });

  if (isFirebaseEnabled()) {
    const createdMahar = await createDocumentWithNumericId(COLLECTION_NAME, newMahar, sanitizeMahar);
    return normalizeListedMahar(createdMahar);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.mahars.reduce((highestId, mahar) => Math.max(highestId, Number(mahar.id) || 0), 0) + 1;
    const payloadWithId = sanitizeMahar({
      ...newMahar,
      id: nextId
    });

    store.mahars.push(payloadWithId);
    await writeStore(store);

    return normalizeListedMahar(payloadWithId);
  });
};

const updateMahar = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentMahar = await findMaharById(id);

    if (!currentMahar) {
      return null;
    }

    const updatedMahar = sanitizeMahar({
      ...currentMahar,
      ...updates,
      id: currentMahar.id,
      pembayaran: Array.isArray(updates.pembayaran) ? updates.pembayaran : currentMahar.pembayaran,
      updatedAt: new Date().toISOString()
    });
    const paymentSummary = calculateStatus(updatedMahar);

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      sanitizeMahar({
        ...updatedMahar,
        status: updates.status || paymentSummary.status
      }),
      sanitizeMahar
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const maharIndex = store.mahars.findIndex((mahar) => String(mahar.id) === String(id));

    if (maharIndex === -1) {
      return null;
    }

    const currentMahar = store.mahars[maharIndex];
    const updatedMahar = sanitizeMahar({
      ...currentMahar,
      ...updates,
      id: currentMahar.id,
      pembayaran: Array.isArray(updates.pembayaran) ? updates.pembayaran : currentMahar.pembayaran,
      updatedAt: new Date().toISOString()
    });
    const paymentSummary = calculateStatus(updatedMahar);

    store.mahars[maharIndex] = sanitizeMahar({
      ...updatedMahar,
      status: updates.status || paymentSummary.status
    });
    await writeStore(store);

    return store.mahars[maharIndex];
  });
};

const addPaymentToMahar = async (id, paymentPayload) => {
  const currentMahar = await findMaharById(id);

  if (!currentMahar) {
    return null;
  }

  const payment = sanitizePayment({
    ...paymentPayload,
    id: currentMahar.pembayaran.length + 1,
    tanggal: new Date().toISOString()
  });
  const updatedMahar = sanitizeMahar({
    ...currentMahar,
    pembayaran: [...currentMahar.pembayaran, payment],
    updatedAt: new Date().toISOString()
  });
  const summary = calculateStatus(updatedMahar);

  const savedMahar = isFirebaseEnabled()
    ? await updateDocumentById(
        COLLECTION_NAME,
        id,
        sanitizeMahar({
          ...updatedMahar,
          status: summary.status
        }),
        sanitizeMahar
      )
    : await runSerialized(FILENAME, async () => {
        const store = await readStore();
        const maharIndex = store.mahars.findIndex((mahar) => String(mahar.id) === String(id));

        if (maharIndex === -1) {
          return null;
        }

        store.mahars[maharIndex] = sanitizeMahar({
          ...updatedMahar,
          status: summary.status
        });
        await writeStore(store);
        return store.mahars[maharIndex];
      });

  if (!savedMahar) {
    return null;
  }

  return {
    mahar: savedMahar,
    pembayaran: payment,
    ...summary
  };
};

const deleteMahar = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, id, sanitizeMahar);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const maharIndex = store.mahars.findIndex((mahar) => String(mahar.id) === String(id));

    if (maharIndex === -1) {
      return null;
    }

    const [deletedMahar] = store.mahars.splice(maharIndex, 1);
    await writeStore(store);

    return deletedMahar;
  });
};

module.exports = {
  addPaymentToMahar,
  createMahar,
  deleteMahar,
  findMaharById,
  listMahars,
  updateMahar
};
