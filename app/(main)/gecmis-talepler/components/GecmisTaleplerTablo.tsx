import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

export interface GecmisTaleplerTabloProps {
    tickets: Ticket[];
    onRowSelect: (ticket: Ticket) => void;
}

export const GecmisTaleplerTablo = ({ tickets, onRowSelect }: GecmisTaleplerTabloProps) => {
    return (
        <DataTable
            value={tickets}
            paginator
            rows={15}
            responsiveLayout="scroll"
            emptyMessage="Kapatılmış talep bulunamadı."
            onRowClick={(event) => onRowSelect(event.data as Ticket)}
            rowClassName={() => 'cursor-pointer hover:surface-hover'}
        >
            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="category" header="Kategori" style={{ width: '160px' }} />
            <Column field="requester" header="Talep Sahibi" style={{ width: '160px' }} />
            <Column field="assignee" header="Çözen Uzman" body={(r: Ticket) => r.assignee || '-'} style={{ width: '160px' }} />
            <Column field="createdAt" header="Açılış Tarihi" style={{ width: '150px' }} />
            <Column field="closedAt" header="Kapanış Tarihi" style={{ width: '150px' }} body={(r: Ticket) => (r.closedAt ? new Date(r.closedAt).toLocaleString('tr-TR') : '-')} />
            <Column field="status" header="Durum" style={{ width: '120px' }} body={() => <StatusBadge status="KAPATILDI" />} />
            <Column
                header=""
                style={{ width: '60px' }}
                body={(rowData: Ticket) => (
                    <Button icon="pi pi-eye" rounded outlined severity="secondary" tooltip="Talep Detayı" onClick={(e) => { e.stopPropagation(); onRowSelect(rowData); }} />
                )}
            />
        </DataTable>
    );
};

export default GecmisTaleplerTablo;
