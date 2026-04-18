import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import { exportRowsToCsv, stringifyForSearch } from './adminUtils';

const AdminUsersTab = ({
  users,
  filters,
  setFilter,
  currentUserEmail,
  updateListItem,
  saveUser,
  removeUser
}) => {
  const [selectedId, setSelectedId] = useState(null);

  const filteredUsers = useMemo(
    () =>
      users.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' || item.status === filters.status;
        const matchesRole = filters.role === 'all' || item.role === filters.role;
        return matchesSearch && matchesStatus && matchesRole;
      }),
    [filters.role, filters.search, filters.status, users]
  );

  useEffect(() => {
    if (!filteredUsers.length) {
      setSelectedId(null);
      return;
    }

    if (!filteredUsers.some((item) => String(item.id) === String(selectedId))) {
      setSelectedId(filteredUsers[0].id);
    }
  }, [filteredUsers, selectedId]);

  const selectedUser = filteredUsers.find((item) => String(item.id) === String(selectedId)) || null;

  const columns = [
    {
      key: 'identity',
      label: 'User',
      width: '34%',
      render: (item) => (
        <div className="admin-sheet-primary">
          <strong>{item.nama || 'Tanpa nama'}</strong>
          <span>{item.email}</span>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Telepon',
      width: '20%',
      render: (item) => item.noTelepon || '-'
    },
    {
      key: 'role',
      label: 'Role',
      width: '16%',
      render: (item) => <span className={`admin-tag ${item.role}`}>{item.role}</span>
    },
    {
      key: 'status',
      label: 'Status',
      width: '16%',
      render: (item) => <span className={`admin-tag ${item.status || 'active'}`}>{item.status || 'active'}</span>
    },
    {
      key: 'notes',
      label: 'Catatan',
      width: '14%',
      render: (item) => (
        <span className="admin-sheet-muted" title={item.notes || '-'}>
          {item.notes || '-'}
        </span>
      )
    }
  ];

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari user..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.status} onChange={(event) => setFilter('status', event.target.value)}>
          <option value="all">Semua Status</option>
          <option value="active">active</option>
          <option value="inactive">inactive</option>
        </select>
        <select value={filters.role} onChange={(event) => setFilter('role', event.target.value)}>
          <option value="all">Semua Role</option>
          <option value="admin">admin</option>
          <option value="user">user</option>
        </select>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            exportRowsToCsv(
              'users.csv',
              filteredUsers.map((item) => ({
                id: item.id,
                email: item.email,
                nama: item.nama,
                role: item.role,
                status: item.status,
                noTelepon: item.noTelepon
              }))
            )
          }
        >
          Export CSV
        </button>
      </div>

      <div className="admin-sheet-layout">
        <section className="admin-sheet-card">
          <div className="admin-sheet-titlebar">
            <div>
              <h3>Daftar User</h3>
              <p>{filteredUsers.length} user tampil dalam tampilan spreadsheet.</p>
            </div>
          </div>
          <AdminSheetTable
            columns={columns}
            rows={filteredUsers}
            selectedId={selectedId}
            onSelect={setSelectedId}
            emptyMessage="Belum ada user yang cocok dengan filter."
          />
        </section>

        <aside className="admin-sheet-card admin-sheet-detail">
          {selectedUser ? (
            <>
              <div className="admin-sheet-titlebar">
                <div>
                  <h3>{selectedUser.nama || selectedUser.email}</h3>
                  <p>{selectedUser.email}</p>
                </div>
                <div className="admin-actions">
                  <span className={`admin-tag ${selectedUser.role}`}>{selectedUser.role}</span>
                  <span className={`admin-tag ${selectedUser.status || 'active'}`}>{selectedUser.status || 'active'}</span>
                </div>
              </div>

              <div className="admin-detail-grid">
                <label className="admin-field">
                  <span>Nama</span>
                  <input value={selectedUser.nama || ''} onChange={(event) => updateListItem(selectedUser.id, 'nama', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Email</span>
                  <input value={selectedUser.email || ''} onChange={(event) => updateListItem(selectedUser.id, 'email', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Telepon</span>
                  <input value={selectedUser.noTelepon || ''} onChange={(event) => updateListItem(selectedUser.id, 'noTelepon', event.target.value)} />
                </label>
                <label className="admin-field">
                  <span>Role</span>
                  <select value={selectedUser.role} onChange={(event) => updateListItem(selectedUser.id, 'role', event.target.value)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label className="admin-field">
                  <span>Status</span>
                  <select value={selectedUser.status || 'active'} onChange={(event) => updateListItem(selectedUser.id, 'status', event.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
                <label className="admin-field admin-field-full">
                  <span>Catatan</span>
                  <textarea value={selectedUser.notes || ''} onChange={(event) => updateListItem(selectedUser.id, 'notes', event.target.value)} />
                </label>
              </div>

              <div className="admin-actions">
                <button type="button" className="btn-primary" onClick={() => saveUser(selectedUser)}>Simpan User</button>
                <button type="button" className="btn-secondary" onClick={() => removeUser(selectedUser)} disabled={selectedUser.email === currentUserEmail}>Hapus</button>
              </div>
            </>
          ) : (
            <div className="admin-empty">Pilih user dari tabel untuk melihat detail dan melakukan edit.</div>
          )}
        </aside>
      </div>
    </>
  );
};

export default AdminUsersTab;
