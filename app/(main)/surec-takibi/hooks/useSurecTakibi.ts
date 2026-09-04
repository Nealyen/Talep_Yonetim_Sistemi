'use client';

import { useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';

export const useSurecTakibi = () => {
    const { tickets, assignTicket, unassignTicket, isLoading, loadError } = useTickets();
    const { users, currentUser } = useUser();

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [selectedTech, setSelectedTech] = useState<string>('');
    const [assignDialog, setAssignDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Teknisyen, Admin ve Koordinatör atanabilir; talep sahibi veya mevcut atanan hariç tutulur
    const availableTechnicians = users.filter((u) => {
        const isValidRole = ['TEKNISYEN', 'ADMIN', 'KOORDINATOR'].includes(u.role);
        const isNotRequester = selectedTicket ? u.fullName !== selectedTicket.requester : true;
        const isNotCurrentAssignee = selectedTicket ? u.fullName !== selectedTicket.assignee : true;

        return isValidRole && isNotRequester && isNotCurrentAssignee;
    });

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.status !== 'KAPATILDI' &&
            (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
            (!categoryFilter || ticket.category === categoryFilter)
    );

    const openAssignDialog = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setSelectedTech('');
        setAssignDialog(true);
    };

    const closeAssignDialog = () => {
        setAssignDialog(false);
        setSelectedTicket(null);
        setSelectedTech('');
    };

    const handleManualAssign = async () => {
        if (!selectedTicket || !selectedTech) return;

        const isSoDViolation = selectedTicket.requester === selectedTech;

        if (isSoDViolation) {
            confirmDialog({
                message: `DİKKAT: [${selectedTech}] bu talebin bizzat sahibidir. Görevler Ayrılığı (SoD) ilkesi gereği bir personel kendi açtığı talebi teknik olarak üstlenemez. Yine de zorlamak istiyor musunuz?`,
                header: 'SoD İhlali Uyarısı',
                icon: 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                acceptLabel: 'Riski Kabul Et ve Ata',
                rejectLabel: 'İptal',
                accept: async () => {
                    if (await assignTicket(selectedTicket.id, selectedTech, currentUser.fullName)) {
                        setAssignDialog(false);
                        setSelectedTech('');
                    }
                }
            });
            return;
        }

        if (await assignTicket(selectedTicket.id, selectedTech, currentUser.fullName)) {
            setAssignDialog(false);
            setSelectedTech('');
        }
    };

    // KURAL: "İlişkiyi Kes" artık direkt silmiyor; önce onay penceresi çıkarıyor.
    const requestUnassign = (ticket: Ticket) => {
        confirmDialog({
            message: `[${ticket.id}] numaralı talebin, atanmış olan [${ticket.assignee || ticket.pendingAssignee}] ile ilişkisini kesmek istediğinize emin misiniz? Talep yeniden atanmayı bekleyen duruma geri döner.`,
            header: 'İlişkiyi Kesme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Evet, İlişkiyi Kes',
            rejectLabel: 'Vazgeç',
            accept: () => unassignTicket(ticket.id)
        });
    };

    return {
        isLoading,
        loadError,
        selectedTicket,
        selectedTech,
        setSelectedTech,
        assignDialog,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        availableTechnicians,
        filteredTickets,
        openAssignDialog,
        closeAssignDialog,
        handleManualAssign,
        requestUnassign
    };
};
