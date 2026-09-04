'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { useKullanicilar } from './hooks/useKullanicilar';
import { KullanicilarTablo } from './components/KullanicilarTablo';

const KullanicilarPage = () => {
    const { users, currentUser, isAdmin, handleRoleChange, handleSpecialtyChange } = useKullanicilar();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title="Kurumsal Personel ve Rol Tanımları (RBAC)" subTitle="Sistem erişim seviyeleri, yetki matrisi ve uzmanlık atamaları.">
                        <KullanicilarTablo users={users} currentUser={currentUser} isAdmin={isAdmin} onRoleChange={handleRoleChange} onSpecialtyChange={handleSpecialtyChange} />
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default KullanicilarPage;
