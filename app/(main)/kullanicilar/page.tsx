'use client';

import React from 'react';
import { Card } from 'primereact/card';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { useKullanicilar } from './hooks/useKullanicilar';
import { KullanicilarTablo } from './components/KullanicilarTablo';
import { YeniRolTanimla } from './components/YeniRolTanimla';

const KullanicilarPage = () => {
    const {
        users,
        currentUser,
        isAdmin,
        handleRoleChange,
        handleSpecialtyChange,
        draftRoles,
        newRoleName,
        setNewRoleName,
        newRolePermissions,
        setNewRolePermissions,
        roleFormError,
        handleAddDraftRole,
        handleDeleteDraftRole
    } = useKullanicilar();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title="Kurumsal Personel ve Rol Tanımları (RBAC)" subTitle="Sistem erişim seviyeleri, yetki matrisi ve uzmanlık atamaları.">
                        <KullanicilarTablo users={users} currentUser={currentUser} isAdmin={isAdmin} onRoleChange={handleRoleChange} onSpecialtyChange={handleSpecialtyChange} />
                    </Card>
                </div>

                <div className="col-12">
                    <YeniRolTanimla
                        newRoleName={newRoleName}
                        onNewRoleNameChange={setNewRoleName}
                        newRolePermissions={newRolePermissions}
                        onNewRolePermissionsChange={setNewRolePermissions}
                        roleFormError={roleFormError}
                        draftRoles={draftRoles}
                        onAddRole={handleAddDraftRole}
                        onDeleteRole={handleDeleteDraftRole}
                    />
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default KullanicilarPage;
