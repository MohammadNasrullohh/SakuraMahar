import React, { useMemo, useState } from 'react';
import './Services.css';

export const defaultProducts = [
  {
    id: 1,
    name: 'Packing Kayu Mahar',
    category: 'Packing Wajib',
    price: 'Rp35.000',
    compareAtPrice: '',
    shortDescription: 'Tambahan packing kayu untuk pengiriman mahar yang lebih aman.',
    features: ['Kuat untuk pengiriman', 'Cocok untuk frame mahar', 'Bisa ditambah kartu ucapan'],
    rating: '4.9',
    soldText: '170 terjual',
    badgeText: 'Wajib',
    popular: true,
    featured: true,
    imageUrl: '',
    accent: 'amber'
  },
  {
    id: 2,
    name: 'Tambahan Bunga Artificial',
    category: 'Isian Mahar',
    price: 'Rp30.000',
    compareAtPrice: '',
    shortDescription: 'Rangkaian bunga dekoratif untuk membuat mahar tampil lebih mewah.',
    features: ['Warna bisa custom', 'Tampilan premium', 'Cocok untuk box atau frame'],
    rating: '4.8',
    soldText: '19 terjual',
    badgeText: 'Promo',
    popular: false,
    featured: true,
    imageUrl: '',
    accent: 'rose'
  },
  {
    id: 3,
    name: 'Free Lampu Mahar LED',
    category: 'Model Bingkai Mahar',
    price: 'Rp195.000',
    compareAtPrice: 'Rp225.000',
    shortDescription: 'Frame mahar dengan lampu LED yang siap dipajang setelah acara.',
    features: ['Frame premium', 'Lampu LED hangat', 'Desain custom nama pasangan'],
    rating: '5.0',
    soldText: '6 terjual',
    badgeText: 'Best Seller',
    popular: true,
    featured: true,
    imageUrl: '',
    accent: 'blue'
  },
  {
    id: 4,
    name: 'Replika Logam Emas',
    category: 'Isian Mahar',
    price: 'Rp15.000',
    compareAtPrice: '',
    shortDescription: 'Replika logam emas untuk isian mahar akrilik atau box hias.',
    features: ['Tersedia beberapa gramasi', 'Finishing rapi', 'Cocok untuk frame atau box'],
    rating: '4.9',
    soldText: '15 terjual',
    badgeText: 'Hot',
    popular: false,
    featured: false,
    imageUrl: '',
    accent: 'gold'
  },
  {
    id: 5,
    name: 'Box Mahar Ukir 1-2 Hari',
    category: 'Model Bingkai Mahar',
    price: 'Rp195.000',
    compareAtPrice: '',
    shortDescription: 'Box mahar ukir elegan dengan pengerjaan cepat untuk kebutuhan mendadak.',
    features: ['Ukiran elegan', 'Proses cepat', 'Free kartu nama pasangan'],
    rating: '4.9',
    soldText: 'Penilaian toko 4.9',
    badgeText: 'Express',
    popular: true,
    featured: false,
    imageUrl: '',
    accent: 'purple'
  },
  {
    id: 6,
    name: 'Akrilik Ganti Tetes Air',
    category: 'Produk',
    price: 'Rp75.000',
    compareAtPrice: '',
    shortDescription: 'Akrilik bentuk unik untuk pelengkap mahar dekoratif dengan tampilan modern.',
    features: ['Pilihan mirror gold/rosegold/silver', 'Bisa custom tulisan', 'Tampilan modern'],
    rating: '5.0',
    soldText: '1 terjual',
    badgeText: 'Custom',
    popular: false,
    featured: false,
    imageUrl: '',
    accent: 'teal'
  }
];

export const defaultServices = defaultProducts;

const legacyPackageNames = new Set([
  'paket starter',
  'paket premium',
  'paket platinum'
]);

const isLegacyPackageCatalog = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every((item) => legacyPackageNames.has(String(item?.name || '').trim().toLowerCase()));

