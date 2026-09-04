import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

export interface TaleplerimTabloProps {
    tickets: Ticket[];
    onRowSelect: (ticket: Ticket) => void;
    onApprove: (ticketId: string) => void;
    onObject: (ticketId: string) => void;
}

export const TaleplerimTablo = ({ tickets, onRowSelect, onApprove, onObject }: TaleplerimTabloProps) => {
    const actionBodyTemplate = (rowData: Ticket) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    rounded
                    outlined
                    severity="secondary"
                    tooltip="Talep Detayı ve Tarihçe"
                    onClick={() => onRowSelect(rowData)}
                />
                {rowData.status === 'ONAY_BEKLİYOR' && (
                    <>
                        <Button icon="pi pi-check" rounded severity="success" tooltip="Çözümü Onayla (Kapat)" onClick={() => onApprove(rowData.id)} />
                        <Button icon="pi pi-times" rounded severity="danger" tooltip="Sorun Devam Ediyor (İtiraz Et)" onClick={() => onObject(rowData.id)} />
                    </>
                )}
            </div>
        );
    };

    return (
        <DataTable
            value={tickets}
            paginator
            rows={10}
            responsiveLayout="scroll"
            emptyMessage="Açtığınız herhangi bir aktif talep bulunmamaktadır."
            onRowClick={(event) => onRowSelect(event.data as Ticket)}
            rowClassName={() => 'cursor-pointer hover:surface-hover'}
        >
            <Column field="id" header="Talep No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="category" header="Kategori" style={{ width: '150px' }} />
            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
            <Column field="status" header="Durum" style={{ width: '160px' }} body={(rowData: Ticket) => <StatusBadge status={rowData.status} />} />
            <Column field="assignee" header="Atanan Uzman" body={(r: Ticket) => r.assignee || 'Henüz Atanmadı'} />
            <Column field="createdAt" header="Tarih" style={{ width: '150px' }} />
            <Column header="İşlem & Akış" body={actionBodyTemplate} style={{ width: '140px' }} />
        </DataTable>
    );
};

export default TaleplerimTablo;
