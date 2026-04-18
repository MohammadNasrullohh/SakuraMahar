export const stringifyForSearch = (value) => JSON.stringify(value || {}).toLowerCase();

export const exportRowsToCsv = (filename, rows) => {
  if (!rows.length) {
    return false;
  }

  const headers = Object.keys(rows[0]);
  const escapeCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCell(row[header])).join(','))
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
  return true;
};

export const formatDateTime = (value, fallback = '-') => {
  if (!value) {
    return fallback;
  }

  const parsedDate = new Date(value);
  return Number.isNaN(parsedDate.getTime()) ? value : parsedDate.toLocaleString('id-ID');
};

export const formatRupiah = (value, fallback = '-') => {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  const normalized = Number(String(value).replace(/[^\d.-]/g, ''));

  if (Number.isNaN(normalized)) {
    return String(value);
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(normalized);
};
