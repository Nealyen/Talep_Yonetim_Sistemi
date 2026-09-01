'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { WorkLog } from '@/layout/context/TicketContext';

export interface PendingWorkLogApprovalItem {
  ticketId: string;
  ticketTitle: string;
  workLog: WorkLog;
}

export interface WorkLogApprovalModalProps {
  visible: boolean;
  pendingData: PendingWorkLogApprovalItem[];
  onHide: () => void;
  onResolve: (ticketId: string, logId: string, isApproved: boolean) => void;
}

export const WorkLogApprovalModal = ({
  visible,
  pendingData,
  onHide,
  onResolve,
}: WorkLogApprovalModalProps) => {
  const actionTemplate = (rowData: PendingWorkLogApprovalItem) => (
    <div className="flex gap-2">
      <Button
        label="Onayla"
        icon="pi pi-check"
        severity="success"
        size="small"
        onClick={() => onResolve(rowData.ticketId, rowData.workLog.id, true)}
      />
      <Button
        label="Reddet"
        icon="pi pi-times"
        severity="danger"
        size="small"
        onClick={() => onResolve(rowData.ticketId, rowData.workLog.id, false)}
      />
    </div>
  );

  return (
    <Dialog
      header="Mesai Onayları"
      visible={visible}
      onHide={onHide}
      style={{ width: '900px', maxWidth: '95vw' }}
      dismissableMask
    >
      <DataTable value={pendingData} paginator rows={10} emptyMessage="Onay bekleyen mesai kaydı bulunmuyor.">
        <Column field="ticketId" header="Talep No" style={{ width: '120px' }} />
        <Column field="ticketTitle" header="Talep Başlığı" />
        <Column
          header="Çalışan"
          body={(rowData: PendingWorkLogApprovalItem) => rowData.workLog.fullName}
          style={{ width: '170px' }}
        />
        <Column
          header="Süre"
          body={(rowData: PendingWorkLogApprovalItem) => rowData.workLog.durationStr}
          style={{ width: '140px' }}
        />
        <Column
          header="Durum"
          body={(rowData: PendingWorkLogApprovalItem) => (
            <Tag value={rowData.workLog.status || 'PENDING'} severity="warning" />
          )}
          style={{ width: '120px' }}
        />
        <Column
          header="Açıklama"
          body={(rowData: PendingWorkLogApprovalItem) => rowData.workLog.description || '-'}
          style={{ minWidth: '220px' }}
        />
        <Column header="İşlem" body={actionTemplate} style={{ width: '220px' }} />
      </DataTable>
    </Dialog>
  );
};

export default WorkLogApprovalModal;
