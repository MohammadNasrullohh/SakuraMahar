import React from 'react';
import { defaultCheckoutContent, normalizeCheckoutContent } from '../utils/checkoutContent';

export const createInitialContent = () => ({
  branding: {
    brandName: '',
    browserTitle: '',
    metaDescription: '',
    logoUrl: '',
    logoAlt: '',
    logoIconClass: 'fas fa-cherry',
    faviconUrl: ''
  },
  checkout: defaultCheckoutContent,
  hero: {
    badge: '',
    title: '',
    description: '',
    primaryButtonLabel: '',
    secondaryButtonLabel: '',
    imageUrl: ''
  },
  heroStats: [],
  features: [],
  products: [],
  services: [],
  testimonials: [],
  contact: {
    title: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    hours: '',
    socials: []
  },
  footer: {
    about: '',
    helpLinks: [],
    socials: []
  },
  wedding: {
    coupleTagline: '',
    brideName: '',
    groomName: '',
    welcomeMessage: '',
    eventDate: '',
    countdownTarget: '',
    heroImageUrl: '',
    coverImageUrl: '',
    venueName: '',
    venueAddress: '',
    venueMapUrl: '',
    livestreamUrl: '',
    dressCodeTitle: '',
    dressCodeDescription: '',
    dressPalette: [],
    giftIntro: '',
    gifts: [],
    gallery: [],
    loveStory: [],
    schedule: [],
    notes: []
  }
});

const createId = () => Date.now() + Math.floor(Math.random() * 1000);

const mergeArrayItems = (items, fallbackFactory) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...(fallbackFactory(index) || {}),
    ...(item || {}),
    id: item?.id ?? index + 1
  }));

export const normalizeContentValue = (value) => {
  const initial = createInitialContent();
  const source = value && typeof value === 'object' ? value : {};
  const contact = source.contact && typeof source.contact === 'object' ? source.contact : {};
  const footer = source.footer && typeof source.footer === 'object' ? source.footer : {};
  const wedding = source.wedding && typeof source.wedding === 'object' ? source.wedding : {};
  const rawProducts = source.products || source.services;
  const normalizedProducts = mergeArrayItems(rawProducts, () => ({
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
  })).map((item) => ({
    ...item,
    features: Array.isArray(item.features) ? item.features : []
  }));

  return {
    ...initial,
    ...source,
    branding: {
      ...initial.branding,
      ...(source.branding || {})
    },
    checkout: normalizeCheckoutContent(source.checkout),
    hero: {
      ...initial.hero,
      ...(source.hero || {})
    },
    heroStats: mergeArrayItems(source.heroStats, () => ({
      value: '',
      label: ''
    })),
    features: mergeArrayItems(source.features, () => ({
      icon: 'fa-star',
      title: '',
      description: ''
    })),
    products: normalizedProducts,
    services: normalizedProducts,
    testimonials: mergeArrayItems(source.testimonials, () => ({
      name: '',
      role: '',
      image: '💐',
      text: ''
    })),
    contact: {
      ...initial.contact,
      ...contact,
      socials: mergeArrayItems(contact.socials, () => ({
        platform: '',
        icon: 'fab fa-instagram',
        url: ''
      }))
    },
    footer: {
      ...initial.footer,
      ...footer,
      helpLinks: mergeArrayItems(footer.helpLinks, () => ({
        label: '',
        url: ''
      })),
      socials: mergeArrayItems(footer.socials, () => ({
        platform: '',
        icon: 'fab fa-instagram',
        url: ''
      }))
    },
    wedding: {
      ...initial.wedding,
      ...wedding,
      dressPalette: Array.isArray(wedding.dressPalette) ? wedding.dressPalette : initial.wedding.dressPalette,
      gifts: mergeArrayItems(wedding.gifts, () => ({
        label: '',
        bankName: '',
        accountName: '',
        accountNumber: '',
        qrImageUrl: ''
      })),
      gallery: mergeArrayItems(wedding.gallery, () => ({
        url: '',
        caption: ''
      })),
      loveStory: mergeArrayItems(wedding.loveStory, () => ({
        title: '',
        date: '',
        description: ''
      })),
      schedule: mergeArrayItems(wedding.schedule, () => ({
        title: '',
        date: '',
        time: '',
        location: '',
        description: ''
      })),
      notes: Array.isArray(wedding.notes) ? wedding.notes : initial.wedding.notes
    }
  };
};

