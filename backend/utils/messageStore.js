const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'messages.json';
const DEFAULT_STORE = { messages: [] };
const COLLECTION_NAME = 'messages';

const sanitizeMessage = (message = {}) => ({
  id: Number(message.id),
  nama: message.nama || '',
  email: message.email || '',
  noTelepon: message.noTelepon || '',
  subjek: message.subjek || 'Tidak ada subjek',
  pesan: message.pesan || '',
  status: message.status || 'unread',
  createdAt: message.createdAt || new Date().toISOString(),
  updatedAt: message.updatedAt || message.createdAt || new Date().toISOString(),
  readAt: message.readAt || null,
  respondedAt: message.respondedAt || null,
  response: message.response || ''
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    messages: Array.isArray(data.messages) ? data.messages.map(sanitizeMessage) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    messages: store.messages.map(sanitizeMessage)
  });
};

const listMessages = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeMessage)) || [];
  }

  const store = await readStore();
  return store.messages.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const findMessageById = async (id) => {
  if (isFirebaseEnabled()) {
    return (await getDocumentById(COLLECTION_NAME, id, sanitizeMessage)) || null;
  }

  const messages = await listMessages();
  return messages.find((message) => String(message.id) === String(id)) || null;
};

const createMessage = async ({ nama, email, noTelepon = '', subjek = '', pesan }) => {
  const timestamp = new Date().toISOString();
  const payload = sanitizeMessage({
    nama,
    email,
    noTelepon,
    subjek,
    pesan,
    status: 'unread',
    createdAt: timestamp,
    updatedAt: timestamp
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, payload, sanitizeMessage);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.messages.reduce((highestId, message) => Math.max(highestId, Number(message.id) || 0), 0) + 1;
    const newMessage = sanitizeMessage({
      ...payload,
      id: nextId
    });

    store.messages.push(newMessage);
    await writeStore(store);

    return newMessage;
  });
};

const updateMessage = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentMessage = await findMessageById(id);

    if (!currentMessage) {
      return null;
    }

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      sanitizeMessage({
        ...currentMessage,
        ...updates,
        id: currentMessage.id,
        updatedAt: new Date().toISOString()
      }),
      sanitizeMessage
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const messageIndex = store.messages.findIndex((message) => String(message.id) === String(id));

    if (messageIndex === -1) {
      return null;
    }

    const currentMessage = store.messages[messageIndex];
    const updatedMessage = sanitizeMessage({
      ...currentMessage,
      ...updates,
      id: currentMessage.id,
      updatedAt: new Date().toISOString()
    });

    store.messages[messageIndex] = updatedMessage;
    await writeStore(store);

    return updatedMessage;
  });
};

const deleteMessage = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, id, sanitizeMessage);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const messageIndex = store.messages.findIndex((message) => String(message.id) === String(id));

    if (messageIndex === -1) {
      return null;
    }

    const [deletedMessage] = store.messages.splice(messageIndex, 1);
    await writeStore(store);

    return deletedMessage;
  });
};

module.exports = {
  createMessage,
  deleteMessage,
  findMessageById,
  listMessages,
  updateMessage
};
