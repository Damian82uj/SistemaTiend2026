/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export function formatCurrency(amount: number, symbol: string = '$'): string {
  const rounded = Math.round(amount * 100) / 100;
  const parts = rounded.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return `${symbol} ${parts}`;
}

export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString: string): string {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

export function generateOperationNumber(prefix: string, count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(5, '0');
  return `${prefix}-${year}-${seq}`;
}

export function exportToCSV(filename: string, rows: Record<string, any>[]): void {
  if (!rows || rows.length === 0) {
    alert('No hay datos disponibles para exportar.');
    return;
  }

  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((header) => {
          let val = row[header] ?? '';
          if (typeof val === 'string') {
            val = `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(';')
    ),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
