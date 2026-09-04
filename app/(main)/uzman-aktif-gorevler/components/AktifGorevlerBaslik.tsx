import React from 'react';
import { Button } from 'primereact/button';

export interface AktifGorevlerBaslikProps {
    pendingCount: number;
    onOpenPending: () => void;
}

export const AktifGorevlerBaslik = ({ pendingCount, onOpenPending }: AktifGorevlerBaslikProps) => {
    return (
        <div className="flex justify-content-between align-items-center gap-2">
            <div>
                <div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div>
            </div>
            <div className="flex align-items-center gap-2">
                <Button
                    label="Atama İşlemleri"
                    icon="pi pi-inbox"
                    severity={pendingCount > 0 ? 'warning' : 'secondary'}
                    badge={pendingCount > 0 ? pendingCount.toString() : undefined}
                    badgeClassName="p-badge-danger"
                    onClick={onOpenPending}
                />
            </div>
        </div>
    );
};

export default AktifGorevlerBaslik;