const toNumber = (value) => {
  const numeric = String(value ?? '').replace(/[^0-9.]/g, '');
  const parsed = Number(numeric);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toRating = (value) => {
  const parsed = Number(String(value ?? '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
};

const lowestPriceLabel = (items) => {
  const prices = items.map((item) => ({ raw: item.price, numeric: toNumber(item.price) })).filter((item) => item.numeric > 0);
  if (!prices.length) {
    return 'Konsultasi dulu';
  }

  const cheapest = prices.sort((left, right) => left.numeric - right.numeric)[0];
  return `Mulai ${cheapest.raw}`;
};

export const normalizeProductItems = (items) => {
  const source =
    Array.isArray(items) && items.length
      ? (isLegacyPackageCatalog(items) ? defaultProducts : items)
      : defaultProducts;

  return source.map((item, index) => ({
    id: item?.id ?? index + 1,
    name: item?.name || `Produk ${index + 1}`,
    category: item?.category || item?.group || 'Produk',
    price: item?.price || 'Mulai konsultasi',
    compareAtPrice: item?.compareAtPrice || '',
    shortDescription: item?.shortDescription || item?.description || '',
    features: Array.isArray(item?.features) ? item.features.filter(Boolean) : [],
    rating: item?.rating || '',
    soldText: item?.soldText || item?.soldLabel || '',
    badgeText: item?.badgeText || '',
    popular: Boolean(item?.popular),
    featured: item?.featured !== false,
    imageUrl: item?.imageUrl || item?.image || '',
    accent: item?.accent || 'rose'
  }));
};

const accentClassMap = {
  amber: 'product-card-accent-amber',
  blue: 'product-card-accent-blue',
  gold: 'product-card-accent-gold',
  purple: 'product-card-accent-purple',
  teal: 'product-card-accent-teal',
  rose: 'product-card-accent-rose'
};

const getSortLabel = (sortMode) => ({
  featured: 'Unggulan',
  sold: 'Terlaris',
  rating: 'Rating Tertinggi',
  priceLow: 'Harga Terendah',
  priceHigh: 'Harga Tertinggi',
  newest: 'Terbaru',
  name: 'Nama A-Z'
}[sortMode] || 'Unggulan');

const sortProducts = (items, sortMode) => {
  const cloned = [...items];

  return cloned.sort((left, right) => {
    if (sortMode === 'priceLow') {
      return toNumber(left.price) - toNumber(right.price);
    }

    if (sortMode === 'priceHigh') {
      return toNumber(right.price) - toNumber(left.price);
    }

    if (sortMode === 'rating') {
      return toRating(right.rating) - toRating(left.rating) || toNumber(right.soldText) - toNumber(left.soldText);
    }

    if (sortMode === 'sold') {
      return toNumber(right.soldText) + (right.popular ? 1000 : 0) - (toNumber(left.soldText) + (left.popular ? 1000 : 0));
    }

    if (sortMode === 'name') {
      return String(left.name).localeCompare(String(right.name), 'id');
    }

    if (sortMode === 'newest') {
      return Number(right.id) - Number(left.id);
    }

    return (
      Number(right.popular) - Number(left.popular) ||
      Number(right.featured) - Number(left.featured) ||
      toRating(right.rating) - toRating(left.rating) ||
      toNumber(right.soldText) - toNumber(left.soldText) ||
      Number(right.id) - Number(left.id)
    );
  });
};

const ProductCard = ({
  item,
  isLoggedIn,
  primaryActionLabelLoggedIn,
  primaryActionLabelLoggedOut,
  onSelect,
  onWhatsAppClick,
  onContactClick,
  showContactShortcut,
  contactShortcutLabel,
  showWhatsAppShortcut,
  whatsappShortcutLabel,
  rank
}) => {
  const accentClass = accentClassMap[item.accent] || accentClassMap.rose;

  return (
    <article className={`product-card ${accentClass} ${item.popular ? 'is-popular' : ''}`}>
      <div className="product-card-media">
        {rank ? <span className="product-rank-badge">TOP {rank}</span> : null}
        {item.badgeText ? <span className="product-badge">{item.badgeText}</span> : null}
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} className="product-image" />
        ) : (
          <div className="product-image product-image-placeholder">
            <span>{item.category}</span>
            <strong>{item.name}</strong>
          </div>
        )}
      </div>

      <div className="product-card-body">
        <p className="product-category">{item.category}</p>
        <h3>{item.name}</h3>
        <p className="product-description">{item.shortDescription || 'Produk mahar custom yang siap dipilih untuk momen bahagia Anda.'}</p>

        <div className="product-price-row">
          <div>
            <strong className="product-price">{item.price}</strong>
            {item.compareAtPrice ? <span className="product-compare-price">{item.compareAtPrice}</span> : null}
          </div>
        </div>

        {item.features.length ? (
          <div className="product-chip-row">
            {item.features.slice(0, 3).map((feature) => (
              <span key={`${item.id}-${feature}`} className="product-chip">{feature}</span>
            ))}
          </div>
        ) : null}

        <div className="product-meta-row">
          {item.rating ? <span className="product-rating">★ {item.rating}</span> : null}
          {item.soldText ? <span className="product-sold">{item.soldText}</span> : null}
        </div>

        <button
          type="button"
          className="btn-primary product-primary-action"
          onClick={() => onSelect?.(item)}
        >
          {isLoggedIn ? primaryActionLabelLoggedIn : primaryActionLabelLoggedOut}
        </button>

        <div className="service-actions product-actions">
          {showWhatsAppShortcut ? (
            <button type="button" className="service-action-link service-action-button" onClick={() => onWhatsAppClick?.(item)}>
              {whatsappShortcutLabel}
            </button>
          ) : null}
          {showContactShortcut ? (
            <button type="button" className="service-action-link service-action-button" onClick={() => onContactClick?.(item)}>
              {contactShortcutLabel}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const TrendCard = ({ item, rank, onSelect }) => (
  <button type="button" className="trend-card" onClick={() => onSelect?.(item)}>
    <span className="trend-rank">#{rank}</span>
    <div className="trend-copy">
      <strong>{item.name}</strong>
      <span>{item.category}</span>
    </div>
    <div className="trend-meta">
      <strong>{item.price}</strong>
      <small>{item.soldText || 'Siap dipesan'}</small>
    </div>
  </button>
);

const Services = ({
  items = defaultProducts,
  isLoggedIn = false,
  onSelectPackage,
  onSelectProduct,
  onContactClick,
  onWhatsAppClick,
  primaryActionLabelLoggedIn = 'Pesan Produk',
  primaryActionLabelLoggedOut = 'Login & Pesan',
  showContactShortcut = true,
  contactShortcutLabel = 'Form Kontak',
  showWhatsAppShortcut = true,
  whatsappShortcutLabel = 'WhatsApp Kami'
}) => {
  const products = useMemo(() => normalizeProductItems(items), [items]);
  const categories = useMemo(
    () => ['Semua Produk', ...new Set(products.map((item) => item.category).filter(Boolean))],
    [products]
  );
  const categorySummaries = useMemo(
    () =>
      categories
        .filter((category) => category !== 'Semua Produk')
        .map((category) => {
          const categoryItems = products.filter((item) => item.category === category);
          return {
            name: category,
            count: categoryItems.length,
            featuredCount: categoryItems.filter((item) => item.featured).length,
            popularCount: categoryItems.filter((item) => item.popular).length,
            lowestPrice: lowestPriceLabel(categoryItems)
          };
        }),
    [categories, products]
  );

  const [activeCategory, setActiveCategory] = useState('Semua Produk');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState('featured');

  const filteredProducts = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    const scopedProducts = activeCategory === 'Semua Produk'
      ? products
      : products.filter((item) => item.category === activeCategory);

    const searchedProducts = normalizedQuery
      ? scopedProducts.filter((item) =>
        [
          item.name,
          item.category,
          item.shortDescription,
          ...(Array.isArray(item.features) ? item.features : [])
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery)
      )
      : scopedProducts;

    return sortProducts(searchedProducts, sortMode);
  }, [activeCategory, products, searchTerm, sortMode]);

  const featuredProducts = useMemo(() => {
    const spotlight = filteredProducts.filter((item) => item.featured || item.popular);
    return (spotlight.length ? spotlight : filteredProducts).slice(0, 3);
  }, [filteredProducts]);

  const topSellingProducts = useMemo(
    () => sortProducts(products, 'sold').slice(0, 5),
    [products]
  );

  const handleSelect = (product) => {
    onSelectProduct?.(product);
    onSelectPackage?.(product);
  };

  const activeSummary = activeCategory === 'Semua Produk'
    ? {
      name: 'Semua Produk',
      count: products.length,
      featuredCount: products.filter((item) => item.featured).length,
      popularCount: products.filter((item) => item.popular).length,
      lowestPrice: lowestPriceLabel(products)
    }
    : categorySummaries.find((item) => item.name === activeCategory) || {
      name: activeCategory,
      count: filteredProducts.length,
      featuredCount: filteredProducts.filter((item) => item.featured).length,
      popularCount: filteredProducts.filter((item) => item.popular).length,
      lowestPrice: lowestPriceLabel(filteredProducts)
    };

  const overviewStats = [
    { label: 'Total Produk', value: products.length, tone: 'pink' },
    { label: 'Kategori Pilihan', value: categorySummaries.length, tone: 'purple' },
    { label: 'Produk Unggulan', value: products.filter((item) => item.featured).length, tone: 'amber' },
    { label: 'Paling Populer', value: products.filter((item) => item.popular).length, tone: 'teal' }
  ];

  return (
    <section className="services product-catalog" id="services">
      <div className="container">
        <div className="catalog-header">
          <div>
            <p className="catalog-label">Katalog Produk</p>
            <h2 className="section-title">Temukan Mahar yang Paling Memikat</h2>
            <p className="section-subtitle">
              Pilih bingkai, isian, dan aksesoris mahar yang tertata rapi, nyaman dijelajahi, dan siap dipesan sesuai selera Anda.
            </p>
          </div>
        </div>

        <div className="catalog-overview-grid">
          {overviewStats.map((stat) => (
            <div key={stat.label} className={`catalog-overview-card tone-${stat.tone}`}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <div className="catalog-toolbar-shell">
          <label className="catalog-searchbox" htmlFor="catalog-search">
            <i className="fas fa-search" aria-hidden="true"></i>
            <input
              id="catalog-search"
              type="text"
              value={searchTerm}
              placeholder="Cari model, isian, atau sentuhan yang Anda suka..."
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
          <label className="catalog-sortbox" htmlFor="catalog-sort">
            <span>Urutkan</span>
            <select id="catalog-sort" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="featured">Unggulan</option>
              <option value="sold">Terlaris</option>
              <option value="rating">Rating</option>
              <option value="priceLow">Harga Terendah</option>
              <option value="priceHigh">Harga Tertinggi</option>
              <option value="newest">Terbaru</option>
              <option value="name">Nama A-Z</option>
            </select>
          </label>
        </div>

        <div className="catalog-tabs" role="tablist" aria-label="Kategori produk">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={`catalog-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="category-summary-grid">
          {categorySummaries.map((summary) => (
            <button
              key={summary.name}
              type="button"
              className={`category-summary-card ${activeCategory === summary.name ? 'active' : ''}`}
              onClick={() => setActiveCategory(summary.name)}
            >
              <strong>{summary.name}</strong>
              <span>{summary.count} produk</span>
              <small>{summary.lowestPrice}</small>
            </button>
          ))}
        </div>

        <div className="catalog-spotlight">
          <div className="catalog-spotlight-copy">
            <p className="catalog-label">Pilihan Hari Ini</p>
            <h3>{activeSummary.name}</h3>
            <p>
              Ada {activeSummary.count} pilihan dalam koleksi ini, dengan sorotan
              {' '}<strong>{getSortLabel(sortMode).toLowerCase()}</strong> untuk membantu Anda menemukan model yang terasa paling pas.
            </p>
            <div className="catalog-spotlight-meta">
              <span>{activeSummary.lowestPrice}</span>
              <span>{searchTerm.trim() ? `Pilihan bertema "${searchTerm.trim()}"` : 'Siap dipilih sesuai selera Anda'}</span>
            </div>
          </div>
          <div className="catalog-spotlight-list">
            {featuredProducts.map((item) => (
              <button key={`spotlight-${item.id}`} type="button" className="catalog-spotlight-card" onClick={() => handleSelect(item)}>
                <div>
                  <span>{item.category}</span>
                  <strong>{item.name}</strong>
                </div>
                <small>{item.price}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="catalog-results-head">
          <div>
            <h3>{searchTerm.trim() ? 'Pilihan yang Cocok untuk Anda' : activeCategory}</h3>
            <p>{filteredProducts.length} produk siap dipilih untuk hadiah mahar yang lebih berkesan.</p>
          </div>
          {(searchTerm.trim() || activeCategory !== 'Semua Produk' || sortMode !== 'featured') ? (
            <button
              type="button"
              className="catalog-link-button"
              onClick={() => {
                setSearchTerm('');
                setSortMode('featured');
                setActiveCategory('Semua Produk');
              }}
            >
              Lihat Semua Lagi
            </button>
          ) : null}
        </div>

        {filteredProducts.length ? (
          <div className="product-grid product-grid-expanded">
            {filteredProducts.map((item) => (
              <ProductCard
                key={`product-${item.id}`}
                item={item}
                isLoggedIn={isLoggedIn}
                primaryActionLabelLoggedIn={primaryActionLabelLoggedIn}
                primaryActionLabelLoggedOut={primaryActionLabelLoggedOut}
                onSelect={handleSelect}
                onWhatsAppClick={onWhatsAppClick}
                onContactClick={onContactClick}
                showContactShortcut={showContactShortcut}
                contactShortcutLabel={contactShortcutLabel}
                showWhatsAppShortcut={showWhatsAppShortcut}
                whatsappShortcutLabel={whatsappShortcutLabel}
              />
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <strong>Belum ada pilihan yang pas untuk pencarian ini.</strong>
            <p>Coba kata lain atau buka semua koleksi untuk melihat lebih banyak inspirasi mahar.</p>
          </div>
        )}

        <div className="catalog-bottom-grid">
          <div className="catalog-shelf catalog-shelf-compact">
            <div className="catalog-shelf-head">
              <div>
                <h3>Produk Terlaris</h3>
                <p>Pilihan yang paling sering dipilih untuk hadiah mahar favorit pelanggan.</p>
              </div>
            </div>
            <div className="trend-grid">
              {topSellingProducts.map((item, index) => (
                <TrendCard key={`trend-${item.id}`} item={item} rank={index + 1} onSelect={handleSelect} />
              ))}
            </div>
          </div>

          <div className="catalog-process-card">
            <p className="catalog-label">Belanja Lebih Nyaman</p>
            <h3>Semua koleksi ditata agar mudah dipilih</h3>
            <ul>
              <li>Koleksi dipisahkan rapi supaya Anda cepat menemukan jenis mahar yang dicari.</li>
              <li>Produk favorit dan unggulan tampil lebih menonjol dalam sekali lihat.</li>
              <li>Harga, detail, dan sentuhan custom ditampilkan jelas agar keputusan terasa lebih mantap.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Services;
