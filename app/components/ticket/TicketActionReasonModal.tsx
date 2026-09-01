import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { Ticket } from '@/layout/context/TicketContext';

export interface TicketActionReasonModalProps {
  visible: boolean;
  actionType: 'release' | 'complete';
  ticket: Ticket | null;
  onHide: () => void;
  onConfirm: (message: string) => void;
}

const TicketActionReasonModal = ({ visible, actionType, ticket, onHide, onConfirm }: TicketActionReasonModalProps) => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (visible) {
      setMessage('');
    }
  }, [visible]);

  const title = actionType === 'release' ? 'Görevi Havuza İade Et' : 'Görevi Tamamla';
  const placeholder =
    actionType === 'release'
      ? 'Görev neden havuza iade ediliyor? Kısa açıklama yazın...'
      : 'İşlem tamamlandı. Yapılan çözüm veya notu açıklayın...';

  return (
    <Dialog
      header={title}
      visible={visible}
      style={{ width: '480px', maxWidth: '95vw' }}
      dismissableMask
      onHide={onHide}
      footer={
        <div className="flex justify-content-end gap-2">
          <Button label="İptal" severity="secondary" onClick={onHide} />
          <Button
            label={actionType === 'release' ? 'Havuza İade Et' : 'Tamamla'}
            severity={actionType === 'release' ? 'danger' : 'success'}
            onClick={() => onConfirm(message.trim())}
          />
        </div>
      }
    >
      <div className="flex flex-column gap-3">
        <div>
          <label className="font-bold mb-2 block">Talep</label>
          <div className="surface-ground p-3 border-round text-sm">{ticket?.title || 'Seçili talep'}</div>
        </div>

        <div>
          <label className="font-bold mb-2 block">Açıklama / Log</label>
          <InputTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            autoResize
            className="w-full"
            placeholder={placeholder}
          />
        </div>
      </div>
    </Dialog>
  );
};

export default TicketActionReasonModal;
