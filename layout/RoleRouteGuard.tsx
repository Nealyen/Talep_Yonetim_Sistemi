'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, UserRole } from '@/layout/context/UserContext';
import { ProgressSpinner } from 'primereact/progressspinner';

interface RoleRouteGuardProps {
    allowedRoles: UserRole[];
    children: React.ReactNode;
}

export const RoleRouteGuard = ({ allowedRoles, children }: RoleRouteGuardProps) => {
    const { currentUser } = useUser();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!currentUser || !currentUser.role) {
            return;
        }

        // Aktif kullanıcının rolü izin verilen roller arasında yoksa ana sayfaya fırlat
        if (!allowedRoles.includes(currentUser.role)) {
            router.replace('/');
        } else {
            setIsAuthorized(true);
        }
    }, [currentUser, allowedRoles, router]);

    // Yetki kontrolü bitene veya yönlendirme tamamlanana kadar içeriği DOM'a basma
    if (!isAuthorized) {
        return (
            <div className="flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <ProgressSpinner strokeWidth="4" />
            </div>
        );
    }

    return <>{children}</>;
};