import React, { useEffect, useMemo, useState } from 'react';
import './AdminPanel.css';
import ContentStudio, { normalizeContentValue } from './ContentStudio';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminMaharsTab from './admin/AdminMaharsTab';
import AdminGuestsTab from './admin/AdminGuestsTab';
import AdminInvitationsTab from './admin/AdminInvitationsTab';
import AdminMessagesTab from './admin/AdminMessagesTab';
import AdminAuditTab from './admin/AdminAuditTab';
import AdminOrdersTab from './admin/AdminOrdersTab';
import AdminProductsTab from './admin/AdminProductsTab';
import {
  addMaharPayment,
  createGuest,
  createInvitation,
  createMahar,
  deleteOrder,
  deleteAdminUser,
  deleteGuest,
  deleteInvitation,
  deleteMahar,
  deleteMessage,
  fetchAdminDashboard,
  fetchAdminUsers,
  fetchAuditLogs,
  fetchMediaAssets,
  fetchMessages,
  fetchOrders,
  respondToMessage,
  updateOrder,
  updateAdminUser,
  updateGuest,
  updateInvitation,
  updateMahar,
  updateSiteContent,
  uploadMediaAsset
} from '../services/siteService';

const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    navHint: '',
    icon: 'fa-chart-pie',
    title: 'Dashboard',
    description: 'Pantau performa toko dan aktivitas utama.'
  },
  {
    id: 'content',
    label: 'Storefront',
    navHint: '',
    icon: 'fa-pencil-ruler',
    title: 'Storefront',
    description: 'Kelola branding, hero, dan section publik.'
  },
  {
    id: 'products',
    label: 'Produk',
    navHint: '',
    icon: 'fa-box-open',
    title: 'Produk',
    description: 'Tambah, edit, dan hapus katalog toko.'
  },
  {
    id: 'users',
    label: 'Users',
    navHint: '',
    icon: 'fa-users',
    title: 'Pengguna',
    description: 'Atur akun, role, dan akses.'
  },
  {
    id: 'messages',
    label: 'Pesan',
    navHint: '',
    icon: 'fa-comments',
    title: 'Pesan',
    description: 'Inbox lead dan balasan admin.'
  },
  {
    id: 'orders',
    label: 'Orders',
    navHint: '',
    icon: 'fa-shopping-cart',
    title: 'Order',
    description: 'Pantau checkout dan tindak lanjut.'
  },
  {
    id: 'audit',
    label: 'Audit Log',
    navHint: '',
    icon: 'fa-shield-alt',
    title: 'Aktivitas',
    description: 'Lihat jejak perubahan penting.'
  }
];

const emptyMahar = { nama: '', email: '', jumlah: '', deskripsi: '', metodePerayaan: 'Transfer Bank', tanggalPerayaan: '' };
const emptyGuest = { nama: '', email: '', noTelepon: '', status: 'pending' };
const emptyInvitation = { guestNama: '', guestEmail: '', tanggalPernikahan: '', tempatPernikahan: '', jamMulai: '', linkGoogle: '' };
const emptyPayment = { jumlah: '', metode: 'Transfer Bank', bukti: '' };

const clone = (value) => JSON.parse(JSON.stringify(value || {}));
const formatMetricLabel = (key) => String(key || '').replace(/([A-Z])/g, ' $1').trim();
const formatMetricValue = (value) =>
  typeof value === 'number' ? value.toLocaleString('id-ID') : String(value ?? '0');
const formatRatio = (value) =>
  `${Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 })}%`;
const formatDecimal = (value) =>
  Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 1 });
