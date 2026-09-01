import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';

export interface TicketHistoryModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onHide: () => void;
  onAction: (action: 'close', payload?: { ticketId: string | null }) => void;
}

export const TicketHistoryModal = ({ visible, ticket, onHide, onAction }: TicketHistoryModalProps) => {
  const handleHide = () => {
    onHide();
    onAction('close', { ticketId: ticket?.id ?? null });
  };

  return (
    <Dialog
      header={`Talep Detayı - ${ticket?.id ?? ''}`}
      visible={visible}
      style={{ width: '650px', maxWidth: '95vw' }}
      dismissableMask
      footer={
        <div className="flex justify-content-end w-full pt-2">
          <Button label="Kapat" icon="pi pi-times" severity="secondary" onClick={handleHide} />
        </div>
      }
      onHide={handleHide}
    >
      {ticket && (
        <div className="flex flex-column gap-4">
          <div className="surface-ground p-3 border-round">
            <div className="flex justify-content-between align-items-center mb-2 gap-2 flex-wrap">
              <span className="font-bold text-lg">{ticket.title}</span>
              <div className="flex gap-2 align-items-center"> 
                <span className="text-sm font-semibold text-700">{ticket.priority}</span>
              </div>
            </div>
            <p className="m-0 text-700 font-sans text-sm">{ticket.description}</p>
          </div>

          <div>
            <h6 className="font-bold mb-3">Süreç Tarihçesi</h6>
            <Timeline
              value={ticket.history}
              opposite={(item) => <small className="text-500">{item.date}</small>}
              content={(item) => (
                <div className="mb-2">
                  <div className="font-bold text-sm">{item.action}</div>
                  <small className="text-500">İşlem Yapan: {item.user}</small>
                </div>
              )}
            />
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default TicketHistoryModal;
