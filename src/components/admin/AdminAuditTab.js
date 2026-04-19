import React, { useMemo } from 'react';
import { exportRowsToCsv, formatDateTime, stringifyForSearch } from './adminUtils';

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
        <input className="admin-search" placeholder="Cari aktivitas..." value={filters.search} onChange={(event) => setFilter('search', event.target.value)} />
        <select value={filters.entityType} onChange={(event) => setFilter('entityType', event.target.value)}>
          <option value="all">Semua</option>
          {[...new Set(auditLogs.map((item) => item.entityType).filter(Boolean))].map((entityType) => (
            <option key={entityType} value={entityType}>{entityType}</option>
          ))}
        </select>
        <button type="button" className="btn-secondary" onClick={() => exportRowsToCsv('audit-log.csv', filteredAuditLogs.map((item) => ({ id: item.id, createdAt: item.createdAt, actorEmail: item.actorEmail, action: item.action, entityType: item.entityType, entityId: item.entityId, summary: item.summary })))}>Unduh CSV</button>
      </div>

      <div className="admin-list">
        {filteredAuditLogs.map((item) => (
          <div key={item.id} className="admin-card">
            <div className="admin-card-head">
              <div>
                <h3>{item.summary}</h3>
                <p className="admin-card-subtitle">{item.action}</p>
              </div>
              <span className="admin-tag">{item.entityType}</span>
            </div>
            <div className="admin-meta-list admin-meta-list-compact">
              <div><strong>Pelaku</strong><span>{item.actorEmail || 'system/public'}</span></div>
              <div><strong>ID</strong><span>{item.entityId || '-'}</span></div>
              <div><strong>Waktu</strong><span>{formatDateTime(item.createdAt)}</span></div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default AdminAuditTab;
