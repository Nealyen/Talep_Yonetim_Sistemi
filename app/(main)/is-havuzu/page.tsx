'use client';

import React, { useRef, useState } from 'react';
import { useTickets, Ticket, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import WorkLogApprovalModal from '@/app/components/ticket/WorkLogApprovalModal';

const IsHavuzuPage = () => {
    const { tickets, assignTicket, updateTicket, requestWorkLogApproval, resolveWorkLogApproval, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);
    
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [workLogApprovalVisible, setWorkLogApprovalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');

    const isTechnician = currentUser.role === 'TEKNISYEN' || currentUser.role === 'ADMIN';

    // KURAL: Havuzda yalnızca henüz kimseye atanmamış (boşta) ve 'YENİ' durumundaki açık talepler listelenir
    const unassignedTickets = tickets.filter((ticket) => 
        !ticket.assignee && ticket.status === 'YENİ'
    );

    const pendingWorkLogsForCurrentUser = tickets.reduce<Array<{ ticketId: string; ticketTitle: string; workLog: WorkLog }>>((acc, ticket) => {
        const pendingLogs = (ticket.pendingWorkLogs || []).filter((log) => log.fullName === currentUser.fullName && log.status === 'PENDING');
        pendingLogs.forEach((log) => {
            acc.push({ ticketId: ticket.id, ticketTitle: ticket.title, workLog: log });
        });
        return acc;
    }, []);

    const filteredTickets = unassignedTickets.filter((ticket) =>
        (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
        (!priorityFilter || ticket.priority === priorityFilter)
    );

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setHistoryDialogVisible(true);
    };

    const handleAssignAction = async (action: 'assign' | 'accept' | 'reject' | 'close', payload?: { ticketId?: string | null; technician?: string; message?: string }) => {
        if (action === 'close') {
            setHistoryDialogVisible(false);
            return;
        }

        if (action === 'assign' && payload?.ticketId && payload.technician) {
            await assignTicket(payload.ticketId, payload.technician, currentUser.fullName, currentUser.role, payload.message);
            setHistoryDialogVisible(false);
        }
    };

    const handleWorkLogAction = async (action: 'addWorkLog' | 'requestApproval' | 'close', payload?: { workLog?: WorkLog; ticketId?: string | null }) => {
        if (action === 'close') {
            setHistoryDialogVisible(false);
            return;
        }

        if (action === 'requestApproval' && payload?.workLog && payload.ticketId) {
            await requestWorkLogApproval(payload.ticketId, payload.workLog);
            setHistoryDialogVisible(false);
            return;
        }

        if (action === 'addWorkLog' && payload?.workLog && payload.ticketId) {
            const ticket = tickets.find((item) => item.id === payload.ticketId);
            if (!ticket) return;
            await updateTicket(payload.ticketId, { workLogs: [...(ticket.workLogs || []), payload.workLog] }, currentUser.fullName);
            setHistoryDialogVisible(false);
        }
    };

    const handleRelease = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await assignTicket(ticketId, currentUser.fullName, currentUser.fullName, currentUser.role, message);
        setActionReasonModalVisible(false);
    };

    const actionBodyTemplate = (rowData: Ticket) => {
        if (!isTechnician) {
            return <span className="text-500 text-sm">Salt Okunur</span>;
        }

        const isMyOwnTicket = rowData.requester.trim().toLocaleLowerCase('tr-TR') === currentUser.fullName.trim().toLocaleLowerCase('tr-TR');

        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    rounded
                    outlined
                    severity="secondary"
                    tooltip="Talep Detayı ve Tarihçe"
                    onClick={(e) => {
                        e.stopPropagation();
                        openTicketHistory(rowData);
                    }}
                />
                <Button
                    label={isMyOwnTicket ? "Kendi Talebiniz" : "İşi Üzerime Al"} 
                    icon={isMyOwnTicket ? "pi pi-ban" : "pi pi-plus"} 
                    size="small" 
                    severity={isMyOwnTicket ? "secondary" : "info"}
                    disabled={isMyOwnTicket}
                    tooltip={isMyOwnTicket ? "Kendi oluşturduğunuz talebi doğrudan üzerinize alamazsınız." : "Talebi üzerinize atayın"}
                    tooltipOptions={{ position: 'left' }}
                    onClick={async (e) => {
                        e.stopPropagation();
                        if (isMyOwnTicket) return;

                        const assigned = await assignTicket(rowData.id, currentUser.fullName);
                        if (assigned) {
                            toast.current?.show({ 
                                severity: 'success', 
                                summary: 'Görev Zimmetlendi', 
                                detail: 'Talep üzerinize alındı ve "Aktif Görevlerim" sayfasına aktarıldı.', 
                                life: 2500 
                            });
                        }
                    }}
                />
            </div>
        );
    };

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card 
                        title={<div className="flex justify-content-between align-items-center gap-2"><span>Teknik Servis İş Havuzu</span><Button label="Mesai Onayları" icon="pi pi-check-circle" severity={pendingWorkLogsForCurrentUser.length > 0 ? 'info' : 'secondary'} badge={pendingWorkLogsForCurrentUser.length > 0 ? pendingWorkLogsForCurrentUser.length.toString() : undefined} badgeClassName="p-badge-info" onClick={() => setWorkLogApprovalVisible(true)} /></div>}
                        subTitle="Müdahale bekleyen ve henüz bir teknisyene atanmamış sahipsiz talepler."
                    >
                        {isLoading && <Message severity="info" className="w-full mb-3" text="İş havuzu yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                            <InputText 
                                value={search} 
                                onChange={(event) => setSearch(event.target.value)} 
                                placeholder="Talep veya birim ara..." 
                                className="w-full md:w-20rem"
                            />
                            <Dropdown 
                                value={priorityFilter} 
                                options={['Düşük', 'Normal', 'Yüksek', 'Kritik']} 
                                onChange={(event) => setPriorityFilter(event.value)} 
                                placeholder="Aciliyet Filtresi" 
                                showClear 
                            />
                        </div>

                        <DataTable 
                            value={filteredTickets} 
                            paginator 
                            rows={10} 
                            responsiveLayout="scroll" 
                            emptyMessage="Havuzda atanmayı bekleyen açık iş bulunmamaktadır."
                            onRowClick={(event) => openTicketHistory(event.data as Ticket)}
                            rowClassName={() => 'cursor-pointer hover:surface-hover'}
                        >
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column 
                                field="status" 
                                header="Durum" 
                                style={{ width: '120px' }} 
                                body={() => <Tag value="HAVUZDA" severity="info" />} 
                            />
                            <Column header="Müdahale" body={actionBodyTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>

                <TicketHistoryModal
                    visible={historyDialogVisible}
                    ticket={selectedTicket}
                    onHide={() => setHistoryDialogVisible(false)}
                    onAction={() => setHistoryDialogVisible(false)}
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
                            setWorkLogApprovalVisible(false);
                        }
                    }}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default IsHavuzuPage;