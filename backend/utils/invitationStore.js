const crypto = require('crypto');
const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  findDocumentByField,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'invitations.json';
const DEFAULT_STORE = { invitations: [] };
const COLLECTION_NAME = 'invitations';

const createUniqueCode = () => crypto.randomBytes(5).toString('hex');

const sanitizeInvitation = (invitation = {}) => ({
  id: Number(invitation.id),
  userId: invitation.userId || null,
  guestId: invitation.guestId || null,
  guestEmail: invitation.guestEmail || '',
  guestNama: invitation.guestNama || '',
  tanggalPernikahan: invitation.tanggalPernikahan || '',
  tempatPernikahan: invitation.tempatPernikahan || '',
  jamMulai: invitation.jamMulai || '',
  linkGoogle: invitation.linkGoogle || '',
  status: invitation.status || 'sent',
  openedAt: invitation.openedAt || null,
  respondedAt: invitation.respondedAt || null,
  response: invitation.response || null,
  jumlahOrang: Number(invitation.jumlahOrang || 1),
  menu: invitation.menu || '',
  catatan: invitation.catatan || '',
  createdAt: invitation.createdAt || new Date().toISOString(),
  updatedAt: invitation.updatedAt || invitation.createdAt || new Date().toISOString(),
  uniqueCode: invitation.uniqueCode || createUniqueCode()
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    invitations: Array.isArray(data.invitations) ? data.invitations.map(sanitizeInvitation) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    invitations: store.invitations.map(sanitizeInvitation)
  });
};

const listInvitations = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeInvitation)) || [];
  }

  const store = await readStore();
  return store.invitations.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const findInvitationById = async (id) => {
  if (isFirebaseEnabled()) {
    return (await getDocumentById(COLLECTION_NAME, id, sanitizeInvitation)) || null;
  }

  const invitations = await listInvitations();
  return invitations.find((invitation) => String(invitation.id) === String(id)) || null;
};

const findInvitationByCode = async (code) => {
  if (isFirebaseEnabled()) {
    return (await findDocumentByField(COLLECTION_NAME, 'uniqueCode', code, sanitizeInvitation)) || null;
  }

  const invitations = await listInvitations();
  return invitations.find((invitation) => invitation.uniqueCode === code) || null;
};

const createInvitation = async (payload) => {
  const timestamp = new Date().toISOString();
  const invitationPayload = sanitizeInvitation({
    ...payload,
    createdAt: timestamp,
    updatedAt: timestamp,
    uniqueCode: payload.uniqueCode || createUniqueCode()
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, invitationPayload, sanitizeInvitation);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.invitations.reduce((highestId, invitation) => Math.max(highestId, Number(invitation.id) || 0), 0) + 1;
    const newInvitation = sanitizeInvitation({
      ...invitationPayload,
      id: nextId
    });

    store.invitations.push(newInvitation);
    await writeStore(store);

    return newInvitation;
  });
};

const updateInvitation = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentInvitation = await findInvitationById(id);

    if (!currentInvitation) {
      return null;
    }

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      sanitizeInvitation({
        ...currentInvitation,
        ...updates,
        id: currentInvitation.id,
        uniqueCode: currentInvitation.uniqueCode,
        updatedAt: new Date().toISOString()
      }),
      sanitizeInvitation
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const invitationIndex = store.invitations.findIndex((invitation) => String(invitation.id) === String(id));

    if (invitationIndex === -1) {
      return null;
    }

    const currentInvitation = store.invitations[invitationIndex];
    const updatedInvitation = sanitizeInvitation({
      ...currentInvitation,
      ...updates,
      id: currentInvitation.id,
      uniqueCode: currentInvitation.uniqueCode,
      updatedAt: new Date().toISOString()
    });

    store.invitations[invitationIndex] = updatedInvitation;
    await writeStore(store);

    return updatedInvitation;
  });
};

const updateInvitationByCode = async (code, updates) => {
  const invitation = await findInvitationByCode(code);

  if (!invitation) {
    return null;
  }

  return updateInvitation(invitation.id, updates);
};

const deleteInvitation = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(COLLECTION_NAME, id, sanitizeInvitation);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const invitationIndex = store.invitations.findIndex((invitation) => String(invitation.id) === String(id));

    if (invitationIndex === -1) {
      return null;
    }

    const [deletedInvitation] = store.invitations.splice(invitationIndex, 1);
    await writeStore(store);

    return deletedInvitation;
  });
};

module.exports = {
  createInvitation,
  deleteInvitation,
  findInvitationByCode,
  findInvitationById,
  listInvitations,
  updateInvitation,
  updateInvitationByCode
};
