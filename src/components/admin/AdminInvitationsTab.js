import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, stringifyForSearch } from './adminUtils';

const AdminInvitationsTab = ({ invitations, filters, setFilter, newInvitation, setNewInvitation, updateListItem, submitInvitation, saveInvitation, removeInvitation, copyText }) => {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('create');

  const filteredInvitations = useMemo(
    () =>
      invitations.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [filters.search, filters.status, invitations]
  );

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!filteredInvitations.length) {
      setSelectedId(null);
      setMode('create');
      return;
    }

    if (!filteredInvitations.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredInvitations[0].id);
    }
  }, [filteredInvitations, mode, selectedId]);

  const selectedInvitation = filteredInvitations.find((item) => String(item.id) === String(selectedId)) || null;

  const columns = [
    {
      key: 'guest',
      label: 'Tamu',
      width: '26%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.guestNama || '-'}</strong>
          <span>{item.guestEmail || '-'}</span>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Tanggal',
      width: '18%',
      render: (item) => item.tanggalPernikahan ? new Date(item.tanggalPernikahan).toLocaleDateString('id-ID') : '-'
    },
    {
      key: 'place',
      label: 'Tempat',
      width: '28%',
      render: (item) => (
        <span className="admin-sheet-muted" title={item.tempatPernikahan || '-'}>
          {item.tempatPernikahan || '-'}
        </span>
      )
    },
    {
      key: 'code',
      label: 'Kode',
      width: '14%',
      render: (item) => item.uniqueCode || '-'
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (item) => <span className={`admin-tag ${item.status}`}>{item.status}</span>
    }
  ];

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari undangan..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="sent">sent</option>
          <option value="responded">responded</option>
        </select>
        <button type="button" className="btn-primary" onClick={() => { setMode('create'); setSelectedId(null); }}>Buat Undangan</button>
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('invitations.csv', filteredInvitations.map((item) => ({ id: item.id, guestNama: item.guestNama, guestEmail: item.guestEmail, status: item.status, response: item.response || '', uniqueCode: item.uniqueCode })))}>Unduh CSV</button>
      </div>

      <div className="admin-sheet-layout">
        <section className="admin-sheet-card">
          <div className="admin-sheet-titlebar">
            <div>
              <h3>Daftar Undangan</h3>
              <p>{filteredInvitations.length} undangan tampil dalam grid rapi seperti spreadsheet.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredInvitations}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMode('edit');
            }}
            emptyMessage="Belum ada undangan yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {mode === 'create' ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>Buat Undangan Baru</h3>
                  <p>Isi data inti lalu kirim undangan digital dengan cepat.</p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Nama Tamu</span><input value={newInvitation.guestNama} onChange={(event) => setNewInvitation((current) => ({ ...current, guestNama: event.target.value }))} /></label>
                <label className="admin-field"><span>Email Tamu</span><input value={newInvitation.guestEmail} onChange={(event) => setNewInvitation((current) => ({ ...current, guestEmail: event.target.value }))} /></label>
                <label className="admin-field"><span>Tanggal Pernikahan</span><input type="date" value={newInvitation.tanggalPernikahan} onChange={(event) => setNewInvitation((current) => ({ ...current, tanggalPernikahan: event.target.value }))} /></label>
                <label className="admin-field"><span>Tempat</span><input value={newInvitation.tempatPernikahan} onChange={(event) => setNewInvitation((current) => ({ ...current, tempatPernikahan: event.target.value }))} /></label>
                <label className="admin-field"><span>Jam Mulai</span><input value={newInvitation.jamMulai} onChange={(event) => setNewInvitation((current) => ({ ...current, jamMulai: event.target.value }))} /></label>
                <label className="admin-field"><span>Link Maps</span><input value={newInvitation.linkGoogle} onChange={(event) => setNewInvitation((current) => ({ ...current, linkGoogle: event.target.value }))} /></label>
              </div>
              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={submitInvitation}>Buat Undangan</button>
              </div>
            </>
          ) : selectedInvitation ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedInvitation.guestNama || '-'}</h3>
                  <p>{selectedInvitation.guestEmail || '-'}</p>
                </div>
                <span className={`admin-tag ${selectedInvitation.status}`}>{selectedInvitation.status}</span>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Email</span><input value={selectedInvitation.guestEmail || ''} onChange={(event) => updateListItem(selectedInvitation.id, 'guestEmail', event.target.value)} /></label>
                <label className="admin-field"><span>Tanggal</span><input type="date" value={(selectedInvitation.tanggalPernikahan || '').slice(0, 10)} onChange={(event) => updateListItem(selectedInvitation.id, 'tanggalPernikahan', event.target.value)} /></label>
                <label className="admin-field"><span>Tempat</span><input value={selectedInvitation.tempatPernikahan || ''} onChange={(event) => updateListItem(selectedInvitation.id, 'tempatPernikahan', event.target.value)} /></label>
                <label className="admin-field"><span>Jam</span><input value={selectedInvitation.jamMulai || ''} onChange={(event) => updateListItem(selectedInvitation.id, 'jamMulai', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>Link Maps</span><input value={selectedInvitation.linkGoogle || ''} onChange={(event) => updateListItem(selectedInvitation.id, 'linkGoogle', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>Link Publik</span><input readOnly value={`${window.location.origin}/rsvp/${selectedInvitation.uniqueCode}`} /></label>
              </div>
              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveInvitation(selectedInvitation)}>Simpan</button>
                <button type="button" className="btn-secondary" onClick={() => copyText(`${window.location.origin}/rsvp/${selectedInvitation.uniqueCode}`)}>Salin Link</button>
                <button type="button" className="btn-secondary" onClick={() => removeInvitation(selectedInvitation.id)}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih undangan dari tabel atau buat undangan baru.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminInvitationsTab;
