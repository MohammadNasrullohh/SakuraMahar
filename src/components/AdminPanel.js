import React, { useEffect, useMemo, useState } from 'react';
import './AdminPanel.css';
import ContentStudio, { normalizeContentValue } from './ContentStudio';
import AdminUsersTab from './admin/AdminUsersTab';
import AdminMaharsTab from './admin/AdminMaharsTab';
import AdminGuestsTab from './admin/AdminGuestsTab';
import AdminInvitationsTab from './admin/AdminInvitationsTab';
import AdminMessagesTab from './admin/AdminMessagesTab';
import AdminMediaTab from './admin/AdminMediaTab';
import AdminAuditTab from './admin/AdminAuditTab';
import AdminOrdersTab from './admin/AdminOrdersTab';
import {
  addMaharPayment,
  createGuest,
  createInvitation,
  createMahar,
  deleteMediaAsset,
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
  updateMediaAsset,
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
    navHint: 'Ikhtisar sistem',
    icon: 'fa-chart-pie',
    title: 'Ringkasan Operasional',
    description: 'Pantau performa bisnis, aktivitas pelanggan, dan status tim dalam satu dashboard admin.'
  },
  {
    id: 'content',
    label: 'Storefront',
    navHint: 'Konten publik',
    icon: 'fa-pencil-ruler',
    title: 'Storefront & Katalog',
    description: 'Kelola branding, homepage, katalog produk, dan flow checkout dari workspace visual yang terpusat.'
  },
  {
    id: 'users',
    label: 'Users',
    navHint: 'Akun & role',
    icon: 'fa-users',
    title: 'Manajemen Pengguna',
    description: 'Atur role user, status akun, dan akses admin tanpa tercampur dengan tampilan homepage.'
  },
  {
    id: 'messages',
    label: 'Pesan',
    navHint: 'Inbox lead',
    icon: 'fa-comments',
    title: 'Inbox Pesan',
    description: 'Pantau pesan masuk, balas cepat, dan kelola lead dari halaman kontak publik.'
  },
  {
    id: 'orders',
    label: 'Orders',
    navHint: 'Checkout masuk',
    icon: 'fa-shopping-cart',
    title: 'Orders Management',
    description: 'Lihat order produk masuk, prioritas, status follow-up, dan catatan admin dengan struktur yang jelas.'
  },
  {
    id: 'media',
    label: 'Media',
    navHint: 'Aset visual',
    icon: 'fa-images',
    title: 'Media Library',
    description: 'Upload, edit, dan gunakan aset visual untuk logo, favicon, banner toko, serta foto produk.'
  },
  {
    id: 'audit',
    label: 'Audit Log',
    navHint: 'Jejak perubahan',
    icon: 'fa-shield-alt',
    title: 'Audit & Aktivitas',
    description: 'Telusuri jejak perubahan penting supaya kontrol admin lebih aman dan transparan.'
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
  const displayName = user?.nama || user?.email || 'Admin';
  const brandName = branding?.brandName || 'Sakura Mahar';
  const summaryCards = [
    {
      id: 'orders',
      icon: 'fa-bag-shopping',
      tone: 'pink',
      label: 'Order Masuk',
      value: overview.orders ?? orders.length,
      detail: 'Checkout produk yang sudah tercatat.'
    },
    {
      id: 'openOrders',
      icon: 'fa-bolt',
      tone: 'amber',
      label: 'Perlu Follow Up',
      value: overview.openOrders ?? orders.filter((item) => item.status !== 'completed').length,
      detail: 'Order yang masih aktif ditindaklanjuti.'
    },
    {
      id: 'messages',
      icon: 'fa-inbox',
      tone: 'blue',
      label: 'Pesan Masuk',
      value: overview.messages ?? messages.length,
      detail: 'Inbox publik dari form kontak website.'
    },
    {
      id: 'media',
      icon: 'fa-image',
      tone: 'purple',
      label: 'Aset Media',
      value: overview.mediaAssets ?? mediaAssets.length,
      detail: 'File visual siap pakai untuk branding.'
    }
  ];
  const quickActions = [
    { id: 'content', label: 'Edit Storefront', hint: 'Branding, hero, katalog produk, dan checkout' },
    { id: 'orders', label: 'Cek Orders', hint: 'Lanjutkan follow-up order terbaru' },
    { id: 'messages', label: 'Balas Lead', hint: 'Buka inbox dan respon pesan masuk' },
    { id: 'media', label: 'Kelola Media', hint: 'Upload logo, banner, dan foto produk' }
  ];

  useEffect(() => {
    setContentForm(clone(normalizeContentValue(siteContent)));
  }, [siteContent]);

  const setSuccess = (message) => setStatus({ type: 'success', message });
  const setError = (message) => setStatus({ type: 'error', message });
  const setTabFilter = (tab, field, value) => setFilters((current) => ({ ...current, [tab]: { ...current[tab], [field]: value } }));

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
      { key: 'media', label: 'media', request: fetchMediaAssets, fallback: { assets: [] } }
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

  const handleMediaUpload = async () => {
    if (!uploadDraft.file) {
      setError('Pilih file media terlebih dahulu.');
      return;
    }

    setUploadDraft((current) => ({ ...current, isUploading: true }));
    try {
      const response = await uploadMediaAsset(uploadDraft.file, uploadDraft.folder);
      setMediaAssets((current) => [response.asset, ...current]);
      setUploadDraft((current) => ({ ...current, file: null, isUploading: false }));
      await refreshMediaData();
      await syncAfterMutation();
      setSuccess('Media berhasil diunggah.');
    } catch (error) {
      setUploadDraft((current) => ({ ...current, isUploading: false }));
      setError(error.message || 'Media gagal diunggah.');
    }
  };

  const saveMediaAsset = async (asset) => {
    try {
      const response = await updateMediaAsset(asset.id, {
        displayName: asset.displayName || '',
        altText: asset.altText || ''
      });
      setMediaAssets((current) => current.map((item) => (item.id === asset.id ? response.asset : item)));
      await syncAfterMutation();
      setSuccess('Metadata media berhasil diperbarui.');
    } catch (error) {
      setError(error.message || 'Media gagal diperbarui.');
    }
  };

  const removeMediaAsset = async (id) => {
    try {
      await deleteMediaAsset(id);
      setMediaAssets((current) => current.filter((item) => item.id !== id));
      await syncAfterMutation();
      setSuccess(`Media #${id} berhasil dihapus.`);
    } catch (error) {
      setError(error.message || 'Media gagal dihapus.');
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
      <div className="admin-overview-grid">
        {summaryCards.map((card) => (
          <div key={card.id} className="admin-metric-card">
            <span>{card.label}</span>
            <strong>{formatMetricValue(card.value)}</strong>
            <p>{card.detail}</p>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-grid">
        <div className="admin-card admin-card-highlight">
          <div className="admin-card-head">
            <div>
              <h3>Pusat Kendali Cepat</h3>
              <p className="admin-card-subtitle">Shortcut ke area kerja yang paling sering dipakai admin.</p>
            </div>
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
                <span>{action.hint}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Kesehatan Workspace</h3>
              <p className="admin-card-subtitle">Snapshot singkat agar admin cepat tahu kondisi toko dan operasional.</p>
            </div>
          </div>
          <div className="admin-meta-list admin-meta-list-compact">
            <div><strong>Brand Aktif</strong><span>{brandName}</span></div>
            <div><strong>Total Produk</strong><span>{formatMetricValue(siteContent?.products?.length ?? contentForm?.products?.length ?? 0)}</span></div>
            <div><strong>Order Aktif</strong><span>{formatMetricValue(overview.openOrders ?? orders.filter((order) => !['completed', 'cancelled'].includes(order.status)).length)}</span></div>
            <div><strong>Total Pesan</strong><span>{formatMetricValue(overview.messages ?? messages.length)}</span></div>
            <div><strong>Audit Log</strong><span>{formatMetricValue(overview.auditLogs ?? auditLogs.length)}</span></div>
            <div><strong>Admin Aktif</strong><span>{displayName}</span></div>
          </div>
        </div>
      </div>

      {Object.keys(overview).length ? (
        <div className="admin-card">
          <div className="admin-card-head">
            <div>
              <h3>Semua Metrik</h3>
              <p className="admin-card-subtitle">Detail angka dari backend untuk pemeriksaan cepat.</p>
            </div>
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

  const renderActiveTabContent = () => {
    if (isLoading) {
      return <div className="admin-empty">Memuat data panel admin...</div>;
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'content':
        return <ContentStudio value={contentForm} onChange={setContentForm} onSave={saveContent} isSaving={isSaving} mediaAssets={mediaAssets} />;
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
      case 'media':
        return <AdminMediaTab mediaAssets={mediaAssets} filters={filters.media} setFilter={(field, value) => setTabFilter('media', field, value)} uploadDraft={uploadDraft} setUploadDraft={setUploadDraft} handleMediaUpload={handleMediaUpload} copyText={copyText} updateListItem={(id, field, value) => updateListItem(setMediaAssets, id, field, value)} saveMediaAsset={saveMediaAsset} removeMediaAsset={removeMediaAsset} />;
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
                <span>Admin workspace</span>
              </div>
            </div>

            <div className="admin-sidebar-user">
              <span className="admin-sidebar-user-label">Akun aktif</span>
              <strong>{displayName}</strong>
              <small>{user.email}</small>
            </div>

            <div className="admin-sidebar-section-label">Navigasi</div>
            <div className="admin-sidebar-nav">
              {tabs.map((tab) => {
                const badgeValue =
                  tab.id === 'users' ? users.length :
                    tab.id === 'mahars' ? mahars.length :
                      tab.id === 'guests' ? guests.length :
                        tab.id === 'invitations' ? invitations.length :
                          tab.id === 'messages' ? (overview.messages ?? messages.length) :
                            tab.id === 'orders' ? (overview.openOrders ?? orders.length) :
                              tab.id === 'media' ? mediaAssets.length :
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
                      <small>{tab.navHint || tab.description}</small>
                    </span>
                    {badgeValue !== null ? <span className="admin-nav-badge">{formatMetricValue(badgeValue)}</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="admin-sidebar-footer">
              <button type="button" className="btn-secondary admin-sidebar-action" onClick={onBackHome}>Lihat Homepage</button>
              <button type="button" className="btn-login admin-sidebar-action" onClick={onChangePasswordClick}>Ubah Password</button>
              <button type="button" className="btn-logout admin-sidebar-action" onClick={onLogout}>Keluar</button>
            </div>
          </aside>

          <div className="admin-main">
            <div className="admin-topbar">
              <div className="admin-hero-grid">
                <div className="admin-header">
                  <div>
                    <p className="admin-eyebrow">Admin Dashboard</p>
                    <h1>{activeTabConfig.title}</h1>
                    <p>{activeTabConfig.description}</p>
                  </div>
                  <div className="admin-active-tab-chip">
                    <i className={`fas ${activeTabConfig.icon}`}></i>
                    <span>{activeTabConfig.label}</span>
                  </div>
                </div>
                <div className="admin-header-side">
                  <div className="admin-profile-card">
                    <span className="admin-profile-label">Admin Aktif</span>
                    <strong>{displayName}</strong>
                    <small>{user.email}</small>
                  </div>
                  <div className="admin-header-note">
                    Workspace dibuat lebih ringkas supaya navigasi cepat, konten utama lega, dan panel menyesuaikan di berbagai ukuran layar.
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
                      <small>{card.detail}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
