import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import AdminOverlayForm from './AdminOverlayForm';
import { exportRowsToCsv, formatDateTime, stringifyForSearch } from './adminUtils';

const cloneItem = (item) => JSON.parse(JSON.stringify(item || null));

const AdminMessagesTab = ({ messages, filters, setFilter, saveMessageResponse, removeMessage }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [draftMessage, setDraftMessage] = useState(null);

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

  const openReplyForm = (targetMessage) => {
    if (!targetMessage) {
      return;
    }

    setSelectedId(targetMessage.id);
    setDraftMessage(cloneItem(targetMessage));
    setIsReplyOpen(true);
  };

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
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('messages.csv', filteredMessages.map((item) => ({ id: item.id, nama: item.nama, email: item.email, subjek: item.subjek, status: item.status })))}>Unduh CSV</button>
      </div>

      <section className="admin-sheet-card">
        <div className="admin-sheet-titlebar">
          <div>
            <h3>Inbox Pesan</h3>
            <p>{filteredMessages.length} pesan siap dibaca. Klik pesan untuk membuka balasan di atas halaman ini.</p>
          </div>
          {selectedMessage ? (
            <button type="button" className="btn-primary" onClick={() => openReplyForm(selectedMessage)}>
              Balas Pesan
            </button>
          ) : null}
        </div>
        <AdminSheetTable
          columns={columns}
          rows={filteredMessages}
          selectedId={selectedId}
          onSelect={(id) => {
            const nextMessage = filteredMessages.find((item) => String(item.id) === String(id));
            setSelectedId(id);
            openReplyForm(nextMessage);
          }}
          emptyMessage="Belum ada pesan yang cocok dengan filter."
        />
      </section>

      <AdminOverlayForm
        isOpen={isReplyOpen && Boolean(draftMessage)}
        tag="Pesan"
        title={draftMessage?.nama || 'Balas Pesan'}
        description={draftMessage ? `${draftMessage.email || '-'} · ${formatDateTime(draftMessage.createdAt)}` : ''}
        onClose={() => setIsReplyOpen(false)}
        actions={
          draftMessage ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setIsReplyOpen(false)}>
                Tutup
              </button>
              <button type="button" className="btn-secondary" onClick={() => { removeMessage(draftMessage.id); setIsReplyOpen(false); }}>
                Hapus
              </button>
              <button type="button" className="btn-primary" onClick={() => { saveMessageResponse(draftMessage); setIsReplyOpen(false); }}>
                Kirim Balasan
              </button>
            </>
          ) : null
        }
      >
        {draftMessage ? (
          <div className="admin-overlay-stack">
            <div className="admin-sheet-section">
              <h4>Subjek</h4>
              <p className="admin-message-body">{draftMessage.subjek || '-'}</p>
            </div>

            <div className="admin-sheet-section">
              <h4>Pesan Masuk</h4>
              <p className="admin-message-body">{draftMessage.pesan || '-'}</p>
            </div>

            <label className="admin-field">
              <span>Balasan</span>
              <textarea value={draftMessage.response || ''} onChange={(event) => setDraftMessage((current) => ({ ...current, response: event.target.value }))} />
            </label>
          </div>
        ) : null}
      </AdminOverlayForm>
    </>
  );
};

export default AdminMessagesTab;
