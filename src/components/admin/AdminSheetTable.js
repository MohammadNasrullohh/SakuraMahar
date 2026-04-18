import React from 'react';

const AdminSheetTable = ({
  columns = [],
  rows = [],
  selectedId = null,
  onSelect,
  emptyMessage = 'Belum ada data.'
}) => {
  const getRowKey = (row, index) => row?.id ?? row?.key ?? index;

  return (
    <div className="admin-sheet-table-wrap">
      <table className="admin-sheet-table">
        <colgroup>
          {columns.map((column) => (
            <col
              key={column.key || column.label}
              style={column.width ? { width: column.width } : undefined}
            />
          ))}
        </colgroup>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key || column.label}
                className={column.align ? `is-${column.align}` : ''}
                scope="col"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => {
              const rowKey = getRowKey(row, index);
              const isSelected = String(rowKey) === String(selectedId);

              return (
                <tr
                  key={rowKey}
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => onSelect?.(rowKey)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelect?.(rowKey);
                    }
                  }}
                  tabIndex={0}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowKey}-${column.key || column.label}`}
                      className={column.align ? `is-${column.align}` : ''}
                    >
                      {typeof column.render === 'function'
                        ? column.render(row)
                        : row?.[column.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="admin-sheet-empty-cell" colSpan={Math.max(columns.length, 1)}>
                <div className="admin-empty admin-empty-inline">{emptyMessage}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AdminSheetTable;
