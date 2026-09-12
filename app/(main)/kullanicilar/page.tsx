'use client';

/**
 * SAYFA: Kullanıcı & Rol Yönetimi (RBAC) — Rota: "/kullanicilar"
 * KİMLER GÖREBİLİR: ADMIN.
 * NE İŞE YARAR: Personel listesi; rol değiştirme, ekip atama/çıkarma (satır içi
 * checkbox listesiyle).
 * DİKKAT — "YENİ ROL TANIMLA": Sayfanın alt kısmındaki bu alan sadece görsel bir taslaktır,
 * gerçek bir yetkilendirme sistemine bağlı DEĞİLDİR (component state'te tutulur, sayfa
 * yenilenince kaybolur). Gerçek RBAC ileride ayrı bir iş olarak ele alınmalı.
 */

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
        teams,
        handleRoleChange,
        handleAddTeamToUser,
        handleRemoveTeamFromUser,
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
                    <Card title="Kurumsal Personel ve Rol Tanımları (RBAC)" subTitle="Sistem erişim seviyeleri ve yetki matrisi.">
                        <KullanicilarTablo
                            users={users}
                            currentUser={currentUser}
                            isAdmin={isAdmin}
                            teams={teams}
                            onRoleChange={handleRoleChange}
                            onAddTeamToUser={handleAddTeamToUser}
                            onRemoveTeamFromUser={handleRemoveTeamFromUser}
                        />
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
