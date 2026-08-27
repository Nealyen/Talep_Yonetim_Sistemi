'use client';

import React from 'react';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { Tag } from 'primereact/tag';

const TumTaleplerPage = () => {
    const { tickets } = useTickets();

    const getStatusSeverity = (status: Ticket['status']): "info" | "success" | "warning" | "danger" | null => {
        switch (status) {
            case 'YENİ': return 'info';
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return null;
            case 'KAPATILDI': return 'success';
            default: return null;
        }
    };

    return (
        <RoleRouteGuard allowedRoles={['KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title="Tüm Talepler (Genel İzleme Paneli)" subTitle="Sistemdeki tüm birimlere ait aktif ve kapanmış taleplerin listesi.">
                        <DataTable value={tickets} paginator rows={10} responsiveLayout="scroll">
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '160px' }} />
                            <Column field="assignee" header="Atanan Uzman" body={(r) => r.assignee || 'Atama Bekliyor'} style={{ width: '160px' }} />
                            <Column 
                                field="status" 
                                header="Durum" 
                                style={{ width: '140px' }} 
                                body={(rowData: Ticket) => (
                                    <Tag 
                                        value={rowData.status} 
                                        severity={getStatusSeverity(rowData.status)} 
                                        className={rowData.status === 'ONAY_BEKLİYOR' ? "bg-purple-600 text-white" : ""}
                                    />
                                )} 
                            />
                            <Column field="createdAt" header="Tarih" style={{ width: '140px' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default TumTaleplerPage;