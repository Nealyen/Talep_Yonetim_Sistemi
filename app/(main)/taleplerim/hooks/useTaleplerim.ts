'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { parseTurkishDate } from '@/utils/ticketHelpers';

// KURAL: Kapatılmış bir talep, kapatıldığı andan (closedAt) itibaren 1 ay sonra
// Taleplerim sayfasından otomatik olarak kaldırılır. Talep verisi silinmiyor —
// herkesin görebildiği "Geçmiş Talepler" arşiv sayfasında görünmeye devam eder.
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export const useTaleplerim = () => {
    const { tickets, confirmTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();
    const searchParams = useSearchParams();

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);

    // KURAL: Gösterge Panelindeki "Son 1 Ay / Son 3 Ay / Tüm Zamanlar" grafiklerine
    // tıklanınca ?range=1m / ?range=3m / ?range=all parametresiyle bu sayfaya
    // yönlendiriliyoruz. Sayfa ilk açıldığında bu parametreyi okuyup tarih filtresini
    // buna göre otomatik dolduruyoruz (durum/state farketmeksizin, sadece tarihe göre).
    useEffect(() => {
        const range = searchParams?.get('range');
        if (!range || range === 'all') return;

        const now = new Date();
        const from = new Date();
        if (range === '1m') from.setMonth(now.getMonth() - 1);
        else if (range === '3m') from.setMonth(now.getMonth() - 3);
        else return;

        setDateRange([from, now]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const normalize = (val: string) => (val ? val.trim().toLocaleLowerCase('tr-TR') : '');

    // KURAL: Rol fark etmeksizin yalnızca aktif kullanıcının açtığı talepler listelenir
    const myCreatedTickets = tickets.filter((ticket) => {
        const requester = normalize(ticket.requester);
        const activeUser = normalize(currentUser.fullName);
        return requester === activeUser || requester.startsWith(activeUser);
    });

    // KURAL: Kapatılıp üzerinden 1 aydan fazla geçmiş talepler bu sayfada artık
    // gösterilmiyor (arşive taşınmış sayılırlar, "Geçmiş Talepler" sayfasından
    // hâlâ görülebilirler).
    const activeOrRecentlyClosedTickets = myCreatedTickets.filter((ticket) => {
        if (ticket.status !== 'KAPATILDI') return true;
        if (!ticket.closedAt) return true;
        return Date.now() - new Date(ticket.closedAt).getTime() < ONE_MONTH_MS;
    });

    const filteredTickets = activeOrRecentlyClosedTickets.filter((ticket) => {
        const query = search.trim().toLocaleLowerCase('tr-TR');
        const matchesSearch =
            !query ||
            ticket.id.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.title.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.category.toLocaleLowerCase('tr-TR').includes(query);

        const matchesStatus = !statusFilter || ticket.status === statusFilter;

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

        return matchesSearch && matchesStatus && matchesDate;
    });

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDialogVisible(true);
    };

    const handleRelease = async (ticketId: string, message?: string) => {
        await confirmTicket(ticketId, false, currentUser.fullName);
        setActionReasonModalVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await confirmTicket(ticketId, true, currentUser.fullName);
        setActionReasonModalVisible(false);
    };

    const handleApprove = (ticketId: string) => confirmTicket(ticketId, true);
    const handleObject = (ticketId: string) => confirmTicket(ticketId, false);

    const handleActionReasonConfirm = (messageText?: string) => {
        if (!selectedTicket) return;
        if (actionType === 'release') {
            void handleRelease(selectedTicket.id, messageText);
        } else {
            void handleComplete(selectedTicket.id, messageText);
        }
    };

    return {
        isLoading,
        loadError,
        currentUser,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        dateRange,
        setDateRange,
        selectedTicket,
        dialogVisible,
        setDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        filteredTickets,
        openTicketHistory,
        handleApprove,
        handleObject,
        handleActionReasonConfirm
    };
};
