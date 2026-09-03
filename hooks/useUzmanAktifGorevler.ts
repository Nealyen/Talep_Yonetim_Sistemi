'use client';

import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import type { TicketEditModalHandle } from '@/app/components/ticket/TicketEditModal';

export type ActionType = 'release' | 'complete';

/**
 * "Üzerimdeki Aktif Görevler" sayfasının tüm işlevlerini yönetiyor
 * bu hook'u çağırıp component'leri diziyor.
 */
export const useUzmanAktifGorevler = () => {
    const { tickets, completeTicket, unassignTicket, assignTicket, respondToAssignment, updateTicket } = useTickets();
    const { currentUser, users } = useUser();
    const toast = useRef<Toast>(null);
    const editModalRef = useRef<TicketEditModalHandle>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [delegateDialogVisible, setDelegateDialogVisible] = useState(false);
    const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<ActionType>('release');
    const [targetTech, setTargetTech] = useState<string>('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    const myActiveTickets = tickets.filter((ticket) => ticket.assignee === currentUser.fullName && ticket.status !== 'KAPATILDI');
    const myPendingTickets = tickets.filter((ticket) => ticket.pendingAssignee === currentUser.fullName && ticket.status === 'ATAMA_BEKLİYOR');

    const filteredTickets = myActiveTickets.filter((ticket) => {
        const query = search.toLocaleLowerCase('tr-TR');
        return (
            (!query || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(query)) &&
            (!statusFilter || ticket.status === statusFilter) &&
            (!priorityFilter || ticket.priority === priorityFilter)
        );
    });

    const eligibleTechnicians = users.filter((u) => u.role === 'TEKNISYEN' || u.role === 'ADMIN' || u.role === 'KOORDINATOR');
    const availableDelegates = eligibleTechnicians.filter((u) => u.fullName !== currentUser.fullName && (selectedTicket ? u.fullName !== selectedTicket.requester : true));

    const openEditDialog = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDialogVisible(false);
        setEditDialogVisible(true);
    };

    const handleSaveEdit = async (updatedData: Partial<Ticket>) => {
        if (!selectedTicket) return;

        const success = await updateTicket(selectedTicket.id, updatedData, currentUser.fullName);
        if (success) {
            toast.current?.show({ severity: 'success', summary: 'Kayıt Güncellendi', detail: 'Değişiklikler kaydedildi.', life: 3000 });
            setEditDialogVisible(false);
        }
    };

    const handleRelease = async (ticketId: string, message?: string) => {
        await unassignTicket(ticketId, currentUser.fullName, currentUser.role, message);
        setDialogVisible(false);
        setEditDialogVisible(false);
        setDelegateDialogVisible(false);
        setActionReasonModalVisible(false);
    };

    const openReleaseReasonModal = () => {
        if (!selectedTicket) return;
        setActionType('release');
        setActionReasonModalVisible(true);
    };

    const handleAcceptAssignment = async (ticketId: string) => {
        await respondToAssignment(ticketId, true, currentUser.fullName);
        setPendingDialogVisible(false);
    };

    const handleRejectAssignment = async (ticketId: string) => {
        await respondToAssignment(ticketId, false, currentUser.fullName);
        setPendingDialogVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await completeTicket(ticketId, currentUser.fullName, currentUser.role, message);
        setDialogVisible(false);
        setEditDialogVisible(false);
        setActionReasonModalVisible(false);
    };

    const openCompleteReasonModal = (ticketId: string) => {
        setSelectedTicket(tickets.find((ticket) => ticket.id === ticketId) || null);
        setActionType('complete');
        setActionReasonModalVisible(true);
    };

    const handleAssignAction = async (
        action: 'assign' | 'accept' | 'reject' | 'close',
        payload?: { ticketId?: string | null; technician?: string; message?: string }
    ) => {
        if (action === 'close') {
            setPendingDialogVisible(false);
            setDelegateDialogVisible(false);
            return;
        }

        if (action === 'accept' && payload?.ticketId) {
            await handleAcceptAssignment(payload.ticketId);
            return;
        }

        if (action === 'reject' && payload?.ticketId) {
            await handleRejectAssignment(payload.ticketId);
            return;
        }

        if (action === 'assign' && payload?.ticketId && payload.technician) {
            await assignTicket(payload.ticketId, payload.technician, currentUser.fullName, currentUser.role, payload.message);
            setDelegateDialogVisible(false);
            setEditDialogVisible(false);
            setDialogVisible(false);
            setTargetTech('');
        }
    };

    const onRowClick = (event: any) => openEditDialog(event.data as Ticket);

    // onay sonrası modalın kendi
    // triggerSave() metodu çağrılıyor; bu da tıpkı modalın dahili "Kaydet" butonuna
    // basılmış gibi gerçek form verisini onSave (handleSaveEdit) üzerinden gönderiyor.
    const confirmSave = () => {
        if (!selectedTicket) return;
        confirmDialog({
            message: 'Yapılan değişiklikleri kaydetmek istediğinize emin misiniz?',
            header: 'Kayıt Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Evet, Kaydet',
            rejectLabel: 'İptal',
            acceptClassName: 'p-button-success',
            accept: () => {
                editModalRef.current?.triggerSave();
            }
        });
    };

    return {
        toast,
        editModalRef,
        currentUser,
        confirmSave,
        selectedTicket,
        setSelectedTicket,
        dialogVisible,
        setDialogVisible,
        editDialogVisible,
        setEditDialogVisible,
        delegateDialogVisible,
        setDelegateDialogVisible,
        pendingDialogVisible,
        setPendingDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        targetTech,
        setTargetTech,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        priorityFilter,
        setPriorityFilter,
        myPendingTickets,
        filteredTickets,
        eligibleTechnicians,
        availableDelegates,
        openEditDialog,
        handleSaveEdit,
        handleRelease,
        openReleaseReasonModal,
        handleComplete,
        openCompleteReasonModal,
        handleAssignAction,
        onRowClick
    };
};

export default useUzmanAktifGorevler;
