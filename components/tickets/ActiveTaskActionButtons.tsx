'use client';

import React from 'react';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';

export interface ActiveTaskActionButtonsProps {
    ticket: Ticket;
    onPreview: (ticket: Ticket) => void;
    onComplete: (ticketId: string) => void;
    onRelease: (ticket: Ticket) => void;
    onDelegate: (ticket: Ticket) => void;
}

/**
 * "Üzerimdeki Aktif Görevler" tablosundaki satır işlem butonları
 * (önizleme, tamamla, havuza iade, devret)
 */
export const ActiveTaskActionButtons = ({ ticket, onPreview, onComplete, onRelease, onDelegate }: ActiveTaskActionButtonsProps) => (
    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        <Button
            icon="pi pi-search"
            rounded
            outlined
            severity="secondary"
            tooltip="Önizleme ve Tarihçe"
            onClick={(e) => {
                e.stopPropagation();
                onPreview(ticket);
            }}
        />
        {ticket.status === 'İŞLEMDE' && (
            <>
                <Button
                    icon="pi pi-check"
                    rounded
                    severity="success"
                    tooltip="Tamamlandı Olarak Bildir"
                    onClick={(e) => {
                        e.stopPropagation();
                        onComplete(ticket.id);
                    }}
                />
                <Button
                    icon="pi pi-times"
                    rounded
                    severity="danger"
                    tooltip="Havuza İade Et"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRelease(ticket);
                    }}
                />
                <Button
                    icon="pi pi-send"
                    rounded
                    severity="help"
                    tooltip="Görevi Devret"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelegate(ticket);
                    }}
                />
            </>
        )}
    </div>
);

export default ActiveTaskActionButtons;
