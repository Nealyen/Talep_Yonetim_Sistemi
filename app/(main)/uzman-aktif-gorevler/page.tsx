'use client';

import React, { useRef, useState } from 'react';
import { useTickets, Ticket, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import TicketEditModal from '@/app/components/ticket/TicketEditModal';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketAssignModal from '@/app/components/ticket/TicketAssignModal';
import TicketWorkLogModal from '@/app/components/ticket/TicketWorkLogModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import WorkLogApprovalModal from '@/app/components/ticket/WorkLogApprovalModal';

const UzmanAktifGorevlerPage = () => {
    const { tickets, completeTicket, unassignTicket, assignTicket, respondToAssignment, updateTicket, requestWorkLogApproval, resolveWorkLogApproval, isLoading, loadError } = useTickets();
    const { currentUser, users } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editDialogVisible, setEditDialogVisible] = useState(false);
    const [delegateDialogVisible, setDelegateDialogVisible] = useState(false);
    const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
    const [workLogDialogVisible, setWorkLogDialogVisible] = useState(false);
    const [workLogApprovalVisible, setWorkLogApprovalVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');
    const [targetTech, setTargetTech] = useState<string>('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    const myActiveTickets = tickets.filter((ticket) => ticket.assignee === currentUser.fullName && ticket.status !== 'KAPATILDI');
    const myPendingTickets = tickets.filter((ticket) => ticket.pendingAssignee === currentUser.fullName && ticket.status === 'ATAMA_BEKLİYOR');
    const pendingWorkLogsForCurrentUser = tickets.reduce<Array<{ ticketId: string; ticketTitle: string; workLog: WorkLog }>>((acc, ticket) => {
        const pendingLogs = (ticket.pendingWorkLogs || []).filter((log) => log.fullName === currentUser.fullName && log.status === 'PENDING');
        pendingLogs.forEach((log) => {
            acc.push({ ticketId: ticket.id, ticketTitle: ticket.title, workLog: log });
        });
        return acc;
    }, []);

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

    const getStatusSeverity = (status: Ticket['status']): 'info' | 'success' | 'warning' | 'danger' | null => {
        switch (status) {
            case 'YENİ': return 'info';
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return null;
            case 'KAPATILDI': return 'success';
            case 'REDDEDİLDİ': return 'danger';
            case 'ATAMA_BEKLİYOR': return 'warning';
            default: return null;
        }
    };

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

    const handleAssignAction = async (action: 'assign' | 'accept' | 'reject' | 'close', payload?: { ticketId?: string | null; technician?: string; message?: string }) => {
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

    const handleWorkLogAction = async (action: 'addWorkLog' | 'requestApproval' | 'close', payload?: { workLog?: WorkLog; ticketId?: string | null }) => {
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
            const success = await updateTicket(payload.ticketId, {
                workLogs: [...(currentTicket.workLogs || []), payload.workLog],
            }, currentUser.fullName);

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
                    const modalTicket = selectedTicket;
                    setSelectedTicket(modalTicket);
                }
            },
        });
    };

    const actionBodyTemplate = (rowData: Ticket) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
                icon="pi pi-search"
                rounded
                outlined
                severity="secondary"
                tooltip="Önizleme ve Tarihçe"
                onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTicket(rowData);
                    setDialogVisible(true);
                }}
            />
            {rowData.status === 'İŞLEMDE' && (
                <>
                    <Button icon="pi pi-check" rounded severity="success" tooltip="Tamamlandı Olarak Bildir" onClick={(e) => { e.stopPropagation(); openCompleteReasonModal(rowData.id); }} />
                    <Button icon="pi pi-times" rounded severity="danger" tooltip="Havuza İade Et" onClick={(e) => { e.stopPropagation(); setSelectedTicket(rowData); openReleaseReasonModal(); }} />
                    <Button icon="pi pi-send" rounded severity="help" tooltip="Görevi Devret" onClick={(e) => { e.stopPropagation(); setSelectedTicket(rowData); setDelegateDialogVisible(true); }} />
                </>
            )}
        </div>
    );

    const editModalFooter = (
        <div className="flex flex-wrap justify-content-between align-items-center w-full gap-2 pt-2 border-top-1 surface-border">
            <div className="flex flex-wrap gap-2">
                <Button label="Tarihçe / Detay" icon="pi pi-history" severity="secondary" outlined size="small" onClick={() => { setEditDialogVisible(false); setDialogVisible(true); }} />
                {selectedTicket?.status === 'İŞLEMDE' && (
                    <>
                        <Button label="Havuza Bırak" icon="pi pi-arrow-circle-left" severity="danger" outlined size="small" onClick={() => { setSelectedTicket(selectedTicket); openReleaseReasonModal(); }} />
                        <Button label="Devret" icon="pi pi-send" severity="help" outlined size="small" onClick={() => setDelegateDialogVisible(true)} />
                    </>
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Değişiklikleri Kaydet" icon="pi pi-check" severity="success" onClick={confirmSave} />
            </div>
        </div>
    );

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN', 'KOORDINATOR']}>
            <div className="grid">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="col-12">
                    <Card title={<div className="flex justify-content-between align-items-center gap-2"><div><div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div></div><div className="flex align-items-center gap-2"><Button label="Atama İşlemleri" icon="pi pi-inbox" severity={myPendingTickets.length > 0 ? 'warning' : 'secondary'} badge={myPendingTickets.length > 0 ? myPendingTickets.length.toString() : undefined} badgeClassName="p-badge-danger" onClick={() => setPendingDialogVisible(true)} /><Button label="Mesai Onayları" icon="pi pi-check-circle" severity={pendingWorkLogsForCurrentUser.length > 0 ? 'info' : 'secondary'} badge={pendingWorkLogsForCurrentUser.length > 0 ? pendingWorkLogsForCurrentUser.length.toString() : undefined} badgeClassName="p-badge-info" onClick={() => setWorkLogApprovalVisible(true)} /></div></div>}>
                        <DataTable value={filteredTickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Aktif bir görev bulunmamaktadır." onRowClick={onRowClick} rowClassName={() => 'cursor-pointer hover:surface-hover'}>
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '180px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column field="status" header="Durum" style={{ width: '140px' }} body={(r: Ticket) => <Tag value={r.status} severity={getStatusSeverity(r.status)} />} />
                            <Column header="İşlemler" body={actionBodyTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>

                <TicketEditModal
                    visible={editDialogVisible}
                    ticket={selectedTicket}
                    footer={editModalFooter}
                    onHide={() => setEditDialogVisible(false)}
                    onSave={handleSaveEdit}
                    onOpenWorkLog={() => setWorkLogDialogVisible(true)}
                />

                <TicketHistoryModal
                    visible={dialogVisible}
                    ticket={selectedTicket}
                    onHide={() => setDialogVisible(false)}
                    onAction={(action) => {
                        if (action === 'close') setDialogVisible(false);
                    }}
                />

                <TicketAssignModal
                    visible={pendingDialogVisible}
                    ticket={selectedTicket}
                    availableTechnicians={eligibleTechnicians}
                    mode="pending"
                    selectedTechnician={targetTech}
                    onHide={() => setPendingDialogVisible(false)}
                    onAction={handleAssignAction}
                    onTechnicianChange={setTargetTech}
                    pendingAssignments={myPendingTickets}
                />

                <TicketAssignModal
                    visible={delegateDialogVisible}
                    ticket={selectedTicket}
                    availableTechnicians={availableDelegates}
                    mode="delegate"
                    selectedTechnician={targetTech}
                    onHide={() => {
                        setDelegateDialogVisible(false);
                        setTargetTech('');
                    }}
                    onAction={handleAssignAction}
                    onTechnicianChange={setTargetTech}
                />

                <TicketWorkLogModal
                    visible={workLogDialogVisible}
                    ticket={selectedTicket}
                    currentUser={currentUser}
                    eligibleTechnicians={eligibleTechnicians}
                    onHide={() => setWorkLogDialogVisible(false)}
                    onAction={handleWorkLogAction}
                />

                <TicketActionReasonModal
                    visible={actionReasonModalVisible}
                    actionType={actionType}
                    ticket={selectedTicket}
                    onHide={() => setActionReasonModalVisible(false)}
                    onConfirm={(messageText) => {
                        if (!selectedTicket) return;
                        if (actionType === 'release') {
                            void handleRelease(selectedTicket.id, messageText);
                        } else {
                            void handleComplete(selectedTicket.id, messageText);
                        }
                    }}
                />

                <WorkLogApprovalModal
                    visible={workLogApprovalVisible}
                    pendingData={pendingWorkLogsForCurrentUser}
                    onHide={() => setWorkLogApprovalVisible(false)}
                    onResolve={async (ticketId, logId, isApproved) => {
                        const success = await resolveWorkLogApproval(ticketId, logId, isApproved);
                        if (success) {
                            toast.current?.show({
                                severity: isApproved ? 'success' : 'warn',
                                summary: isApproved ? 'Mesai Onaylandı' : 'Mesai Reddedildi',
                                detail: isApproved ? 'Mesai kaydı onaylandı.' : 'Mesai kaydı reddedildi.',
                                life: 2500,
                            });
                            setWorkLogApprovalVisible(false);
                        }
                    }}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default UzmanAktifGorevlerPage;