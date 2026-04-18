export const defaultCheckoutFields = [
  {
    id: 1,
    key: 'nama',
    label: 'Nama Lengkap',
    type: 'text',
    placeholder: 'Nama lengkap',
    required: true,
    enabled: true
  },
  {
    id: 2,
    key: 'email',
    label: 'Email',
    type: 'email',
    placeholder: 'nama@email.com',
    required: true,
    enabled: true
  },
  {
    id: 3,
    key: 'phone',
    label: 'Nomor Telepon',
    type: 'tel',
    placeholder: '08xxxxxxxxxx',
    required: true,
    enabled: true
  },
  {
    id: 4,
    key: 'neededDate',
    label: 'Tanggal Dibutuhkan',
    type: 'date',
    placeholder: '',
    required: false,
    enabled: true
  },
  {
    id: 5,
    key: 'quantity',
    label: 'Jumlah Item',
    type: 'number',
    placeholder: 'Contoh: 1',
    required: false,
    enabled: true
  },
  {
    id: 6,
    key: 'deliveryAddress',
    label: 'Alamat Lengkap',
    type: 'textarea',
    placeholder: 'Tulis alamat lengkap tujuan pengiriman',
    required: false,
    enabled: true
  },
  {
    id: 7,
    key: 'mapsLink',
    label: 'Link Google Maps',
    type: 'text',
    placeholder: 'Tempel link pin Google Maps agar lokasi mudah ditemukan',
    required: false,
    enabled: true
  },
  {
    id: 8,
    key: 'notes',
    label: 'Catatan Custom',
    type: 'textarea',
    placeholder: 'Ceritakan detail custom, warna, nama pasangan, atau request lainnya',
    required: false,
    enabled: true
  }
];

export const defaultCheckoutContent = {
  primaryActionMode: 'checkout',
  requireLoginBeforeCheckout: true,
  primaryActionLoggedOutLabel: 'Login & Pesan Produk',
  primaryActionLoggedInLabel: 'Pesan Produk',
  whatsappShortcutEnabled: true,
  whatsappShortcutLabel: 'WhatsApp Kami',
  contactShortcutEnabled: true,
  contactShortcutLabel: 'Form Kontak',
  authPromptText:
    'Masuk atau daftar untuk melanjutkan pemesanan produk {{productName}}. Pilihan Anda akan tetap tersimpan.',
  pageEyebrow: 'Checkout Produk',
  pageDescription:
    'Lengkapi kebutuhan untuk {{productName}}, lalu kirim order. Admin akan menindaklanjuti lewat email, telepon, atau WhatsApp.',
  packageLabel: 'Produk Terpilih',
  supportCardTitle: 'Butuh jalur cepat?',
  supportCardDescription: 'Anda tetap bisa konsultasi dulu untuk {{productName}} sebelum order final.',
  supportWhatsAppLabel: 'Chat WhatsApp',
  supportContactLabel: 'Ke Form Kontak',
  notFoundTitle: 'Produk belum ditemukan',
  notFoundDescription: 'Pilih ulang produk dari katalog atau hubungi kami untuk konsultasi cepat.',
  backToPackagesLabel: 'Kembali ke Produk',
  loginButtonLabel: 'Masuk',
  registerButtonLabel: 'Daftar',
  useContactLabel: 'Pakai form kontak',
  directWhatsAppLabel: 'Tanya via WhatsApp',
  formTitle: 'Form Pemesanan',
  formDescription: 'Lengkapi data pesanan, termasuk alamat dan pin Google Maps bila perlu, agar tim kami lebih mudah menindaklanjuti order {{productName}}.',
  submitButtonLabel: 'Kirim Order Produk',
  submittingButtonLabel: 'Mengirim Order...',
  successMessage: 'Order produk berhasil dikirim ke admin.',
  errorMessage: 'Order produk gagal dikirim.',
  orderSubjectPrefix: 'Order Produk',
  fields: defaultCheckoutFields
};

const withFieldDefaults = (fields) => {
  const source = Array.isArray(fields) && fields.length ? fields : defaultCheckoutFields;

  return source.map((field, index) => ({
    id: field?.id ?? index + 1,
    key: String(field?.key || `field_${index + 1}`).trim(),
    label: field?.label || `Field ${index + 1}`,
    type: field?.type || 'text',
    placeholder: field?.placeholder || '',
    required: Boolean(field?.required),
    enabled: field?.enabled !== false
  }));
};

export const normalizeCheckoutContent = (value) => ({
  ...defaultCheckoutContent,
  ...(value || {}),
  fields: withFieldDefaults(value?.fields)
});

export const getWhatsAppBaseUrl = (contact = {}) => {
  const safeContact = contact && typeof contact === 'object' ? contact : {};
  const socials = Array.isArray(safeContact.socials) ? safeContact.socials : [];
  const socialMatch = socials.find((item) =>
    /whatsapp/i.test(`${item?.platform || ''} ${item?.icon || ''} ${item?.url || ''}`)
  );

  if (socialMatch?.url) {
    return socialMatch.url;
  }

  const rawPhone = String(safeContact.phone || '').replace(/\D/g, '');
  if (!rawPhone) {
    return '';
  }

  const normalizedPhone = rawPhone.startsWith('0')
    ? `62${rawPhone.slice(1)}`
    : rawPhone;

  return `https://wa.me/${normalizedPhone}`;
};

export const buildWhatsAppUrl = (contact = {}, message = '') => {
  const baseUrl = getWhatsAppBaseUrl(contact);

  if (!baseUrl) {
    return '';
  }

  if (!message) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('text', message);
    return url.toString();
  } catch (error) {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}text=${encodeURIComponent(message)}`;
  }
};

export const buildGoogleMapsSearchUrl = (query = '') => {
  const trimmedQuery = String(query || '').trim();

  if (!trimmedQuery) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedQuery)}`;
};

export const buildProductInquiryText = (product, brandName = 'Sakura Mahar') => {
  if (!product) {
    return '';
  }

  return `Halo, saya tertarik dengan ${product.name} di ${brandName}. Mohon info detail produk dan proses pemesanannya.`;
};

export const buildPackageInquiryText = buildProductInquiryText;

export const fillCheckoutTemplate = (template, replacements = {}) =>
  Object.entries(replacements).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value ?? ''),
    String(template || '')
  );

export const createCheckoutFormState = (fields, user) =>
  (Array.isArray(fields) ? fields : []).reduce((state, field) => {
    if (!field?.enabled || !field?.key) {
      return state;
    }

    let value = '';
    if (field.key === 'nama') {
      value = user?.nama || '';
    } else if (field.key === 'email') {
      value = user?.email || '';
    } else if (field.key === 'phone') {
      value = user?.noTelepon || '';
    }

    return {
      ...state,
      [field.key]: value
    };
  }, {});
