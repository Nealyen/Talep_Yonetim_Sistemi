'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { useIsHavuzu } from './hooks/useIsHavuzu';
import { IsHavuzuFiltre } from './components/IsHavuzuFiltre';
import { IsHavuzuTablo } from './components/IsHavuzuTablo';

const IsHavuzuPage = () => {
    const {
        toast,
        isLoading,
        loadError,
        search,
        setSearch,
        priorityFilter,
        setPriorityFilter,
        selectedTicket,
        historyDialogVisible,
        setHistoryDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        isTechnician,
        filteredTickets,
        isMyOwnTicket,
        openTicketHistory,
        handleTakeOwnership,
        handleActionReasonConfirm
    } = useIsHavuzu();

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card
                        title={
                            <div className="flex justify-content-between align-items-center gap-2">
                                <span>Teknik Servis İş Havuzu</span>
                            </div>
                        }
                        subTitle="Müdahale bekleyen ve henüz bir teknisyene atanmamış sahipsiz talepler."
                    >
                        {isLoading && <Message severity="info" className="w-full mb-3" text="İş havuzu yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                        <IsHavuzuFiltre search={search} onSearchChange={setSearch} priorityFilter={priorityFilter} onPriorityFilterChange={setPriorityFilter} />

                        <IsHavuzuTablo
                            tickets={filteredTickets}
                            isTechnician={isTechnician}
                            isMyOwnTicket={isMyOwnTicket}
                            onRowSelect={openTicketHistory}
                            onTakeOwnership={handleTakeOwnership}
                        />
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
                    onConfirm={handleActionReasonConfirm}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default IsHavuzuPage;
