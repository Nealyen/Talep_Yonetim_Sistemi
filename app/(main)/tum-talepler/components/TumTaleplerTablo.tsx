import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

export interface TumTaleplerTabloProps {
    tickets: Ticket[];
    isAdmin: boolean;
    onRowSelect: (ticket: Ticket) => void;
    onEdit: (ticket: Ticket) => void;
}

export const TumTaleplerTablo = ({ tickets, isAdmin, onRowSelect, onEdit }: TumTaleplerTabloProps) => {
    const actionBodyTemplate = (rowData: Ticket) => (
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
            {isAdmin && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="warning"
                    tooltip="Talebi Düzenle (Admin Yetkisi)"
                    onClick={(e) => {
                        e.stopPropagation();
                        onEdit(rowData);
                    }}
                />
            )}
        </div>
    );

    return (
        <DataTable
            value={tickets}
            paginator
            rows={10}
            responsiveLayout="scroll"
            onRowClick={(event) => onRowSelect(event.data as Ticket)}
            rowClassName={() => 'cursor-pointer hover:surface-hover'}
        >
            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
            <Column field="title" header="Talep Başlığı" />
            <Column field="category" header="Kategori" style={{ width: '150px' }} />
            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
            <Column field="requester" header="Talep Sahibi" style={{ width: '160px' }} />
            <Column field="assignee" header="Atanan Uzman" body={(r) => r.assignee || 'Atama Bekliyor'} style={{ width: '160px' }} />
            <Column field="status" header="Durum" style={{ width: '140px' }} body={(rowData: Ticket) => <StatusBadge status={rowData.status} />} />
            <Column field="createdAt" header="Tarih" style={{ width: '140px' }} />
            <Column header="İşlem" body={actionBodyTemplate} style={{ width: isAdmin ? '130px' : '90px' }} />
        </DataTable>
    );
};

export default TumTaleplerTablo;
