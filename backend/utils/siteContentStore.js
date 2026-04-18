const { readJsonFile, runSerialized, writeJsonFile } = require('./dataStore');
const { getSingletonDocument, setSingletonDocument } = require('./firestoreHelpers');
const { isFirebaseEnabled } = require('./firebase');

const FILENAME = 'site-content.json';
const COLLECTION_NAME = 'siteContent';
const DOC_ID = 'public';

const DEFAULT_SITE_CONTENT = {
  branding: {
    brandName: 'Sakura Mahar',
    browserTitle: 'Sakura Mahar - Mahar Custom & Aksesoris',
    metaDescription: 'Sakura Mahar - toko mahar custom, bingkai mahar, isian mahar, aksesoris, dan packing wajib.',
    logoUrl: '',
    logoAlt: 'Logo Sakura Mahar',
    logoIconClass: 'fas fa-cherry',
    faviconUrl: ''
  },
  hero: {
    badge: 'Mahar Custom & Aksesoris',
    title: 'Toko Mahar Custom yang Rapi, Cepat, dan Siap Pesan',
    description:
      'Sakura Mahar fokus menjual bingkai mahar, isian mahar, aksesoris, dan packing wajib dengan tampilan elegan serta proses pemesanan yang simpel.',
    primaryButtonLabel: 'Lihat Produk',
    secondaryButtonLabel: 'Cara Pesan',
    imageUrl: ''
  },
  heroStats: [
    { id: 1, value: '500+', label: 'Produk & Variasi' },
    { id: 2, value: '1K+', label: 'Pesanan Selesai' },
    { id: 3, value: '4.9/5', label: 'Rating Pelanggan' }
  ],
  features: [
    {
      id: 1,
      icon: 'fa-store',
      title: 'Katalog Produk Jelas',
      description: 'Produk dibagi per kategori seperti model bingkai, isian mahar, dan packing wajib agar lebih mudah dipilih.'
    },
    {
      id: 2,
      icon: 'fa-pen-ruler',
      title: 'Bisa Custom Desain',
      description: 'Nama pasangan, warna bunga, layout bingkai, dan detail hiasan bisa disesuaikan dengan kebutuhan.'
    },
    {
      id: 3,
      icon: 'fa-bolt',
      title: 'Pengerjaan Cepat',
      description: 'Tersedia produk ready order dan opsi pengerjaan express untuk kebutuhan mendadak.'
    },
    {
      id: 4,
      icon: 'fa-box-open',
      title: 'Packing Aman',
      description: 'Tambahan packing kayu dan proteksi pengiriman membantu produk sampai dengan lebih aman.'
    },
    {
      id: 5,
      icon: 'fa-comments',
      title: 'Konsultasi Langsung',
      description: 'Pelanggan bisa langsung tanya detail produk, request custom, dan follow-up order lewat WhatsApp atau form.'
    },
    {
      id: 6,
      icon: 'fa-lock',
      title: 'Order Tercatat Rapi',
      description: 'Setiap pesanan ditangani dengan rapi sehingga proses konfirmasi, revisi, dan pengerjaan terasa lebih tenang.'
    }
  ],
  products: [
    {
      id: 1,
      name: 'Packing Kayu Mahar',
      category: 'Packing Wajib',
      price: 'Rp35.000',
      compareAtPrice: '',
      shortDescription: 'Tambahan packing kayu untuk pengiriman mahar yang lebih aman.',
      imageUrl: '',
      badgeText: 'Wajib',
      rating: '4.9',
      soldText: '170 terjual',
      features: ['Kuat untuk pengiriman', 'Cocok untuk frame mahar', 'Bisa ditambah kartu ucapan'],
      popular: true,
      featured: true,
      accent: 'amber'
    },
    {
      id: 2,
      name: 'Tambahan Bunga Artificial',
      category: 'Isian Mahar',
      price: 'Rp30.000',
      compareAtPrice: '',
      shortDescription: 'Rangkaian bunga dekoratif untuk membuat mahar tampil lebih mewah.',
      imageUrl: '',
      badgeText: 'Promo',
      rating: '4.8',
      soldText: '19 terjual',
      features: ['Warna bisa custom', 'Tampilan premium', 'Cocok untuk box atau frame'],
      popular: false,
      featured: true,
      accent: 'rose'
    },
    {
      id: 3,
      name: 'Free Lampu Mahar LED',
      category: 'Model Bingkai Mahar',
      price: 'Rp195.000',
      compareAtPrice: 'Rp225.000',
      shortDescription: 'Frame mahar dengan lampu LED yang siap dipajang setelah acara.',
      imageUrl: '',
      badgeText: 'Best Seller',
      rating: '5.0',
      soldText: '6 terjual',
      features: ['Frame premium', 'Lampu LED hangat', 'Desain custom nama pasangan'],
      popular: true,
      featured: true,
      accent: 'blue'
    }
  ],
  services: [],
  checkout: {
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
    fields: [
      { id: 1, key: 'nama', label: 'Nama Lengkap', type: 'text', placeholder: 'Nama lengkap', required: true, enabled: true },
      { id: 2, key: 'email', label: 'Email', type: 'email', placeholder: 'nama@email.com', required: true, enabled: true },
      { id: 3, key: 'phone', label: 'Nomor Telepon', type: 'tel', placeholder: '08xxxxxxxxxx', required: true, enabled: true },
      { id: 4, key: 'neededDate', label: 'Tanggal Dibutuhkan', type: 'date', placeholder: '', required: false, enabled: true },
      { id: 5, key: 'quantity', label: 'Jumlah Item', type: 'number', placeholder: 'Contoh: 1', required: false, enabled: true },
      { id: 6, key: 'deliveryAddress', label: 'Alamat Lengkap', type: 'textarea', placeholder: 'Tulis alamat lengkap tujuan pengiriman', required: false, enabled: true },
      { id: 7, key: 'mapsLink', label: 'Link Google Maps', type: 'text', placeholder: 'Tempel link pin Google Maps agar lokasi mudah ditemukan', required: false, enabled: true },
      { id: 8, key: 'notes', label: 'Catatan Custom', type: 'textarea', placeholder: 'Ceritakan detail custom, warna, nama pasangan, atau request lainnya', required: false, enabled: true }
    ]
  },
  testimonials: [
    {
      id: 1,
      name: 'Ayu & Rizki',
      role: 'Pembeli Bingkai Mahar',
      image: '👰',
      text: 'Frame mahar yang kami pesan rapi banget, warnanya sesuai request, dan hasil akhirnya terlihat mewah.'
    },
    {
      id: 2,
      name: 'Siti & Ahmad',
      role: 'Pembeli Box Mahar',
      image: '💒',
      text: 'Adminnya responsif, box mahar datang cepat, dan detail bunga serta ornamen sesuai foto referensi.'
    },
    {
      id: 3,
      name: 'Nadia & Irfan',
      role: 'Pembeli Produk Custom',
      image: '💕',
      text: 'Kami pesan beberapa item sekaligus, dari isian mahar sampai packing kayu, semuanya tercatat dan follow-up-nya rapi.'
    }
  ],
  contact: {
    title: 'Hubungi Kami',
    description:
      'Punya pertanyaan tentang produk atau ingin memesan model custom? Tim Sakura Mahar siap membantu dengan ramah.',
    phone: '+62 812 3456 7890',
    email: 'info@sakuramahar.com',
    address: 'Jakarta, Indonesia',
    hours: 'Senin - Jumat: 09:00 - 18:00',
    socials: [
      { id: 1, platform: 'Facebook', icon: 'fab fa-facebook', url: 'https://facebook.com' },
      { id: 2, platform: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
      { id: 3, platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/6281234567890' },
      { id: 4, platform: 'TikTok', icon: 'fab fa-tiktok', url: 'https://tiktok.com' }
    ]
  },
  footer: {
    about:
      'Toko mahar custom yang fokus pada bingkai mahar, isian, aksesoris, dan packing wajib dengan proses order yang rapi.',
    helpLinks: [
      { id: 1, label: 'FAQ', url: '#features' },
      { id: 2, label: 'Tutorial', url: '#services' },
      { id: 3, label: 'Demo Testimoni', url: '#testimonials' },
      { id: 4, label: 'Hubungi Kami', url: '#contact' }
    ],
    socials: [
      { id: 1, platform: 'Facebook', icon: 'fab fa-facebook', url: 'https://facebook.com' },
      { id: 2, platform: 'Instagram', icon: 'fab fa-instagram', url: 'https://instagram.com' },
      { id: 3, platform: 'LinkedIn', icon: 'fab fa-linkedin', url: 'https://linkedin.com' },
      { id: 4, platform: 'WhatsApp', icon: 'fab fa-whatsapp', url: 'https://wa.me/6281234567890' }
    ]
  },
  wedding: {
    coupleTagline: 'The Wedding of',
    brideName: 'Sakura',
    groomName: 'Haru',
    welcomeMessage: 'Dengan penuh sukacita kami mengundang Anda hadir di hari bahagia kami.',
    eventDate: '',
    countdownTarget: '',
    heroImageUrl: '',
    coverImageUrl: '',
    venueName: 'Grand Ballroom Sakura',
    venueAddress: 'Jakarta, Indonesia',
    venueMapUrl: '',
    livestreamUrl: '',
    dressCodeTitle: 'Dress Code',
    dressCodeDescription: 'Busana formal dengan nuansa pastel lembut.',
    dressPalette: ['#f8d7da', '#d9c2f0', '#f7e5c6'],
    giftIntro: 'Doa restu Anda adalah hadiah terindah. Jika berkenan, Anda juga dapat mengirim hadiah melalui opsi berikut.',
    gifts: [
      {
        id: 1,
        label: 'Transfer Bank',
        bankName: 'BCA',
        accountName: 'Sakura Mahar',
        accountNumber: '1234567890',
        qrImageUrl: ''
      }
    ],
    gallery: [
      {
        id: 1,
        url: '',
        caption: 'Momen spesial kami'
      }
    ],
    loveStory: [
      {
        id: 1,
        title: 'Pertemuan Pertama',
        date: '',
        description: 'Kami pertama kali bertemu dan memulai kisah yang membawa kami ke hari bahagia ini.'
      }
    ],
    schedule: [
      {
        id: 1,
        title: 'Akad Nikah',
        date: '',
        time: '09:00',
        location: 'Grand Ballroom Sakura',
        description: 'Prosesi akad bersama keluarga inti.'
      },
      {
        id: 2,
        title: 'Resepsi',
        date: '',
        time: '11:00',
        location: 'Grand Ballroom Sakura',
        description: 'Sesi resepsi dan ramah tamah.'
      }
    ],
    notes: [
      'Mohon hadir 30 menit sebelum acara dimulai.',
      'Konfirmasi kehadiran Anda melalui formulir RSVP.'
    ]
  }
};

const withIds = (items, fallbackFactory) =>
  (Array.isArray(items) ? items : []).map((item, index) => ({
    ...fallbackFactory(index),
    ...item,
    id: Number(item.id || index + 1)
  }));

const legacyPackageNames = new Set([
  'paket starter',
  'paket premium',
  'paket platinum'
]);

const isLegacyPackageCatalog = (items) =>
  Array.isArray(items) &&
  items.length > 0 &&
  items.every((item) => legacyPackageNames.has(String(item?.name || '').trim().toLowerCase()));

const resolveProductSource = (content = {}) => {
  if (Array.isArray(content.products) && content.products.length) {
    return content.products;
  }

  if (isLegacyPackageCatalog(content.services)) {
    return DEFAULT_SITE_CONTENT.products;
  }

  if (Array.isArray(content.services) && content.services.length) {
    return content.services;
  }

  return DEFAULT_SITE_CONTENT.products;
};

const normalizeSiteContent = (content = {}) => ({
  branding: {
    ...DEFAULT_SITE_CONTENT.branding,
    ...(content.branding || {})
  },
  hero: {
    ...DEFAULT_SITE_CONTENT.hero,
    ...(content.hero || {})
  },
  heroStats: withIds(content.heroStats || DEFAULT_SITE_CONTENT.heroStats, (index) => ({
    id: index + 1,
    value: '',
    label: ''
  })),
  features: withIds(content.features || DEFAULT_SITE_CONTENT.features, (index) => ({
    id: index + 1,
    icon: 'fa-star',
    title: '',
    description: ''
  })),
  products: withIds(resolveProductSource(content), (index) => ({
    id: index + 1,
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
  })).map((product) => ({
    ...product,
    features: Array.isArray(product.features) ? product.features : []
  })),
  services: withIds(resolveProductSource(content), (index) => ({
    id: index + 1,
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
  })).map((product) => ({
    ...product,
    features: Array.isArray(product.features) ? product.features : []
  })),
  checkout: {
    ...DEFAULT_SITE_CONTENT.checkout,
    ...(content.checkout || {}),
    fields: withIds((content.checkout && content.checkout.fields) || DEFAULT_SITE_CONTENT.checkout.fields, (index) => ({
      id: index + 1,
      key: `field_${index + 1}`,
      label: `Field ${index + 1}`,
      type: 'text',
      placeholder: '',
      required: false,
      enabled: true
    })).map((field) => ({
      ...field,
      key: String(field.key || '').trim() || `field_${field.id}`,
      type: field.type || 'text',
      placeholder: field.placeholder || '',
      required: Boolean(field.required),
      enabled: field.enabled !== false
    }))
  },
  testimonials: withIds(content.testimonials || DEFAULT_SITE_CONTENT.testimonials, (index) => ({
    id: index + 1,
    name: '',
    role: '',
    image: '💐',
    text: ''
  })),
  contact: {
    ...DEFAULT_SITE_CONTENT.contact,
    ...(content.contact || {}),
    socials: withIds(
      (content.contact && content.contact.socials) || DEFAULT_SITE_CONTENT.contact.socials,
      (index) => ({
        id: index + 1,
        platform: '',
        icon: 'fas fa-link',
        url: '#'
      })
    )
  },
  footer: {
    ...DEFAULT_SITE_CONTENT.footer,
    ...(content.footer || {}),
    helpLinks: withIds(
      (content.footer && content.footer.helpLinks) || DEFAULT_SITE_CONTENT.footer.helpLinks,
      (index) => ({
        id: index + 1,
        label: '',
        url: '#contact'
      })
    ),
    socials: withIds(
      (content.footer && content.footer.socials) || DEFAULT_SITE_CONTENT.footer.socials,
      (index) => ({
        id: index + 1,
        platform: '',
        icon: 'fas fa-link',
        url: '#'
      })
    )
  },
  wedding: {
    ...DEFAULT_SITE_CONTENT.wedding,
    ...(content.wedding || {}),
    dressPalette:
      Array.isArray(content?.wedding?.dressPalette) && content.wedding.dressPalette.length
        ? content.wedding.dressPalette
        : DEFAULT_SITE_CONTENT.wedding.dressPalette,
    gifts: withIds((content.wedding && content.wedding.gifts) || DEFAULT_SITE_CONTENT.wedding.gifts, (index) => ({
      id: index + 1,
      label: '',
      bankName: '',
      accountName: '',
      accountNumber: '',
      qrImageUrl: ''
    })),
    gallery: withIds((content.wedding && content.wedding.gallery) || DEFAULT_SITE_CONTENT.wedding.gallery, (index) => ({
      id: index + 1,
      url: '',
      caption: ''
    })),
    loveStory: withIds((content.wedding && content.wedding.loveStory) || DEFAULT_SITE_CONTENT.wedding.loveStory, (index) => ({
      id: index + 1,
      title: '',
      date: '',
      description: ''
    })),
    schedule: withIds((content.wedding && content.wedding.schedule) || DEFAULT_SITE_CONTENT.wedding.schedule, (index) => ({
      id: index + 1,
      title: '',
      date: '',
      time: '',
      location: '',
      description: ''
    })),
    notes:
      Array.isArray(content?.wedding?.notes) && content.wedding.notes.length
        ? content.wedding.notes
        : DEFAULT_SITE_CONTENT.wedding.notes
  }
});

const getSiteContent = async () => {
  if (isFirebaseEnabled()) {
    const data = await getSingletonDocument(COLLECTION_NAME, DOC_ID, DEFAULT_SITE_CONTENT);
    return normalizeSiteContent(data || DEFAULT_SITE_CONTENT);
  }

  const data = await readJsonFile(FILENAME, DEFAULT_SITE_CONTENT);
  return normalizeSiteContent(data);
};

const saveSiteContent = async (content) => {
  const normalizedContent = normalizeSiteContent(content);

  if (isFirebaseEnabled()) {
    await setSingletonDocument(COLLECTION_NAME, DOC_ID, normalizedContent);
    return normalizedContent;
  }

  return runSerialized(FILENAME, async () => {
    await writeJsonFile(FILENAME, normalizedContent);
    return normalizedContent;
  });
};

module.exports = {
  DEFAULT_SITE_CONTENT,
  getSiteContent,
  normalizeSiteContent,
  saveSiteContent
};
