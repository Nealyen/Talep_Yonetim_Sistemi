import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

export interface IsHavuzuTabloProps {
    tickets: Ticket[];
    isTechnician: boolean;
    isMyOwnTicket: (ticket: Ticket) => boolean;
    onRowSelect: (ticket: Ticket) => void;
    onTakeOwnership: (ticket: Ticket) => void;
}

export const IsHavuzuTablo = ({ tickets, isTechnician, isMyOwnTicket, onRowSelect, onTakeOwnership }: IsHavuzuTabloProps) => {
    const actionBodyTemplate = (rowData: Ticket) => {
        if (!isTechnician) {
            return <span className="text-500 text-sm">Salt Okunur</span>;
        }

        const ownTicket = isMyOwnTicket(rowData);

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    rounded
                    outlined
                    severity="secondary"
                    tooltip="Talep Detayı ve Tarihçe"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRowSelect(rowData);
                    }}
                />
                <Button
                    label={ownTicket ? 'Kendi Talebiniz' : 'İşi Üzerime Al'}
                    icon={ownTicket ? 'pi pi-ban' : 'pi pi-plus'}
                    size="small"
                    severity={ownTicket ? 'secondary' : 'info'}
                    disabled={ownTicket}
                    tooltip={ownTicket ? 'Kendi oluşturduğunuz talebi doğrudan üzerinize alamazsınız.' : 'Talebi üzerinize atayın'}
                    tooltipOptions={{ position: 'left' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        void onTakeOwnership(rowData);
                    }}
                />
            </div>
        );
    };

    return (
        <DataTable
            value={tickets}
            paginator
            rows={10}
            responsiveLayout="scroll"
            emptyMessage="Havuzda atanmayı bekleyen açık iş bulunmamaktadır."
            onRowClick={(event) => onRowSelect(event.data as Ticket)}
            rowClassName={() => 'cursor-pointer hover:surface-hover'}
        >
            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="category" header="Kategori" style={{ width: '150px' }} />
            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
            <Column field="status" header="Durum" style={{ width: '120px' }} body={() => <StatusBadge status="HAVUZDA" />} />
            <Column header="Müdahale" body={actionBodyTemplate} style={{ width: '200px' }} />
        </DataTable>
    );
};

export default IsHavuzuTablo;
