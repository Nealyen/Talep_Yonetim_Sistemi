'use client';

/**
 * BİLEŞEN: Rol Bazlı Rota Koruması — GERÇEK/KULLANILAN olan budur (bkz.
 * components/RoleRouteGuard.tsx'teki ölü kopya notu, ONU KULLANMAYIN).
 * NE İŞE YARAR: Bir sayfayı <RoleRouteGuard allowedRoles={[...]}> ile sarmalar;
 * aktif kullanıcının rolü listede yoksa doğrudan "/" (ana sayfa)'ya yönlendirir
 * (router.replace('/')). Yetki kontrolü bitene kadar içerik DOM'a hiç basılmaz
 * (ProgressSpinner gösterilir) — böylece yetkisiz içerik bir an için bile görünmez.
 */

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