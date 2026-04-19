const admin = require('firebase-admin');

let initialized = false;
let initializationError = null;
let firestoreDb = null;
let storageBucket = null;

const parseServiceAccountJson = (rawValue, sourceLabel) => {
  if (!rawValue) {
    return null;
  }

  try {
    return JSON.parse(rawValue);
  } catch (error) {
    initializationError = new Error(`${sourceLabel} tidak valid.`);
    return null;
  }
};

const parseInlineServiceAccount = () => {
  const base64Value = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (base64Value) {
    try {
      const decodedValue = Buffer.from(base64Value, 'base64').toString('utf8');
      const parsedServiceAccount = parseServiceAccountJson(
        decodedValue,
        'FIREBASE_SERVICE_ACCOUNT_BASE64'
      );

      if (parsedServiceAccount) {
        return parsedServiceAccount;
      }
    } catch (error) {
      initializationError = new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 tidak valid.');
      return null;
    }
  }

  const inlineValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!inlineValue) {
    return null;
  }

  return parseServiceAccountJson(inlineValue, 'FIREBASE_SERVICE_ACCOUNT_JSON');
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
  if (firestoreDb) {
    return firestoreDb;
  }

  const app = initializeFirebase();

  if (!app) {
    return null;
  }

  firestoreDb = admin.firestore(app);
  firestoreDb.settings({ ignoreUndefinedProperties: true });
  return firestoreDb;
};

const getStorageBucket = () => {
  if (storageBucket) {
    return storageBucket;
  }

  const app = initializeFirebase();

  if (!app) {
    return null;
  }

  storageBucket = admin.storage(app).bucket();
  return storageBucket;
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
