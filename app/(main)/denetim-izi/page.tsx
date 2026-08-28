'use client';

import React, { useEffect, useState } from 'react';
import { useTickets } from '@/layout/context/TicketContext';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';

const DenetimIziPage = () => {
    const { tickets } = useTickets();
    const [apiLogs, setApiLogs] = useState<{ id: string; action: string; userId: string; ticketId?: string; date: string; detail: string }[]>([]);

    useEffect(() => {
        fetch('/api/audit').then((response) => response.json()).then(setApiLogs).catch(() => setApiLogs([]));
    }, []);

    // Tüm biletlerin geçmişlerini tek bir düz log dizisinde birleştirme
    const ticketLogs = tickets.flatMap((ticket) =>
        ticket.history.map((h, index) => ({
            logId: `LOG-${ticket.id}-${index + 1}`,
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            action: h.action,
            user: h.user,
            date: h.date
        }))
    ).reverse();

    const allLogs = [
        ...ticketLogs,
        ...apiLogs.map((log) => ({
            logId: log.id,
            ticketId: log.ticketId || log.detail.match(/TLP-\d{4}-\d{3}/)?.[0] || '-',
            ticketTitle: log.detail,
            action: log.action,
            user: log.userId,
            date: log.date
        }))
    ].sort((first, second) => {
        const firstDate = Date.parse(first.date);
        const secondDate = Date.parse(second.date);
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate);
    });

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title="Resmi Denetim İzi (Audit Trail) Kayıtları" subTitle="5651 ve kurumsal kalite yönetimi standartlarına uygun değiştirilemez işlem kayıtları.">
                        <DataTable value={allLogs} paginator rows={10} responsiveLayout="scroll">
                            <Column field="logId" header="Log ID" style={{ width: '140px' }} />
                            <Column field="date" header="Zaman Damgası" style={{ width: '180px' }} />
                            <Column field="ticketId" header="İlgili Talep" style={{ width: '130px' }} />
                            <Column field="action" header="Gerçekleştirilen Hareket" />
                            <Column field="user" header="İşlemi Yapan Hesap" style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default DenetimIziPage;