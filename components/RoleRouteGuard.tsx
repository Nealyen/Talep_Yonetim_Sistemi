'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Message } from 'primereact/message';
import { UserRole, useTickets } from '@/layout/context/TicketContext';

interface RoleRouteGuardProps {
    allowedRole: UserRole;
    children: React.ReactNode;
}

const RoleRouteGuard = ({ allowedRole, children }: RoleRouteGuardProps) => {
    const router = useRouter();
    const { activeRole } = useTickets();
    const [roleReady, setRoleReady] = useState(false);

    useEffect(() => {
        const savedRole = localStorage.getItem('activeRole');
        if (savedRole && savedRole !== allowedRole) {
            router.replace('/');
            return;
        }
        if (!savedRole && activeRole !== allowedRole) {
            router.replace('/');
            return;
        }
        setRoleReady(true);
    }, [activeRole, allowedRole, router]);

    if (!roleReady) {
        return <Message severity="info" text="Yetki kontrolü yapılıyor..." />;
    }

    if (activeRole !== allowedRole) {
        return <Message severity="warn" text="Bu sayfaya erişim yetkiniz bulunmuyor." />;
    }

    return <>{children}</>;
};

export default RoleRouteGuard;
