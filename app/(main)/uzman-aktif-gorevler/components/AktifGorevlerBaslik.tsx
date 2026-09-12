/**
 * BİLEŞEN: Aktif Görevlerim sayfa başlığı + "Atama İşlemleri" butonu.
 * Buton rozetindeki sayı = bekleyen atama sayısı (pendingCount) + ekip bildirimi
 * sayısı (notificationCount) toplamı.
 */

import React from 'react';
import { Button } from 'primereact/button';

export interface AktifGorevlerBaslikProps {
    pendingCount: number;
    notificationCount?: number;
    onOpenPending: () => void;
}

export const AktifGorevlerBaslik = ({ pendingCount, notificationCount = 0, onOpenPending }: AktifGorevlerBaslikProps) => {
    const totalBadgeCount = pendingCount + notificationCount;

    return (
        <div className="flex justify-content-between align-items-center gap-2">
            <div>
                <div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div>
            </div>
            <div className="flex align-items-center gap-2">
                <Button
                    label="Atama İşlemleri"
                    icon="pi pi-inbox"
                    severity={totalBadgeCount > 0 ? 'warning' : 'secondary'}
                    badge={totalBadgeCount > 0 ? totalBadgeCount.toString() : undefined}
                    badgeClassName="p-badge-danger"
                    onClick={onOpenPending}
                />
            </div>
        </div>
    );
};

export default AktifGorevlerBaslik;
