const crypto = require('crypto');
const { constants: fsConstants } = require('fs');
const fs = require('fs/promises');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const {
  createDocumentWithNumericId,
  deleteDocumentById,
  getDocumentById,
  listCollectionDocuments,
  updateDocumentById
} = require('./firestoreHelpers');
const { getStorageBucket, isFirebaseEnabled } = require('./firebase');
const { resolveUploadsDirectory } = require('./runtimePaths');

const COLLECTION_NAME = 'mediaAssets';
const FILENAME = 'media.json';
const DEFAULT_STORE = { assets: [] };
const uploadsDirectory = resolveUploadsDirectory();

const resolvePublicPath = (asset = {}) => {
  if (asset.publicPath) {
    return asset.publicPath;
  }

  if (asset.provider === 'local' && asset.folder && asset.filename) {
    return `/uploads/${asset.folder}/${asset.filename}`;
  }

  if (typeof asset.url === 'string' && asset.url.startsWith('/')) {
    return asset.url;
  }

  if (typeof asset.url === 'string' && asset.url) {
    try {
      return new URL(asset.url).pathname || asset.url;
    } catch (error) {
      return '';
    }
  }

  return '';
};

const sanitizeMediaAsset = (asset = {}) => ({
  id: Number(asset.id),
  provider: asset.provider || 'local',
  folder: asset.folder || 'general',
  filename: asset.filename || '',
  originalName: asset.originalName || '',
  displayName: asset.displayName || asset.originalName || '',
  altText: asset.altText || '',
  mimeType: asset.mimeType || 'application/octet-stream',
  size: Number(asset.size || 0),
  url: asset.url || '',
  publicPath: resolvePublicPath(asset),
  storagePath: asset.storagePath || '',
  createdAt: asset.createdAt || new Date().toISOString(),
  updatedAt: asset.updatedAt || asset.createdAt || new Date().toISOString(),
  uploadedBy: asset.uploadedBy || null,
  uploadedByEmail: asset.uploadedByEmail || ''
});

const readStore = async () => {
  const data = await readJsonFile(FILENAME, DEFAULT_STORE);
  return {
    assets: Array.isArray(data.assets) ? data.assets.map(sanitizeMediaAsset) : []
  };
};

const writeStore = async (store) => {
  await writeJsonFile(FILENAME, {
    assets: store.assets.map(sanitizeMediaAsset)
  });
};

const ensureUploadsDirectory = async (folder) => {
  const targetDirectory = path.join(uploadsDirectory, folder);
  await fs.mkdir(targetDirectory, { recursive: true });
  await fs.access(targetDirectory, fsConstants.F_OK);
  return targetDirectory;
};

const sanitizeFolder = (folder = 'general') =>
  folder
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'general';

const sanitizeFilename = (originalName = 'file') => {
  const extension = path.extname(originalName) || '';
  const baseName = path
    .basename(originalName, extension)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'upload';

  return `${Date.now()}-${baseName}${extension.toLowerCase()}`;
};

const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return false;
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true
  });

  return true;
};

const createMediaMetadata = async (payload) => {
  const normalizedPayload = sanitizeMediaAsset(payload);

  if (isFirebaseEnabled()) {
    return createDocumentWithNumericId(COLLECTION_NAME, normalizedPayload, sanitizeMediaAsset);
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const nextId =
      store.assets.reduce((highestId, asset) => Math.max(highestId, Number(asset.id) || 0), 0) + 1;
    const newAsset = sanitizeMediaAsset({
      ...normalizedPayload,
      id: nextId
    });

    store.assets.push(newAsset);
    await writeStore(store);

    return newAsset;
  });
};

const listMediaAssets = async () => {
  if (isFirebaseEnabled()) {
    return (await listCollectionDocuments(COLLECTION_NAME, sanitizeMediaAsset)) || [];
  }

  const store = await readStore();
  return store.assets.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

const updateMediaAsset = async (id, updates) => {
  if (isFirebaseEnabled()) {
    const currentAsset = await getDocumentById(COLLECTION_NAME, id, sanitizeMediaAsset);

    if (!currentAsset) {
      return null;
    }

    return updateDocumentById(
      COLLECTION_NAME,
      id,
      sanitizeMediaAsset({
        ...currentAsset,
        displayName: updates.displayName ?? currentAsset.displayName ?? currentAsset.originalName,
        altText: updates.altText ?? currentAsset.altText,
        updatedAt: new Date().toISOString()
      }),
      sanitizeMediaAsset
    );
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const assetIndex = store.assets.findIndex((asset) => String(asset.id) === String(id));

    if (assetIndex === -1) {
      return null;
    }

    const currentAsset = store.assets[assetIndex];
    const updatedAsset = sanitizeMediaAsset({
      ...currentAsset,
      displayName: updates.displayName ?? currentAsset.displayName ?? currentAsset.originalName,
      altText: updates.altText ?? currentAsset.altText,
      updatedAt: new Date().toISOString()
    });

    store.assets[assetIndex] = updatedAsset;
    await writeStore(store);

    return updatedAsset;
  });
};

