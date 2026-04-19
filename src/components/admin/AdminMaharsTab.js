import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, formatDateTime, formatRupiah, stringifyForSearch } from './adminUtils';

const AdminMaharsTab = ({
  mahars,
  filters,
  setFilter,
  newMahar,
  setNewMahar,
  paymentDrafts,
  setPaymentDrafts,
  updateListItem,
  submitMahar,
  saveMahar,
  payMahar,
  removeMahar
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState('create');

  const filteredMahars = useMemo(
    () =>
      mahars.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        return matchesSearch && matchesStatus;
      }),
    [filters.search, filters.status, mahars]
  );

  useEffect(() => {
    if (mode === 'create') {
      return;
    }

    if (!filteredMahars.length) {
      setSelectedId(null);
      setMode('create');
      return;
    }

    if (!filteredMahars.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredMahars[0].id);
    }
  }, [filteredMahars, mode, selectedId]);

  const selectedMahar = filteredMahars.find((item) => String(item.id) === String(selectedId)) || null;

  const columns = [
    {
      key: 'name',
      label: 'Penerima',
      width: '28%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.nama || '-'}</strong>
          <span>{item.email || '-'}</span>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Jumlah',
      width: '18%',
      render: (item) => formatRupiah(item.jumlah)
    },
    {
      key: 'method',
      label: 'Metode',
      width: '20%',
      render: (item) => item.metodePerayaan || '-'
    },
    {
      key: 'date',
      label: 'Tanggal',
      width: '18%',
      render: (item) => item.tanggalPerayaan ? formatDateTime(item.tanggalPerayaan) : '-'
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
        <input className="admin-search" placeholder="Cari mahar..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="active">active</option>
          <option value="completed">completed</option>
          <option value="cancelled">cancelled</option>
        </select>
        <button type="button" className="btn-primary" onClick={() => { setMode('create'); setSelectedId(null); }}>Tambah Mahar</button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            exportRowsToCsv(
              'mahars.csv',
              filteredMahars.map((item) => ({
                id: item.id,
                nama: item.nama,
                email: item.email,
                jumlah: item.jumlah,
                status: item.status,
                metode: item.metodePerayaan
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
              <h3>Data Mahar</h3>
              <p>{filteredMahars.length} transaksi tercatat.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredMahars}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setMode('edit');
            }}
            emptyMessage="Belum ada data mahar yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {mode === 'create' ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>Tambah Mahar Baru</h3>
                  <p>Form cepat untuk mencatat mahar baru ke sistem.</p>
                </div>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Nama</span><input value={newMahar.nama} onChange={(event) => setNewMahar((current) => ({ ...current, nama: event.target.value }))} /></label>
                <label className="admin-field"><span>Email</span><input value={newMahar.email} onChange={(event) => setNewMahar((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className="admin-field"><span>Jumlah</span><input type="number" value={newMahar.jumlah} onChange={(event) => setNewMahar((current) => ({ ...current, jumlah: event.target.value }))} /></label>
                <label className="admin-field"><span>Metode</span><input value={newMahar.metodePerayaan} onChange={(event) => setNewMahar((current) => ({ ...current, metodePerayaan: event.target.value }))} /></label>
                <label className="admin-field"><span>Tanggal</span><input type="date" value={newMahar.tanggalPerayaan} onChange={(event) => setNewMahar((current) => ({ ...current, tanggalPerayaan: event.target.value }))} /></label>
                <label className="admin-field admin-field-full"><span>Deskripsi</span><textarea value={newMahar.deskripsi} onChange={(event) => setNewMahar((current) => ({ ...current, deskripsi: event.target.value }))} /></label>
              </div>
              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={submitMahar}>Tambah Mahar</button>
              </div>
            </>
          ) : selectedMahar ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedMahar.nama || `Mahar #${selectedMahar.id}`}</h3>
                  <p>{selectedMahar.email || '-'} · {formatRupiah(selectedMahar.jumlah)}</p>
                </div>
                <span className={`admin-tag ${selectedMahar.status}`}>{selectedMahar.status}</span>
              </div>
              <div className="admin-detail-grid">
                <label className="admin-field"><span>Nama</span><input value={selectedMahar.nama || ''} onChange={(event) => updateListItem(selectedMahar.id, 'nama', event.target.value)} /></label>
                <label className="admin-field"><span>Email</span><input value={selectedMahar.email || ''} onChange={(event) => updateListItem(selectedMahar.id, 'email', event.target.value)} /></label>
                <label className="admin-field"><span>Jumlah</span><input type="number" value={selectedMahar.jumlah || ''} onChange={(event) => updateListItem(selectedMahar.id, 'jumlah', event.target.value)} /></label>
                <label className="admin-field"><span>Status</span><select value={selectedMahar.status} onChange={(event) => updateListItem(selectedMahar.id, 'status', event.target.value)}><option value="active">active</option><option value="completed">completed</option><option value="cancelled">cancelled</option></select></label>
                <label className="admin-field"><span>Metode</span><input value={selectedMahar.metodePerayaan || ''} onChange={(event) => updateListItem(selectedMahar.id, 'metodePerayaan', event.target.value)} /></label>
                <label className="admin-field admin-field-full"><span>Deskripsi</span><textarea value={selectedMahar.deskripsi || ''} onChange={(event) => updateListItem(selectedMahar.id, 'deskripsi', event.target.value)} /></label>
              </div>

              <div className="admin-sheet-section">
                <h4>Catat Pembayaran</h4>
                <div className="admin-detail-grid">
                  <label className="admin-field"><span>Pembayaran Baru</span><input type="number" value={paymentDrafts[selectedMahar.id]?.jumlah || ''} onChange={(event) => setPaymentDrafts((current) => ({ ...current, [selectedMahar.id]: { ...(current[selectedMahar.id] || { metode: 'Transfer Bank', bukti: '' }), jumlah: event.target.value } }))} /></label>
                  <label className="admin-field"><span>Metode Bayar</span><input value={paymentDrafts[selectedMahar.id]?.metode || 'Transfer Bank'} onChange={(event) => setPaymentDrafts((current) => ({ ...current, [selectedMahar.id]: { ...(current[selectedMahar.id] || { jumlah: '', bukti: '' }), metode: event.target.value } }))} /></label>
                </div>
              </div>

              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveMahar(selectedMahar)}>Simpan Mahar</button>
                <button type="button" className="btn-secondary" onClick={() => payMahar(selectedMahar.id)}>Catat Bayar</button>
                <button type="button" className="btn-secondary" onClick={() => removeMahar(selectedMahar.id)}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih data mahar dari tabel atau buat mahar baru.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminMaharsTab;
