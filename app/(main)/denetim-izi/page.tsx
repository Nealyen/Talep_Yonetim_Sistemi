'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { useAuditLogs } from '@/hooks/useAuditLogs';

const DenetimIziPage = () => {
    const allLogs = useAuditLogs();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card
                        title="Resmi Denetim İzi (Audit Trail) Kayıtları"
                        subTitle="5651 ve kurumsal kalite yönetimi standartlarına uygun değiştirilemez işlem kayıtları."
                    >
                        <DataTable value={allLogs} paginator rows={10} responsiveLayout="scroll">
                            <Column field="logId" header="Log ID" style={{ width: '140px' }} />
                            <Column field="date" header="Zaman Damgası" style={{ width: '180px' }} />
                            <Column field="ticketId" header="İlgili Talep" style={{ width: '130px' }} />
                            <Column field="action" header="Gerçekleştirilen Hareket" />
                            <Column field="user" header="İşlemi Yapan Hesap" style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default DenetimIziPage;
