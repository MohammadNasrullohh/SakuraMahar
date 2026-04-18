const admin = require('firebase-admin');

let initialized = false;
let initializationError = null;

const parseInlineServiceAccount = () => {
  const inlineValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!inlineValue) {
    return null;
  }

  try {
    return JSON.parse(inlineValue);
  } catch (error) {
    initializationError = new Error('FIREBASE_SERVICE_ACCOUNT_JSON tidak valid.');
    return null;
  }
};

const resolveProjectId = () => {
  if (process.env.FIREBASE_PROJECT_ID) {
    return process.env.FIREBASE_PROJECT_ID;
  }

  if (process.env.GCLOUD_PROJECT) {
    return process.env.GCLOUD_PROJECT;
  }

  if (process.env.FIREBASE_CONFIG) {
    try {
      const parsedConfig = JSON.parse(process.env.FIREBASE_CONFIG);
      return parsedConfig.projectId || null;
    } catch (error) {
      return null;
    }
  }

  return null;
};

const resolveStorageBucket = (projectId) =>
  process.env.FIREBASE_STORAGE_BUCKET || (projectId ? `${projectId}.appspot.com` : undefined);

const canInitializeWithProject = () =>
  Boolean(
    parseInlineServiceAccount() ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIRESTORE_EMULATOR_HOST ||
      resolveProjectId()
  );

const initializeFirebase = () => {
  if (admin.apps.length) {
    initialized = true;
    return admin.app();
  }

  if (initialized) {
    return admin.apps[0] || null;
  }

  if (!canInitializeWithProject()) {
    return null;
  }

  const projectId = resolveProjectId();
  const storageBucket = resolveStorageBucket(projectId);
  const inlineServiceAccount = parseInlineServiceAccount();

  try {
    const appConfig = {
      projectId,
      storageBucket
    };

    if (inlineServiceAccount) {
      admin.initializeApp({
        ...appConfig,
        credential: admin.credential.cert(inlineServiceAccount)
      });
    } else {
      admin.initializeApp(appConfig);
    }

    initialized = true;
    return admin.app();
  } catch (error) {
    initializationError = error;
    return null;
  }
};

const getFirestoreDb = () => {
  const app = initializeFirebase();

  if (!app) {
    return null;
  }

  const db = admin.firestore(app);
  db.settings({ ignoreUndefinedProperties: true });
  return db;
};

const getStorageBucket = () => {
  const app = initializeFirebase();

  if (!app) {
    return null;
  }

  return admin.storage(app).bucket();
};

const isFirebaseEnabled = () => Boolean(initializeFirebase());

const getFirebaseInitializationError = () => initializationError;

module.exports = {
  getFirebaseInitializationError,
  getFirestoreDb,
  getStorageBucket,
  initializeFirebase,
  isFirebaseEnabled
};
