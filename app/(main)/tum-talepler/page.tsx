'use client';

import React from 'react';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketEditModal from '@/app/components/ticket/TicketEditModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { useTumTalepler } from './hooks/useTumTalepler';
import { TumTaleplerTablo } from './components/TumTaleplerTablo';

const TumTaleplerPage = () => {
    const {
        toast,
        tickets,
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
    } = useTumTalepler();

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
                        <TumTaleplerTablo tickets={tickets} isAdmin={isAdmin} onRowSelect={openTicketHistory} onEdit={openTicketEdit} />
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
                    onConfirm={handleActionReasonConfirm}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default TumTaleplerPage;
