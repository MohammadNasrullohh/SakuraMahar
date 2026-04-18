import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, formatDateTime, stringifyForSearch } from './adminUtils';

const AdminMessagesTab = ({ messages, filters, setFilter, updateListItem, saveMessageResponse, removeMessage }) => {
  const [selectedId, setSelectedId] = useState(null);

  const filteredMessages = useMemo(
    () =>
      messages.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [filters.search, filters.status, messages]
  );

  useEffect(() => {
    if (!filteredMessages.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredMessages.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredMessages[0].id);
    }
  }, [filteredMessages, selectedId]);

  const selectedMessage = filteredMessages.find((item) => String(item.id) === String(selectedId)) || null;

  const columns = [
    {
      key: 'sender',
      label: 'Pengirim',
      width: '28%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.nama || '-'}</strong>
          <span>{item.email || '-'}</span>
        </div>
      )
    },
    {
      key: 'subject',
      label: 'Subjek',
      width: '28%',
      render: (item) => (
        <span className="admin-sheet-muted" title={item.subjek || '-'}>
          {item.subjek || '-'}
        </span>
      )
    },
    {
      key: 'message',
      label: 'Preview',
      width: '28%',
      render: (item) => (
        <span className="admin-sheet-muted" title={item.pesan || '-'}>
          {item.pesan || '-'}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '16%',
      render: (item) => <span className={`admin-tag ${item.status}`}>{item.status}</span>
    }
  ];

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari pesan..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="unread">unread</option>
          <option value="read">read</option>
          <option value="responded">responded</option>
        </select>
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('messages.csv', filteredMessages.map((item) => ({ id: item.id, nama: item.nama, email: item.email, subjek: item.subjek, status: item.status })))}>Export CSV</button>
      </div>

      <div className="admin-sheet-layout">
        <section className="admin-sheet-card">
          <div className="admin-sheet-titlebar">
            <div>
              <h3>Inbox Pesan</h3>
              <p>{filteredMessages.length} pesan tampil dalam tabel untuk dibaca dan diproses cepat.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredMessages}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="Belum ada pesan yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {selectedMessage ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedMessage.nama || '-'}</h3>
                  <p>{selectedMessage.email || '-'} · {formatDateTime(selectedMessage.createdAt)}</p>
                </div>
                <span className={`admin-tag ${selectedMessage.status}`}>{selectedMessage.status}</span>
              </div>

              <div className="admin-sheet-section">
                <h4>Subjek</h4>
                <p className="admin-message-body">{selectedMessage.subjek || '-'}</p>
              </div>

              <div className="admin-sheet-section">
                <h4>Pesan Masuk</h4>
                <p className="admin-message-body">{selectedMessage.pesan || '-'}</p>
              </div>

              <div className="admin-detail-grid">
                <label className="admin-field admin-field-full">
                  <span>Balasan</span>
                  <textarea value={selectedMessage.response || ''} onChange={(event) => updateListItem(selectedMessage.id, 'response', event.target.value)} />
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveMessageResponse(selectedMessage)}>Kirim Balasan</button>
                <button type="button" className="btn-secondary" onClick={() => removeMessage(selectedMessage.id)}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih pesan dari tabel untuk membaca isi lengkap dan membalasnya.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminMessagesTab;
