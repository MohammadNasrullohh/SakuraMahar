import React, { useEffect, useMemo, useState } from 'react';
import AdminSheetTable from './AdminSheetTable';
import AdminOverlayForm from './AdminOverlayForm';
import { exportRowsToCsv, stringifyForSearch } from './adminUtils';

const cloneItem = (item) => JSON.parse(JSON.stringify(item || null));

const AdminUsersTab = ({
  users,
  filters,
  setFilter,
  currentUserEmail,
  saveUser,
  removeUser
}) => {
  const [selectedId, setSelectedId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [draftUser, setDraftUser] = useState(null);

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

  const openEditor = (targetUser) => {
    if (!targetUser) {
      return;
    }

    setSelectedId(targetUser.id);
    setDraftUser(cloneItem(targetUser));
    setIsEditorOpen(true);
  };

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
          Unduh CSV
        </button>
      </div>

      <section className="admin-sheet-card">
        <div className="admin-sheet-titlebar">
          <div>
            <h3>Daftar User</h3>
            <p>{filteredUsers.length} akun tersedia. Klik baris untuk membuka form edit di atas halaman ini.</p>
          </div>
          {selectedUser ? (
            <button type="button" className="btn-primary" onClick={() => openEditor(selectedUser)}>
              Edit User
            </button>
          ) : null}
        </div>
        <AdminSheetTable
          columns={columns}
          rows={filteredUsers}
          selectedId={selectedId}
          onSelect={(id) => {
            const nextSelectedUser = filteredUsers.find((item) => String(item.id) === String(id));
            setSelectedId(id);
            openEditor(nextSelectedUser);
          }}
          emptyMessage="Belum ada user yang cocok dengan filter."
        />
      </section>

      <AdminOverlayForm
        isOpen={isEditorOpen && Boolean(draftUser)}
        tag="Users"
        title={draftUser?.nama || draftUser?.email || 'Edit User'}
        description={draftUser?.email || 'Atur identitas, role, dan status user.'}
        onClose={() => setIsEditorOpen(false)}
        actions={
          draftUser ? (
            <>
              <button type="button" className="btn-secondary" onClick={() => setIsEditorOpen(false)}>
                Tutup
              </button>
              <button type="button" className="btn-secondary" onClick={() => { removeUser(draftUser); setIsEditorOpen(false); }} disabled={draftUser.email === currentUserEmail}>
                Hapus
              </button>
              <button type="button" className="btn-primary" onClick={() => { saveUser(draftUser); setIsEditorOpen(false); }}>
                Simpan User
              </button>
            </>
          ) : null
        }
      >
        {draftUser ? (
          <div className="admin-detail-grid">
            <label className="admin-field">
              <span>Nama</span>
              <input value={draftUser.nama || ''} onChange={(event) => setDraftUser((current) => ({ ...current, nama: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Email</span>
              <input value={draftUser.email || ''} onChange={(event) => setDraftUser((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Telepon</span>
              <input value={draftUser.noTelepon || ''} onChange={(event) => setDraftUser((current) => ({ ...current, noTelepon: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Role</span>
              <select value={draftUser.role} onChange={(event) => setDraftUser((current) => ({ ...current, role: event.target.value }))}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label className="admin-field">
              <span>Status</span>
              <select value={draftUser.status || 'active'} onChange={(event) => setDraftUser((current) => ({ ...current, status: event.target.value }))}>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="admin-field admin-field-full">
              <span>Catatan</span>
              <textarea value={draftUser.notes || ''} onChange={(event) => setDraftUser((current) => ({ ...current, notes: event.target.value }))} />
            </label>
          </div>
        ) : null}
      </AdminOverlayForm>
    </>
  );
};

export default AdminUsersTab;
