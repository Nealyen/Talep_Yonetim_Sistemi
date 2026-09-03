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
mesai kayır alanındaki verilerin db ye gitmeden önceki Geçici bekleme alanı

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
