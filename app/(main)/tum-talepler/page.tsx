'use client';

import React, { useRef, useState } from 'react';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketEditModal from '@/app/components/ticket/TicketEditModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { StatusBadge } from '@/app/components/ui/StatusBadge';

const TumTaleplerPage = () => {
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

    const actionBodyTemplate = (rowData: Ticket) => (
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
            {isAdmin && (
                <Button
                    icon="pi pi-pencil"
                    rounded
                    outlined
                    severity="warning"
                    tooltip="Talebi Düzenle (Admin Yetkisi)"
                    onClick={(e) => {
                        e.stopPropagation();
                        openTicketEdit(rowData);
                    }}
                />
            )}
        </div>
    );

    return (
        <RoleRouteGuard allowedRoles={['KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card
                        title={
                            <div className="flex justify-content-between align-items-center gap-2">
                                <span>Tüm Talepler (Genel İzleme Paneli)</span>
                            </div>
                        }
                        subTitle={
                            isAdmin
                                ? 'Sistemdeki tüm birimlere ait aktif ve kapanmış taleplerin listesi. ADMIN yetkisiyle, sahibi olmasanız dahi tüm talepleri düzenleyebilirsiniz.'
                                : 'Sistemdeki tüm birimlere ait aktif ve kapanmış taleplerin listesi.'
                        }
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
                            <Column header="İşlem" body={actionBodyTemplate} style={{ width: isAdmin ? '130px' : '90px' }} />
                        </DataTable>
                    </Card>
                </div>

                <TicketHistoryModal
                    visible={historyDialogVisible}
                    ticket={selectedTicket}
                    onHide={() => setHistoryDialogVisible(false)}
                    onAction={() => setHistoryDialogVisible(false)}
                />

                {isAdmin && (
                    <TicketEditModal
                        visible={editDialogVisible}
                        ticket={selectedTicket}
                        onHide={() => setEditDialogVisible(false)}
                        onSave={handleSaveEdit}
                    />
                )}

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