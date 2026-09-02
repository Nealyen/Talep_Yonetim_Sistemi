'use client';

import { useEffect, useState } from 'react';
import { useTickets } from '@/layout/context/TicketContext';

export interface AuditLogRow {
    logId: string;
    ticketId: string;
    ticketTitle: string;
    action: string;
    user: string;
    date: string;
}

interface ApiAuditLog {
    id: string;
    action: string;
    userId: string;
    ticketId?: string;
    date: string;
    detail: string;
}

/**
 * Ticket geçmişi + /api/audit uç noktasından gelen kayıtları tek, tarihe göre
 * sıralanmış bir log listesinde birleştirir. Önceden denetim-izi/page.tsx
 * içine gömülüydü.
 */
export const useAuditLogs = (): AuditLogRow[] => {
    const { tickets } = useTickets();
    const [apiLogs, setApiLogs] = useState<ApiAuditLog[]>([]);

    useEffect(() => {
        fetch('/api/audit')
            .then((response) => response.json())
            .then(setApiLogs)
            .catch(() => setApiLogs([]));
    }, []);

    const ticketLogs: AuditLogRow[] = tickets
        .flatMap((ticket) =>
            ticket.history.map((h, index) => ({
                logId: `LOG-${ticket.id}-${index + 1}`,
                ticketId: ticket.id,
                ticketTitle: ticket.title,
                action: h.action,
                user: h.user,
                date: h.date
            }))
        )
        .reverse();

    const apiLogRows: AuditLogRow[] = apiLogs.map((log) => ({
        logId: log.id,
        ticketId: log.ticketId || log.detail.match(/TLP-\d{4}-\d{3}/)?.[0] || '-',
        ticketTitle: log.detail,
        action: log.action,
        user: log.userId,
        date: log.date
    }));

    return [...ticketLogs, ...apiLogRows].sort((first, second) => {
        const firstDate = Date.parse(first.date);
        const secondDate = Date.parse(second.date);
        return (Number.isNaN(secondDate) ? 0 : secondDate) - (Number.isNaN(firstDate) ? 0 : firstDate);
    });
};

export default useAuditLogs;
