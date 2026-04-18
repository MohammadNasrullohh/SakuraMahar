const path = require('path');
const { readJsonFile } = require('../utils/dataStore');
const { getFirestoreDb, isFirebaseEnabled } = require('../utils/firebase');
const { normalizeSiteContent, DEFAULT_SITE_CONTENT } = require('../utils/siteContentStore');

const writeCollection = async (db, collectionName, items) => {
  const batch = db.batch();

  items.forEach((item) => {
    batch.set(db.collection(collectionName).doc(String(item.id)), item);
  });

  await batch.commit();

  const maxId = items.reduce((highestId, item) => Math.max(highestId, Number(item.id) || 0), 0);
  await db.collection('_meta').doc(`counter_${collectionName}`).set({
    collectionName,
    value: maxId,
    updatedAt: new Date().toISOString()
  });
};

const run = async () => {
  if (!isFirebaseEnabled()) {
    throw new Error(
      'Firebase belum aktif. Isi FIREBASE_PROJECT_ID dan kredensial, atau jalankan lewat Firebase emulator.'
    );
  }

  const db = getFirestoreDb();
  const usersData = await readJsonFile('users.json', { users: [] });
  const guestsData = await readJsonFile('guests.json', { guests: [] });
  const messagesData = await readJsonFile('messages.json', { messages: [] });
  const maharsData = await readJsonFile('mahars.json', { mahars: [] });
  const invitationsData = await readJsonFile('invitations.json', { invitations: [] });
  const siteContent = await readJsonFile('site-content.json', DEFAULT_SITE_CONTENT);

  await writeCollection(db, 'users', Array.isArray(usersData.users) ? usersData.users : []);
  await writeCollection(db, 'guests', Array.isArray(guestsData.guests) ? guestsData.guests : []);
  await writeCollection(db, 'messages', Array.isArray(messagesData.messages) ? messagesData.messages : []);
  await writeCollection(db, 'mahars', Array.isArray(maharsData.mahars) ? maharsData.mahars : []);
  await writeCollection(
    db,
    'invitations',
    Array.isArray(invitationsData.invitations) ? invitationsData.invitations : []
  );
  await db.collection('siteContent').doc('public').set(normalizeSiteContent(siteContent));

  console.log('Seed Firestore selesai.');
};

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