const formatDateTimeLabel = (value, fallback = '-') => {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return fallback;
  }

  return parsedDate.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const AdminPanel = ({
  user,
  isAdmin,
  isAuthChecking = false,
  siteContent,
  siteSummary,
  onContentUpdated,
  onSessionUserUpdated,
  onBackHome,
  onLoginClick,
  onSignupClick,
  onLogout,
  onChangePasswordClick,
  branding,
  standalone = false
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboard, setDashboard] = useState(null);
  const [users, setUsers] = useState([]);
  const [mahars, setMahars] = useState([]);
  const [guests, setGuests] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [mediaAssets, setMediaAssets] = useState([]);
  const [contentForm, setContentForm] = useState(() => clone(normalizeContentValue(siteContent)));
  const [newMahar, setNewMahar] = useState(emptyMahar);
  const [newGuest, setNewGuest] = useState(emptyGuest);
  const [newInvitation, setNewInvitation] = useState(emptyInvitation);
  const [paymentDrafts, setPaymentDrafts] = useState({});
  const [uploadDraft, setUploadDraft] = useState({ folder: 'products', file: null, isUploading: false });
  const [filters, setFilters] = useState({
    users: { search: '', status: 'all', role: 'all' },
    mahars: { search: '', status: 'all' },
    guests: { search: '', status: 'all' },
    invitations: { search: '', status: 'all' },
    messages: { search: '', status: 'all' },
    orders: { search: '', status: 'all', priority: 'all' },
    media: { search: '', folder: 'all' },
    audit: { search: '', entityType: 'all' }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const overview = useMemo(() => dashboard?.overview || siteSummary || {}, [dashboard, siteSummary]);
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) || tabs[0];
  const isOverviewTab = activeTab === 'overview';
  const displayName = user?.nama || user?.email || 'Admin';
  const brandName = branding?.brandName || 'Sakura Mahar';
  const analytics = dashboard?.analytics || null;
  const analyticsSummary = analytics?.summary || {};
  const analyticsPages = Array.isArray(analytics?.pages) ? analytics.pages : [];
  const analyticsDaily = Array.isArray(analytics?.daily) ? analytics.daily : [];
  const websiteVisitors = Number(analyticsSummary.uniqueVisitors || 0);
  const websitePageViews = Number(analyticsSummary.pageViews || 0);
  const websiteLeads = Math.max(Number(analyticsSummary.contactLeads || 0), Number(overview.messages ?? messages.length ?? 0));
  const websiteOrders = Math.max(Number(analyticsSummary.orders || 0), Number(overview.orders ?? orders.length ?? 0));
  const leadRate = websiteVisitors ? (websiteLeads / websiteVisitors) * 100 : 0;
  const orderRate = websiteVisitors ? (websiteOrders / websiteVisitors) * 100 : 0;
  const pagesPerVisitor = websiteVisitors ? websitePageViews / websiteVisitors : 0;
  const trafficWindow = analyticsDaily.slice(-7);
  const topPage = analyticsPages[0] || null;
  const maxTrafficViews = Math.max(...trafficWindow.map((entry) => Number(entry.pageViews || 0)), 1);
  const hasPerformanceData = websiteVisitors > 0 || websitePageViews > 0 || websiteLeads > 0 || websiteOrders > 0;
  const currentProducts = Array.isArray(contentForm?.products)
    ? contentForm.products
    : Array.isArray(siteContent?.products)
      ? siteContent.products
      : [];
  const currentTestimonials = Array.isArray(contentForm?.testimonials)
    ? contentForm.testimonials
    : Array.isArray(siteContent?.testimonials)
      ? siteContent.testimonials
      : [];
  const productCount = currentProducts.length;
  const featuredProductCount = currentProducts.filter((item) => item?.featured !== false).length;
  const popularProductCount = currentProducts.filter((item) => item?.popular).length;
  const categoryCount = new Set(currentProducts.map((item) => String(item?.category || '').trim()).filter(Boolean)).size;
  const testimonialCount = currentTestimonials.length;
  const unreadMessageCount = overview.unreadMessages ?? messages.filter((item) => item.status === 'unread').length;
  const activeOrderCount = overview.openOrders ?? orders.filter((item) => !['completed', 'cancelled'].includes(item.status)).length;
  const completedOrderCount = orders.filter((item) => item.status === 'completed').length;
  const activeUsersCount = overview.activeUsers ?? users.filter((item) => item.status === 'active').length;
  const adminCount = overview.admins ?? users.filter((item) => item.role === 'admin').length;
  const auditEntityCount = new Set(auditLogs.map((item) => item.entityType).filter(Boolean)).size;
  const performanceCards = [
    { id: 'visitors', label: 'Pengunjung', value: websiteVisitors, hint: 'unik' },
    { id: 'views', label: 'Page views', value: websitePageViews, hint: 'kunjungan' },
    { id: 'leads', label: 'Lead', value: websiteLeads, hint: 'masuk' },
    { id: 'sales', label: 'Order', value: websiteOrders, hint: 'checkout' }
  ];
  const summaryCards = [
    {
      id: 'orders',
      icon: 'fa-bag-shopping',
      tone: 'pink',
      label: 'Order',
      value: overview.orders ?? orders.length
    },
    {
      id: 'openOrders',
      icon: 'fa-bolt',
      tone: 'amber',
      label: 'Aktif',
      value: overview.openOrders ?? orders.filter((item) => item.status !== 'completed').length
    },
    {
      id: 'messages',
      icon: 'fa-inbox',
      tone: 'blue',
      label: 'Pesan',
      value: overview.messages ?? messages.length
    },
    {
      id: 'products',
      icon: 'fa-box-open',
      tone: 'purple',
      label: 'Produk',
      value: productCount
    }
  ];
  const quickActions = [
    { id: 'products', label: 'Kelola Produk' },
    { id: 'content', label: 'Ubah Profile Website' },
    { id: 'orders', label: 'Cek Order' },
    { id: 'messages', label: 'Balas Lead' }
  ];
  const compactHeaderStats = {
    content: [
      { id: 'products', label: 'Produk', value: formatMetricValue(productCount) },
      { id: 'testimonials', label: 'Testimoni', value: formatMetricValue(testimonialCount) }
    ],
    products: [
      { id: 'products', label: 'Produk', value: formatMetricValue(productCount) },
      { id: 'featuredProducts', label: 'Unggulan', value: formatMetricValue(featuredProductCount) },
      { id: 'popularProducts', label: 'Populer', value: formatMetricValue(popularProductCount) },
      { id: 'categories', label: 'Kategori', value: formatMetricValue(categoryCount) }
    ],
    users: [
      { id: 'users', label: 'User', value: formatMetricValue(users.length) },
      { id: 'activeUsers', label: 'Aktif', value: formatMetricValue(activeUsersCount) },
      { id: 'admins', label: 'Admin', value: formatMetricValue(adminCount) }
    ],
    messages: [
      { id: 'messages', label: 'Inbox', value: formatMetricValue(overview.messages ?? messages.length) },
      { id: 'unreadMessages', label: 'Belum balas', value: formatMetricValue(unreadMessageCount) }
    ],
    orders: [
      { id: 'orders', label: 'Order', value: formatMetricValue(overview.orders ?? orders.length) },
      { id: 'activeOrders', label: 'Aktif', value: formatMetricValue(activeOrderCount) },
      { id: 'completedOrders', label: 'Selesai', value: formatMetricValue(completedOrderCount) }
    ],
    audit: [
      { id: 'logs', label: 'Log', value: formatMetricValue(auditLogs.length) },
      { id: 'entities', label: 'Entitas', value: formatMetricValue(auditEntityCount) }
    ]
  }[activeTab] || [];

  useEffect(() => {
    setContentForm(clone(normalizeContentValue(siteContent)));
  }, [siteContent]);

  const setSuccess = (message) => setStatus({ type: 'success', message });
  const setError = (message) => setStatus({ type: 'error', message });
  const setTabFilter = (tab, field, value) => setFilters((current) => ({ ...current, [tab]: { ...current[tab], [field]: value } }));
  const setProductsCatalog = (nextProducts) => {
    const normalizedProducts = Array.isArray(nextProducts)
      ? nextProducts.map((item, index) => ({
        ...item,
        id: item?.id ?? index + 1,
        features: Array.isArray(item?.features) ? item.features : []
      }))
      : [];

    setContentForm((current) => ({
      ...current,
      products: normalizedProducts,
      services: clone(normalizedProducts)
    }));
  };

  const refreshAuditData = async () => {
    try {
      const response = await fetchAuditLogs();
      setAuditLogs(response.logs || []);
    } catch (error) {
      // Preserve current logs on refresh failure.
    }
  };

  const refreshMediaData = async () => {
    try {
      const response = await fetchMediaAssets();
      setMediaAssets(response.assets || []);
    } catch (error) {
      // Preserve current media on refresh failure.
    }
  };

  const loadPanel = async () => {
    const requests = [
      { key: 'dashboard', label: 'overview', request: fetchAdminDashboard, fallback: null },
      { key: 'users', label: 'users', request: fetchAdminUsers, fallback: { users: [] } },
      { key: 'messages', label: 'pesan', request: fetchMessages, fallback: { messages: [] } },
      { key: 'orders', label: 'orders', request: fetchOrders, fallback: { orders: [] } },
      { key: 'audit', label: 'audit log', request: fetchAuditLogs, fallback: { logs: [] } },
      { key: 'media', label: 'aset visual', request: fetchMediaAssets, fallback: { assets: [] } }
    ];

    const results = await Promise.allSettled(requests.map((item) => item.request()));
    const resolved = {};
    const unavailable = [];

    results.forEach((result, index) => {
      const request = requests[index];

      if (result.status === 'fulfilled') {
        resolved[request.key] = result.value;
        return;
      }

      resolved[request.key] = request.fallback;
      unavailable.push(request.label);
    });

    setDashboard(resolved.dashboard);
    setUsers(resolved.users.users || []);
    setMahars([]);
    setGuests([]);
    setInvitations([]);
    setMessages(resolved.messages.messages || []);
    setOrders(resolved.orders.orders || []);
    setAuditLogs(resolved.audit.logs || []);
    setMediaAssets(resolved.media.assets || []);
    setPaymentDrafts({});

    if (unavailable.length) {
      setStatus({
        type: 'error',
        message: `Sebagian data admin belum tersedia: ${unavailable.join(', ')}.`
      });
    } else {
      setStatus((current) =>
        current.message.startsWith('Sebagian data admin belum tersedia')
          ? { type: '', message: '' }
          : current
      );
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    const run = async () => {
      setIsLoading(true);
      try {
        await loadPanel();
      } catch (error) {
        setError(error.message || 'Gagal memuat panel admin.');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [isAdmin, user]);

  const updateListItem = (setter, id, field, value) => {
    setter((currentItems) => currentItems.map((item) => (String(item.id) === String(id) ? { ...item, [field]: value } : item)));
  };

  const syncAfterMutation = async () => {
    await refreshAuditData();
    setDashboard(await fetchAdminDashboard());
  };

  const saveContent = async () => {
    setIsSaving(true);
    try {
      const response = await updateSiteContent(normalizeContentValue(contentForm));
      setContentForm(clone(response.content));
      onContentUpdated?.(response.content);
      await syncAfterMutation();
      setSuccess('Konten visual berhasil diperbarui.');
    } catch (error) {
      setError(error.message || 'Konten gagal disimpan.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveUser = async (targetUser) => {
    try {
      const response = await updateAdminUser(targetUser.id, targetUser);
      setUsers((current) => current.map((item) => (item.id === targetUser.id ? response.user : item)));
      if (response.user.id === user.id) {
        onSessionUserUpdated?.(response.user);
      }
      await syncAfterMutation();
      setSuccess(`User ${response.user.email} berhasil diperbarui.`);
    } catch (error) {
      setError(error.message || 'User gagal diperbarui.');
    }
  };

  const removeUser = async (targetUser) => {
    try {
      await deleteAdminUser(targetUser.id);
      setUsers((current) => current.filter((item) => item.id !== targetUser.id));
      await syncAfterMutation();
      setSuccess(`User ${targetUser.email} berhasil dihapus.`);
    } catch (error) {
      setError(error.message || 'User gagal dihapus.');
    }
  };

  const submitMahar = async () => {
    try {
      const response = await createMahar(newMahar);
      setMahars((current) => [response.mahar, ...current]);
      setPaymentDrafts((current) => ({ ...current, [response.mahar.id]: { ...emptyPayment } }));
      setNewMahar(emptyMahar);
      await syncAfterMutation();
      setSuccess('Mahar baru berhasil dibuat.');
    } catch (error) {
      setError(error.message || 'Mahar gagal dibuat.');
    }
  };

  const saveMahar = async (item) => { try { const response = await updateMahar(item.id, item); setMahars((current) => current.map((currentItem) => (currentItem.id === item.id ? response.mahar : currentItem))); await syncAfterMutation(); setSuccess(`Mahar #${item.id} berhasil diperbarui.`); } catch (error) { setError(error.message || 'Mahar gagal diperbarui.'); } };
  const payMahar = async (id) => { try { const response = await addMaharPayment(id, paymentDrafts[id] || emptyPayment); setMahars((current) => current.map((item) => (item.id === id ? response.mahar : item))); setPaymentDrafts((current) => ({ ...current, [id]: { ...emptyPayment } })); await syncAfterMutation(); setSuccess(`Pembayaran mahar #${id} dicatat.`); } catch (error) { setError(error.message || 'Pembayaran gagal dicatat.'); } };
  const removeMahar = async (id) => { try { await deleteMahar(id); setMahars((current) => current.filter((item) => item.id !== id)); await syncAfterMutation(); setSuccess(`Mahar #${id} dihapus.`); } catch (error) { setError(error.message || 'Mahar gagal dihapus.'); } };
  const submitGuest = async () => { try { const response = await createGuest(newGuest); setGuests((current) => [response.guest, ...current]); setNewGuest(emptyGuest); await syncAfterMutation(); setSuccess('Tamu baru berhasil ditambahkan.'); } catch (error) { setError(error.message || 'Tamu gagal ditambahkan.'); } };
  const saveGuest = async (item) => { try { const response = await updateGuest(item.id, item); setGuests((current) => current.map((currentItem) => (currentItem.id === item.id ? response.guest : currentItem))); await syncAfterMutation(); setSuccess(`Tamu ${item.nama} berhasil diperbarui.`); } catch (error) { setError(error.message || 'Tamu gagal diperbarui.'); } };
  const removeGuest = async (id) => { try { await deleteGuest(id); setGuests((current) => current.filter((item) => item.id !== id)); await syncAfterMutation(); setSuccess(`Tamu #${id} dihapus.`); } catch (error) { setError(error.message || 'Tamu gagal dihapus.'); } };
  const submitInvitation = async () => { try { const response = await createInvitation(newInvitation); setInvitations((current) => [response.undangan, ...current]); setNewInvitation(emptyInvitation); await syncAfterMutation(); setSuccess('Undangan berhasil dibuat.'); } catch (error) { setError(error.message || 'Undangan gagal dibuat.'); } };
  const saveInvitation = async (item) => { try { const response = await updateInvitation(item.id, item); setInvitations((current) => current.map((currentItem) => (currentItem.id === item.id ? response.undangan : currentItem))); await syncAfterMutation(); setSuccess(`Undangan #${item.id} berhasil diperbarui.`); } catch (error) { setError(error.message || 'Undangan gagal diperbarui.'); } };
  const removeInvitation = async (id) => { try { await deleteInvitation(id); setInvitations((current) => current.filter((item) => item.id !== id)); await syncAfterMutation(); setSuccess(`Undangan #${id} dihapus.`); } catch (error) { setError(error.message || 'Undangan gagal dihapus.'); } };
  const saveMessageResponse = async (item) => { try { const response = await respondToMessage(item.id, item.response); setMessages((current) => current.map((currentItem) => (currentItem.id === item.id ? response.data : currentItem))); await syncAfterMutation(); setSuccess(`Balasan untuk ${item.email} berhasil dikirim.`); } catch (error) { setError(error.message || 'Balasan pesan gagal dikirim.'); } };
  const removeMessage = async (id) => { try { await deleteMessage(id); setMessages((current) => current.filter((item) => item.id !== id)); await syncAfterMutation(); setSuccess(`Pesan #${id} dihapus.`); } catch (error) { setError(error.message || 'Pesan gagal dihapus.'); } };
  const saveOrder = async (item) => { try { const response = await updateOrder(item.id, { status: item.status, priority: item.priority, adminNotes: item.adminNotes || '' }); setOrders((current) => current.map((currentItem) => (currentItem.id === item.id ? response.order : currentItem))); await syncAfterMutation(); setSuccess(`Order ${response.order.orderCode} berhasil diperbarui.`); } catch (error) { setError(error.message || 'Order gagal diperbarui.'); } };
  const removeOrder = async (id) => { try { await deleteOrder(id); setOrders((current) => current.filter((item) => item.id !== id)); await syncAfterMutation(); setSuccess(`Order #${id} dihapus.`); } catch (error) { setError(error.message || 'Order gagal dihapus.'); } };

  const handleMediaUpload = async (incomingFiles = null, folderOverride = '') => {
    const pendingFiles = Array.isArray(incomingFiles)
      ? incomingFiles.filter(Boolean)
      : incomingFiles
        ? Array.from(incomingFiles).filter(Boolean)
        : uploadDraft.file
          ? [uploadDraft.file]
          : [];
    const targetFolder = folderOverride || uploadDraft.folder;

    if (!pendingFiles.length) {
      setError('Pilih file media terlebih dahulu.');
      return [];
    }

    setUploadDraft((current) => ({ ...current, folder: targetFolder, file: pendingFiles[0], isUploading: true }));
    try {
      const uploadedAssets = [];

      for (const file of pendingFiles) {
        const response = await uploadMediaAsset(file, targetFolder);
        uploadedAssets.push(response.asset);
      }

      setMediaAssets((current) => [...uploadedAssets.reverse(), ...current]);
      setUploadDraft((current) => ({ ...current, file: null, isUploading: false }));
      await refreshMediaData();
      await syncAfterMutation();
      setSuccess(pendingFiles.length > 1 ? `${pendingFiles.length} media berhasil diunggah.` : 'Media berhasil diunggah.');
      return uploadedAssets;
    } catch (error) {
      setUploadDraft((current) => ({ ...current, isUploading: false }));
      setError(error.message || 'Media gagal diunggah.');
      return [];
    }
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setSuccess('Teks berhasil disalin.');
    } catch (error) {
      setError('Gagal menyalin teks.');
    }
  };

  const renderOverviewTab = () => (
    <div className="admin-overview-stack">
      <div className="admin-performance-layout">
        <div className="admin-card admin-card-highlight admin-performance-card">
          <div className="admin-card-head">
            <h3>Performa Website</h3>
          </div>

          <div className="admin-performance-grid">
            {performanceCards.map((card) => (
              <div key={card.id} className="admin-performance-tile">
                <span>{card.label}</span>
                <strong>{formatMetricValue(card.value)}</strong>
                <small>{card.hint}</small>
              </div>
            ))}
          </div>

          {hasPerformanceData ? (
            <>
              {trafficWindow.length ? (
                <div className="admin-traffic-bars">
                  {trafficWindow.map((entry) => (
                    <div key={entry.date} className="admin-traffic-bar">
                      <div className="admin-traffic-bar-track">
                        <span
                          className="admin-traffic-bar-fill"
                          style={{
                            height: `${Math.max(18, Math.round((Number(entry.pageViews || 0) / maxTrafficViews) * 100))}%`
                          }}
                        />
                      </div>
                      <strong>{formatMetricValue(entry.pageViews)}</strong>
                      <small>{new Date(`${entry.date}T00:00:00`).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="admin-traffic-empty">Histori 7 hari akan muncul setelah ada kunjungan publik.</div>
              )}

              <div className="admin-performance-meta">
                <div>
                  <strong>{formatRatio(leadRate)}</strong>
                  <span>Rasio lead</span>
                </div>
                <div>
                  <strong>{formatRatio(orderRate)}</strong>
                  <span>Rasio order</span>
                </div>
                <div>
                  <strong>{formatDecimal(pagesPerVisitor)}x</strong>
                  <span>Halaman per pengunjung</span>
                </div>
              </div>
            </>
          ) : (
            <div className="admin-empty">
              Statistik akan muncul setelah ada kunjungan publik, pesan masuk, atau checkout baru.
            </div>
          )}
        </div>

        <div className="admin-card admin-traffic-card">
          <div className="admin-card-head">
            <h3>Snapshot</h3>
          </div>
            <div className="admin-meta-list admin-meta-list-compact">
            <div><strong>Halaman teratas</strong><span>{topPage?.label || '-'}</span></div>
            <div><strong>Views teratas</strong><span>{formatMetricValue(topPage?.views || 0)}</span></div>
            <div><strong>Pesan belum dibalas</strong><span>{formatMetricValue(overview.unreadMessages ?? messages.filter((item) => item.status === 'unread').length)}</span></div>
            <div><strong>Order aktif</strong><span>{formatMetricValue(overview.openOrders ?? orders.filter((item) => !['completed', 'cancelled'].includes(item.status)).length)}</span></div>
            <div><strong>Admin</strong><span>{formatMetricValue(overview.admins ?? users.filter((item) => item.role === 'admin').length)}</span></div>
            <div><strong>Update</strong><span>{formatDateTimeLabel(analytics?.updatedAt, '-')}</span></div>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-card admin-card-highlight">
          <div className="admin-card-head">
            <h3>Aksi Cepat</h3>
          </div>
          <div className="admin-quick-grid">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="admin-quick-card"
                onClick={() => setActiveTab(action.id)}
              >
                <strong>{action.label}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Status Sistem</h3>
          </div>
          <div className="admin-meta-list admin-meta-list-compact">
            <div><strong>Brand</strong><span>{brandName}</span></div>
            <div><strong>Total Produk</strong><span>{formatMetricValue(productCount)}</span></div>
            <div><strong>Order Aktif</strong><span>{formatMetricValue(overview.openOrders ?? orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length)}</span></div>
            <div><strong>Pesan</strong><span>{formatMetricValue(overview.messages ?? messages.length)}</span></div>
            <div><strong>Audit</strong><span>{formatMetricValue(overview.auditLogs ?? auditLogs.length)}</span></div>
            <div><strong>Admin Aktif</strong><span>{displayName}</span></div>
          </div>
        </div>
      </div>

      {Object.keys(overview).length ? (
        <div className="admin-card">
          <div className="admin-card-head">
            <h3>Data Sistem</h3>
          </div>
          <div className="admin-overview-grid admin-overview-grid-dense">
            {Object.entries(overview).map(([key, value]) => (
              <div key={key} className="admin-metric-card admin-metric-card-compact">
                <span>{formatMetricLabel(key)}</span>
                <strong>{formatMetricValue(value)}</strong>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );

  const renderCompactTopbar = () => (
    <div className="admin-topbar admin-topbar-compact">
      <div className="admin-page-header">
        <div className="admin-page-copy">
          <p className="admin-page-label">{activeTabConfig.label}</p>
          <h1>{activeTabConfig.title}</h1>
          <p>{activeTabConfig.description}</p>
        </div>
        <div className="admin-page-meta-grid">
          <div className="admin-page-meta-card admin-page-meta-card-profile">
            <span>Admin</span>
            <strong>{displayName}</strong>
            <small>{user.email}</small>
          </div>
          {compactHeaderStats.map((item) => (
            <div key={item.id} className="admin-page-meta-card">
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <div className="admin-empty">Memuat data panel admin...</div>;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'content':
        return <ContentStudio value={contentForm} onChange={setContentForm} onSave={saveContent} isSaving={isSaving} mediaAssets={mediaAssets} onUploadImages={handleMediaUpload} uploadDraft={uploadDraft} />;
      case 'products':
        return (
          <AdminProductsTab
            products={currentProducts}
            setProducts={setProductsCatalog}
            onSave={saveContent}
            isSaving={isSaving}
            mediaAssets={mediaAssets}
            onUploadImages={handleMediaUpload}
            uploadDraft={uploadDraft}
          />
        );
      case 'users':
        return <AdminUsersTab users={users} filters={filters.users} setFilter={(field, value) => setTabFilter('users', field, value)} currentUserEmail={user.email} updateListItem={(id, field, value) => updateListItem(setUsers, id, field, value)} saveUser={saveUser} removeUser={removeUser} />;
      case 'mahars':
        return <AdminMaharsTab mahars={mahars} filters={filters.mahars} setFilter={(field, value) => setTabFilter('mahars', field, value)} newMahar={newMahar} setNewMahar={setNewMahar} paymentDrafts={paymentDrafts} setPaymentDrafts={setPaymentDrafts} updateListItem={(id, field, value) => updateListItem(setMahars, id, field, value)} submitMahar={submitMahar} saveMahar={saveMahar} payMahar={payMahar} removeMahar={removeMahar} />;
      case 'guests':
        return <AdminGuestsTab guests={guests} filters={filters.guests} setFilter={(field, value) => setTabFilter('guests', field, value)} newGuest={newGuest} setNewGuest={setNewGuest} updateListItem={(id, field, value) => updateListItem(setGuests, id, field, value)} submitGuest={submitGuest} saveGuest={saveGuest} removeGuest={removeGuest} />;
      case 'invitations':
        return <AdminInvitationsTab invitations={invitations} filters={filters.invitations} setFilter={(field, value) => setTabFilter('invitations', field, value)} newInvitation={newInvitation} setNewInvitation={setNewInvitation} updateListItem={(id, field, value) => updateListItem(setInvitations, id, field, value)} submitInvitation={submitInvitation} saveInvitation={saveInvitation} removeInvitation={removeInvitation} copyText={copyText} />;
      case 'messages':
        return <AdminMessagesTab messages={messages} filters={filters.messages} setFilter={(field, value) => setTabFilter('messages', field, value)} updateListItem={(id, field, value) => updateListItem(setMessages, id, field, value)} saveMessageResponse={saveMessageResponse} removeMessage={removeMessage} />;
      case 'orders':
        return <AdminOrdersTab orders={orders} filters={filters.orders} setFilter={(field, value) => setTabFilter('orders', field, value)} updateListItem={(id, field, value) => updateListItem(setOrders, id, field, value)} saveOrder={saveOrder} removeOrder={removeOrder} />;
      case 'audit':
        return <AdminAuditTab auditLogs={auditLogs} filters={filters.audit} setFilter={(field, value) => setTabFilter('audit', field, value)} />;
      default:
        return renderOverviewTab();
    }
  };

  const renderAccessGate = () => (
    <section className={`admin-panel ${standalone ? 'admin-panel-standalone' : ''}`} id={standalone ? undefined : 'admin-panel'}>
      <div className={standalone ? 'admin-page-shell' : 'container'}>
        <div className="admin-access-card">
          <span className="admin-access-badge">Admin Workspace</span>
          <h1>{isAuthChecking ? 'Memeriksa akses admin...' : 'Akses panel admin dibatasi'}</h1>
          <p>
            {isAuthChecking
              ? 'Sistem sedang memverifikasi sesi Anda sebelum membuka dashboard admin.'
              : user
                ? 'Akun ini berhasil login, tetapi belum memiliki role admin. Silakan ganti akun admin atau kembali ke website publik.'
                : 'Silakan login menggunakan akun admin untuk membuka workspace manajemen Sakura Mahar.'}
          </p>
          <div className="admin-access-actions">
            {!isAuthChecking && !user ? <button type="button" className="btn-primary" onClick={onLoginClick}>Masuk Admin</button> : null}
            {!isAuthChecking && !user ? <button type="button" className="btn-secondary" onClick={onSignupClick}>Daftar</button> : null}
            {!isAuthChecking && user ? (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  onLogout?.();
                  onLoginClick?.();
                }}
              >
                Ganti Akun
              </button>
            ) : null}
            <button type="button" className="btn-login" onClick={onBackHome}>Kembali ke Homepage</button>
          </div>
        </div>
      </div>
    </section>
  );

  if (!isAdmin) {
    return standalone ? renderAccessGate() : null;
  }

  return (
    <section className={`admin-panel ${standalone ? 'admin-panel-standalone' : ''}`} id={standalone ? undefined : 'admin-panel'}>
      <div className={standalone ? 'admin-page-shell' : 'container'}>
        <div className="admin-workspace">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-brand">
              <div className="admin-sidebar-mark" aria-hidden="true">
                {String(brandName).trim().charAt(0).toUpperCase() || 'S'}
              </div>
              <div>
                <strong>{brandName}</strong>
              </div>
            </div>

            <div className="admin-sidebar-user">
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </div>

            <div className="admin-sidebar-nav">
              {tabs.map((tab) => {
                const badgeValue =
                  tab.id === 'users' ? users.length :
                    tab.id === 'products' ? productCount :
                    tab.id === 'mahars' ? mahars.length :
                      tab.id === 'guests' ? guests.length :
                        tab.id === 'invitations' ? invitations.length :
                          tab.id === 'messages' ? (overview.messages ?? messages.length) :
                            tab.id === 'orders' ? (overview.openOrders ?? orders.length) :
                              tab.id === 'audit' ? auditLogs.length : null;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => setActiveTab(tab.id)}
                    >
                      <span className="admin-nav-icon"><i className={`fas ${tab.icon}`}></i></span>
                      <span className="admin-nav-copy">
                        <strong>{tab.label}</strong>
                      </span>
                      {badgeValue !== null ? <span className="admin-nav-badge">{formatMetricValue(badgeValue)}</span> : null}
                    </button>
                );
              })}
            </div>

            <div className="admin-sidebar-footer">
              <button type="button" className="btn-secondary admin-sidebar-action" onClick={onBackHome}>Homepage</button>
              <button type="button" className="btn-login admin-sidebar-action" onClick={onChangePasswordClick}>Password</button>
              <button type="button" className="btn-logout admin-sidebar-action" onClick={onLogout}>Keluar</button>
            </div>
          </aside>

          <div className="admin-main">
            {isOverviewTab ? (
              <div className="admin-topbar">
                <div className="admin-hero-grid">
                  <div className="admin-header">
                    <p className="admin-page-label">Overview</p>
                    <h1>{activeTabConfig.title}</h1>
                    <p>{activeTabConfig.description}</p>
                  </div>
                  <div className="admin-header-side">
                    <div className="admin-profile-card">
                      <strong>{displayName}</strong>
                      <small>{user.email}</small>
                    </div>
                    <div className="admin-profile-card admin-profile-card-compact">
                      <strong>{formatMetricValue(websiteVisitors)}</strong>
                      <small>Pengunjung</small>
                    </div>
                  </div>
                </div>

                <div className="admin-topbar-stats">
                  {summaryCards.map((card) => (
                    <div key={card.id} className={`admin-topbar-stat tone-${card.tone}`}>
                      <div className="admin-topbar-stat-icon">
                        <i className={`fas ${card.icon}`}></i>
                      </div>
                      <div className="admin-topbar-stat-copy">
                        <span>{card.label}</span>
                        <strong>{formatMetricValue(card.value)}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : renderCompactTopbar()}

            {status.message ? <div className={`admin-status ${status.type}`}>{status.message}</div> : null}

            <div className="admin-content-shell">
              {renderActiveTabContent()}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AdminPanel;
