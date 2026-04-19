import React, { useEffect, useMemo, useState } from 'react';
import AdminImageDropzone from './AdminImageDropzone';
import AdminOverlayForm from './AdminOverlayForm';

const productTemplate = {
  name: '',
  category: 'Produk',
  price: '',
  compareAtPrice: '',
  shortDescription: '',
  imageUrl: '',
  badgeText: '',
  rating: '',
  soldText: '',
  features: [],
  popular: false,
  featured: true,
  accent: 'rose'
};

const categoryOptions = [
  'Produk',
  'Bingkai Mahar',
  'Mahar Uang',
  'Mahar Custom',
  'Paket Premium',
  'Souvenir',
  'Aksesoris'
];

const accentOptions = [
  { value: 'rose', label: 'Rose' },
  { value: 'amber', label: 'Amber' },
  { value: 'blue', label: 'Blue' },
  { value: 'gold', label: 'Gold' },
  { value: 'purple', label: 'Purple' },
  { value: 'teal', label: 'Teal' }
];

const createProductId = () => `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

const normalizeProducts = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...productTemplate,
    ...(item || {}),
    id: item?.id ?? `product-${index + 1}`,
    features: Array.isArray(item?.features) ? item.features : []
  }));

const createDraftProduct = (overrides = {}) => ({
  ...productTemplate,
  badgeText: 'Baru',
  ...overrides,
  features: Array.isArray(overrides.features) ? overrides.features : []
});

const isImageAsset = (asset) => asset?.mimeType?.startsWith('image/');

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

const formatMetricValue = (value) => Number(value || 0).toLocaleString('id-ID');

const buildCategoryOptions = (currentCategory) =>
  [...new Set([currentCategory, ...categoryOptions].filter(Boolean))];

const AdminProductsTab = ({
  products = [],
  setProducts,
  onSave,
  isSaving = false,
  mediaAssets = [],
  onUploadImages,
  uploadDraft
}) => {
  const [search, setSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [newProductDraft, setNewProductDraft] = useState(() => createDraftProduct({ category: 'Bingkai Mahar' }));
  const [editProductDraft, setEditProductDraft] = useState(null);

  const normalizedProducts = useMemo(() => normalizeProducts(products), [products]);
  const imageAssets = useMemo(
    () => (Array.isArray(mediaAssets) ? mediaAssets : []).filter(isImageAsset).slice(0, 12),
    [mediaAssets]
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return normalizedProducts;
    }

    return normalizedProducts.filter((item) =>
      [item.name, item.category, item.badgeText, item.shortDescription]
        .some((field) => String(field || '').toLowerCase().includes(keyword))
    );
  }, [normalizedProducts, search]);

  useEffect(() => {
    if (!filteredProducts.length) {
      setSelectedProductId(null);
      return;
    }

    if (!filteredProducts.some((item) => String(item.id) === String(selectedProductId))) {
      setSelectedProductId(filteredProducts[0].id);
    }
  }, [filteredProducts, selectedProductId]);

  const selectedProduct = filteredProducts.find((item) => String(item.id) === String(selectedProductId)) || null;

  const stats = useMemo(() => {
    const categories = new Set(normalizedProducts.map((item) => String(item.category || '').trim()).filter(Boolean));

    return [
      { id: 'total', label: 'Total Produk', value: formatMetricValue(normalizedProducts.length), note: 'siap tayang' },
      { id: 'featured', label: 'Unggulan', value: formatMetricValue(normalizedProducts.filter((item) => item.featured !== false).length), note: 'ditampilkan' },
      { id: 'popular', label: 'Populer', value: formatMetricValue(normalizedProducts.filter((item) => item.popular).length), note: 'badge ramai' },
      { id: 'categories', label: 'Kategori', value: formatMetricValue(categories.size), note: 'aktif dipakai' }
    ];
  }, [normalizedProducts]);

  const commitProducts = (updater) => {
    const nextProducts = typeof updater === 'function' ? updater(normalizedProducts) : updater;
    setProducts(normalizeProducts(nextProducts));
  };

  const resetNewProductDraft = () => setNewProductDraft(createDraftProduct({ category: 'Bingkai Mahar' }));

  const openEditForm = (targetProduct) => {
    if (!targetProduct) {
      return;
    }

    setSelectedProductId(targetProduct.id);
    setEditProductDraft(JSON.parse(JSON.stringify(targetProduct)));
    setIsEditOpen(true);
  };

  const applyNewProduct = () => {
    const nextProduct = {
      ...createDraftProduct(newProductDraft),
      id: createProductId(),
      name: String(newProductDraft.name || '').trim(),
      category: String(newProductDraft.category || 'Produk').trim() || 'Produk',
      features: (Array.isArray(newProductDraft.features) ? newProductDraft.features : []).filter(Boolean)
    };

    if (!nextProduct.name) {
      return;
    }

    commitProducts((current) => [nextProduct, ...current]);
    setSelectedProductId(nextProduct.id);
    resetNewProductDraft();
    setIsAddOpen(false);
  };

  const applyEditProduct = () => {
    if (!editProductDraft) {
      return;
    }

    commitProducts((current) =>
      current.map((item) => (item.id === editProductDraft.id ? { ...editProductDraft } : item))
    );
    setIsEditOpen(false);
  };

  const removeEditingProduct = () => {
    if (!editProductDraft) {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm(`Hapus produk "${editProductDraft.name || 'tanpa nama'}"?`)) {
      return;
    }

    commitProducts((current) => current.filter((item) => item.id !== editProductDraft.id));
    setIsEditOpen(false);
  };

  const renderMediaPicker = (currentImageUrl, onSelectImage) => {
    if (!imageAssets.length) {
      return null;
    }

    return (
      <div className="admin-products-media-picker">
        <div className="admin-products-section-head">
          <div>
            <h4>Pilih Gambar Cepat</h4>
            <p>Ambil langsung dari aset media yang sudah diunggah.</p>
          </div>
        </div>
        <div className="admin-product-media-grid">
          {imageAssets.map((asset) => {
            const assetPath = resolveAssetPath(asset);
            const isActive = assetPath && assetPath === currentImageUrl;

            return (
              <button
                key={`${asset.id}-${assetPath}`}
                type="button"
                className={`admin-product-media-button ${isActive ? 'active' : ''}`}
                onClick={() => onSelectImage(assetPath)}
              >
                <img src={asset.url} alt={asset.altText || asset.displayName || asset.originalName} />
                <span>{asset.displayName || asset.originalName}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderProductFields = (draft, setDraft) => (
    <div className="admin-overlay-stack">
      <div className="admin-detail-grid">
        <label className="admin-field">
          <span>Nama Produk</span>
          <input value={draft.name || ''} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
        </label>
        <label className="admin-field">
          <span>Kategori</span>
          <select value={draft.category || 'Produk'} onChange={(event) => setDraft((current) => ({ ...current, category: event.target.value }))}>
            {buildCategoryOptions(draft.category).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Harga</span>
          <input value={draft.price || ''} onChange={(event) => setDraft((current) => ({ ...current, price: event.target.value }))} placeholder="Rp195.000" />
        </label>
        <label className="admin-field">
          <span>Harga Coret</span>
          <input value={draft.compareAtPrice || ''} onChange={(event) => setDraft((current) => ({ ...current, compareAtPrice: event.target.value }))} placeholder="Rp225.000" />
        </label>
        <label className="admin-field">
          <span>Badge</span>
          <input value={draft.badgeText || ''} onChange={(event) => setDraft((current) => ({ ...current, badgeText: event.target.value }))} placeholder="Baru / Promo / Hot" />
        </label>
        <label className="admin-field">
          <span>Rating</span>
          <input value={draft.rating || ''} onChange={(event) => setDraft((current) => ({ ...current, rating: event.target.value }))} placeholder="4.9" />
        </label>
        <label className="admin-field">
          <span>Teks Terjual</span>
          <input value={draft.soldText || ''} onChange={(event) => setDraft((current) => ({ ...current, soldText: event.target.value }))} placeholder="170 terjual" />
        </label>
        <label className="admin-field">
          <span>Aksen Kartu</span>
          <select value={draft.accent || 'rose'} onChange={(event) => setDraft((current) => ({ ...current, accent: event.target.value }))}>
            {accentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-field">
          <span>Tampilkan di Rekomendasi</span>
          <select value={draft.featured === false ? 'no' : 'yes'} onChange={(event) => setDraft((current) => ({ ...current, featured: event.target.value === 'yes' }))}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="admin-field">
          <span>Produk Populer</span>
          <select value={draft.popular ? 'yes' : 'no'} onChange={(event) => setDraft((current) => ({ ...current, popular: event.target.value === 'yes' }))}>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </label>
        <label className="admin-field admin-field-full">
          <span>Deskripsi Singkat</span>
          <textarea value={draft.shortDescription || ''} onChange={(event) => setDraft((current) => ({ ...current, shortDescription: event.target.value }))} />
        </label>
        <label className="admin-field admin-field-full">
          <span>Gambar Produk</span>
          <input value={draft.imageUrl || ''} onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))} placeholder="/uploads/products/frame-premium.jpg" />
        </label>
        <label className="admin-field admin-field-full">
          <span>Highlight Produk</span>
          <textarea
            value={(draft.features || []).join('\n')}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                features: event.target.value.split('\n').map((feature) => feature.trim()).filter(Boolean)
              }))
            }
            placeholder="Satu baris untuk satu highlight produk"
          />
        </label>
      </div>

      <AdminImageDropzone
        title="Upload foto produk dengan drag & drop"
        hint="Foto yang diunggah akan langsung masuk folder products dan otomatis mengisi field gambar."
        folderLabel="Upload ke: products"
        isUploading={uploadDraft?.isUploading}
        onFilesSelected={async (files) => {
          const assets = await onUploadImages?.(files, 'products');
          const firstAsset = Array.isArray(assets) ? assets[0] : null;
          const nextPath = resolveAssetPath(firstAsset);

          if (nextPath) {
            setDraft((current) => ({ ...current, imageUrl: nextPath }));
          }
        }}
      />

      {renderMediaPicker(draft.imageUrl, (imageUrl) => setDraft((current) => ({ ...current, imageUrl })))}
    </div>
  );

  return (
    <>
      <div className="admin-products-stack">
        <div className="admin-products-stats">
          {stats.map((item) => (
            <div key={item.id} className="admin-products-stat-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.note}</small>
            </div>
          ))}
        </div>

        <div className="admin-card admin-card-highlight">
          <div className="admin-card-head admin-products-toolbar-head">
            <div>
              <h3>Produk</h3>
              <p>Form tambah dan edit sekarang muncul sebagai panel overlay di depan halaman supaya isi data lebih fokus.</p>
            </div>
            <div className="admin-products-toolbar-actions">
              <button type="button" className="btn-secondary" onClick={() => setIsAddOpen(true)}>
                Tambah Produk
              </button>
              {selectedProduct ? (
                <button type="button" className="btn-secondary" onClick={() => openEditForm(selectedProduct)}>
                  Atur Produk
                </button>
              ) : null}
              <button type="button" className="btn-primary" onClick={onSave} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan ke Website'}
              </button>
            </div>
          </div>
        </div>

        <div className="admin-toolbar">
          <input className="admin-search" placeholder="Cari produk..." value={search} onChange={(event) => setSearch(event.target.value)} />
          <div className="admin-products-count-chip">{filteredProducts.length} produk</div>
        </div>

        <section className="admin-card admin-products-list-shell">
          <div className="admin-card-head">
            <div>
              <h3>Daftar Produk</h3>
              <p>Klik produk untuk membuka form edit di depan halaman ini.</p>
            </div>
          </div>

          {filteredProducts.length ? (
            <div className="admin-products-list">
              {filteredProducts.map((item) => {
                const isSelected = item.id === selectedProductId;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`admin-product-list-item ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedProductId(item.id);
                      openEditForm(item);
                    }}
                  >
                    <div className="admin-product-list-visual">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name || 'Produk'} />
                      ) : (
                        <div className="admin-product-list-placeholder">
                          {String(item.name || 'P').trim().charAt(0).toUpperCase() || 'P'}
                        </div>
                      )}
                    </div>

                    <div className="admin-product-list-copy">
                      <strong>{item.name || 'Produk baru'}</strong>
                      <span>{item.category || 'Tanpa kategori'}</span>
                      <div className="admin-product-list-meta">
                        <small>{item.price || 'Harga belum diisi'}</small>
                        {item.soldText ? <small>{item.soldText}</small> : null}
                      </div>
                    </div>

                    <div className="admin-product-list-tags">
                      {item.badgeText ? <span className="admin-tag">{item.badgeText}</span> : null}
                      {item.featured !== false ? <span className="admin-product-pill">Unggulan</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="admin-empty">Produk belum ditemukan. Gunakan tombol tambah untuk membuat produk baru.</div>
          )}
        </section>
      </div>

      <AdminOverlayForm
        isOpen={isAddOpen}
        tag="Produk"
        title="Tambah Produk"
        description="Isi data produk baru lalu tambahkan ke daftar sebelum disimpan ke website."
        onClose={() => setIsAddOpen(false)}
        actions={
          <>
            <button type="button" className="btn-secondary" onClick={() => { resetNewProductDraft(); setIsAddOpen(false); }}>
              Tutup
            </button>
            <button type="button" className="btn-primary" onClick={applyNewProduct} disabled={!String(newProductDraft.name || '').trim()}>
              Tambahkan ke Daftar
            </button>
          </>
        }
      >
        {renderProductFields(newProductDraft, setNewProductDraft)}
      </AdminOverlayForm>

      <AdminOverlayForm
        isOpen={isEditOpen && Boolean(editProductDraft)}
        tag="Produk"
        title={editProductDraft?.name || 'Atur Produk'}
        description="Ubah isi produk lalu simpan perubahan ke daftar."
        onClose={() => setIsEditOpen(false)}
        actions={
          editProductDraft ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setIsEditOpen(false)}>
                Tutup
              </button>
              <button type="button" className="btn-secondary" onClick={removeEditingProduct}>
                Hapus
              </button>
              <button type="button" className="btn-primary" onClick={applyEditProduct}>
                Simpan Edit Produk
              </button>
            </>
          ) : null
        }
      >
        {editProductDraft ? (
          <div className="admin-overlay-stack">
            <div className="admin-products-preview-panel">
              <div className="admin-products-preview-visual">
                {editProductDraft.imageUrl ? (
                  <img src={editProductDraft.imageUrl} alt={editProductDraft.name || 'Preview produk'} />
                ) : (
                  <div className="admin-products-preview-placeholder">Belum ada gambar</div>
                )}
              </div>
              <div className="admin-products-preview-copy">
                <span className="admin-page-label">Preview Produk</span>
                <strong>{editProductDraft.name || 'Nama produk belum diisi'}</strong>
                <p>{editProductDraft.shortDescription || 'Deskripsi singkat akan tampil di sini untuk membantu cek tampilan produk.'}</p>
                <div className="admin-products-badge-row">
                  {editProductDraft.category ? <span className="admin-product-pill">{editProductDraft.category}</span> : null}
                  {editProductDraft.price ? <span className="admin-product-pill admin-product-pill-price">{editProductDraft.price}</span> : null}
                  {editProductDraft.badgeText ? <span className="admin-tag">{editProductDraft.badgeText}</span> : null}
                </div>
              </div>
            </div>

            {renderProductFields(editProductDraft, setEditProductDraft)}
          </div>
        ) : null}
      </AdminOverlayForm>
    </>
  );
};

export default AdminProductsTab;
