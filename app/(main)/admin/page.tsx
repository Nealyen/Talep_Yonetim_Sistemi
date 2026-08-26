'use client';

import React from 'react';
import RoleRouteGuard from '@/components/RoleRouteGuard';
import TaleplerimPage from '../taleplerim/page';

const AdminPage = () => (
    <RoleRouteGuard allowedRole="ADMIN">
        <TaleplerimPage />
    </RoleRouteGuard>
);

export default AdminPage;
