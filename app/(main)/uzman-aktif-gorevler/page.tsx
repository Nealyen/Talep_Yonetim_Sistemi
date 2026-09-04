'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import TicketEditModal from '@/app/components/ticket/TicketEditModal';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketAssignModal from '@/app/components/ticket/TicketAssignModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { useUzmanAktifGorevler } from './hooks/useUzmanAktifGorevler';
import { AktifGorevlerBaslik } from './components/AktifGorevlerBaslik';
import { AktifGorevlerTablo } from './components/AktifGorevlerTablo';
import { DuzenlemeFooteri } from './components/DuzenlemeFooteri';

const UzmanAktifGorevlerPage = () => {
    const {
        toast,
        editModalRef,
        selectedTicket,
        dialogVisible,
        setDialogVisible,
        editDialogVisible,
        setEditDialogVisible,
        delegateDialogVisible,
        pendingDialogVisible,
        setPendingDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        targetTech,
        setTargetTech,
        myPendingTickets,
        filteredTickets,
        eligibleTechnicians,
        availableDelegates,
        handleSaveEdit,
        openCompleteReasonModal,
        handleAssignAction,
        onRowClick,
        confirmSave,
        handlePreview,
        handleReleaseRow,
        handleDelegateRow,
        handleHistoryModalAction,
        openHistoryFromEditFooter,
        openDelegateFromEditFooter,
        openReleaseReasonModal,
        closeDelegateDialog,
        handleActionReasonConfirm
    } = useUzmanAktifGorevler();

    const editModalFooter = (
        <DuzenlemeFooteri
            selectedTicket={selectedTicket}
            onOpenHistory={openHistoryFromEditFooter}
            onRelease={openReleaseReasonModal}
            onDelegate={openDelegateFromEditFooter}
            onConfirmSave={confirmSave}
        />
    );

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN', 'KOORDINATOR']}>
            <div className="grid">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="col-12">
                    <Card title={<AktifGorevlerBaslik pendingCount={myPendingTickets.length} onOpenPending={() => setPendingDialogVisible(true)} />}>
                        <AktifGorevlerTablo
                            tickets={filteredTickets}
                            onRowClick={onRowClick}
                            onPreview={handlePreview}
                            onComplete={openCompleteReasonModal}
                            onRelease={handleReleaseRow}
                            onDelegate={handleDelegateRow}
                        />
                    </Card>
                </div>

                <TicketEditModal
                    ref={editModalRef}
                    visible={editDialogVisible}
                    ticket={selectedTicket}
                    footer={editModalFooter}
                    onHide={() => setEditDialogVisible(false)}
                    onSave={handleSaveEdit}
                />

                <TicketHistoryModal visible={dialogVisible} ticket={selectedTicket} onHide={() => setDialogVisible(false)} onAction={handleHistoryModalAction} />

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
                    onHide={closeDelegateDialog}
                    onAction={handleAssignAction}
                    onTechnicianChange={setTargetTech}
                />

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

export default UzmanAktifGorevlerPage;
