import React, { useMemo, useRef, useState } from 'react';
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
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const filteredMediaAssets = useMemo(
    () =>
      mediaAssets.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesFolder = filters.folder === 'all' || item.folder === filters.folder;
        return matchesSearch && matchesFolder;
      }),
    [filters.folder, filters.search, mediaAssets]
  );

  const handlePickedFiles = (fileList) => {
    const pickedFiles = Array.from(fileList || []).filter((file) => file?.type?.startsWith('image/'));

    if (!pickedFiles.length) {
      return;
    }

    setUploadDraft((current) => ({ ...current, file: pickedFiles[0] || null }));
    handleMediaUpload(pickedFiles);
  };

  const clearDragState = () => setIsDragging(false);

  return (
    <>
      <div className="admin-card admin-card-highlight">
        <div className="admin-card-head">
          <div>
            <h3>Media</h3>
            <p>Tarik gambar langsung ke area upload, lalu pakai aset yang masuk untuk logo, banner, dan katalog produk.</p>
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

          <div
            className={`admin-upload-dropzone ${isDragging ? 'active' : ''} ${uploadDraft.isUploading ? 'is-uploading' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              clearDragState();
            }}
            onDrop={(event) => {
              event.preventDefault();
              clearDragState();
              handlePickedFiles(event.dataTransfer.files);
            }}
          >
            <input
              ref={fileInputRef}
              className="admin-upload-hidden-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                handlePickedFiles(event.target.files);
                event.target.value = '';
              }}
            />
            <strong>{uploadDraft.isUploading ? 'Mengunggah gambar...' : 'Drag & drop gambar di sini'}</strong>
            <span>
              {uploadDraft.isUploading
                ? 'Upload sedang berjalan. Tunggu sebentar sampai media masuk ke daftar.'
                : 'Klik area ini atau tarik satu sampai beberapa gambar sekaligus.'}
            </span>
            <small>Folder aktif: {uploadDraft.folder}</small>
          </div>
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
                  <details className="admin-dropdown-card">
                    <summary>Ubah metadata</summary>
                    <div className="admin-dropdown-body">
                      <label className="admin-field">
                        <span>Nama Tampil</span>
                        <input value={asset.displayName || ''} onChange={(event) => updateListItem(asset.id, 'displayName', event.target.value)} placeholder={asset.originalName} />
                      </label>
                      <label className="admin-field">
                        <span>Alt Text</span>
                        <input value={asset.altText || ''} onChange={(event) => updateListItem(asset.id, 'altText', event.target.value)} placeholder="Deskripsi gambar untuk SEO/accessibility" />
                      </label>
                    </div>
                  </details>
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
