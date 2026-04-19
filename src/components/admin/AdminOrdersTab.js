import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, formatDateTime, stringifyForSearch } from './adminUtils';

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

const AdminOrdersTab = ({ orders, filters, setFilter, updateListItem, saveOrder, removeOrder }) => {
  const [selectedId, setSelectedId] = useState(null);

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

      <div className="admin-sheet-layout">
        <section className="admin-sheet-card">
          <div className="admin-sheet-titlebar">
            <div>
              <h3>Daftar Order</h3>
              <p>{filteredOrders.length} order siap diproses.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredOrders}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="Belum ada order yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {selectedOrder ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedOrder.orderCode || `Order #${selectedOrder.id}`}</h3>
                  <p>{[selectedOrder.productName || selectedOrder.packageName, selectedOrder.productCategory, selectedOrder.productPrice || selectedOrder.packagePrice].filter(Boolean).join(' · ')}</p>
                </div>
                <div className="admin-actions">
                  <span className={`admin-tag ${selectedOrder.status}`}>{selectedOrder.status}</span>
                  <span className="admin-tag">{selectedOrder.priority || 'normal'}</span>
                </div>
              </div>

              <div className="admin-meta-list admin-meta-list-compact">
                <div><strong>Customer</strong><span>{selectedOrder.customerName || '-'}</span></div>
                <div><strong>Email</strong><span>{selectedOrder.customerEmail || '-'}</span></div>
                <div><strong>Telepon</strong><span>{selectedOrder.customerPhone || '-'}</span></div>
                <div><strong>Produk</strong><span>{selectedOrder.productName || selectedOrder.packageName || '-'}</span></div>
                <div><strong>Dibuat</strong><span>{formatDateTime(selectedOrder.createdAt)}</span></div>
                <div><strong>Diupdate</strong><span>{formatDateTime(selectedOrder.updatedAt)}</span></div>
              </div>

              {selectedOrder.customerNotes ? (
                <div className="admin-sheet-section">
                  <h4>Catatan Customer</h4>
                  <p className="admin-message-body">{selectedOrder.customerNotes}</p>
                </div>
              ) : null}

              {Array.isArray(selectedOrder.fieldSnapshot) && selectedOrder.fieldSnapshot.length ? (
                <div className="admin-sheet-section">
                  <h4>Field Checkout</h4>
                  <div className="admin-order-field-list">
                    {selectedOrder.fieldSnapshot.map((field) => (
                      <div key={`${selectedOrder.id}-${field.key}`} className="admin-order-field-item">
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
                  <select value={selectedOrder.status || 'new'} onChange={(event) => updateListItem(selectedOrder.id, 'status', event.target.value)}>
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
                  <select value={selectedOrder.priority || 'normal'} onChange={(event) => updateListItem(selectedOrder.id, 'priority', event.target.value)}>
                    <option value="low">low</option>
                    <option value="normal">normal</option>
                    <option value="high">high</option>
                    <option value="urgent">urgent</option>
                  </select>
                </label>
                <label className="admin-field admin-field-full">
                  <span>Catatan Admin</span>
                  <textarea value={selectedOrder.adminNotes || ''} onChange={(event) => updateListItem(selectedOrder.id, 'adminNotes', event.target.value)} />
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveOrder(selectedOrder)}>Simpan Order</button>
                <button type="button" className="btn-secondary" onClick={() => removeOrder(selectedOrder.id)}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih order dari tabel untuk melihat detail dan follow-up.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminOrdersTab;
