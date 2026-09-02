import React from 'react';
import { Tag } from 'primereact/tag';

export type TicketStatus =
  | 'YENİ'
  | 'İNCELEMEDE'
  | 'İŞLEMDE'
  | 'ATAMA_BEKLİYOR'
  | 'ONAY_BEKLİYOR'
  | 'KAPATILDI'
  | 'REDDEDİLDİ'
  | 'HAVUZDA'
  | 'AKTİF'
  | string;

type StatusSeverity = 'success' | 'info' | 'warning' | 'danger' | null;

const statusConfig: Record<string, { label: string; severity: StatusSeverity; className?: string }> = {
  YENİ: { label: 'YENİ', severity: 'info' },
  İNCELEMEDE: { label: 'İNCELEMEDE', severity: 'info' },
  İŞLEMDE: { label: 'İŞLEMDE', severity: 'warning' },
  ATAMA_BEKLİYOR: { label: 'ATAMA BEKLİYOR', severity: 'warning' },
  // Severity 'null' PrimeReact'te varsayılan gri renk verir; sayfalarda tutarlı biçimde
  // kullanılan mor rozeti burada merkezi olarak koruyoruz.
  ONAY_BEKLİYOR: { label: 'ONAY BEKLİYOR', severity: null, className: 'bg-purple-600 text-white' },
  KAPATILDI: { label: 'KAPATILDI', severity: 'success' },
  REDDEDİLDİ: { label: 'REDDEDİLDİ', severity: 'danger' },
  HAVUZDA: { label: 'HAVUZDA', severity: 'info' },
  AKTİF: { label: 'AKTİF', severity: 'success' },
};

const getStatusMeta = (status?: string | null) => {
  if (!status) {
    return { label: 'BİLİNMEYEN', severity: null };
  }

  return statusConfig[status] ?? { label: status, severity: null };
};

type StatusBadgeProps = {
  status?: string | null;
  className?: string;
};

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const meta = getStatusMeta(status);
  const mergedClassName = [meta.className, className].filter(Boolean).join(' ') || undefined;

  return <Tag value={meta.label} severity={meta.severity} className={mergedClassName} />;
};

export default StatusBadge;
