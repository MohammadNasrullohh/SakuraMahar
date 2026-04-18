import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, stringifyForSearch } from './adminUtils';

const AdminGuestsTab = ({ guests, filters, setFilter, newGuest, setNewGuest, updateListItem, submitGuest, saveGuest, removeGuest }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('create');

  const filteredGuests = useMemo(
    () =>
      guests.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [filters.search, filters.status, guests]
  );

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!filteredGuests.length) {
      setSelectedId(null);
      setMode('create');
      return;
    }

    if (!filteredGuests.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredGuests[0].id);
    }
  }, [filteredGuests, mode, selectedId]);

  const selectedGuest = filteredGuests.find((item) => String(item.id) === String(selectedId)) || null;

  const columns = [
    {
      key: 'name',
      label: 'Nama',
      width: '28%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.nama || '-'}</strong>
          <span>{item.email || '-'}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Telepon',
      width: '22%',
      render: (item) => item.noTelepon || '-'
    },
    {
      key: 'status',
      label: 'Status',
      width: '16%',
      render: (item) => <span className={`admin-tag ${item.status}`}>{item.status}</span>
    },
    {
      key: 'notes',
      label: 'Catatan',
      width: '34%',
      render: (item) => (
        <span className="admin-sheet-muted" title={item.catatan || '-'}>
          {item.catatan || '-'}
        </span>
      )
    }
  ];

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari tamu..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="pending">pending</option>
          <option value="confirmed">confirmed</option>
          <option value="declined">declined</option>
        </select>
        <button type="button" className="btn-primary" onClick={() => { setMode('create'); setSelectedId(null); }}>Tambah Tamu</button>
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('guests.csv', filteredGuests.map((item) => ({ id: item.id, nama: item.nama, email: item.email, noTelepon: item.noTelepon, status: item.status })))}>Export CSV</button>
      </div>

      <div className="admin-sheet-layout">
        <section className="admin-sheet-card">
          <div className="admin-sheet-titlebar">
            <div>
              <h3>Database Tamu</h3>
              <p>{filteredGuests.length} tamu tersusun rapi untuk pencarian dan edit cepat.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredGuests}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMode('edit');
            }}
            emptyMessage="Belum ada tamu yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {mode === 'create' ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>Tambah Tamu Baru</h3>
                  <p>Form cepat untuk menambahkan tamu ke database.</p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Nama</span><input value={newGuest.nama} onChange={(event) => setNewGuest((current) => ({ ...current, nama: event.target.value }))} /></label>
                <label className="admin-field"><span>Email</span><input value={newGuest.email} onChange={(event) => setNewGuest((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="admin-field"><span>Telepon</span><input value={newGuest.noTelepon} onChange={(event) => setNewGuest((current) => ({ ...current, noTelepon: event.target.value }))} /></label>
                <label className="admin-field"><span>Status</span><select value={newGuest.status} onChange={(event) => setNewGuest((current) => ({ ...current, status: event.target.value }))}><option value="pending">pending</option><option value="confirmed">confirmed</option><option value="declined">declined</option></select></label>
              </div>
              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={submitGuest}>Tambah Tamu</button>
              </div>
            </>
          ) : selectedGuest ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedGuest.nama || '-'}</h3>
                  <p>{selectedGuest.email || '-'}</p>
                </div>
                <span className={`admin-tag ${selectedGuest.status}`}>{selectedGuest.status}</span>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Email</span><input value={selectedGuest.email || ''} onChange={(event) => updateListItem(selectedGuest.id, 'email', event.target.value)} /></label>
                <label className="admin-field"><span>Telepon</span><input value={selectedGuest.noTelepon || ''} onChange={(event) => updateListItem(selectedGuest.id, 'noTelepon', event.target.value)} /></label>
                <label className="admin-field"><span>Status</span><select value={selectedGuest.status || 'pending'} onChange={(event) => updateListItem(selectedGuest.id, 'status', event.target.value)}><option value="pending">pending</option><option value="confirmed">confirmed</option><option value="declined">declined</option></select></label>
                <label className="admin-field admin-field-full"><span>Catatan</span><textarea value={selectedGuest.catatan || ''} onChange={(event) => updateListItem(selectedGuest.id, 'catatan', event.target.value)} /></label>
              </div>
              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveGuest(selectedGuest)}>Simpan Tamu</button>
                <button type="button" className="btn-secondary" onClick={() => removeGuest(selectedGuest.id)}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih tamu dari tabel atau buat tamu baru.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminGuestsTab;
