import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import AdminOverlayForm from './AdminOverlayForm';
import { exportRowsToCsv, formatDateTime, stringifyForSearch } from './adminUtils';

const cloneItem = (item) => JSON.parse(JSON.stringify(item || null));

const getOrderFieldValue = (order, keys = []) => {
  const safeKeys = Array.isArray(keys) ? keys.map((key) => String(key || '').trim()) : [];
  const directFormValue = safeKeys
    .map((key) => String(order?.formData?.[key] || '').trim())
    .find(Boolean);

  if (directFormValue) {
    return directFormValue;
  }

  const snapshot = Array.isArray(order?.fieldSnapshot) ? order.fieldSnapshot : [];
  return snapshot.find((field) => safeKeys.includes(String(field?.key || '').trim()))?.value || '';
};

const buildGoogleMapsSearchUrl = (query = '') => {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery) {
    return '';
  }

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trimmedQuery)}`;
};

const AdminOrdersTab = ({ orders, filters, setFilter, saveOrder, removeOrder }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftOrder, setDraftOrder] = useState(null);

  const filteredOrders = useMemo(
    () =>
      orders.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        const matchesPriority = filters.priority === 'all' || item.priority === filters.priority;
        return matchesSearch && matchesStatus && matchesPriority;
      }),
    [filters.priority, filters.search, filters.status, orders]
  );

  useEffect(() => {
    if (!filteredOrders.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredOrders.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredOrders[0].id);
    }
  }, [filteredOrders, selectedId]);

  const selectedOrder = filteredOrders.find((item) => String(item.id) === String(selectedId)) || null;

  const openEditor = (targetOrder) => {
    if (!targetOrder) {
      return;
    }

    setSelectedId(targetOrder.id);
    setDraftOrder(cloneItem(targetOrder));
    setIsEditorOpen(true);
  };

  const columns = [
    {
      key: 'orderCode',
      label: 'Order',
      width: '22%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.orderCode || `Order #${item.id}`}</strong>
          <span>{formatDateTime(item.createdAt)}</span>
        </div>
      )
    },
    {
      key: 'customer',
      label: 'Customer',
      width: '22%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.customerName || '-'}</strong>
          <span>{item.customerEmail || '-'}</span>
        </div>
      )
    },
    {
      key: 'product',
      label: 'Produk',
      width: '20%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.productName || item.packageName || '-'}</strong>
          <span>{[item.productCategory, item.productPrice || item.packagePrice].filter(Boolean).join(' • ') || '-'}</span>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Prioritas',
      width: '16%',
      render: (item) => <span className="admin-tag">{item.priority || 'normal'}</span>
    },
    {
      key: 'status',
      label: 'Status',
      width: '20%',
      render: (item) => <span className={`admin-tag ${item.status}`}>{item.status}</span>
    }
  ];

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari order..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="new">new</option>
          <option value="reviewing">reviewing</option>
          <option value="contacted">contacted</option>
          <option value="confirmed">confirmed</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <select value={filters.priority} onChange={(event) => setFilter('priority', event.target.value)}>
          <option value="all">Semua Prioritas</option>
          <option value="low">low</option>
          <option value="normal">normal</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            exportRowsToCsv(
              'orders.csv',
              filteredOrders.map((item) => ({
                id: item.id,
                orderCode: item.orderCode,
                productName: item.productName || item.packageName,
                productCategory: item.productCategory,
                customerName: item.customerName,
                customerEmail: item.customerEmail,
                customerPhone: item.customerPhone,
                deliveryAddress: getOrderFieldValue(item, ['deliveryAddress', 'address', 'alamat']),
                mapsLink: getOrderFieldValue(item, ['mapsLink', 'googleMapsLink', 'googleMapsUrl', 'locationLink']),
                status: item.status,
                priority: item.priority,
                createdAt: item.createdAt
              }))
            )
          }
        >
          Unduh CSV
        </button>
      </div>

      <section className="admin-sheet-card">
        <div className="admin-sheet-titlebar">
          <div>
            <h3>Daftar Order</h3>
            <p>{filteredOrders.length} order siap diproses. Klik order untuk membuka form tindak lanjut di atas halaman ini.</p>
          </div>
          {selectedOrder ? (
            <button type="button" className="btn-primary" onClick={() => openEditor(selectedOrder)}>
              Tindak Lanjut
            </button>
          ) : null}
        </div>
        <AdminSheetTable
          columns={columns}
          rows={filteredOrders}
          selectedId={selectedId}
          onSelect={(id) => {
            const nextOrder = filteredOrders.find((item) => String(item.id) === String(id));
            setSelectedId(id);
            openEditor(nextOrder);
          }}
          emptyMessage="Belum ada order yang cocok dengan filter."
        />
      </section>

      <AdminOverlayForm
        isOpen={isEditorOpen && Boolean(draftOrder)}
        tag="Orders"
        title={draftOrder?.orderCode || `Order #${draftOrder?.id || ''}`}
        description={draftOrder ? [draftOrder.productName || draftOrder.packageName, draftOrder.productCategory, draftOrder.productPrice || draftOrder.packagePrice].filter(Boolean).join(' · ') : ''}
        onClose={() => setIsEditorOpen(false)}
        actions={
          draftOrder ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setIsEditorOpen(false)}>
                Tutup
              </button>
              <button type="button" className="btn-secondary" onClick={() => { removeOrder(draftOrder.id); setIsEditorOpen(false); }}>
                Hapus
              </button>
              <button type="button" className="btn-primary" onClick={() => { saveOrder(draftOrder); setIsEditorOpen(false); }}>
                Simpan Order
              </button>
            </>
          ) : null
        }
      >
        {draftOrder ? (
          <div className="admin-overlay-stack">
            <div className="admin-meta-list admin-meta-list-compact">
              <div><strong>Customer</strong><span>{draftOrder.customerName || '-'}</span></div>
              <div><strong>Email</strong><span>{draftOrder.customerEmail || '-'}</span></div>
              <div><strong>Telepon</strong><span>{draftOrder.customerPhone || '-'}</span></div>
              <div><strong>Produk</strong><span>{draftOrder.productName || draftOrder.packageName || '-'}</span></div>
              <div><strong>Dibuat</strong><span>{formatDateTime(draftOrder.createdAt)}</span></div>
              <div><strong>Diupdate</strong><span>{formatDateTime(draftOrder.updatedAt)}</span></div>
            </div>

            {draftOrder.customerNotes ? (
              <div className="admin-sheet-section">
                <h4>Catatan Customer</h4>
                <p className="admin-message-body">{draftOrder.customerNotes}</p>
              </div>
            ) : null}

            {Array.isArray(draftOrder.fieldSnapshot) && draftOrder.fieldSnapshot.length ? (
              <div className="admin-sheet-section">
                <h4>Field Checkout</h4>
                <div className="admin-order-field-list">
                  {draftOrder.fieldSnapshot.map((field) => (
                    <div key={`${draftOrder.id}-${field.key}`} className="admin-order-field-item">
                      <strong>{field.label}</strong>
                      {/maps/i.test(String(field.key || '')) && field.value ? (
                        <a href={/^https?:\/\//i.test(field.value) ? field.value : buildGoogleMapsSearchUrl(field.value)} target="_blank" rel="noreferrer">
                          Buka Google Maps
                        </a>
                      ) : /address|alamat/i.test(String(field.key || '')) && field.value ? (
                        <a href={buildGoogleMapsSearchUrl(field.value)} target="_blank" rel="noreferrer">
                          {field.value}
                        </a>
                      ) : (
                        <span>{field.value || '-'}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="admin-detail-grid">
              <label className="admin-field">
                <span>Status</span>
                <select value={draftOrder.status || 'new'} onChange={(event) => setDraftOrder((current) => ({ ...current, status: event.target.value }))}>
                  <option value="new">new</option>
                  <option value="reviewing">reviewing</option>
                  <option value="contacted">contacted</option>
                  <option value="confirmed">confirmed</option>
                  <option value="completed">completed</option>
                  <option value="cancelled">cancelled</option>
                </select>
              </label>
              <label className="admin-field">
                <span>Prioritas</span>
                <select value={draftOrder.priority || 'normal'} onChange={(event) => setDraftOrder((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="low">low</option>
                  <option value="normal">normal</option>
                  <option value="high">high</option>
                  <option value="urgent">urgent</option>
                </select>
              </label>
              <label className="admin-field admin-field-full">
                <span>Catatan Admin</span>
                <textarea value={draftOrder.adminNotes || ''} onChange={(event) => setDraftOrder((current) => ({ ...current, adminNotes: event.target.value }))} />
              </label>
            </div>
          </div>
        ) : null}
      </AdminOverlayForm>
    </>
  );
};

export default AdminOrdersTab;
