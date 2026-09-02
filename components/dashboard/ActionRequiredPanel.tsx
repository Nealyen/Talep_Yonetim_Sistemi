'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Ticket } from '@/layout/context/TicketContext';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

export interface ActionRequiredPanelProps {
    tickets: Ticket[];
}

export const ActionRequiredPanel = ({ tickets }: ActionRequiredPanelProps) => {
    if (tickets.length === 0) {
        return (
            <Card title="Sistem Durumu">
                <div className="flex align-items-center justify-content-center p-4 border-round surface-ground text-500 font-medium">
                    Şu anda doğrudan aksiyonunuzu bekleyen bir talep bulunmamaktadır.
                </div>
            </Card>
        );
    }

    return (
        <Card
            title="Aksiyon Bekleyen Talepleriniz"
            subTitle="Aşağıdaki kayıtlarda doğrudan sizin müdahaleniz veya onayınız beklenmektedir."
        >
            <DataTable value={tickets} responsiveLayout="scroll">
                <Column field="id" header="Kayıt No" />
                <Column field="title" header="Talep Başlığı" />
                <Column field="category" header="Kategori" />
                <Column field="status" header="Durum" body={(rowData: Ticket) => <StatusBadge status={rowData.status} />} />
            </DataTable>
        </Card>
    );
};

export default ActionRequiredPanel;
