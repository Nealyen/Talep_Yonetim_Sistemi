/**
 * MODAL: "Atama İşlemleri" penceresi — Aktif Görevlerim sayfasında açılır.
 * İki bölüm gösterir: (1) onay/red gerektiren bekleyen atamalar (pendingAssignments),
 * (2) salt-bilgi ekip bildirimleri (teamNotifications, sadece ✕ ile kapatılır, onay
 * gerektirmez). Ayrıca manuel teknisyen atama seçimi için Dropdown içerir.
 */

import React, { useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputTextarea } from 'primereact/inputtextarea';
import { Ticket } from '@/layout/context/TicketContext';

export interface TechnicianOption {
  fullName: string;
  role?: string;
  teams?: string[];
}

export interface TicketAssignModalProps {
  visible: boolean;
  ticket: Ticket | null;
  availableTechnicians: TechnicianOption[];
  mode: 'delegate' | 'pending';
  selectedTechnician: string;
  onHide: () => void;
  onAction: (action: 'assign' | 'accept' | 'reject' | 'close', payload?: { ticketId: string | null; technician?: string; message?: string }) => void;
  onTechnicianChange: (value: string) => void;
  pendingAssignments?: Ticket[];
  teamNotifications?: { id: string; message: string }[];
  onDismissNotification?: (notificationId: string) => void;
}

export const TicketAssignModal = ({
  visible,
  ticket,
  availableTechnicians,
  mode,
  selectedTechnician,
  onHide,
  onAction,
  onTechnicianChange,
  pendingAssignments = [],
  teamNotifications = [],
  onDismissNotification,
}: TicketAssignModalProps) => {
  const [localSelected, setLocalSelected] = useState(selectedTechnician);
  const [reasonMessage, setReasonMessage] = useState('');

  React.useEffect(() => {
    setLocalSelected(selectedTechnician);
    if (visible) {
      setReasonMessage('');
    }
  }, [selectedTechnician, visible]);

  const delegateOptions = useMemo(
    () => availableTechnicians.filter((tech) => tech.fullName !== ticket?.requester && tech.fullName !== ticket?.assignee),
    [availableTechnicians, ticket]
  );

  const handleAssign = () => {
    const nextTech = localSelected || selectedTechnician;
    if (!nextTech) return;
    onAction('assign', { ticketId: ticket?.id ?? null, technician: nextTech, message: reasonMessage.trim() });
  };

  if (mode === 'pending') {
    return (
      <Dialog
        header="Onayınızı Bekleyen Atamalar"
        visible={visible}
        style={{ width: '800px', maxWidth: '95vw' }}
        dismissableMask
        onHide={onHide}
      >
        {teamNotifications.length > 0 && (
          <div className="flex flex-column gap-2 mb-3">
            {teamNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex justify-content-between align-items-center gap-2 p-2 border-round surface-100"
              >
                <span className="text-sm">
                  <i className="pi pi-info-circle mr-2 text-primary" />
                  {notification.message}
                </span>
                <Button
                  icon="pi pi-times"
                  rounded
                  text
                  size="small"
                  severity="secondary"
                  aria-label="Bildirimi kapat"
                  onClick={() => onDismissNotification?.(notification.id)}
                />
              </div>
            ))}
          </div>
        )}

        {pendingAssignments.length === 0 ? (
          teamNotifications.length === 0 ? (
            <Message severity="info" text="Bekleyen atama talebi bulunmuyor." />
          ) : null
        ) : (
          <DataTable value={pendingAssignments} paginator rows={6} responsiveLayout="scroll">
            <Column field="id" header="Talep No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="delegatedBy" header="Atayan / Yönlendiren" />
            <Column
              header="İşlem"
              body={(row: Ticket) => (
                <div className="flex gap-2">
                  <Button
                    label="Kabul Et"
                    icon="pi pi-check"
                    size="small"
                    severity="success"
                    onClick={() => onAction('accept', { ticketId: row.id })}
                  />
                  <Button
                    label="Reddet"
                    icon="pi pi-times"
                    size="small"
                    severity="danger"
                    outlined
                    onClick={() => onAction('reject', { ticketId: row.id })}
                  />
                </div>
              )}
            />
          </DataTable>
        )}
      </Dialog>
    );
  }

  return (
    <Dialog
      header="Görevi Başka Bir Personele Yönlendir"
      visible={visible}
      style={{ width: '450px', maxWidth: '95vw' }}
      dismissableMask
      onHide={onHide}
    >
      {!delegateOptions.length ? (
        <Message severity="warn" text="Yönlendirilecek personel bulunamadı." />
      ) : (
        <>
          <label className="font-bold mb-2 block">Personel Seçimi</label>
          <Dropdown
            value={localSelected}
            options={delegateOptions}
            optionLabel="fullName"
            optionValue="fullName"
            onChange={(e) => {
              setLocalSelected(e.value);
              onTechnicianChange(e.value);
            }}
            placeholder="Seçiniz..."
            className="w-full"
          />
        </>
      )}

      <div className="mt-3">
        <label className="font-bold mb-2 block">İşlem Gerekçesi / Açıklama</label>
        <InputTextarea
          value={reasonMessage}
          onChange={(e) => setReasonMessage(e.target.value)}
          rows={4}
          autoResize
          className="w-full"
          placeholder="Görevin devredilme nedeni veya kısa açıklama..."
        />
      </div>

      <div className="flex justify-content-end gap-2 mt-3">
        <Button label="İptal" severity="secondary" onClick={onHide} />
        <Button
          label="Gönder"
          severity="help"
          icon="pi pi-send"
          onClick={handleAssign}
          disabled={!localSelected && !selectedTechnician}
        />
      </div>
    </Dialog>
  );
};

export default TicketAssignModal;
