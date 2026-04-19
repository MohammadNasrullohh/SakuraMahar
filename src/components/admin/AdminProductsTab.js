import React, { useEffect, useMemo, useState } from 'react';

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

const createDraftProduct = (overrides = {}) => ({
  ...productTemplate,
  badgeText: 'Baru',
  ...overrides,
  features: Array.isArray(overrides.features) ? overrides.features : []
});

const normalizeProducts = (items) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...productTemplate,
    ...(item || {}),
    id: item?.id ?? `product-${index + 1}`,
    features: Array.isArray(item?.features) ? item.features : []
  }));

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

const AdminProductsTab = ({ products = [], setProducts, onSave, isSaving = false, mediaAssets = [] }) => {
  const [search, setSearch] = useState('');
  const [newProductDraft, setNewProductDraft] = useState(() => createDraftProduct({ category: 'Bingkai Mahar' }));
  const normalizedProducts = useMemo(() => normalizeProducts(products), [products]);
  const [selectedProductId, setSelectedProductId] = useState(normalizedProducts[0]?.id ?? null);

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

  const selectedProduct = normalizedProducts.find((item) => item.id === selectedProductId) || null;
  const imageAssets = useMemo(
    () => (Array.isArray(mediaAssets) ? mediaAssets : []).filter(isImageAsset).slice(0, 12),
    [mediaAssets]
  );

  const stats = useMemo(() => {
    const categories = new Set(normalizedProducts.map((item) => String(item.category || '').trim()).filter(Boolean));

    return [
      { id: 'total', label: 'Total Produk', value: formatMetricValue(normalizedProducts.length), note: 'siap tayang' },
      { id: 'featured', label: 'Unggulan', value: formatMetricValue(normalizedProducts.filter((item) => item.featured !== false).length), note: 'ditampilkan' },
      { id: 'popular', label: 'Populer', value: formatMetricValue(normalizedProducts.filter((item) => item.popular).length), note: 'badge ramai' },
      { id: 'categories', label: 'Kategori', value: formatMetricValue(categories.size), note: 'aktif dipakai' }
    ];
  }, [normalizedProducts]);

  useEffect(() => {
    if (!normalizedProducts.length) {
      setSelectedProductId(null);
      return;
    }

    if (filteredProducts.length && !filteredProducts.some((item) => item.id === selectedProductId)) {
      setSelectedProductId(filteredProducts[0].id);
      return;
    }

    if (!normalizedProducts.some((item) => item.id === selectedProductId)) {
      setSelectedProductId(normalizedProducts[0].id);
    }
  }, [filteredProducts, normalizedProducts, selectedProductId]);

  const commitProducts = (updater) => {
    const nextProducts = typeof updater === 'function' ? updater(normalizedProducts) : updater;
    setProducts(normalizeProducts(nextProducts));
  };

  const resetNewProductDraft = () => setNewProductDraft(createDraftProduct({ category: 'Bingkai Mahar' }));

  const addDraftProduct = () => {
    const nextProduct = {
      ...createDraftProduct(newProductDraft),
      id: createProductId(),
      name: String(newProductDraft.name || '').trim(),
      category: String(newProductDraft.category || 'Produk').trim() || 'Produk',
      price: String(newProductDraft.price || '').trim(),
      compareAtPrice: String(newProductDraft.compareAtPrice || '').trim(),
      shortDescription: String(newProductDraft.shortDescription || '').trim(),
      imageUrl: String(newProductDraft.imageUrl || '').trim(),
      badgeText: String(newProductDraft.badgeText || '').trim(),
      rating: String(newProductDraft.rating || '').trim(),
      soldText: String(newProductDraft.soldText || '').trim(),
      features: (Array.isArray(newProductDraft.features) ? newProductDraft.features : []).filter(Boolean)
    };

    if (!nextProduct.name) {
      return;
    }

    commitProducts((current) => [nextProduct, ...current]);
    setSelectedProductId(nextProduct.id);
    setSearch('');
    resetNewProductDraft();
  };

  const updateSelectedProduct = (field, value) => {
    if (!selectedProduct) {
      return;
    }

    commitProducts((current) =>
      current.map((item) => (item.id === selectedProduct.id ? { ...item, [field]: value } : item))
    );
  };

  const deleteSelectedProduct = () => {
    if (!selectedProduct) {
      return;
    }

    if (typeof window !== 'undefined' && !window.confirm(`Hapus produk "${selectedProduct.name || 'tanpa nama'}"?`)) {
      return;
    }

    const nextProducts = normalizedProducts.filter((item) => item.id !== selectedProduct.id);
    commitProducts(nextProducts);
    setSelectedProductId(nextProducts[0]?.id ?? null);
  };

  const renderImagePicker = (currentImageUrl, onSelectImage) => {
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

  return (
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
            <p>Panel ini saya pecah jadi dua dropdown utama supaya tambah produk dan atur produk lebih gampang dipahami.</p>
          </div>
          <div className="admin-products-toolbar-actions">
            <button type="button" className="btn-primary" onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        </div>
      </div>

      <div className="admin-products-section-stack">
        <details className="admin-dropdown-card admin-products-main-dropdown">
          <summary>
            <span className="admin-dropdown-copy">
              <strong>Tambah Produk</strong>
              <small>Buat produk baru tanpa langsung memenuhi halaman edit.</small>
            </span>
          </summary>
          <div className="admin-dropdown-body">
            <div className="admin-products-helper-note">
              Isi data penting dulu. Setelah produk masuk daftar, detail lanjutan bisa dirapikan di dropdown Atur Produk.
            </div>

            <div className="admin-grid-two">
              <label className="admin-field">
                <span>Nama Produk</span>
                <input
                  value={newProductDraft.name || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Contoh: Mahar Frame Premium"
                />
              </label>
              <label className="admin-field">
                <span>Kategori</span>
                <select
                  value={newProductDraft.category || 'Produk'}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, category: event.target.value }))}
                >
                  {buildCategoryOptions(newProductDraft.category).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="admin-field">
                <span>Harga</span>
                <input
                  value={newProductDraft.price || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Rp195.000"
                />
              </label>
              <label className="admin-field">
                <span>Harga Coret</span>
                <input
                  value={newProductDraft.compareAtPrice || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, compareAtPrice: event.target.value }))}
                  placeholder="Rp225.000"
                />
              </label>
              <label className="admin-field">
                <span>Badge</span>
                <input
                  value={newProductDraft.badgeText || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, badgeText: event.target.value }))}
                  placeholder="Baru / Promo / Hot"
                />
              </label>
              <label className="admin-field">
                <span>Gambar Produk</span>
                <input
                  value={newProductDraft.imageUrl || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, imageUrl: event.target.value }))}
                  placeholder="/uploads/products/frame-premium.jpg"
                />
              </label>
              <label className="admin-field admin-field-full">
                <span>Deskripsi Singkat</span>
                <textarea
                  value={newProductDraft.shortDescription || ''}
                  onChange={(event) => setNewProductDraft((current) => ({ ...current, shortDescription: event.target.value }))}
                  placeholder="Tulisan pendek yang menjelaskan produk."
                />
              </label>
            </div>

            <details className="admin-dropdown-card admin-products-sub-dropdown">
              <summary>
                <span className="admin-dropdown-copy">
                  <strong>Pengaturan Lanjutan</strong>
                  <small>Untuk highlight, tampilan kartu, dan opsi rekomendasi.</small>
                </span>
              </summary>
              <div className="admin-dropdown-body">
                <div className="admin-grid-two">
                  <label className="admin-field">
                    <span>Rating</span>
                    <input
                      value={newProductDraft.rating || ''}
                      onChange={(event) => setNewProductDraft((current) => ({ ...current, rating: event.target.value }))}
                      placeholder="4.9"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Teks Terjual</span>
                    <input
                      value={newProductDraft.soldText || ''}
                      onChange={(event) => setNewProductDraft((current) => ({ ...current, soldText: event.target.value }))}
                      placeholder="170 terjual"
                    />
                  </label>
                  <label className="admin-field">
                    <span>Aksen Kartu</span>
                    <select
                      value={newProductDraft.accent || 'rose'}
                      onChange={(event) => setNewProductDraft((current) => ({ ...current, accent: event.target.value }))}
                    >
                      {accentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Tampilkan di Rekomendasi</span>
                    <select
                      value={newProductDraft.featured === false ? 'no' : 'yes'}
                      onChange={(event) => setNewProductDraft((current) => ({ ...current, featured: event.target.value === 'yes' }))}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span>Produk Populer</span>
                    <select
                      value={newProductDraft.popular ? 'yes' : 'no'}
                      onChange={(event) => setNewProductDraft((current) => ({ ...current, popular: event.target.value === 'yes' }))}
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </label>
                  <label className="admin-field admin-field-full">
                    <span>Highlight Produk</span>
                    <textarea
                      value={(newProductDraft.features || []).join('\n')}
                      onChange={(event) =>
                        setNewProductDraft((current) => ({
                          ...current,
                          features: event.target.value.split('\n').map((feature) => feature.trim()).filter(Boolean)
                        }))
                      }
                      placeholder="Satu baris untuk satu highlight produk"
                    />
                  </label>
                </div>

                {renderImagePicker(newProductDraft.imageUrl, (imageUrl) =>
                  setNewProductDraft((current) => ({ ...current, imageUrl }))
                )}
              </div>
            </details>

            <div className="admin-actions admin-products-primary-actions">
              <button type="button" className="btn-secondary" onClick={resetNewProductDraft}>
                Reset Form
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={addDraftProduct}
                disabled={!String(newProductDraft.name || '').trim()}
              >
                Tambahkan ke Daftar
              </button>
            </div>
          </div>
        </details>

        <details className="admin-dropdown-card admin-products-main-dropdown" open>
          <summary>
            <span className="admin-dropdown-copy">
              <strong>Atur Produk</strong>
              <small>Pilih produk yang sudah ada lalu edit isinya secara bertahap.</small>
            </span>
          </summary>
          <div className="admin-dropdown-body">
            <div className="admin-products-manage-toolbar">
              <input
                className="admin-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari produk..."
              />
              <div className="admin-products-count-chip">
                {filteredProducts.length} produk
              </div>
            </div>

            <div className="admin-products-layout">
              <div className="admin-card admin-products-list-shell">
                <div className="admin-card-head">
                  <div>
                    <h3>Daftar Produk</h3>
                    <p>Pilih salah satu produk untuk diatur.</p>
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
                          onClick={() => setSelectedProductId(item.id)}
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
                  <div className="admin-empty">Produk belum ditemukan. Coba kata kunci lain atau tambah produk baru.</div>
                )}
              </div>

              <div className="admin-card admin-products-editor-shell">
                {selectedProduct ? (
                  <>
                    <div className="admin-sheet-titlebar">
                      <div>
                        <h3>{selectedProduct.name || 'Produk Baru'}</h3>
                        <p>Edit detail produk yang dipilih, lalu simpan supaya storefront ikut terbarui.</p>
                      </div>
                      <div className="admin-actions">
                        <button type="button" className="btn-secondary" onClick={deleteSelectedProduct}>
                          Hapus
                        </button>
                      </div>
                    </div>

                    <div className="admin-products-preview-panel">
                      <div className="admin-products-preview-visual">
                        {selectedProduct.imageUrl ? (
                          <img src={selectedProduct.imageUrl} alt={selectedProduct.name || 'Preview produk'} />
                        ) : (
                          <div className="admin-products-preview-placeholder">Belum ada gambar</div>
                        )}
                      </div>
                      <div className="admin-products-preview-copy">
                        <span className="admin-page-label">Preview Produk</span>
                        <strong>{selectedProduct.name || 'Nama produk belum diisi'}</strong>
                        <p>{selectedProduct.shortDescription || 'Deskripsi singkat akan tampil di sini untuk membantu cek tampilan produk.'}</p>
                        <div className="admin-products-badge-row">
                          {selectedProduct.category ? <span className="admin-product-pill">{selectedProduct.category}</span> : null}
                          {selectedProduct.price ? <span className="admin-product-pill admin-product-pill-price">{selectedProduct.price}</span> : null}
                          {selectedProduct.badgeText ? <span className="admin-tag">{selectedProduct.badgeText}</span> : null}
                        </div>
                      </div>
                    </div>

                    <div className="admin-products-editor-sections">
                      <details className="admin-dropdown-card" open>
                        <summary>
                          <span className="admin-dropdown-copy">
                            <strong>Informasi Utama</strong>
                            <small>Nama, kategori, harga, dan deskripsi produk.</small>
                          </span>
                        </summary>
                        <div className="admin-dropdown-body">
                          <div className="admin-grid-two">
                            <label className="admin-field">
                              <span>Nama Produk</span>
                              <input value={selectedProduct.name || ''} onChange={(event) => updateSelectedProduct('name', event.target.value)} />
                            </label>
                            <label className="admin-field">
                              <span>Kategori</span>
                              <select value={selectedProduct.category || 'Produk'} onChange={(event) => updateSelectedProduct('category', event.target.value)}>
                                {buildCategoryOptions(selectedProduct.category).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="admin-field">
                              <span>Harga</span>
                              <input value={selectedProduct.price || ''} onChange={(event) => updateSelectedProduct('price', event.target.value)} placeholder="Rp195.000" />
                            </label>
                            <label className="admin-field">
                              <span>Harga Coret</span>
                              <input value={selectedProduct.compareAtPrice || ''} onChange={(event) => updateSelectedProduct('compareAtPrice', event.target.value)} placeholder="Rp225.000" />
                            </label>
                            <label className="admin-field admin-field-full">
                              <span>Deskripsi Singkat</span>
                              <textarea value={selectedProduct.shortDescription || ''} onChange={(event) => updateSelectedProduct('shortDescription', event.target.value)} />
                            </label>
                          </div>
                        </div>
                      </details>

                      <details className="admin-dropdown-card">
                        <summary>
                          <span className="admin-dropdown-copy">
                            <strong>Tampilan Kartu</strong>
                            <small>Badge, aksen, rating, dan visibilitas produk.</small>
                          </span>
                        </summary>
                        <div className="admin-dropdown-body">
                          <div className="admin-grid-two">
                            <label className="admin-field">
                              <span>Badge</span>
                              <input value={selectedProduct.badgeText || ''} onChange={(event) => updateSelectedProduct('badgeText', event.target.value)} placeholder="Promo, Hot, Baru" />
                            </label>
                            <label className="admin-field">
                              <span>Rating</span>
                              <input value={selectedProduct.rating || ''} onChange={(event) => updateSelectedProduct('rating', event.target.value)} placeholder="4.9" />
                            </label>
                            <label className="admin-field">
                              <span>Teks Terjual</span>
                              <input value={selectedProduct.soldText || ''} onChange={(event) => updateSelectedProduct('soldText', event.target.value)} placeholder="170 terjual" />
                            </label>
                            <label className="admin-field">
                              <span>Aksen Kartu</span>
                              <select value={selectedProduct.accent || 'rose'} onChange={(event) => updateSelectedProduct('accent', event.target.value)}>
                                {accentOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                            <label className="admin-field">
                              <span>Tampilkan di Rekomendasi</span>
                              <select value={selectedProduct.featured === false ? 'no' : 'yes'} onChange={(event) => updateSelectedProduct('featured', event.target.value === 'yes')}>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </label>
                            <label className="admin-field">
                              <span>Produk Populer</span>
                              <select value={selectedProduct.popular ? 'yes' : 'no'} onChange={(event) => updateSelectedProduct('popular', event.target.value === 'yes')}>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                              </select>
                            </label>
                          </div>
                        </div>
                      </details>

                      <details className="admin-dropdown-card" open>
                        <summary>
                          <span className="admin-dropdown-copy">
                            <strong>Gambar & Highlight</strong>
                            <small>Atur foto produk dan poin keunggulan yang tampil di katalog.</small>
                          </span>
                        </summary>
                        <div className="admin-dropdown-body">
                          <div className="admin-grid-two">
                            <label className="admin-field admin-field-full">
                              <span>Gambar Produk</span>
                              <input value={selectedProduct.imageUrl || ''} onChange={(event) => updateSelectedProduct('imageUrl', event.target.value)} placeholder="/uploads/products/frame-premium.jpg" />
                            </label>
                            <label className="admin-field admin-field-full">
                              <span>Highlight Produk</span>
                              <textarea
                                value={(selectedProduct.features || []).join('\n')}
                                onChange={(event) =>
                                  updateSelectedProduct(
                                    'features',
                                    event.target.value
                                      .split('\n')
                                      .map((feature) => feature.trim())
                                      .filter(Boolean)
                                  )
                                }
                                placeholder="Satu baris untuk satu highlight produk"
                              />
                            </label>
                          </div>

                          {renderImagePicker(selectedProduct.imageUrl, (imageUrl) => updateSelectedProduct('imageUrl', imageUrl))}
                        </div>
                      </details>
                    </div>

                    <div className="admin-actions admin-actions-sticky">
                      <button type="button" className="btn-primary" onClick={onSave} disabled={isSaving}>
                        {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="admin-empty">
                    Belum ada produk yang dipilih. Buka dropdown Tambah Produk untuk membuat data baru, atau pilih produk dari daftar.
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default AdminProductsTab;
