import React, { useEffect, useMemo, useState } from 'react';
import './PackageCheckoutPage.css';
import { createOrder } from '../services/siteService';
import { defaultProducts, normalizeProductItems } from './Services';
import {
  buildGoogleMapsSearchUrl,
  buildProductInquiryText,
  buildWhatsAppUrl,
  createCheckoutFormState,
  fillCheckoutTemplate,
  normalizeCheckoutContent
} from '../utils/checkoutContent';

const defaultContact = {
  phone: '+62 812 3456 7890',
  email: 'info@sakuramahar.com',
  address: 'Jakarta, Indonesia',
  socials: [
    { platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/6281234567890' }
  ]
};

const PackageCheckoutPage = ({
  packageId,
  user,
  isAuthChecking,
  services,
  products,
  contactContent,
  branding,
  checkoutContent,
  onRequireAuth,
  onBackHome
}) => {
  const brandName = branding?.brandName || 'Sakura Mahar';
  const safeContact = useMemo(
    () => ({
      ...defaultContact,
      ...(contactContent || {}),
      socials: Array.isArray(contactContent?.socials) && contactContent.socials.length
        ? contactContent.socials
        : defaultContact.socials
    }),
    [contactContent]
  );
  const checkout = useMemo(
    () => normalizeCheckoutContent(checkoutContent),
    [checkoutContent]
  );
  const productList = useMemo(
    () => normalizeProductItems(products || services || defaultProducts),
    [products, services]
  );
  const selectedProduct = useMemo(
    () => productList.find((item) => String(item.id) === String(packageId)) || null,
    [packageId, productList]
  );
  const templateValues = useMemo(
    () => ({
      brandName,
      productName: selectedProduct?.name || '',
      packageName: selectedProduct?.name || ''
    }),
    [brandName, selectedProduct]
  );
  const resolveText = (value) => fillCheckoutTemplate(value, templateValues);
  const enabledFields = useMemo(
    () =>
      checkout.fields.filter(
        (field) => field?.enabled && String(field?.key || '').trim()
      ),
    [checkout.fields]
  );
  const whatsappUrl = useMemo(
    () =>
      buildWhatsAppUrl(
        safeContact,
        selectedProduct ? buildProductInquiryText(selectedProduct, brandName) : ''
      ),
    [brandName, safeContact, selectedProduct]
  );
  const [formData, setFormData] = useState(() =>
    createCheckoutFormState(enabledFields, user)
  );
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deliveryAddress = useMemo(
    () =>
      ['deliveryAddress', 'address', 'alamat', 'alamatPengiriman']
        .map((key) => String(formData[key] || '').trim())
        .find(Boolean) || '',
    [formData]
  );
  const rawMapsLink = useMemo(
    () =>
      ['mapsLink', 'googleMapsLink', 'googleMapsUrl', 'locationLink']
        .map((key) => String(formData[key] || '').trim())
        .find(Boolean) || '',
    [formData]
  );
  const addressMapsUrl = useMemo(
    () => buildGoogleMapsSearchUrl(deliveryAddress),
    [deliveryAddress]
  );
  const previewMapsUrl = useMemo(() => {
    if (!rawMapsLink) {
      return addressMapsUrl;
    }

    if (/^https?:\/\//i.test(rawMapsLink)) {
      return rawMapsLink;
    }

    return buildGoogleMapsSearchUrl(rawMapsLink);
  }, [addressMapsUrl, rawMapsLink]);

  useEffect(() => {
    setFormData((current) => {
      const seededState = createCheckoutFormState(enabledFields, user);

      enabledFields.forEach((field) => {
        const currentValue = current?.[field.key];
        if (currentValue !== undefined && currentValue !== null && currentValue !== '') {
          seededState[field.key] = currentValue;
        }
      });

      return seededState;
    });
  }, [enabledFields, user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedProduct) {
      setStatus({
        type: 'error',
        message: resolveText(checkout.notFoundDescription) || 'Produk belum ditemukan.'
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: '', message: '' });

    try {
      const customerName = String(formData.nama || user?.nama || '').trim();
      const customerEmail = String(formData.email || user?.email || '').trim().toLowerCase();
      const customerPhone = String(
        formData.phone || formData.noTelepon || user?.noTelepon || ''
      ).trim();
      const customerNotes =
        ['notes', 'catatan', 'pesan', 'message', 'detailAcara']
          .map((key) => String(formData[key] || '').trim())
          .find(Boolean) || '';

      const response = await createOrder({
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productPrice: selectedProduct.price || '',
        productCategory: selectedProduct.category || '',
        productImage: selectedProduct.imageUrl || '',
        productPopular: Boolean(selectedProduct.popular),
        packageId: selectedProduct.id,
        packageName: selectedProduct.name,
        packagePrice: selectedProduct.price || '',
        packageDuration: selectedProduct.duration || '',
        packagePopular: Boolean(selectedProduct.popular),
        customerName,
        customerEmail,
        customerPhone,
        customerNotes,
        formData,
        fields: enabledFields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required
        }))
      });

      setStatus({
        type: 'success',
        message: response.message || resolveText(checkout.successMessage)
      });
      setFormData(createCheckoutFormState(enabledFields, user));
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || resolveText(checkout.errorMessage)
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthChecking) {
    return <div className="checkout-shell">Memuat checkout produk...</div>;
  }

  if (!selectedProduct) {
    return (
      <div className="checkout-shell">
        <div className="checkout-not-found">
          <p className="checkout-eyebrow">{resolveText(checkout.pageEyebrow)}</p>
          <h1>{resolveText(checkout.notFoundTitle)}</h1>
          <p>{resolveText(checkout.notFoundDescription)}</p>
          <div className="checkout-cta-row">
            <button type="button" className="btn-primary" onClick={() => onBackHome?.('services')}>
              {resolveText(checkout.backToPackagesLabel)}
            </button>
            {whatsappUrl && (
              <a className="btn-secondary" href={whatsappUrl} target="_blank" rel="noreferrer">
                {resolveText(checkout.directWhatsAppLabel)}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!user && checkout.requireLoginBeforeCheckout) {
    return (
      <div className="checkout-shell">
        <div className="checkout-auth-card">
          <p className="checkout-eyebrow">{resolveText(checkout.pageEyebrow)}</p>
          <h1>{selectedProduct.name}</h1>
          <p>{resolveText(checkout.authPromptText)}</p>
          <div className="checkout-cta-row">
            <button type="button" className="btn-primary" onClick={() => onRequireAuth?.('login')}>
              {resolveText(checkout.loginButtonLabel)}
            </button>
            <button type="button" className="btn-secondary" onClick={() => onRequireAuth?.('register')}>
              {resolveText(checkout.registerButtonLabel)}
            </button>
          </div>
          <div className="checkout-inline-links">
            <button
              type="button"
              className="checkout-inline-button"
              onClick={() => onBackHome?.('contact', selectedProduct)}
            >
              {resolveText(checkout.useContactLabel)}
            </button>
            {whatsappUrl && (
              <a className="checkout-inline-button" href={whatsappUrl} target="_blank" rel="noreferrer">
                {resolveText(checkout.directWhatsAppLabel)}
              </a>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-shell checkout-shell-rich">
      <section className="checkout-hero">
        <div className="container checkout-layout">
          <div className="checkout-summary">
            <p className="checkout-eyebrow">{resolveText(checkout.pageEyebrow)}</p>
            <h1>{selectedProduct.name}</h1>
            <p className="checkout-copy">{resolveText(checkout.pageDescription)}</p>

            <div className="checkout-package-card">
              <div className="checkout-package-top">
                <div>
                  <span className="checkout-package-label">{resolveText(checkout.packageLabel)}</span>
                  <strong>{selectedProduct.name}</strong>
                  {selectedProduct.category ? <p>{selectedProduct.category}</p> : null}
                </div>
                <div className="checkout-package-price">{selectedProduct.price || '-'}</div>
              </div>
              <div className="checkout-package-meta">
                {selectedProduct.category ? <span className="checkout-package-chip">{selectedProduct.category}</span> : null}
                {selectedProduct.rating ? <span className="checkout-package-chip">★ {selectedProduct.rating}</span> : null}
                {selectedProduct.popular ? (
                  <span className="checkout-package-chip checkout-package-chip-highlight">Favorit</span>
                ) : null}
              </div>
              <ul className="checkout-feature-list">
                {(Array.isArray(selectedProduct.features) ? selectedProduct.features : []).map((feature, index) => (
                  <li key={`${selectedProduct.id}-${index}`}>{feature}</li>
                ))}
              </ul>
            </div>

            <div className="checkout-support-card">
              <h3>{resolveText(checkout.supportCardTitle)}</h3>
              <p>{resolveText(checkout.supportCardDescription)}</p>
              <div className="checkout-support-actions">
                {whatsappUrl && (
                  <a className="btn-primary" href={whatsappUrl} target="_blank" rel="noreferrer">
                    {resolveText(checkout.supportWhatsAppLabel)}
                  </a>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onBackHome?.('contact', selectedProduct)}
                >
                  {resolveText(checkout.supportContactLabel)}
                </button>
              </div>
            </div>
          </div>

          <div className="checkout-form-card">
            <h2>{resolveText(checkout.formTitle)}</h2>
            <p className="checkout-form-copy">{resolveText(checkout.formDescription)}</p>

            <form className="checkout-form" onSubmit={handleSubmit}>
              <div className="checkout-readonly-card">
                <span className="checkout-readonly-label">{resolveText(checkout.packageLabel)}</span>
                <strong>{selectedProduct.name}</strong>
                <p>{[selectedProduct.price, selectedProduct.category, selectedProduct.soldText].filter(Boolean).join(' • ')}</p>
              </div>

              <div className="checkout-form-grid">
                {enabledFields.map((field) => {
                  const normalizedKey = String(field.key || '').trim().toLowerCase();
                  const isAddressField = ['deliveryaddress', 'address', 'alamat', 'alamatpengiriman'].includes(normalizedKey);
                  const isMapsField = ['mapslink', 'googlemapslink', 'googlemapsurl', 'locationlink'].includes(normalizedKey);
                  const isTextarea = field.type === 'textarea' || isAddressField;
                  const fieldClassName = `checkout-field ${isTextarea ? 'checkout-field-full' : ''}`;
                  const fieldValue = formData[field.key] || '';

                  return (
                    <label key={field.key} className={fieldClassName}>
                      <span>
                        {field.label}
                        {field.required ? ' *' : ''}
                      </span>
                      {isTextarea ? (
                        <textarea
                          name={field.key}
                          value={fieldValue}
                          onChange={handleChange}
                          rows={isAddressField ? 4 : 5}
                          required={field.required}
                          placeholder={field.placeholder || ''}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          min={field.type === 'number' ? '1' : undefined}
                          name={field.key}
                          value={fieldValue}
                          onChange={handleChange}
                          required={field.required}
                          placeholder={field.placeholder || ''}
                        />
                      )}
                      {isAddressField ? (
                        <div className="checkout-field-helper">
                          <p>Tulis alamat selengkap mungkin. Anda bisa cek lokasinya di Google Maps agar titik kirim lebih mudah dipastikan.</p>
                          <div className="checkout-map-actions">
                            {addressMapsUrl ? (
                              <a className="checkout-map-link" href={addressMapsUrl} target="_blank" rel="noreferrer">
                                Cari alamat di Google Maps
                              </a>
                            ) : (
                              <span className="checkout-map-muted">Isi alamat terlebih dulu untuk membuka Google Maps.</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                      {isMapsField ? (
                        <div className="checkout-field-helper">
                          <p>Jika Anda punya pin lokasi, tempel link Google Maps agar tim kami lebih mudah menemukan alamat pengiriman.</p>
                          <div className="checkout-map-actions">
                            {previewMapsUrl ? (
                              <a className="checkout-map-link" href={previewMapsUrl} target="_blank" rel="noreferrer">
                                Buka pin Google Maps
                              </a>
                            ) : (
                              <span className="checkout-map-muted">Bagian ini boleh dikosongkan jika alamat lengkap sudah cukup.</span>
                            )}
                          </div>
                        </div>
                      ) : null}
                    </label>
                  );
                })}
              </div>

              {(deliveryAddress || rawMapsLink) ? (
                <div className="checkout-map-preview">
                  <div>
                    <span className="checkout-readonly-label">Lokasi Pengiriman</span>
                    <strong>{deliveryAddress || 'Pin Google Maps sudah siap dibuka'}</strong>
                    <p>
                      {rawMapsLink
                        ? 'Link Google Maps akan ikut terkirim bersama order agar lokasi lebih mudah dicek.'
                        : 'Alamat lengkap Anda siap dikirim bersama order untuk memudahkan proses pengiriman.'}
                    </p>
                  </div>
                  <div className="checkout-map-actions">
                    {addressMapsUrl ? (
                      <a className="checkout-map-link" href={addressMapsUrl} target="_blank" rel="noreferrer">
                        Cek alamat
                      </a>
                    ) : null}
                    {rawMapsLink ? (
                      <a className="checkout-map-link checkout-map-link-secondary" href={previewMapsUrl} target="_blank" rel="noreferrer">
                        Buka pin
                      </a>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <button type="submit" className="btn-primary" disabled={isSubmitting}>
                {isSubmitting
                  ? resolveText(checkout.submittingButtonLabel)
                  : resolveText(checkout.submitButtonLabel)}
              </button>

              {status.message && <div className={`checkout-status ${status.type}`}>{status.message}</div>}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PackageCheckoutPage;
