'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/layout/context/UserContext';
import { useTickets } from '@/layout/context/TicketContext';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';
import { useDashboardCharts, DashboardViewMode } from '@/hooks/useDashboardCharts';
import { PerformanceChartCard } from '@/components/dashboard/PerformanceChartCard';
import { ActionRequiredPanel } from '@/components/dashboard/ActionRequiredPanel';

const VIEW_OPTIONS: { label: string; value: DashboardViewMode }[] = [
    { label: 'Üzerimdeki Aktif Görevler', value: 'assigned' },
    { label: 'Oluşturduğum Talepler', value: 'created' }
];

const Dashboard = () => {
    const { currentUser } = useUser();
    const { tickets } = useTickets();
    const router = useRouter();

    const isTechOrAdmin = currentUser.role === 'TEKNISYEN' || currentUser.role === 'KOORDINATOR' || currentUser.role === 'ADMIN';
    // KURAL: "Üzerimdeki Aktif Görevler / Oluşturduğum Talepler" ayrımı sadece
    // Teknisyen için kişisel bir anlam taşır. Admin/Koordinatör dashboard'ı artık
    // her zaman sistem geneli veriyi gösterdiği için (bkz. useDashboardCharts) bu
    // seçim onlara gösterilmiyor — aksi halde tıklanınca hiçbir şeyin değişmediği
    // kafa karıştırıcı bir kontrol olurdu.
    const showViewToggle = currentUser.role === 'TEKNISYEN';

    const [viewMode, setViewMode] = useState<DashboardViewMode>('assigned');
    // Çalışan hesaba geçildiğinde state kalıntısını engelleyen otomatik rol senkronizasyonu
    const effectiveViewMode: DashboardViewMode = !isTechOrAdmin ? 'created' : viewMode;

    const charts = useDashboardCharts(effectiveViewMode);

    const actionTickets =
        currentUser.role === 'CALISAN'
            ? tickets.filter((t) => t.requester === currentUser.fullName && t.status === 'ONAY_BEKLİYOR')
            : isTechOrAdmin
            ? tickets.filter((t) => t.assignee === currentUser.fullName && t.status === 'İŞLEMDE')
            : [];

    return (
        <div className="grid">
            {showViewToggle && (
                <div className="col-12 flex justify-content-center mb-3">
                    <SelectButton value={viewMode} onChange={(e) => e.value && setViewMode(e.value)} options={VIEW_OPTIONS} allowEmpty={false} />
                </div>
            )}

            {charts.month1 && charts.month3 && charts.all && (
                <>
                    <div className="col-12 lg:col-4">
                        <PerformanceChartCard
                            title="Son 1 Aylık Performans"
                            bundle={charts.month1}
                            options={charts.options}
                            showActiveTaskCount={effectiveViewMode === 'assigned'}
                            onCardClick={() => router.push('/taleplerim?range=1m')}
                        />
                    </div>
                    <div className="col-12 lg:col-4">
                        <PerformanceChartCard
                            title="Son 3 Aylık Performans"
                            bundle={charts.month3}
                            options={charts.options}
                            showActiveTaskCount={effectiveViewMode === 'assigned'}
                            onCardClick={() => router.push('/taleplerim?range=3m')}
                        />
                    </div>
                    <div className="col-12 lg:col-4">
                        <PerformanceChartCard
                            title="Tüm Zamanlar (Genel Durum)"
                            bundle={charts.all}
                            options={charts.options}
                            showActiveTaskCount={effectiveViewMode === 'assigned'}
                            onCardClick={() => router.push('/taleplerim?range=all')}
                        />
                    </div>
                </>
            )}

            <div className="col-12">
                <Card>
                    <div className="flex flex-wrap gap-3">
                        <Button label="Yeni Talep Oluştur" icon="pi pi-plus" onClick={() => router.push('/yeni-talep')} />
                        <Button label="Açtığım Taleplere Git" icon="pi pi-list" severity="secondary" outlined onClick={() => router.push('/taleplerim')} />
                        {isTechOrAdmin && (
                            <Button label="Teknik İş Havuzu" icon="pi pi-server" severity="info" outlined onClick={() => router.push('/is-havuzu')} />
                        )}
                    </div>
                </Card>
            </div>

            <div className="col-12">
                <ActionRequiredPanel tickets={actionTickets} />
            </div>
        </div>
    );
};

export default Dashboard;
