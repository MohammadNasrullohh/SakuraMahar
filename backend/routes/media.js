const express = require('express');
const multer = require('multer');
const requireAdmin = require('../middleware/requireAdmin');
const { createAuditLog } = require('../utils/auditLogStore');
const {
  deleteMediaAsset,
  listMediaAssets,
  storeMediaFile,
  updateMediaAsset
} = require('../utils/mediaStore');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const assets = await listMediaAssets();

    res.json({
      message: 'Daftar media berhasil diambil',
      assets
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/upload', requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File wajib diunggah.' });
    }

    const folder = req.body.folder || 'general';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const asset = await storeMediaFile({
      file: req.file,
      folder,
      baseUrl,
      uploadedBy: req.user.id,
      uploadedByEmail: req.user.email
    });

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'media.upload',
      entityType: 'media',
      entityId: String(asset.id),
      summary: `Upload media ${asset.originalName}`,
      metadata: {
        folder: asset.folder,
        provider: asset.provider,
        url: asset.url
      }
    });

    res.status(201).json({
      message: 'Media berhasil diunggah',
      asset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const asset = await updateMediaAsset(req.params.id, {
      displayName: req.body.displayName,
      altText: req.body.altText
    });

    if (!asset) {
      return res.status(404).json({ error: 'Media tidak ditemukan.' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'media.update',
      entityType: 'media',
      entityId: String(asset.id),
      summary: `Metadata media ${asset.originalName} diperbarui`,
      metadata: {
        displayName: asset.displayName,
        altText: asset.altText
      }
    });

    res.json({
      message: 'Media berhasil diperbarui',
      asset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const asset = await deleteMediaAsset(req.params.id);

    if (!asset) {
      return res.status(404).json({ error: 'Media tidak ditemukan.' });
    }

    await createAuditLog({
      actorId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'media.delete',
      entityType: 'media',
      entityId: String(asset.id),
      summary: `Media ${asset.originalName} dihapus`,
      metadata: {
        provider: asset.provider,
        folder: asset.folder
      }
    });

    res.json({
      message: 'Media berhasil dihapus',
      asset
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
