'use client';

import { useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export const useTaleplerim = () => {
    const { tickets, confirmTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const normalize = (val: string) => (val ? val.trim().toLocaleLowerCase('tr-TR') : '');

    // KURAL: Rol fark etmeksizin yalnızca aktif kullanıcının açtığı talepler listelenir
    const myCreatedTickets = tickets.filter((ticket) => {
        const requester = normalize(ticket.requester);
        const activeUser = normalize(currentUser.fullName);
        return requester === activeUser || requester.startsWith(activeUser);
    });

    const filteredTickets = myCreatedTickets.filter((ticket) => {
        const query = search.trim().toLocaleLowerCase('tr-TR');
        const matchesSearch =
            !query ||
            ticket.id.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.title.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.category.toLocaleLowerCase('tr-TR').includes(query);

        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
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
