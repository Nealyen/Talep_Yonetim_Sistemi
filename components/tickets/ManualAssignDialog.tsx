'use client';

import React from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';
import { AppUser } from '@/layout/context/UserContext';

export interface ManualAssignDialogProps {
    visible: boolean;
    ticket: Ticket | null;
    availableTechnicians: AppUser[];
    selectedTech: string;
    onTechChange: (value: string) => void;
    onHide: () => void;
    onConfirm: () => void;
}

/**
 * Koordinatörün manuel personel görevlendirme/değiştirme dialog'u.
 * surec-takibi/page.tsx içinden ayrıştırıldı.
 */
export const ManualAssignDialog = ({ visible, ticket, availableTechnicians, selectedTech, onTechChange, onHide, onConfirm }: ManualAssignDialogProps) => (
    <Dialog
        header={`${ticket?.assignee ? 'Teknik Uzman Değiştir' : 'Teknik Personel Görevlendir'} - ${ticket?.id ?? ''}`}
        visible={visible}
        style={{ width: '450px' }}
        onHide={onHide}
    >
        <div className="p-fluid">
            <label className="font-bold mb-2 block">Yeni Teknik Uzman</label>
            <Dropdown
                value={selectedTech}
                options={availableTechnicians}
                optionLabel="fullName"
                optionValue="fullName"
                onChange={(e) => onTechChange(e.value)}
                placeholder={availableTechnicians.length ? 'Uzman Listesinden Seçin' : 'Müsait veya yetkin uzman bulunmuyor'}
                className="mb-4"
                disabled={!availableTechnicians.length}
            />
            <div className="flex justify-content-end gap-2">
                <Button label="İptal" severity="secondary" onClick={onHide} />
                <Button label="Uzmanı Kaydet (Gönder)" severity="info" icon="pi pi-send" onClick={onConfirm} disabled={!selectedTech} />
            </div>
        </div>
    </Dialog>
);

export default ManualAssignDialog;
