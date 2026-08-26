'use client';

import React from 'react';
import RoleRouteGuard from '@/components/RoleRouteGuard';
import IsHavuzuPage from '../is-havuzu/page';
import TaleplerimPage from '../taleplerim/page';

const TamirciPage = () => (
    <RoleRouteGuard allowedRole="TEKNIK_UZMAN">
        <TaleplerimPage />
        <IsHavuzuPage />
    </RoleRouteGuard>
);

export default TamirciPage;
