import React, { useMemo, useState } from 'react';
import AdminImageDropzone from './AdminImageDropzone';
import AdminOverlayForm from './AdminOverlayForm';
import { stringifyForSearch } from './adminUtils';

const resolveAssetPath = (asset = {}) => {
  if (asset.publicPath) {
    return asset.publicPath;
  }

  if (typeof asset.url === 'string' && asset.url.startsWith('/')) {
    return asset.url;
  }

  if (typeof asset.url === 'string' && asset.url) {
    try {
      return new URL(asset.url).pathname || asset.url;
    } catch (error) {
      return asset.url;
    }
  }

  return '';
};

const cloneItem = (item) => JSON.parse(JSON.stringify(item || null));

const AdminMediaTab = ({
  mediaAssets,
  filters,
  setFilter,
  uploadDraft,
  setUploadDraft,
  handleMediaUpload,
  copyText,
  saveMediaAsset,
  removeMediaAsset
}) => {
  const [editingAsset, setEditingAsset] = useState(null);

  const filteredMediaAssets = useMemo(
    () =>
      mediaAssets.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesFolder = filters.folder === 'all' || item.folder === filters.folder;
        return matchesSearch && matchesFolder;
      }),
    [filters.folder, filters.search, mediaAssets]
  );

  const openMetadataForm = (asset) => setEditingAsset(cloneItem(asset));

  return (
    <>
      <div className="admin-card admin-card-highlight">
        <div className="admin-card-head">
          <div>
            <h3>Media</h3>
            <p>Upload gambar dengan drag-and-drop, lalu buka form metadata di atas halaman ini saat perlu edit nama tampil atau alt text.</p>
          </div>
        </div>
        <div className="admin-upload-stack">
          <div className="admin-upload-folder-row">
            <label className="admin-field admin-upload-folder-field">
              <span>Folder Upload</span>
              <select value={uploadDraft.folder} onChange={(event) => setUploadDraft((current) => ({ ...current, folder: event.target.value }))}>
                <option value="branding">branding</option>
                <option value="hero">hero</option>
                <option value="products">products</option>
                <option value="storefront">storefront</option>
                <option value="general">general</option>
              </select>
            </label>
            {uploadDraft.file ? (
              <div className="admin-upload-file-chip">
                <strong>{uploadDraft.file.name}</strong>
                <span>{uploadDraft.isUploading ? 'Sedang diunggah...' : 'Siap diproses'}</span>
              </div>
            ) : null}
          </div>

          <AdminImageDropzone
            title="Drag & drop gambar di sini"
            hint="Klik area ini atau tarik satu sampai beberapa gambar sekaligus."
            folderLabel={`Folder aktif: ${uploadDraft.folder}`}
            isUploading={uploadDraft.isUploading}
            onFilesSelected={(files) => {
              setUploadDraft((current) => ({ ...current, file: files[0] || null }));
              handleMediaUpload(files, uploadDraft.folder);
            }}
          />
        </div>
        <div className="admin-toolbar-note">
          Gunakan folder `branding` untuk logo dan favicon, `hero` untuk banner utama, `products` untuk katalog, dan `storefront` untuk visual pendukung toko.
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari media..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.folder} onChange={(event) => setFilter('folder', event.target.value)}>
          <option value="all">Semua Folder</option>
          {[...new Set(mediaAssets.map((item) => item.folder).filter(Boolean))].map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
      </div>

      {filteredMediaAssets.length ? (
        <div className="media-grid">
          {filteredMediaAssets.map((asset) => {
            const assetPath = resolveAssetPath(asset);

            return (
              <div key={asset.id} className="media-card">
                {asset.mimeType?.startsWith('image/') ? <img src={asset.url} alt={asset.originalName} /> : <div className="media-placeholder">{asset.originalName}</div>}
                <div className="media-card-body">
                  <strong>{asset.displayName || asset.originalName}</strong>
                  <div className="media-card-meta">
                    <span>{asset.folder}</span>
                    <span>{asset.provider || 'local'}</span>
                  </div>
                  <code className="media-card-path">{assetPath || asset.url}</code>
                  <div className="admin-actions">
                    <button type="button" className="btn-primary" onClick={() => openMetadataForm(asset)}>
                      Edit Metadata
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => copyText(assetPath || asset.url)}>
                      Salin Path/URL
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => copyText(asset.url)}>
                      Salin URL Langsung
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => removeMediaAsset(asset.id)}>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="admin-empty">Belum ada media yang cocok dengan filter ini.</div>
      )}

      <AdminOverlayForm
        isOpen={Boolean(editingAsset)}
        tag="Media"
        title={editingAsset?.displayName || editingAsset?.originalName || 'Edit Metadata'}
        description={editingAsset ? `${editingAsset.folder || 'general'} · ${editingAsset.provider || 'local'}` : ''}
        onClose={() => setEditingAsset(null)}
        actions={
          editingAsset ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setEditingAsset(null)}>
                Tutup
              </button>
              <button type="button" className="btn-primary" onClick={() => { saveMediaAsset(editingAsset); setEditingAsset(null); }}>
                Simpan Metadata
              </button>
            </>
          ) : null
        }
      >
        {editingAsset ? (
          <div className="admin-overlay-stack">
            {editingAsset.mimeType?.startsWith('image/') ? (
              <img src={editingAsset.url} alt={editingAsset.originalName} className="admin-overlay-image-preview" />
            ) : null}
            <label className="admin-field">
              <span>Nama Tampil</span>
              <input value={editingAsset.displayName || ''} onChange={(event) => setEditingAsset((current) => ({ ...current, displayName: event.target.value }))} placeholder={editingAsset.originalName} />
            </label>
            <label className="admin-field">
              <span>Alt Text</span>
              <input value={editingAsset.altText || ''} onChange={(event) => setEditingAsset((current) => ({ ...current, altText: event.target.value }))} placeholder="Deskripsi gambar untuk SEO/accessibility" />
            </label>
            <code className="media-card-path">{resolveAssetPath(editingAsset) || editingAsset.url}</code>
          </div>
        ) : null}
      </AdminOverlayForm>
    </>
  );
};

export default AdminMediaTab;
