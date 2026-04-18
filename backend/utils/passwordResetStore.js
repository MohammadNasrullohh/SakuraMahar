const crypto = require('crypto');
const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  deleteDocumentById,
  getDocumentById,
  updateDocumentById
} = require('./firestoreHelpers');
const { getFirestoreDb, isFirebaseEnabled } = require('./firebase');

const FILENAME = 'password-resets.json';
const DEFAULT_STORE = { resets: [] };
const COLLECTION_NAME = 'passwordResets';
const TOKEN_TTL_MS = 1000 * 60 * 30;

const sanitizeReset = (entry = {}) => ({
  id: entry.id || crypto.randomBytes(24).toString('hex'),
  userId: Number(entry.userId),
  email: entry.email || '',
  expiresAt: entry.expiresAt || new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  createdAt: entry.createdAt || new Date().toISOString(),
  usedAt: entry.usedAt || null
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    resets: Array.isArray(data.resets) ? data.resets.map(sanitizeReset) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    resets: store.resets.map(sanitizeReset)
  });
};

const createPasswordReset = async ({ userId, email }) => {
  const reset = sanitizeReset({
    userId,
    email
  });

  if (isFirebaseEnabled()) {
    const db = getFirestoreDb();
    await db.collection(COLLECTION_NAME).doc(reset.id).set(reset);
    return reset;
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    store.resets.push(reset);
    await writeStore(store);
    return reset;
  });
};

const findValidPasswordReset = async (token) => {
  if (!token) {
    return null;
  }

  let reset = null;

  if (isFirebaseEnabled()) {
    reset = await getDocumentById(COLLECTION_NAME, token, sanitizeReset);
  } else {
    const store = await readStore();
    reset = store.resets.find((entry) => entry.id === token) || null;
  }

  if (!reset) {
    return null;
  }

  if (reset.usedAt || new Date(reset.expiresAt).getTime() < Date.now()) {
    return null;
  }

  return sanitizeReset(reset);
};

const consumePasswordReset = async (token) => {
  if (!token) {
    return null;
  }

  if (isFirebaseEnabled()) {
    return updateDocumentById(
      COLLECTION_NAME,
      token,
      {
        usedAt: new Date().toISOString()
      },
      sanitizeReset
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const resetIndex = store.resets.findIndex((entry) => entry.id === token);

    if (resetIndex === -1) {
      return null;
    }

    const updatedReset = sanitizeReset({
      ...store.resets[resetIndex],
      usedAt: new Date().toISOString()
    });

    store.resets[resetIndex] = updatedReset;
    await writeStore(store);
    return updatedReset;
  });
};

const deletePasswordReset = async (token) => {
  if (!token) {
    return null;
  }

  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, token, sanitizeReset);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const resetIndex = store.resets.findIndex((entry) => entry.id === token);

    if (resetIndex === -1) {
      return null;
    }

    const [deletedReset] = store.resets.splice(resetIndex, 1);
    await writeStore(store);
    return sanitizeReset(deletedReset);
  });
};

module.exports = {
  consumePasswordReset,
  createPasswordReset,
  deletePasswordReset,
  findValidPasswordReset,
  TOKEN_TTL_MS
};
