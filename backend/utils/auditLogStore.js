const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  listCollectionDocuments
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'audit-logs.json';
const DEFAULT_STORE = { auditLogs: [] };
const COLLECTION_NAME = 'auditLogs';

const sanitizeAuditLog = (entry = {}) => ({
  id: Number(entry.id),
  actorId: entry.actorId || null,
  actorEmail: entry.actorEmail || '',
  actorRole: entry.actorRole || '',
  action: entry.action || '',
  entityType: entry.entityType || '',
  entityId: entry.entityId || '',
  summary: entry.summary || '',
  metadata: entry.metadata && typeof entry.metadata === 'object' ? entry.metadata : {},
  createdAt: entry.createdAt || new Date().toISOString()
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs.map(sanitizeAuditLog) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    auditLogs: store.auditLogs.map(sanitizeAuditLog)
  });
};

const listAuditLogs = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeAuditLog)) || [];
  }

  const store = await readStore();
  return store.auditLogs.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const createAuditLog = async (payload) => {
  const auditLog = sanitizeAuditLog({
    ...payload,
    createdAt: payload.createdAt || new Date().toISOString()
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, auditLog, sanitizeAuditLog);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.auditLogs.reduce((highestId, entry) => Math.max(highestId, Number(entry.id) || 0), 0) + 1;
    const newAuditLog = sanitizeAuditLog({
      ...auditLog,
      id: nextId
    });

    store.auditLogs.push(newAuditLog);
    await writeStore(store);

    return newAuditLog;
  });
};

module.exports = {
  createAuditLog,
  listAuditLogs
};
