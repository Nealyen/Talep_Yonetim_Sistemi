'use client';

import { useEffect, useState } from 'react';
import { Ticket, useTickets } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { parseTurkishDate } from '@/utils/ticketHelpers';

export interface ChartCounts {
    yeni: number;
    islemde: number;
    onay: number;
    kapali: number;
}

export interface ChartBundle {
    data: any;
    counts: ChartCounts;
    total: number;
    activeTaskCount: number;
}

export interface DashboardCharts {
    month1: ChartBundle | null;
    month3: ChartBundle | null;
    all: ChartBundle | null;
    options: any;
}

const buildChartData = (ticketList: Ticket[], docStyle: CSSStyleDeclaration): ChartBundle => {
    const counts: ChartCounts = {
        yeni: ticketList.filter((t) => t.status === 'YENİ').length,
        islemde: ticketList.filter((t) => t.status === 'İŞLEMDE').length,
        onay: ticketList.filter((t) => t.status === 'ONAY_BEKLİYOR').length,
        kapali: ticketList.filter((t) => t.status === 'KAPATILDI').length
    };

    const total = counts.yeni + counts.islemde + counts.onay + counts.kapali;
    const activeTaskCount = counts.islemde + counts.onay + counts.yeni;

    const data = {
        labels: ['Yeni/Havuzda', 'İşlemde', 'Onay Bekleyen', 'Kapatılan'],
        datasets: [
            {
                data: total === 0 ? [1] : [counts.yeni, counts.islemde, counts.onay, counts.kapali],
                backgroundColor:
                    total === 0
                        ? [docStyle.getPropertyValue('--surface-300')]
                        : [
                              docStyle.getPropertyValue('--blue-500'),
                              docStyle.getPropertyValue('--orange-500'),
                              docStyle.getPropertyValue('--purple-500'),
                              docStyle.getPropertyValue('--green-500')
                          ],
                borderWidth: 2,
                borderColor: docStyle.getPropertyValue('--surface-card')
            }
        ]
    };

    return { data, counts, total, activeTaskCount };
};

export type DashboardViewMode = 'assigned' | 'created';

/**
 * Dashboard'daki 1 aylık / 3 aylık / tüm zamanlar grafik verisini hesaplar.
 * Önceden page.tsx içine gömülü olan bu mantık artık ayrı bir hook.
 * viewMode'a göre "üzerimdeki görevler" veya "oluşturduğum talepler" filtrelenir.
 */
export const useDashboardCharts = (viewMode: DashboardViewMode): DashboardCharts => {
    const { tickets } = useTickets();
    const { currentUser } = useUser();
    const [charts, setCharts] = useState<DashboardCharts>({ month1: null, month3: null, all: null, options: {} });

    useEffect(() => {
        // KURAL: Admin ve Koordinatör rollerinde "üzerime atanan / benim açtığım" ayrımı
        // gerçek çalışma şeklini yansıtmıyor — bu roller kişisel değil, kurumsal genel
        // durumu izler. Bu yüzden onlar için grafikler HER ZAMAN sistemdeki TÜM
        // taleplere göre hesaplanır (aksi halde çoğunlukla "Veri bulunamadı" görünür,
        // çünkü admin/koordinatörün kişisel talep/atama sayısı azdır). Teknisyen ve
        // Çalışan için ise mevcut kişisel filtreleme (assigned/created) korunuyor.
        const isManagementRole = currentUser.role === 'ADMIN' || currentUser.role === 'KOORDINATOR';

        const activeTickets = isManagementRole
            ? tickets
            : viewMode === 'assigned'
            ? tickets.filter((t) => t.assignee === currentUser.fullName)
            : tickets.filter((t) => t.requester === currentUser.fullName);

        const documentStyle = getComputedStyle(document.documentElement);

        const now = new Date();
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);

        const tickets1M = activeTickets.filter((t) => parseTurkishDate(t.createdAt) >= oneMonthAgo);
        const tickets3M = activeTickets.filter((t) => parseTurkishDate(t.createdAt) >= threeMonthsAgo);

        setCharts({
            month1: buildChartData(tickets1M, documentStyle),
            month3: buildChartData(tickets3M, documentStyle),
            all: buildChartData(activeTickets, documentStyle),
            options: {
                cutout: '65%',
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }, [tickets, currentUser.fullName, currentUser.role, viewMode]);

    return charts;
};

export default useDashboardCharts;
