import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';
import { ActiveTaskActionButtons } from '@/components/tickets/ActiveTaskActionButtons';

export interface AktifGorevlerTabloProps {
    tickets: Ticket[];
    onRowClick: (event: any) => void;
    onPreview: (ticket: Ticket) => void;
    onComplete: (ticketId: string) => void;
    onRelease: (ticket: Ticket) => void;
    onDelegate: (ticket: Ticket) => void;
}

export const AktifGorevlerTablo = ({ tickets, onRowClick, onPreview, onComplete, onRelease, onDelegate }: AktifGorevlerTabloProps) => {
    return (
        <DataTable
            value={tickets}
            paginator
            rows={10}
            responsiveLayout="scroll"
            emptyMessage="Aktif bir görev bulunmamaktadır."
            onRowClick={onRowClick}
            rowClassName={() => 'cursor-pointer hover:surface-hover'}
        >
            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="category" header="Kategori" style={{ width: '180px' }} />
            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
            <Column field="status" header="Durum" style={{ width: '140px' }} body={(r: Ticket) => <StatusBadge status={r.status} />} />
            <Column
                header="İşlemler"
                body={(rowData: Ticket) => (
                    <ActiveTaskActionButtons ticket={rowData} onPreview={onPreview} onComplete={onComplete} onRelease={onRelease} onDelegate={onDelegate} />
                )}
                style={{ width: '200px' }}
            />
        </DataTable>
    );
};

export default AktifGorevlerTablo;
