'use client';

import { useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { parseTurkishDate } from '@/utils/ticketHelpers';

export type GecmisTaleplerKapsam = 'kendi' | 'tumu';

export const useGecmisTalepler = () => {
    const { tickets, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();

    // KURAL: Admin ve Koordinatör hariç HERKES sadece kendi (kendi açtığı) geçmiş
    // taleplerini görür. Admin/Koordinatör ise "Kendi Taleplerim" / "Tüm Talepler"
    // arasında seçim yapabilir — Dashboard'daki görünüm seçiciyle aynı mantık.
    const canSeeAll = currentUser.role === 'ADMIN' || currentUser.role === 'KOORDINATOR';
    const [scope, setScope] = useState<GecmisTaleplerKapsam>(canSeeAll ? 'tumu' : 'kendi');

    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    // KURAL: Bu sayfa, sistemdeki TÜM kapatılmış taleplerin kalıcı arşividir —
    // "Taleplerim" sayfasından 1 ay sonra düşen talepler burada kalıcı olarak durur.
    // Kapsam (scope), kimin taleplerinin listeleneceğini belirler.
    const closedTickets = tickets.filter((ticket) => ticket.status === 'KAPATILDI');

    const scopedTickets =
        canSeeAll && scope === 'tumu'
            ? closedTickets
            : closedTickets.filter((ticket) => ticket.requester.trim().toLocaleLowerCase('tr-TR') === currentUser.fullName.trim().toLocaleLowerCase('tr-TR'));

    const categories = Array.from(new Set<string>(closedTickets.map((t) => t.category))).sort();

    const filteredTickets = scopedTickets
        .filter((ticket) => {
            const query = search.trim().toLocaleLowerCase('tr-TR');
            const matchesSearch =
                !query ||
                ticket.id.toLocaleLowerCase('tr-TR').includes(query) ||
                ticket.title.toLocaleLowerCase('tr-TR').includes(query) ||
                ticket.requester.toLocaleLowerCase('tr-TR').includes(query) ||
                (ticket.assignee || '').toLocaleLowerCase('tr-TR').includes(query);

            const matchesCategory = !categoryFilter || ticket.category === categoryFilter;

            const [from, to] = dateRange;
            let matchesDate = true;
            if (from) {
                const createdAt = parseTurkishDate(ticket.createdAt);
                matchesDate = createdAt >= from;
                if (matchesDate && to) {
                    const inclusiveTo = new Date(to);
                    inclusiveTo.setHours(23, 59, 59, 999);
                    matchesDate = createdAt <= inclusiveTo;
                }
            }

            return matchesSearch && matchesCategory && matchesDate;
        })
        .sort((a, b) => new Date(b.closedAt || 0).getTime() - new Date(a.closedAt || 0).getTime());

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setHistoryDialogVisible(true);
    };

    return {
        isLoading,
        loadError,
        canSeeAll,
        scope,
        setScope,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        categories,
        dateRange,
        setDateRange,
        filteredTickets,
        selectedTicket,
        historyDialogVisible,
        setHistoryDialogVisible,
        openTicketHistory
    };
};
