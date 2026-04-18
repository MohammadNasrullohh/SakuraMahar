const { getFirestoreDb, isFirebaseEnabled } = require('./firebase');

const applySanitize = (sanitize, value) => (typeof sanitize === 'function' ? sanitize(value) : value);
const normalizeStoredId = (value) => {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? value : numericValue;
};

const getNextSequence = async (collectionName) => {
  const db = getFirestoreDb();

  if (!db) {
    return null;
  }

  const counterRef = db.collection('_meta').doc(`counter_${collectionName}`);

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const currentValue = snapshot.exists ? Number(snapshot.data().value || 0) : 0;
    const nextValue = currentValue + 1;

    transaction.set(
      counterRef,
      {
        collectionName,
        value: nextValue,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );

    return nextValue;
  });
};

const listCollectionDocuments = async (collectionName, sanitize, orderField = 'createdAt') => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const snapshot = await db.collection(collectionName).orderBy(orderField, 'desc').get();

  return snapshot.docs.map((documentSnapshot) =>
    applySanitize(sanitize, {
      ...documentSnapshot.data(),
      id: normalizeStoredId(documentSnapshot.id)
    })
  );
};

const getDocumentById = async (collectionName, id, sanitize) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const snapshot = await db.collection(collectionName).doc(String(id)).get();

  if (!snapshot.exists) {
    return null;
  }

  return applySanitize(sanitize, {
    ...snapshot.data(),
    id: normalizeStoredId(snapshot.id)
  });
};

const findDocumentByField = async (collectionName, field, value, sanitize) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const snapshot = await db.collection(collectionName).where(field, '==', value).limit(1).get();

  if (snapshot.empty) {
    return null;
  }

  const documentSnapshot = snapshot.docs[0];

  return applySanitize(sanitize, {
    ...documentSnapshot.data(),
    id: normalizeStoredId(documentSnapshot.id)
  });
};

const createDocumentWithNumericId = async (collectionName, payload, sanitize) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const nextId = await getNextSequence(collectionName);
  const document = applySanitize(sanitize, {
    ...payload,
    id: nextId
  });

  await db.collection(collectionName).doc(String(nextId)).set(document);

  return document;
};

const updateDocumentById = async (collectionName, id, updates, sanitize) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const documentRef = db.collection(collectionName).doc(String(id));
  const snapshot = await documentRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const document = applySanitize(sanitize, {
    ...snapshot.data(),
    ...updates,
    id: normalizeStoredId(id)
  });

  await documentRef.set(document);

  return document;
};

const deleteDocumentById = async (collectionName, id, sanitize) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const documentRef = db.collection(collectionName).doc(String(id));
  const snapshot = await documentRef.get();

  if (!snapshot.exists) {
    return null;
  }

  const document = applySanitize(sanitize, {
    ...snapshot.data(),
    id: normalizeStoredId(id)
  });

  await documentRef.delete();

  return document;
};

const getSingletonDocument = async (collectionName, docId, fallbackValue) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  const snapshot = await db.collection(collectionName).doc(docId).get();

  if (!snapshot.exists) {
    return fallbackValue;
  }

  return snapshot.data();
};

const setSingletonDocument = async (collectionName, docId, value) => {
  if (!isFirebaseEnabled()) {
    return null;
  }

  const db = getFirestoreDb();
  await db.collection(collectionName).doc(docId).set(value);
  return value;
};

module.exports = {
  createDocumentWithNumericId,
  deleteDocumentById,
  findDocumentByField,
  getDocumentById,
  getNextSequence,
  getSingletonDocument,
  listCollectionDocuments,
  setSingletonDocument,
  updateDocumentById
};
