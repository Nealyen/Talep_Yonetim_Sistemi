'use client';

import { useMemo } from 'react';
import { useTickets, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export interface PendingWorkLogItem {
    ticketId: string;
    ticketTitle: string;
    workLog: WorkLog;
}

/**
 * Aktif kullanıcının onayını bekleyen mesai kayıtlarını döner.
 * Önceden her sayfada (tum-talepler, taleplerim, is-havuzu, uzman-aktif-gorevler)
 * ayrı ayrı kopyalanan bu hesaplama artık tek bir yerde yaşıyor.
 */
export const usePendingWorkLogs = (): PendingWorkLogItem[] => {
    const { tickets } = useTickets();
    const { currentUser } = useUser();

    return useMemo(() => {
        return tickets.reduce<PendingWorkLogItem[]>((acc, ticket) => {
            const pendingLogs = (ticket.pendingWorkLogs || []).filter(
                (log) => log.fullName === currentUser.fullName && log.status === 'PENDING'
            );
            pendingLogs.forEach((log) => {
                acc.push({ ticketId: ticket.id, ticketTitle: ticket.title, workLog: log });
            });
            return acc;
        }, []);
    }, [tickets, currentUser.fullName]);
};

export default usePendingWorkLogs;
