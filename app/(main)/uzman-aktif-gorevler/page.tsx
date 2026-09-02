'use client';

import React from 'react';
import { Ticket } from '@/layout/context/TicketContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import TicketEditModal from '@/app/components/ticket/TicketEditModal';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketAssignModal from '@/app/components/ticket/TicketAssignModal';
import TicketWorkLogModal from '@/app/components/ticket/TicketWorkLogModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { StatusBadge } from '@/app/components/ui/StatusBadge';
import { WorkLogApprovalButton } from '@/components/tickets/WorkLogApprovalButton';
import { ActiveTaskActionButtons } from '@/components/tickets/ActiveTaskActionButtons';
import { useUzmanAktifGorevler } from '@/hooks/useUzmanAktifGorevler';

const UzmanAktifGorevlerPage = () => {
    const {
        toast,
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
        myPendingTickets,
        filteredTickets,
        eligibleTechnicians,
        availableDelegates,
        handleSaveEdit,
        handleRelease,
        openReleaseReasonModal,
        handleComplete,
        openCompleteReasonModal,
        handleAssignAction,
        handleWorkLogAction,
        onRowClick,
        currentUser,
        confirmSave
    } = useUzmanAktifGorevler();

    const editModalFooter = (save: () => void) => (
        <div className="flex flex-wrap justify-content-between align-items-center w-full gap-2 pt-2 border-top-1 surface-border">
            <div className="flex flex-wrap gap-2">
                <Button
                    label="Tarihçe / Detay"
                    icon="pi pi-history"
                    severity="secondary"
                    outlined
                    size="small"
                    onClick={() => {
                        setEditDialogVisible(false);
                        setDialogVisible(true);
                    }}
                />
                {selectedTicket?.status === 'İŞLEMDE' && (
                    <>
                        <Button
                            label="Havuza Bırak"
                            icon="pi pi-arrow-circle-left"
                            severity="danger"
                            outlined
                            size="small"
                            onClick={() => {
                                setSelectedTicket(selectedTicket);
                                openReleaseReasonModal();
                            }}
                        />
                        <Button label="Devret" icon="pi pi-send" severity="help" outlined size="small" onClick={() => setDelegateDialogVisible(true)} />
                    </>
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Değişiklikleri Kaydet" icon="pi pi-check" severity="success" onClick={() => confirmSave(save)} />
            </div>
        </div>
    );

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN', 'KOORDINATOR']}>
            <div className="grid">
                <Toast ref={toast} />
                <ConfirmDialog />

                <div className="col-12">
                    <Card
                        title={
                            <div className="flex justify-content-between align-items-center gap-2">
                                <div>
                                    <div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div>
                                </div>
                                <div className="flex align-items-center gap-2">
                                    <Button
                                        label="Atama İşlemleri"
                                        icon="pi pi-inbox"
                                        severity={myPendingTickets.length > 0 ? 'warning' : 'secondary'}
                                        badge={myPendingTickets.length > 0 ? myPendingTickets.length.toString() : undefined}
                                        badgeClassName="p-badge-danger"
                                        onClick={() => setPendingDialogVisible(true)}
                                    />
                                    <WorkLogApprovalButton />
                                </div>
                            </div>
                        }
                    >
                        <DataTable
                            value={filteredTickets}
                            paginator
                            rows={10}
                            responsiveLayout="scroll"
                            emptyMessage="Aktif bir görev bulunmamaktadır."
                            onRowClick={onRowClick}
                            rowClassName={() => 'cursor-pointer hover:surface-hover'}
                        >
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="İlgili Ekip" style={{ width: '180px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column field="status" header="Durum" style={{ width: '140px' }} body={(r: Ticket) => <StatusBadge status={r.status} />} />
                            <Column
                                header="İşlemler"
                                body={(rowData: Ticket) => (
                                    <ActiveTaskActionButtons
                                        ticket={rowData}
                                        onPreview={(ticket) => {
                                            setSelectedTicket(ticket);
                                            setDialogVisible(true);
                                        }}
                                        onComplete={openCompleteReasonModal}
                                        onRelease={(ticket) => {
                                            setSelectedTicket(ticket);
                                            openReleaseReasonModal();
                                        }}
                                        onDelegate={(ticket) => {
                                            setSelectedTicket(ticket);
                                            setDelegateDialogVisible(true);
                                        }}
                                    />
                                )}
                                style={{ width: '200px' }}
                            />
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
            </div>
        </RoleRouteGuard>
    );
};

export default UzmanAktifGorevlerPage;
