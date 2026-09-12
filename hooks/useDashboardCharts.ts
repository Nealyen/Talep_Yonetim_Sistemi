'use client';

/**
 * HOOK: Gösterge Paneli (Dashboard) grafiklerinin veri hazırlama mantığı.
 * NE İŞE YARAR: Taleplerden "Son 1 Ay / Son 3 Ay / Tüm Zamanlar" için ChartBundle
 * (doughnut grafik verisi) üretir. DashboardViewMode ('assigned' | 'created') ile
 * Teknisyen, Koordinatör ve Admin için AYNI ŞEKİLDE kişisel görünüm filtrelenir
 * (üçü de hem talep açabilir hem de kendilerine görev atanabilir). Çalışan için
 * page.tsx'te viewMode zaten hep 'created'e sabitlenir.
 */

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
        // KURAL: "Üzerimdeki Aktif Görevler / Oluşturduğum Talepler" ayrımı artık
        // Teknisyen, Koordinatör ve Admin için AYNI ŞEKİLDE çalışır — üçü de talep
        // açabilir (CALISAN gibi) VE kendilerine görev atanabilir (Süreç Takibi'nden
        // manuel atama / İş Havuzu'ndan üstüne alma ile). Bu yüzden burada artık rol
        // bazlı özel bir durum yok; herkes için aynı iki filtre uygulanıyor.
        const activeTickets =
            viewMode === 'assigned' ? tickets.filter((t) => t.assignee === currentUser.fullName) : tickets.filter((t) => t.requester === currentUser.fullName);

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