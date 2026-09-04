'use client';

import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export const useIsHavuzu = () => {
    const { tickets, assignTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);

    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');

    // KURAL: Koordinatör de teknisyen gibi havuzdaki işleri üzerine alabilir; salt okunur
    // sadece işi fiilen üstlenemeyecek roller (ör. Çalışan/Talep Sahibi) için geçerlidir.
    const isTechnician = currentUser.role === 'TEKNISYEN' || currentUser.role === 'ADMIN' || currentUser.role === 'KOORDINATOR';

    // KURAL: Havuzda yalnızca henüz kimseye atanmamış (boşta) ve 'YENİ' durumundaki açık talepler listelenir
    const unassignedTickets = tickets.filter((ticket) => !ticket.assignee && ticket.status === 'YENİ');

    const filteredTickets = unassignedTickets.filter(
        (ticket) =>
            (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
            (!priorityFilter || ticket.priority === priorityFilter)
    );

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setHistoryDialogVisible(true);
    };

    const handleRelease = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const isMyOwnTicket = (ticket: Ticket) => ticket.requester.trim().toLocaleLowerCase('tr-TR') === currentUser.fullName.trim().toLocaleLowerCase('tr-TR');

    const handleTakeOwnership = async (ticket: Ticket) => {
        if (isMyOwnTicket(ticket)) return;

        const assigned = await assignTicket(ticket.id, currentUser.fullName);
        if (assigned) {
            toast.current?.show({
                severity: 'success',
                summary: 'Görev Zimmetlendi',
                detail: 'Talep üzerinize alındı ve "Aktif Görevlerim" sayfasına aktarıldı.',
                life: 2500
            });
        }
    };

    const handleActionReasonConfirm = (messageText?: string) => {
        if (!selectedTicket) return;
        if (actionType === 'release') {
            void handleRelease(selectedTicket.id, messageText);
        } else {
            void handleComplete(selectedTicket.id, messageText);
        }
    };

    return {
        toast,
        isLoading,
        loadError,
        search,
        setSearch,
        priorityFilter,
        setPriorityFilter,
        selectedTicket,
        historyDialogVisible,
        setHistoryDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        isTechnician,
        filteredTickets,
        isMyOwnTicket,
        openTicketHistory,
        handleTakeOwnership,
        handleActionReasonConfirm
    };
};
