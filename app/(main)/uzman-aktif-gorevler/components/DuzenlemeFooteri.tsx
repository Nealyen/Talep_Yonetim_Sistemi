import React from 'react';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';

export interface DuzenlemeFooteriProps {
    selectedTicket: Ticket | null;
    onOpenHistory: () => void;
    onRelease: () => void;
    onDelegate: () => void;
    onConfirmSave: () => void;
}

export const DuzenlemeFooteri = ({ selectedTicket, onOpenHistory, onRelease, onDelegate, onConfirmSave }: DuzenlemeFooteriProps) => {
    return (
        <div className="flex flex-wrap justify-content-between align-items-center w-full gap-2 pt-2 border-top-1 surface-border">
            <div className="flex flex-wrap gap-2">
                <Button label="Tarihçe / Detay" icon="pi pi-history" severity="secondary" outlined size="small" onClick={onOpenHistory} />
                {selectedTicket?.status === 'İŞLEMDE' && (
                    <>
                        <Button label="Havuza Bırak" icon="pi pi-arrow-circle-left" severity="danger" outlined size="small" onClick={onRelease} />
                        <Button label="Devret" icon="pi pi-send" severity="help" outlined size="small" onClick={onDelegate} />
                    </>
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Değişiklikleri Kaydet" icon="pi pi-check" severity="success" onClick={onConfirmSave} />
            </div>
        </div>
    );
};

export default DuzenlemeFooteri;
