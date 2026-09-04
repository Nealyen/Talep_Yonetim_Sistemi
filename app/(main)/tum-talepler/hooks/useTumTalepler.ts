'use client';

import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export const useTumTalepler = () => {
    const { tickets, assignTicket, updateTicket } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');

    // KURAL: Talebin sahibi olmasa bile TÜM talepleri düzenleme yetkisi yalnızca ADMIN rolüne aittir.
    const isAdmin = currentUser.role === 'ADMIN';

    const handleRelease = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setHistoryDialogVisible(true);
    };

    const openTicketEdit = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setEditDialogVisible(true);
    };

    const handleSaveEdit = async (updatedData: Partial<Ticket>) => {
        if (!selectedTicket) return;

        // actorRole'ü göndermek: TicketContext bu talebin sahibi başkasıysa geçmişe
        // otomatik olarak "ADMIN MÜDAHALESİ" notu düşer (hem bu talebin tarihçesinde
        // hem de Denetim İzi sayfasında görünür).
        const success = await updateTicket(selectedTicket.id, updatedData, currentUser.fullName, currentUser.role);
        if (success) {
            toast.current?.show({ severity: 'success', summary: 'Kayıt Güncellendi', detail: 'Değişiklikler kaydedildi.', life: 3000 });
            setEditDialogVisible(false);
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
        tickets,
        currentUser,
        isAdmin,
        selectedTicket,
        historyDialogVisible,
        setHistoryDialogVisible,
        editDialogVisible,
        setEditDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        openTicketHistory,
        openTicketEdit,
        handleSaveEdit,
        handleActionReasonConfirm
    };
};
