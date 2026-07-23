'use client';

import type { ReactNode } from 'react';
import Icon from '@/components/icons/AppIcons';

export type DataTableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  loading?: boolean;
  skeletonRows?: number;
  emptyMessage?: string;
  emptyTitle?: string;
  footer?: ReactNode;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading = false,
  skeletonRows = 5,
  emptyMessage = 'No hay registros para mostrar.',
  emptyTitle = 'Sin resultados',
  footer,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="data-table-wrap" role="region" aria-label="Tabla de datos" aria-busy="true" tabIndex={0}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={`sk-${i}`} className="data-table-skeleton-row">
                {columns.map((col, index) => (
                  <td key={col.key}>
                    <span
                      className="skeleton-bar"
                      style={{ width: `${index === 0 ? 82 : 48 + ((i + index) % 4) * 10}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="empty-state" role="status">
        <span className="empty-state-icon" aria-hidden>
          <Icon name="empty" size={28} />
        </span>
        <strong>{emptyTitle}</strong>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="data-table-wrap" role="region" aria-label="Tabla de datos" tabIndex={0}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {footer}
    </>
  );
}