const cloneContent = (value) => JSON.parse(JSON.stringify(normalizeContentValue(value)));

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

const ContentStudio = ({ value, onChange, onSave, isSaving, mediaAssets = [] }) => {
  const content = normalizeContentValue(value);
  const imageAssets = (Array.isArray(mediaAssets) ? mediaAssets : []).filter(isImageAsset);

  const updateAtPath = (path, updater) => {
    const next = cloneContent(content);
    let pointer = next;

    for (let index = 0; index < path.length - 1; index += 1) {
      const currentKey = path[index];
      if (pointer[currentKey] === undefined || pointer[currentKey] === null) {
        pointer[currentKey] = {};
      }
      pointer = pointer[currentKey];
    }

    const lastKey = path[path.length - 1];
    pointer[lastKey] = updater(pointer[lastKey]);
    onChange(next);
  };

  const updateField = (path, fieldValue) => {
    updateAtPath(path, () => fieldValue);
  };

  const updateArrayItem = (path, itemIndex, field, fieldValue) => {
    updateAtPath(path, (items) =>
      items.map((item, index) => (index === itemIndex ? { ...item, [field]: fieldValue } : item))
    );
  };

  const addArrayItem = (path, itemFactory) => {
    updateAtPath(path, (items) => [...items, { id: createId(), ...itemFactory }]);
  };

  const removeArrayItem = (path, itemIndex) => {
    updateAtPath(path, (items) => items.filter((_, index) => index !== itemIndex));
  };

  const renderUsageState = (assetPath) => {
    const states = [];

    if (content.branding.logoUrl === assetPath) {
      states.push('Logo');
    }

    if (content.branding.faviconUrl === assetPath) {
      states.push('Favicon');
    }

    if (content.hero.imageUrl === assetPath) {
      states.push('Hero');
    }

    return states;
  };

  const renderQuickMediaLibrary = () => {
    if (!imageAssets.length) {
      return (
        <div className="admin-empty">
          Belum ada media lokal. Upload dulu di tab Media, lalu aset akan muncul otomatis di sini.
        </div>
      );
    }

    return (
      <div className="content-media-grid">
        {imageAssets.slice(0, 12).map((asset) => {
          const assetPath = resolveAssetPath(asset);
          const usageState = renderUsageState(assetPath);

          return (
            <div key={`${asset.id}-${assetPath}`} className="content-media-card">
              <img src={asset.url} alt={asset.altText || asset.displayName || asset.originalName} className="content-media-preview" />
              <div className="content-media-body">
                <strong>{asset.displayName || asset.originalName}</strong>
                <span>
                  {asset.folder} · {asset.provider || 'local'}
                </span>
                <code>{assetPath}</code>
                {usageState.length ? (
                  <div className="content-media-usage">
                    {usageState.map((label) => (
                      <span key={label} className="admin-tag">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="admin-actions">
                  <button type="button" className="btn-secondary" onClick={() => updateField(['branding', 'logoUrl'], assetPath)}>
                    Logo
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => updateField(['branding', 'faviconUrl'], assetPath)}>
                    Favicon
                  </button>
                  <button type="button" className="btn-secondary" onClick={() => updateField(['hero', 'imageUrl'], assetPath)}>
                    Hero
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderArrayHeader = (title, description, addHandler, addLabel) => (
    <div className="admin-card-head content-head">
      <div>
        <h3>{title}</h3>
        {description && <p>{description}</p>}
      </div>
      <button type="button" className="btn-secondary" onClick={addHandler}>
        {addLabel}
      </button>
    </div>
  );

  return (
    <div className="content-studio">
      <div className="admin-card admin-card-highlight">
        <div className="admin-card-head">
          <div>
            <h3>Media Workflow</h3>
            <p>Upload gambar ke Cloudinary atau media lokal, lalu pilih langsung untuk logo, favicon, banner hero, dan foto produk tanpa perlu copas URL manual.</p>
          </div>
        </div>
        {renderQuickMediaLibrary()}
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h3>Branding, Logo & Favicon</h3>
        </div>
        <div className="admin-grid-two">
          <label className="admin-field"><span>Nama Brand</span><input value={content.branding.brandName || ''} onChange={(event) => updateField(['branding', 'brandName'], event.target.value)} /></label>
          <label className="admin-field"><span>Judul Browser</span><input value={content.branding.browserTitle || ''} onChange={(event) => updateField(['branding', 'browserTitle'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Meta Description</span><textarea value={content.branding.metaDescription || ''} onChange={(event) => updateField(['branding', 'metaDescription'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Path/URL Logo</span><input value={content.branding.logoUrl || ''} onChange={(event) => updateField(['branding', 'logoUrl'], event.target.value)} placeholder="/uploads/branding/logo.png atau https://res.cloudinary.com/..." /></label>
          <label className="admin-field"><span>Alt Logo</span><input value={content.branding.logoAlt || ''} onChange={(event) => updateField(['branding', 'logoAlt'], event.target.value)} /></label>
          <label className="admin-field"><span>Class Icon Logo</span><input value={content.branding.logoIconClass || ''} onChange={(event) => updateField(['branding', 'logoIconClass'], event.target.value)} placeholder="fas fa-cherry" /></label>
          <label className="admin-field admin-field-full"><span>Path/URL Favicon</span><input value={content.branding.faviconUrl || ''} onChange={(event) => updateField(['branding', 'faviconUrl'], event.target.value)} placeholder="/uploads/branding/favicon.png atau https://res.cloudinary.com/..." /></label>
          <div className="admin-field admin-field-full">
            <span>Preview Branding</span>
            <div className="branding-preview-grid">
              <div className="branding-preview-card">
                <small>Logo</small>
                {content.branding.logoUrl ? <img src={content.branding.logoUrl} alt={content.branding.logoAlt || content.branding.brandName || 'Logo'} className="branding-preview-logo" /> : <div className="branding-preview-placeholder">Belum ada logo</div>}
              </div>
              <div className="branding-preview-card">
                <small>Favicon</small>
                {content.branding.faviconUrl ? <img src={content.branding.faviconUrl} alt="Favicon preview" className="branding-preview-favicon" /> : <div className="branding-preview-placeholder">Belum ada favicon</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h3>Hero Publik</h3>
        </div>
        <div className="admin-grid-two">
          <label className="admin-field"><span>Badge</span><input value={content.hero.badge || ''} onChange={(event) => updateField(['hero', 'badge'], event.target.value)} /></label>
          <label className="admin-field"><span>Judul</span><input value={content.hero.title || ''} onChange={(event) => updateField(['hero', 'title'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Deskripsi</span><textarea value={content.hero.description || ''} onChange={(event) => updateField(['hero', 'description'], event.target.value)} /></label>
          <label className="admin-field"><span>Tombol Utama</span><input value={content.hero.primaryButtonLabel || ''} onChange={(event) => updateField(['hero', 'primaryButtonLabel'], event.target.value)} /></label>
          <label className="admin-field"><span>Tombol Kedua</span><input value={content.hero.secondaryButtonLabel || ''} onChange={(event) => updateField(['hero', 'secondaryButtonLabel'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Hero Image Path/URL</span><input value={content.hero.imageUrl || ''} onChange={(event) => updateField(['hero', 'imageUrl'], event.target.value)} placeholder="/uploads/hero/hero-image.jpg atau https://res.cloudinary.com/..." /></label>
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader(
          'Hero Stats',
          'Atur metrik yang muncul di homepage.',
          () => addArrayItem(['heroStats'], { value: '', label: '' }),
          'Tambah Stat'
        )}
        <div className="admin-list">
          {content.heroStats.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Value</span><input value={item.value || ''} onChange={(event) => updateArrayItem(['heroStats'], index, 'value', event.target.value)} /></label>
                <label className="admin-field"><span>Label</span><input value={item.label || ''} onChange={(event) => updateArrayItem(['heroStats'], index, 'label', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['heroStats'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader(
          'Fitur Homepage',
          'Kelola fitur utama secara visual.',
          () => addArrayItem(['features'], { icon: 'fa-star', title: '', description: '' }),
          'Tambah Fitur'
        )}
        <div className="admin-list">
          {content.features.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Icon</span><input value={item.icon || ''} onChange={(event) => updateArrayItem(['features'], index, 'icon', event.target.value)} /></label>
                <label className="admin-field"><span>Judul</span><input value={item.title || ''} onChange={(event) => updateArrayItem(['features'], index, 'title', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>Deskripsi</span><textarea value={item.description || ''} onChange={(event) => updateArrayItem(['features'], index, 'description', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['features'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h3>Flow Checkout</h3>
        </div>
        <div className="admin-grid-two">
          <label className="admin-field">
            <span>Mode Tombol Utama Produk</span>
            <select value={content.checkout.primaryActionMode || 'checkout'} onChange={(event) => updateField(['checkout', 'primaryActionMode'], event.target.value)}>
              <option value="checkout">Checkout</option>
              <option value="contact">Kontak</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Login Wajib Sebelum Checkout Produk</span>
            <select value={content.checkout.requireLoginBeforeCheckout ? 'yes' : 'no'} onChange={(event) => updateField(['checkout', 'requireLoginBeforeCheckout'], event.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Label Tombol Saat Belum Login</span>
            <input value={content.checkout.primaryActionLoggedOutLabel || ''} onChange={(event) => updateField(['checkout', 'primaryActionLoggedOutLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Saat Sudah Login</span>
            <input value={content.checkout.primaryActionLoggedInLabel || ''} onChange={(event) => updateField(['checkout', 'primaryActionLoggedInLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Shortcut WhatsApp</span>
            <select value={content.checkout.whatsappShortcutEnabled ? 'yes' : 'no'} onChange={(event) => updateField(['checkout', 'whatsappShortcutEnabled'], event.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Label Shortcut WhatsApp</span>
            <input value={content.checkout.whatsappShortcutLabel || ''} onChange={(event) => updateField(['checkout', 'whatsappShortcutLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Shortcut Form Kontak</span>
            <select value={content.checkout.contactShortcutEnabled ? 'yes' : 'no'} onChange={(event) => updateField(['checkout', 'contactShortcutEnabled'], event.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="admin-field">
            <span>Label Shortcut Form Kontak</span>
            <input value={content.checkout.contactShortcutLabel || ''} onChange={(event) => updateField(['checkout', 'contactShortcutLabel'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Pesan Modal Auth</span>
            <textarea value={content.checkout.authPromptText || ''} onChange={(event) => updateField(['checkout', 'authPromptText'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Eyebrow Checkout</span>
            <input value={content.checkout.pageEyebrow || ''} onChange={(event) => updateField(['checkout', 'pageEyebrow'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Produk Terpilih</span>
            <input value={content.checkout.packageLabel || ''} onChange={(event) => updateField(['checkout', 'packageLabel'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Deskripsi Checkout</span>
            <textarea value={content.checkout.pageDescription || ''} onChange={(event) => updateField(['checkout', 'pageDescription'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Judul Support Card</span>
            <input value={content.checkout.supportCardTitle || ''} onChange={(event) => updateField(['checkout', 'supportCardTitle'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Support WhatsApp</span>
            <input value={content.checkout.supportWhatsAppLabel || ''} onChange={(event) => updateField(['checkout', 'supportWhatsAppLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Support Kontak</span>
            <input value={content.checkout.supportContactLabel || ''} onChange={(event) => updateField(['checkout', 'supportContactLabel'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Deskripsi Support Card</span>
            <textarea value={content.checkout.supportCardDescription || ''} onChange={(event) => updateField(['checkout', 'supportCardDescription'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Judul Not Found</span>
            <input value={content.checkout.notFoundTitle || ''} onChange={(event) => updateField(['checkout', 'notFoundTitle'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Kembali ke Produk</span>
            <input value={content.checkout.backToPackagesLabel || ''} onChange={(event) => updateField(['checkout', 'backToPackagesLabel'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Deskripsi Not Found</span>
            <textarea value={content.checkout.notFoundDescription || ''} onChange={(event) => updateField(['checkout', 'notFoundDescription'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Login</span>
            <input value={content.checkout.loginButtonLabel || ''} onChange={(event) => updateField(['checkout', 'loginButtonLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Daftar</span>
            <input value={content.checkout.registerButtonLabel || ''} onChange={(event) => updateField(['checkout', 'registerButtonLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Pakai Form Kontak</span>
            <input value={content.checkout.useContactLabel || ''} onChange={(event) => updateField(['checkout', 'useContactLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Langsung WhatsApp</span>
            <input value={content.checkout.directWhatsAppLabel || ''} onChange={(event) => updateField(['checkout', 'directWhatsAppLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Judul Form Checkout</span>
            <input value={content.checkout.formTitle || ''} onChange={(event) => updateField(['checkout', 'formTitle'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Prefix Subject Order</span>
            <input value={content.checkout.orderSubjectPrefix || ''} onChange={(event) => updateField(['checkout', 'orderSubjectPrefix'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Deskripsi Form Checkout</span>
            <textarea value={content.checkout.formDescription || ''} onChange={(event) => updateField(['checkout', 'formDescription'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Tombol Submit Produk</span>
            <input value={content.checkout.submitButtonLabel || ''} onChange={(event) => updateField(['checkout', 'submitButtonLabel'], event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Label Saat Mengirim</span>
            <input value={content.checkout.submittingButtonLabel || ''} onChange={(event) => updateField(['checkout', 'submittingButtonLabel'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Pesan Sukses Order Produk</span>
            <textarea value={content.checkout.successMessage || ''} onChange={(event) => updateField(['checkout', 'successMessage'], event.target.value)} />
          </label>
          <label className="admin-field admin-field-full">
            <span>Pesan Gagal Order Produk</span>
            <textarea value={content.checkout.errorMessage || ''} onChange={(event) => updateField(['checkout', 'errorMessage'], event.target.value)} />
          </label>
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader(
          'Field Form Checkout',
          'Kelola field yang tampil di halaman checkout produk.',
          () =>
            addArrayItem(['checkout', 'fields'], {
              key: '',
              label: '',
              type: 'text',
              placeholder: '',
              required: false,
              enabled: true
            }),
          'Tambah Field'
        )}
        <div className="admin-list">
          {content.checkout.fields.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Key</span><input value={item.key || ''} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'key', event.target.value)} placeholder="contoh: instagram" /></label>
                <label className="admin-field"><span>Label</span><input value={item.label || ''} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'label', event.target.value)} /></label>
                <label className="admin-field">
                  <span>Tipe</span>
                  <select value={item.type || 'text'} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'type', event.target.value)}>
                    <option value="text">Text</option>
                    <option value="email">Email</option>
                    <option value="tel">Tel</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Required</span>
                  <select value={item.required ? 'yes' : 'no'} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'required', event.target.value === 'yes')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Aktif</span>
                  <select value={item.enabled ? 'yes' : 'no'} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'enabled', event.target.value === 'yes')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <label className="admin-field admin-field-full"><span>Placeholder</span><input value={item.placeholder || ''} onChange={(event) => updateArrayItem(['checkout', 'fields'], index, 'placeholder', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['checkout', 'fields'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader(
          'Testimoni',
          'Edit testimoni pengguna secara visual.',
          () => addArrayItem(['testimonials'], { name: '', role: '', image: '💐', text: '' }),
          'Tambah Testimoni'
        )}
        <div className="admin-list">
          {content.testimonials.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Nama</span><input value={item.name || ''} onChange={(event) => updateArrayItem(['testimonials'], index, 'name', event.target.value)} /></label>
                <label className="admin-field"><span>Role</span><input value={item.role || ''} onChange={(event) => updateArrayItem(['testimonials'], index, 'role', event.target.value)} /></label>
                <label className="admin-field"><span>Emoji/Gambar</span><input value={item.image || ''} onChange={(event) => updateArrayItem(['testimonials'], index, 'image', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>Isi Testimoni</span><textarea value={item.text || ''} onChange={(event) => updateArrayItem(['testimonials'], index, 'text', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['testimonials'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-head">
          <h3>Kontak & Footer</h3>
        </div>
        <div className="admin-grid-two">
          <label className="admin-field"><span>Judul Kontak</span><input value={content.contact.title || ''} onChange={(event) => updateField(['contact', 'title'], event.target.value)} /></label>
          <label className="admin-field"><span>Telepon</span><input value={content.contact.phone || ''} onChange={(event) => updateField(['contact', 'phone'], event.target.value)} /></label>
          <label className="admin-field"><span>Email</span><input value={content.contact.email || ''} onChange={(event) => updateField(['contact', 'email'], event.target.value)} /></label>
          <label className="admin-field"><span>Alamat</span><input value={content.contact.address || ''} onChange={(event) => updateField(['contact', 'address'], event.target.value)} /></label>
          <label className="admin-field"><span>Jam Operasional</span><input value={content.contact.hours || ''} onChange={(event) => updateField(['contact', 'hours'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Deskripsi Kontak</span><textarea value={content.contact.description || ''} onChange={(event) => updateField(['contact', 'description'], event.target.value)} /></label>
          <label className="admin-field admin-field-full"><span>Footer About</span><textarea value={content.footer.about || ''} onChange={(event) => updateField(['footer', 'about'], event.target.value)} /></label>
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader('Social Kontak', null, () => addArrayItem(['contact', 'socials'], { platform: '', icon: 'fab fa-instagram', url: '' }), 'Tambah Social')}
        <div className="admin-list">
          {content.contact.socials.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Platform</span><input value={item.platform || ''} onChange={(event) => updateArrayItem(['contact', 'socials'], index, 'platform', event.target.value)} /></label>
                <label className="admin-field"><span>Icon Class</span><input value={item.icon || ''} onChange={(event) => updateArrayItem(['contact', 'socials'], index, 'icon', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>URL</span><input value={item.url || ''} onChange={(event) => updateArrayItem(['contact', 'socials'], index, 'url', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['contact', 'socials'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-card">
        {renderArrayHeader('Footer Links', null, () => addArrayItem(['footer', 'helpLinks'], { label: '', url: '' }), 'Tambah Link')}
        <div className="admin-list">
          {content.footer.helpLinks.map((item, index) => (
            <div key={item.id || index} className="admin-card">
              <div className="admin-grid-two">
                <label className="admin-field"><span>Label</span><input value={item.label || ''} onChange={(event) => updateArrayItem(['footer', 'helpLinks'], index, 'label', event.target.value)} /></label>
                <label className="admin-field"><span>URL</span><input value={item.url || ''} onChange={(event) => updateArrayItem(['footer', 'helpLinks'], index, 'url', event.target.value)} /></label>
              </div>
              <div className="admin-actions"><button type="button" className="btn-secondary" onClick={() => removeArrayItem(['footer', 'helpLinks'], index)}>Hapus</button></div>
            </div>
          ))}
        </div>
      </div>

      <div className="admin-actions admin-actions-sticky">
        <button type="button" className="btn-primary" onClick={onSave} disabled={isSaving}>
          {isSaving ? 'Menyimpan...' : 'Simpan Konten Visual'}
        </button>
      </div>
    </div>
  );
};

export default ContentStudio;
