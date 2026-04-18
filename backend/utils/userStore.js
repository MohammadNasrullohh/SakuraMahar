const { constants: fsConstants } = require('fs');
const fs = require('fs/promises');
const path = require('path');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  findDocumentByField,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');
const { isReservedAdminEmail, normalizeEmail } = require('./reservedAdmins');

const dataDirectory = path.join(__dirname, '..', 'data');
const usersFilePath = path.join(dataDirectory, 'users.json');
const USERS_COLLECTION = 'users';

let writeQueue = Promise.resolve();

const hydrateUser = (user = {}) => ({
  id: Number(user.id),
  nama: user.nama || '',
  email: normalizeEmail(user.email),
  password: user.password || '',
  noTelepon: user.noTelepon || '',
  alamat: user.alamat || '',
  kota: user.kota || '',
  provinsi: user.provinsi || '',
  role: isReservedAdminEmail(user.email) ? 'admin' : user.role || 'user',
  status: user.status || 'active',
  notes: user.notes || '',
  createdAt: user.createdAt || new Date().toISOString(),
  updatedAt: user.updatedAt || user.createdAt || new Date().toISOString(),
  mahar: user.mahar || null,
  guests: Array.isArray(user.guests) ? user.guests : [],
  undangan: Array.isArray(user.undangan) ? user.undangan : []
});

const ensureStore = async () => {
  await fs.mkdir(dataDirectory, { recursive: true });

  try {
    await fs.access(usersFilePath, fsConstants.F_OK);
  } catch (error) {
    await fs.writeFile(usersFilePath, JSON.stringify({ users: [] }, null, 2));
  }
};

const readStore = async () => {
  await ensureStore();

  const rawContent = await fs.readFile(usersFilePath, 'utf8');
  if (!rawContent.trim()) {
    return { users: [] };
  }

  const parsedContent = JSON.parse(rawContent);
  return {
    users: Array.isArray(parsedContent.users) ? parsedContent.users.map(hydrateUser) : []
  };
};

const writeStore = async (store) => {
  await ensureStore();
  await fs.writeFile(
    usersFilePath,
    JSON.stringify(
      {
        users: store.users.map(hydrateUser)
      },
      null,
      2
    )
  );
};

const runSerializedWrite = async (operation) => {
  const nextWrite = writeQueue.then(operation, operation);
  writeQueue = nextWrite.then(
    () => undefined,
    () => undefined
  );

  return nextWrite;
};

const sortUsers = (users) =>
  [...users].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

const getUsers = async () => {
  if (isFirebaseEnabled()) {
    const users = (await listCollectionDocuments(USERS_COLLECTION, hydrateUser)) || [];
    return sortUsers(users);
  }

  const store = await readStore();
  return sortUsers(store.users);
};

const getPublicUser = (user) => {
  if (!user) {
    return null;
  }

  const { password, ...publicUser } = user;
  return publicUser;
};

const findUserByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);

  if (isFirebaseEnabled()) {
    const user = await findDocumentByField(USERS_COLLECTION, 'email', normalizedEmail, hydrateUser);
    return user || null;
  }

  const users = await getUsers();
  return users.find((user) => user.email === normalizedEmail) || null;
};

const findUserById = async (id) => {
  if (isFirebaseEnabled()) {
    const user = await getDocumentById(USERS_COLLECTION, id, hydrateUser);
    return user || null;
  }

  const users = await getUsers();
  return users.find((user) => String(user.id) === String(id)) || null;
};

const createUser = async ({ nama, email, password, noTelepon = '' }) => {
  const timestamp = new Date().toISOString();
  const payload = hydrateUser({
    nama,
    email: normalizeEmail(email),
    password,
    noTelepon,
    alamat: '',
    kota: '',
    provinsi: '',
    role: isReservedAdminEmail(email) ? 'admin' : 'user',
    status: 'active',
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    mahar: null,
    guests: [],
    undangan: []
  });

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(USERS_COLLECTION, payload, hydrateUser);
  }

  return runSerializedWrite(async () => {
    const store = await readStore();
    const nextId =
      store.users.reduce((highestId, user) => {
        const currentId = Number(user.id) || 0;
        return Math.max(highestId, currentId);
      }, 0) + 1;
    const newUser = hydrateUser({
      ...payload,
      id: nextId
    });

    store.users.push(newUser);
    await writeStore(store);

    return newUser;
  });
};

