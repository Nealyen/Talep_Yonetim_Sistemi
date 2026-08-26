'use client';

import React from 'react';
import RoleRouteGuard from '@/components/RoleRouteGuard';
import TaleplerimPage from '../taleplerim/page';

const CalisanPage = () => (
    <RoleRouteGuard allowedRole="TALEP_SAHIBI">
        <TaleplerimPage />
    </RoleRouteGuard>
);

export default CalisanPage;
