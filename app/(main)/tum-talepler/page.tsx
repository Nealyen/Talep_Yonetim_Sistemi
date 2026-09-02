'use client';

import React, { useState } from 'react';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { Button } from 'primereact/button';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { StatusBadge } from '@/app/components/ui/StatusBadge';
import { WorkLogApprovalButton } from '@/components/tickets/WorkLogApprovalButton';

const TumTaleplerPage = () => {
    const { tickets, assignTicket } = useTickets();
    const { currentUser } = useUser();
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [historyDialogVisible, setHistoryDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');

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
                    <Card
                        title={
                            <div className="flex justify-content-between align-items-center gap-2">
                                <span>Tüm Talepler (Genel İzleme Paneli)</span>
                                <WorkLogApprovalButton />
                            </div>
                        }
                        subTitle="Sistemdeki tüm birimlere ait aktif ve kapanmış taleplerin listesi."
                    >
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
                                body={(rowData: Ticket) => <StatusBadge status={rowData.status} />}
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
            </div>
        </RoleRouteGuard>
    );
};

export default TumTaleplerPage;