const updateUser = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentUser = await findUserById(id);

    if (!currentUser) {
      return null;
    }

    return updateDocumentById(
      USERS_COLLECTION,
      id,
      hydrateUser({
        ...currentUser,
        nama: updates.nama ?? currentUser.nama,
        noTelepon: updates.noTelepon ?? currentUser.noTelepon,
        alamat: updates.alamat ?? currentUser.alamat,
        kota: updates.kota ?? currentUser.kota,
        provinsi: updates.provinsi ?? currentUser.provinsi,
        password: currentUser.password,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }),
      hydrateUser
    );
  }

  return runSerializedWrite(async () => {
    const store = await readStore();
    const userIndex = store.users.findIndex((user) => String(user.id) === String(id));

    if (userIndex === -1) {
      return null;
    }

    const currentUser = store.users[userIndex];
    const updatedUser = hydrateUser({
      ...currentUser,
      nama: updates.nama ?? currentUser.nama,
      noTelepon: updates.noTelepon ?? currentUser.noTelepon,
      alamat: updates.alamat ?? currentUser.alamat,
      kota: updates.kota ?? currentUser.kota,
      provinsi: updates.provinsi ?? currentUser.provinsi,
      id: currentUser.id,
      email: currentUser.email,
      password: currentUser.password,
      updatedAt: new Date().toISOString()
    });

    store.users[userIndex] = updatedUser;
    await writeStore(store);

    return updatedUser;
  });
};

const adminUpdateUser = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentUser = await findUserById(id);

    if (!currentUser) {
      return null;
    }

    return updateDocumentById(
      USERS_COLLECTION,
      id,
      hydrateUser({
        ...currentUser,
        nama: updates.nama ?? currentUser.nama,
        noTelepon: updates.noTelepon ?? currentUser.noTelepon,
        alamat: updates.alamat ?? currentUser.alamat,
        kota: updates.kota ?? currentUser.kota,
        provinsi: updates.provinsi ?? currentUser.provinsi,
        role: isReservedAdminEmail(currentUser.email) ? 'admin' : updates.role ?? currentUser.role,
        status: updates.status ?? currentUser.status,
        notes: updates.notes ?? currentUser.notes,
        password: currentUser.password,
        email: currentUser.email,
        updatedAt: new Date().toISOString()
      }),
      hydrateUser
    );
  }

  return runSerializedWrite(async () => {
    const store = await readStore();
    const userIndex = store.users.findIndex((user) => String(user.id) === String(id));

    if (userIndex === -1) {
      return null;
    }

    const currentUser = store.users[userIndex];
    const updatedUser = hydrateUser({
      ...currentUser,
      nama: updates.nama ?? currentUser.nama,
      noTelepon: updates.noTelepon ?? currentUser.noTelepon,
      alamat: updates.alamat ?? currentUser.alamat,
      kota: updates.kota ?? currentUser.kota,
      provinsi: updates.provinsi ?? currentUser.provinsi,
      role: isReservedAdminEmail(currentUser.email) ? 'admin' : updates.role ?? currentUser.role,
      status: updates.status ?? currentUser.status,
      notes: updates.notes ?? currentUser.notes,
      updatedAt: new Date().toISOString()
    });

    store.users[userIndex] = updatedUser;
    await writeStore(store);

    return updatedUser;
  });
};

const setUserPassword = async (id, password) => {
  if (isFirebaseEnabled()) {
    const currentUser = await findUserById(id);

    if (!currentUser) {
      return null;
    }

    return updateDocumentById(
      USERS_COLLECTION,
      id,
      hydrateUser({
        ...currentUser,
        password,
        updatedAt: new Date().toISOString()
      }),
      hydrateUser
    );
  }

  return runSerializedWrite(async () => {
    const store = await readStore();
    const userIndex = store.users.findIndex((user) => String(user.id) === String(id));

    if (userIndex === -1) {
      return null;
    }

    const updatedUser = hydrateUser({
      ...store.users[userIndex],
      password,
      updatedAt: new Date().toISOString()
    });

    store.users[userIndex] = updatedUser;
    await writeStore(store);
    return updatedUser;
  });
};

const deleteUser = async (id) => {
  if (isFirebaseEnabled()) {
    return deleteDocumentById(USERS_COLLECTION, id, hydrateUser);
  }

  return runSerializedWrite(async () => {
    const store = await readStore();
    const userIndex = store.users.findIndex((user) => String(user.id) === String(id));

    if (userIndex === -1) {
      return null;
    }

    const [deletedUser] = store.users.splice(userIndex, 1);
    await writeStore(store);

    return deletedUser;
  });
};

module.exports = {
  adminUpdateUser,
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  getPublicUser,
  getUsers,
  setUserPassword,
  updateUser
};