const deleteStoredMediaFile = async (asset) => {
  if (!asset) {
    return;
  }

  if (asset.provider === 'cloudinary') {
    const cloudinaryEnabled = configureCloudinary();

    if (!cloudinaryEnabled) {
      return;
    }

    try {
      await cloudinary.uploader.destroy(asset.storagePath, { resource_type: 'auto' });
    } catch (error) {
      if (!/not found|no such file|404/i.test(String(error.message || ''))) {
        throw error;
      }
    }

    return;
  }

  if (asset.provider === 'firebase') {
    const bucket = getStorageBucket();

    if (bucket && bucket.name && asset.storagePath) {
      try {
        await bucket.file(asset.storagePath).delete();
      } catch (error) {
        if (!/no such object/i.test(String(error.message || ''))) {
          throw error;
        }
      }
    }

    return;
  }

  if (!asset.storagePath) {
    return;
  }

  try {
    await fs.unlink(asset.storagePath);
  } catch (error) {
    if (!['ENOENT', 'EPERM', 'EROFS'].includes(error.code)) {
      throw error;
    }
  }
};

const deleteMediaAsset = async (id) => {
  if (isFirebaseEnabled()) {
    const deletedAsset = await deleteDocumentById(COLLECTION_NAME, id, sanitizeMediaAsset);
    await deleteStoredMediaFile(deletedAsset);
    return deletedAsset;
  }

  return runSerialized(FILENAME, async () => {
    const store = await readStore();
    const assetIndex = store.assets.findIndex((asset) => String(asset.id) === String(id));

    if (assetIndex === -1) {
      return null;
    }

    const [deletedAsset] = store.assets.splice(assetIndex, 1);
    await writeStore(store);
    await deleteStoredMediaFile(deletedAsset);

    return sanitizeMediaAsset(deletedAsset);
  });
};

const storeMediaFile = async ({ file, folder, baseUrl, uploadedBy, uploadedByEmail }) => {
  const normalizedFolder = sanitizeFolder(folder);
  const safeFilename = sanitizeFilename(file.originalname);
  const storagePath = `${normalizedFolder}/${safeFilename}`;
  const createdAt = new Date().toISOString();
  const bucket = getStorageBucket();
  const cloudinaryEnabled = configureCloudinary();

  if (cloudinaryEnabled) {
    const publicId = path.basename(safeFilename, path.extname(safeFilename));
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: normalizedFolder,
          public_id: publicId,
          resource_type: 'auto',
          overwrite: false,
          use_filename: false,
          unique_filename: false
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }
          resolve(result);
        }
      );

      uploadStream.end(file.buffer);
    });

    const url = uploadResult.secure_url || uploadResult.url || '';

    return createMediaMetadata({
      provider: 'cloudinary',
      folder: normalizedFolder,
      filename: safeFilename,
      originalName: file.originalname,
      displayName: file.originalname,
      altText: '',
      mimeType: file.mimetype,
      size: file.size,
      url,
      publicPath: url,
      storagePath: uploadResult.public_id || `${normalizedFolder}/${path.basename(safeFilename, path.extname(safeFilename))}`,
      createdAt,
      updatedAt: createdAt,
      uploadedBy,
      uploadedByEmail
    });
  }

  if (bucket && bucket.name) {
    const downloadToken = crypto.randomUUID();
    const targetFile = bucket.file(storagePath);

    await targetFile.save(file.buffer, {
      resumable: false,
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken
        }
      }
    });

    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      storagePath
    )}?alt=media&token=${downloadToken}`;

    return createMediaMetadata({
      provider: 'firebase',
      folder: normalizedFolder,
      filename: safeFilename,
      originalName: file.originalname,
      displayName: file.originalname,
      altText: '',
      mimeType: file.mimetype,
      size: file.size,
      url,
      storagePath,
      createdAt,
      updatedAt: createdAt,
      uploadedBy,
      uploadedByEmail
    });
  }

  const targetDirectory = await ensureUploadsDirectory(normalizedFolder);
  const filePath = path.join(targetDirectory, safeFilename);
  const publicPath = `/uploads/${normalizedFolder}/${safeFilename}`;
  await fs.writeFile(filePath, file.buffer);

  return createMediaMetadata({
    provider: 'local',
    folder: normalizedFolder,
    filename: safeFilename,
    originalName: file.originalname,
    displayName: file.originalname,
    altText: '',
    mimeType: file.mimetype,
    size: file.size,
    url: `${baseUrl}${publicPath}`,
    publicPath: `${baseUrl}${publicPath}`,
    storagePath: filePath,
    createdAt,
    updatedAt: createdAt,
    uploadedBy,
    uploadedByEmail
  });
};

module.exports = {
  deleteMediaAsset,
  listMediaAssets,
  sanitizeMediaAsset,
  storeMediaFile,
  updateMediaAsset
};
