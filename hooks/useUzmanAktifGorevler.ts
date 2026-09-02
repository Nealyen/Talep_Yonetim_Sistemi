'use client';

import { useRef, useState } from 'react';
import { Toast } from 'primereact/toast';
import { confirmDialog } from 'primereact/confirmdialog';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export type ActionType = 'release' | 'complete';

/**
 * "Üzerimdeki Aktif Görevler" sayfasının tüm state'i ve iş mantığı.
 * Önceden 366 satırlık page.tsx içine gömülüydü; artık page.tsx sadece
 * bu hook'u çağırıp component'leri diziyor.
 */
export const useUzmanAktifGorevler = () => {
    const { tickets, completeTicket, unassignTicket, assignTicket, respondToAssignment, updateTicket, requestWorkLogApproval } = useTickets();
    const { currentUser, users } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [delegateDialogVisible, setDelegateDialogVisible] = useState(false);
    const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
    const [workLogDialogVisible, setWorkLogDialogVisible] = useState(false);
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

    const handleWorkLogAction = async (
        action: 'addWorkLog' | 'requestApproval' | 'close',
        payload?: { workLog?: import('@/layout/context/TicketContext').WorkLog; ticketId?: string | null }
    ) => {
        if (action === 'close') {
            setWorkLogDialogVisible(false);
            return;
        }

        if (action === 'requestApproval' && payload?.workLog && payload.ticketId) {
            const success = await requestWorkLogApproval(payload.ticketId, payload.workLog);
            if (success) {
                toast.current?.show({ severity: 'info', summary: 'Onay İstendi', detail: 'Mesai kaydı onay için gönderildi.', life: 2500 });
                setWorkLogDialogVisible(false);
            }
            return;
        }

        if (action === 'addWorkLog' && payload?.workLog && payload.ticketId) {
            const currentTicket = tickets.find((ticket) => ticket.id === payload.ticketId);
            if (!currentTicket) return;

            const description = payload.workLog.description?.trim();
            const success = await updateTicket(
                payload.ticketId,
                { workLogs: [...(currentTicket.workLogs || []), payload.workLog] },
                currentUser.fullName
            );

            if (success) {
                if (description) {
                    const ticketWithLog = tickets.find((ticket) => ticket.id === payload.ticketId);
                    if (ticketWithLog) {
                        const updatedHistory = [
                            ...ticketWithLog.history,
                            { date: new Date().toLocaleString('tr-TR'), action: `Mesai kaydı eklendi. Açıklama: ${description}`, user: currentUser.fullName }
                        ];
                        await updateTicket(payload.ticketId, { history: updatedHistory }, currentUser.fullName);
                    }
                }

                toast.current?.show({ severity: 'success', summary: 'Mesai Eklendi', detail: 'Mesai kaydı listeye eklendi.', life: 2000 });
                setWorkLogDialogVisible(false);
            }
        }
    };

    const onRowClick = (event: any) => openEditDialog(event.data as Ticket);

    // NOT: Orijinal kodda bu buton yalnızca bir onay diyaloğu gösterir; kaydetme
    // işlemi zaten TicketEditModal'ın kendi "Kaydet" akışıyla (handleSaveEdit) yapılıyor.
    // Davranış birebir korunuyor.
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
                if (selectedTicket) {
                    setSelectedTicket(selectedTicket);
                }
            }
        });
    };

    return {
        toast,
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
        workLogDialogVisible,
        setWorkLogDialogVisible,
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
        handleWorkLogAction,
        onRowClick
    };
};

export default useUzmanAktifGorevler;
