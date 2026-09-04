'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { ManualAssignDialog } from '@/components/tickets/ManualAssignDialog';
import { useSurecTakibi } from './hooks/useSurecTakibi';
import { SurecTakibiFiltre } from './components/SurecTakibiFiltre';
import { SurecTakibiTablo } from './components/SurecTakibiTablo';

const KoordinatorPage = () => {
    const {
        isLoading,
        loadError,
        selectedTicket,
        selectedTech,
        setSelectedTech,
        assignDialog,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        availableTechnicians,
        filteredTickets,
        openAssignDialog,
        closeAssignDialog,
        handleManualAssign,
        requestUnassign
    } = useSurecTakibi();

    return (
        <RoleRouteGuard allowedRoles={['KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <ConfirmDialog />

                <div className="col-12">
                    <Card title="Süreç Denetim ve Koordinatör Masası" subTitle="Kurumsal SLA takibi, doğrudan personel görevlendirme ve müdahale merkezi.">
                        {isLoading && <Message severity="info" className="w-full mb-3" text="Talepler ve uzmanlar yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                        <SurecTakibiFiltre search={search} onSearchChange={setSearch} categoryFilter={categoryFilter} onCategoryFilterChange={setCategoryFilter} />

                        <SurecTakibiTablo tickets={filteredTickets} onAssign={openAssignDialog} onUnassign={requestUnassign} />
                    </Card>
                </div>

                <ManualAssignDialog
                    visible={assignDialog}
                    ticket={selectedTicket}
                    availableTechnicians={availableTechnicians}
                    selectedTech={selectedTech}
                    onTechChange={setSelectedTech}
                    onHide={closeAssignDialog}
                    onConfirm={handleManualAssign}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default KoordinatorPage;
