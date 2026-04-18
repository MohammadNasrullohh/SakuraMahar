import React, { useMemo } from 'react';
import { exportRowsToCsv, stringifyForSearch } from './adminUtils';

const AdminAuditTab = ({ auditLogs, filters, setFilter }) => {
  const filteredAuditLogs = useMemo(
    () =>
      auditLogs.filter((item) => {
        const matchesSearch = !filters.search || stringifyForSearch(item).includes(filters.search.toLowerCase());
        const matchesEntityType = filters.entityType === 'all' || item.entityType === filters.entityType;
        return matchesSearch && matchesEntityType;
      }),
    [auditLogs, filters.entityType, filters.search]
  );

  return (
    <>
      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Cari audit log..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.entityType} onChange={(event) => setFilter('entityType', event.target.value)}>
          <option value="all">Semua Entity</option>
          {[...new Set(auditLogs.map((item) => item.entityType).filter(Boolean))].map((entityType) => (
            <option key={entityType} value={entityType}>{entityType}</option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('audit-log.csv', filteredAuditLogs.map((item) => ({ id: item.id, createdAt: item.createdAt, actorEmail: item.actorEmail, action: item.action, entityType: item.entityType, entityId: item.entityId, summary: item.summary })))}>Export CSV</button>
      </div>

      <div className="admin-list">
        {filteredAuditLogs.map((item) => (
          <div key={item.id} className="admin-card">
            <div className="admin-card-head"><h3>{item.summary}</h3><span className="admin-tag">{item.entityType}</span></div>
            <p className="admin-message-body">{item.action}</p>
            <div className="admin-meta-list">
              <span>Actor: {item.actorEmail || 'system/public'}</span>
              <span>Entity ID: {item.entityId}</span>
              <span>Waktu: {new Date(item.createdAt).toLocaleString('id-ID')}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminAuditTab;
