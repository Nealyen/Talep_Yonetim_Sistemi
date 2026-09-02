'use client';

import React, { useState } from 'react';
import { Button } from 'primereact/button';
import { useTickets } from '@/layout/context/TicketContext';
import { usePendingWorkLogs } from '@/hooks/usePendingWorkLogs';
import WorkLogApprovalModal from '@/app/components/ticket/WorkLogApprovalModal';

export interface WorkLogApprovalButtonProps {
    /** Onay/red işlemi başarıyla tamamlandığında çağrılır (örn. toast göstermek için) */
    onResolved?: (isApproved: boolean) => void;
}

/**
 * "Mesai Onayları" butonu: rozet sayısı, modal açma/kapama ve onay/red işlemini
 * kendi içinde yönetir. Önceden her sayfada (tum-talepler, taleplerim, is-havuzu,
 * uzman-aktif-gorevler) ~15-20 satır olarak kopyalanan bu mantık artık tek component.
 */
export const WorkLogApprovalButton = ({ onResolved }: WorkLogApprovalButtonProps) => {
    const { resolveWorkLogApproval } = useTickets();
    const pendingWorkLogs = usePendingWorkLogs();
    const [visible, setVisible] = useState(false);

    const handleResolve = async (ticketId: string, logId: string, isApproved: boolean) => {
        const success = await resolveWorkLogApproval(ticketId, logId, isApproved);
        if (success) {
            onResolved?.(isApproved);
            setVisible(false);
        }
    };

    return (
        <>
            <Button
                label="Mesai Onayları"
                icon="pi pi-check-circle"
                severity={pendingWorkLogs.length > 0 ? 'info' : 'secondary'}
                badge={pendingWorkLogs.length > 0 ? pendingWorkLogs.length.toString() : undefined}
                badgeClassName="p-badge-info"
                onClick={() => setVisible(true)}
            />

            <WorkLogApprovalModal
                visible={visible}
                pendingData={pendingWorkLogs}
                onHide={() => setVisible(false)}
                onResolve={handleResolve}
            />
        </>
    );
};

export default WorkLogApprovalButton;
