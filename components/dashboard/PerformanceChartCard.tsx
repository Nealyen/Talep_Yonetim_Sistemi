'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { ChartBundle } from '@/hooks/useDashboardCharts';

export interface PerformanceChartCardProps {
    title: string;
    bundle: ChartBundle;
    options: any;
    /** "assigned" görünümünde ek olarak "Aktif Görev Miktarı" satırı gösterilir */
    showActiveTaskCount: boolean;
}

/**
 * Tek bir doughnut grafik + özel legend'ı gösteren kart.
 * Dashboard'da "Son 1 Ay" / "Son 3 Ay" / "Tüm Zamanlar" için 3 kez kullanılıyordu,
 * artık tek component olarak paylaşılıyor.
 */
export const PerformanceChartCard = ({ title, bundle, options, showActiveTaskCount }: PerformanceChartCardProps) => {
    const { data, counts, total, activeTaskCount } = bundle;

    return (
        <Card title={title}>
            <div className="flex justify-content-center align-items-center" style={{ height: '220px' }}>
                <Chart type="doughnut" data={data} options={options} className="w-full" style={{ maxWidth: '220px' }} />
            </div>

            {total === 0 ? (
                <div className="text-center text-500 mt-4">Veri bulunamadı</div>
            ) : (
                <div className="mt-4 flex flex-column gap-2 text-sm">
                    <div className="flex justify-content-between align-items-center">
                        <span className="flex align-items-center gap-2">
                            <div className="w-1rem h-1rem border-round bg-blue-500"></div> Yeni / Havuzda
                        </span>
                        <span className="font-bold">{counts.yeni}</span>
                    </div>
                    <div className="flex justify-content-between align-items-center">
                        <span className="flex align-items-center gap-2">
                            <div className="w-1rem h-1rem border-round bg-orange-500"></div> İşlemde
                        </span>
                        <span className="font-bold">{counts.islemde}</span>
                    </div>
                    <div className="flex justify-content-between align-items-center">
                        <span className="flex align-items-center gap-2">
                            <div className="w-1rem h-1rem border-round bg-purple-500"></div> Onay Bekleyen
                        </span>
                        <span className="font-bold">{counts.onay}</span>
                    </div>
                    <div className="flex justify-content-between align-items-center">
                        <span className="flex align-items-center gap-2">
                            <div className="w-1rem h-1rem border-round bg-green-500"></div> Çözülen / Kapatılan
                        </span>
                        <span className="font-bold">{counts.kapali}</span>
                    </div>
                    <div className="flex justify-content-between align-items-center mt-2 pt-2 border-top-1 surface-border">
                        <span className="font-bold">Toplam Kayıt</span>
                        <span className="font-bold text-lg">{total}</span>
                    </div>
                    {showActiveTaskCount && (
                        <div className="flex justify-content-between align-items-center mt-1 text-500">
                            <span className="font-medium">Aktif Görev Miktarı (Net)</span>
                            <span className="font-bold">{activeTaskCount}</span>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};

export default PerformanceChartCard;
