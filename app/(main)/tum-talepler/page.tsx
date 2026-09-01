'use client';

import React, { useState } from 'react';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTickets, Ticket, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import WorkLogApprovalModal from '@/app/components/ticket/WorkLogApprovalModal';

const TumTaleplerPage = () => {
    const { tickets, assignTicket, updateTicket, requestWorkLogApproval, resolveWorkLogApproval } = useTickets();
    const { currentUser } = useUser();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [workLogApprovalVisible, setWorkLogApprovalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');

    const getStatusSeverity = (status: Ticket['status']): "info" | "success" | "warning" | "danger" | null => {
        switch (status) {
            case 'YENİ': return 'info';
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return null;
            case 'KAPATILDI': return 'success';
            default: return null;
        }
    };

    const pendingWorkLogsForCurrentUser = tickets.reduce<Array<{ ticketId: string; ticketTitle: string; workLog: WorkLog }>>((acc, ticket) => {
        const pendingLogs = (ticket.pendingWorkLogs || []).filter((log) => log.fullName === currentUser.fullName && log.status === 'PENDING');
        pendingLogs.forEach((log) => {
            acc.push({ ticketId: ticket.id, ticketTitle: ticket.title, workLog: log });
        });
        return acc;
    }, []);

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

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setHistoryDialogVisible(true);
    };

    const actionBodyTemplate = (rowData: Ticket) => (
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
    );

    return (
        <RoleRouteGuard allowedRoles={['KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title={<div className="flex justify-content-between align-items-center gap-2"><span>Tüm Talepler (Genel İzleme Paneli)</span><Button label="Mesai Onayları" icon="pi pi-check-circle" severity={pendingWorkLogsForCurrentUser.length > 0 ? 'info' : 'secondary'} badge={pendingWorkLogsForCurrentUser.length > 0 ? pendingWorkLogsForCurrentUser.length.toString() : undefined} badgeClassName="p-badge-info" onClick={() => setWorkLogApprovalVisible(true)} /></div>} subTitle="Sistemdeki tüm birimlere ait aktif ve kapanmış taleplerin listesi.">
                        <DataTable
                            value={tickets}
                            paginator
                            rows={10}
                            responsiveLayout="scroll"
                            onRowClick={(event) => openTicketHistory(event.data as Ticket)}
                            rowClassName={() => 'cursor-pointer hover:surface-hover'}
                        >
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '160px' }} />
                            <Column field="assignee" header="Atanan Uzman" body={(r) => r.assignee || 'Atama Bekliyor'} style={{ width: '160px' }} />
                            <Column 
                                field="status" 
                                header="Durum" 
                                style={{ width: '140px' }} 
                                body={(rowData: Ticket) => (
                                    <Tag 
                                        value={rowData.status} 
                                        severity={getStatusSeverity(rowData.status)} 
                                        className={rowData.status === 'ONAY_BEKLİYOR' ? "bg-purple-600 text-white" : ""}
                                    />
                                )} 
                            />
                            <Column field="createdAt" header="Tarih" style={{ width: '140px' }} />
                            <Column header="İşlem" body={actionBodyTemplate} style={{ width: '90px' }} />
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

export default TumTaleplerPage;