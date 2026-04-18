import React, { useMemo } from 'react';
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

const AdminMediaTab = ({
  mediaAssets,
  filters,
  setFilter,
  uploadDraft,
  setUploadDraft,
  handleMediaUpload,
  copyText,
  updateListItem,
  saveMediaAsset,
  removeMediaAsset
}) => {
  const filteredMediaAssets = useMemo(
    () =>
      mediaAssets.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesFolder = filters.folder === 'all' || item.folder === filters.folder;
        return matchesSearch && matchesFolder;
      }),
    [filters.folder, filters.search, mediaAssets]
  );

  return (
    <>
      <div className="admin-card admin-card-highlight">
        <div className="admin-card-head">
          <div>
            <h3>Media</h3>
            <p>Upload gambar ke Cloudinary atau backend lokal, lalu gunakan URL/Path yang muncul di Content Studio untuk logo, favicon, banner toko, dan foto produk.</p>
          </div>
        </div>
        <div className="admin-toolbar">
          <select value={uploadDraft.folder} onChange={(event) => setUploadDraft((current) => ({ ...current, folder: event.target.value }))}>
            <option value="branding">branding</option>
            <option value="hero">hero</option>
            <option value="products">products</option>
            <option value="storefront">storefront</option>
            <option value="general">general</option>
          </select>
          <input type="file" accept="image/*" onChange={(event) => setUploadDraft((current) => ({ ...current, file: event.target.files?.[0] || null }))} />
          <button type="button" className="btn-primary" onClick={handleMediaUpload} disabled={uploadDraft.isUploading}>
            {uploadDraft.isUploading ? 'Mengunggah...' : 'Upload Gambar'}
          </button>
        </div>
        <div className="admin-toolbar-note">
          Pakai folder `branding` untuk logo/favicon, `hero` untuk banner utama, `products` untuk katalog, dan `storefront` untuk visual pendukung toko.
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
                  <label className="admin-field">
                    <span>Nama Tampil</span>
                    <input value={asset.displayName || ''} onChange={(event) => updateListItem(asset.id, 'displayName', event.target.value)} placeholder={asset.originalName} />
                  </label>
                  <label className="admin-field">
                    <span>Alt Text</span>
                    <input value={asset.altText || ''} onChange={(event) => updateListItem(asset.id, 'altText', event.target.value)} placeholder="Deskripsi gambar untuk SEO/accessibility" />
                  </label>
                  <div className="admin-actions">
                    <button type="button" className="btn-primary" onClick={() => saveMediaAsset(asset)}>
                      Simpan
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
    </>
  );
};

export default AdminMediaTab;
