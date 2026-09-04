'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { useTaleplerim } from './hooks/useTaleplerim';
import { TaleplerimFiltre } from './components/TaleplerimFiltre';
import { TaleplerimTablo } from './components/TaleplerimTablo';

const TaleplerimPage = () => {
    const {
        isLoading,
        loadError,
        currentUser,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        selectedTicket,
        dialogVisible,
        setDialogVisible,
        actionReasonModalVisible,
        setActionReasonModalVisible,
        actionType,
        filteredTickets,
        openTicketHistory,
        handleApprove,
        handleObject,
        handleActionReasonConfirm
    } = useTaleplerim();

    return (
        <div className="grid">
            <div className="col-12">
                <Card
                    title={
                        <div className="flex justify-content-between align-items-center gap-2">
                            <span>Açtığım Resmi Talepler</span>
                        </div>
                    }
                    subTitle={`Sayın ${currentUser.fullName}, sadece sizin tarafınızdan oluşturulan talepler listelenmektedir.`}
                >
                    {isLoading && <Message severity="info" className="w-full mb-3" text="Talepler yükleniyor..." />}
                    {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                    <TaleplerimFiltre search={search} onSearchChange={setSearch} statusFilter={statusFilter} onStatusFilterChange={setStatusFilter} />

                    <TaleplerimTablo tickets={filteredTickets} onRowSelect={openTicketHistory} onApprove={handleApprove} onObject={handleObject} />
                </Card>
            </div>

            <TicketHistoryModal
                visible={dialogVisible}
                ticket={selectedTicket}
                onHide={() => setDialogVisible(false)}
                onAction={() => setDialogVisible(false)}
            />

            <TicketActionReasonModal
                visible={actionReasonModalVisible}
                actionType={actionType}
                ticket={selectedTicket}
                onHide={() => setActionReasonModalVisible(false)}
                onConfirm={handleActionReasonConfirm}
            />
        </div>
    );
};

export default TaleplerimPage;
