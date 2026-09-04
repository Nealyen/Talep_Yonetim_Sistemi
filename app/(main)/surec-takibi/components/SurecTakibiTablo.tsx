import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Ticket } from '@/layout/context/TicketContext';

export interface SurecTakibiTabloProps {
    tickets: Ticket[];
    onAssign: (ticket: Ticket) => void;
    onUnassign: (ticket: Ticket) => void;
}

export const SurecTakibiTablo = ({ tickets, onAssign, onUnassign }: SurecTakibiTabloProps) => {
    return (
        <DataTable value={tickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Talep bulunamadı.">
            <Column field="id" header="Kayıt ID" style={{ width: '120px' }} />
            <Column field="title" header="Talep Tanımı" />
            <Column field="category" header="Kategori" style={{ width: '140px' }} />
            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
            <Column field="requester" header="Talep Sahibi" />
            <Column
                field="assignee"
                header="Görevli Uzman"
                body={(r: Ticket) => {
                    if (r.status === 'ATAMA_BEKLİYOR') return <span className="text-orange-500 font-bold">{r.pendingAssignee} (Onay Bekliyor)</span>;
                    return r.assignee || <span className="text-red-500 font-bold">ATANMADI</span>;
                }}
            />
            <Column
                header="Koordinasyon"
                body={(rowData: Ticket) => (
                    <div className="flex gap-2">
                        <Button
                            label={rowData.assignee || rowData.pendingAssignee ? 'Uzmanı Değiştir' : 'Uzman Ata'}
                            icon="pi pi-user-edit"
                            size="small"
                            severity="help"
                            onClick={() => onAssign(rowData)}
                            disabled={['KAPATILDI', 'REDDEDİLDİ'].includes(rowData.status)}
                        />
                        {(rowData.assignee || rowData.pendingAssignee) && !['KAPATILDI', 'REDDEDİLDİ'].includes(rowData.status) && (
                            <Button
                                label="İlişkiyi Kes"
                                icon="pi pi-user-minus"
                                size="small"
                                severity="danger"
                                outlined
                                onClick={() => onUnassign(rowData)}
                            />
                        )}
                    </div>
                )}
                style={{ width: '280px' }}
            />
        </DataTable>
    );
};

export default SurecTakibiTablo;
