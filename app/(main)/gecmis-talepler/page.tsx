'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { SelectButton } from 'primereact/selectbutton';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import { useGecmisTalepler } from './hooks/useGecmisTalepler';
import { GecmisTaleplerFiltre } from './components/GecmisTaleplerFiltre';
import { GecmisTaleplerTablo } from './components/GecmisTaleplerTablo';

const SCOPE_OPTIONS: { label: string; value: 'kendi' | 'tumu' }[] = [
    { label: 'Kendi Taleplerim', value: 'kendi' },
    { label: 'Tüm Talepler', value: 'tumu' }
];

// KURAL: Bu sayfa bilinçli olarak RoleRouteGuard İLE SARILMADI — talep sahibi,
// teknisyen, koordinatör, admin farketmeksizin HERKES bu sayfayı görebilmeli.
// Ama içerik kapsamı role göre değişir: Admin/Koordinatör "Kendi Taleplerim" /
// "Tüm Talepler" arasında seçim yapabilir, diğer roller sadece kendi taleplerini görür.
const GecmisTaleplerPage = () => {
    const {
        isLoading,
        loadError,
        canSeeAll,
        scope,
        setScope,
        search,
        setSearch,
        categoryFilter,
        setCategoryFilter,
        categories,
        dateRange,
        setDateRange,
        filteredTickets,
        selectedTicket,
        historyDialogVisible,
        setHistoryDialogVisible,
        openTicketHistory
    } = useGecmisTalepler();

    return (
        <div className="grid">
            <div className="col-12">
                <Card
                    title={
                        <div className="flex flex-wrap justify-content-between align-items-center gap-3">
                            <span>Geçmiş Talepler (Arşiv)</span>
                            {canSeeAll && <SelectButton value={scope} onChange={(e) => e.value && setScope(e.value)} options={SCOPE_OPTIONS} allowEmpty={false} />}
                        </div>
                    }
                    subTitle={
                        canSeeAll
                            ? 'Sistemdeki kapatılmış taleplerin kalıcı kaydı. "Tüm Talepler" görünümünde herkesin, "Kendi Taleplerim" görünümünde sadece sizin taleplerinizi görürsünüz.'
                            : 'Sizin tarafınızdan oluşturulan, kapatılmış taleplerin kalıcı kaydı.'
                    }
                >
                    {isLoading && <Message severity="info" className="w-full mb-3" text="Geçmiş talepler yükleniyor..." />}
                    {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                    <GecmisTaleplerFiltre
                        search={search}
                        onSearchChange={setSearch}
                        categoryFilter={categoryFilter}
                        onCategoryFilterChange={setCategoryFilter}
                        categories={categories}
                        dateRange={dateRange}
                        onDateRangeChange={setDateRange}
                    />

                    <GecmisTaleplerTablo tickets={filteredTickets} onRowSelect={openTicketHistory} />
                </Card>
            </div>

            <TicketHistoryModal
                visible={historyDialogVisible}
                ticket={selectedTicket}
                onHide={() => setHistoryDialogVisible(false)}
                onAction={() => setHistoryDialogVisible(false)}
            />
        </div>
    );
};

export default GecmisTaleplerPage;
