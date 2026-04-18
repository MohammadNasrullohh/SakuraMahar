const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'guests.json';
const DEFAULT_STORE = { guests: [] };
const COLLECTION_NAME = 'guests';

const sanitizeGuest = (guest = {}) => ({
  id: Number(guest.id),
  userId: guest.userId || null,
  nama: guest.nama || '',
  email: guest.email || '',
  noTelepon: guest.noTelepon || '',
  status: guest.status || 'pending',
  kehadiran: guest.kehadiran ?? null,
  jumlahOrang: Number(guest.jumlahOrang || 1),
  menu: guest.menu || '',
  catatan: guest.catatan || '',
  createdAt: guest.createdAt || new Date().toISOString(),
  updatedAt: guest.updatedAt || guest.createdAt || new Date().toISOString()
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    guests: Array.isArray(data.guests) ? data.guests.map(sanitizeGuest) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    guests: store.guests.map(sanitizeGuest)
  });
};

const listGuests = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeGuest)) || [];
  }

  const store = await readStore();
  return store.guests.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const findGuestById = async (id) => {
  if (isFirebaseEnabled()) {
    return (await getDocumentById(COLLECTION_NAME, id, sanitizeGuest)) || null;
  }

  const guests = await listGuests();
  return guests.find((guest) => String(guest.id) === String(id)) || null;
};

const createGuest = async (payload) => {
  const timestamp = new Date().toISOString();
  const guestPayload = sanitizeGuest({
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, guestPayload, sanitizeGuest);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.guests.reduce((highestId, guest) => Math.max(highestId, Number(guest.id) || 0), 0) + 1;
    const newGuest = sanitizeGuest({
      ...guestPayload,
      id: nextId
    });

    store.guests.push(newGuest);
    await writeStore(store);

    return newGuest;
  });
};

const updateGuest = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentGuest = await findGuestById(id);

    if (!currentGuest) {
      return null;
    }

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      sanitizeGuest({
        ...currentGuest,
        ...updates,
        id: currentGuest.id,
        updatedAt: new Date().toISOString()
      }),
      sanitizeGuest
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const guestIndex = store.guests.findIndex((guest) => String(guest.id) === String(id));

    if (guestIndex === -1) {
      return null;
    }

    const currentGuest = store.guests[guestIndex];
    const updatedGuest = sanitizeGuest({
      ...currentGuest,
      ...updates,
      id: currentGuest.id,
      updatedAt: new Date().toISOString()
    });

    store.guests[guestIndex] = updatedGuest;
    await writeStore(store);

    return updatedGuest;
  });
};

const deleteGuest = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, id, sanitizeGuest);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const guestIndex = store.guests.findIndex((guest) => String(guest.id) === String(id));

    if (guestIndex === -1) {
      return null;
    }

    const [deletedGuest] = store.guests.splice(guestIndex, 1);
    await writeStore(store);

    return deletedGuest;
  });
};

module.exports = {
  createGuest,
  deleteGuest,
  findGuestById,
  listGuests,
  updateGuest
};
