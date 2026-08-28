'use client';

import React from 'react';
import { useUser, UserRole, AppUser, SpecialtyType } from '@/layout/context/UserContext';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
];

const SPECIALTY_OPTIONS: { label: string; value: SpecialtyType }[] = [
    { label: 'Donanım Uzmanı', value: 'Donanım' },
    { label: 'Yazılım Uzmanı', value: 'Yazılım' },
    { label: 'Ağ / Altyapı', value: 'Ağ / Altyapı' },
    { label: 'Genel', value: 'Genel' }
];

const KullanicilarPage = () => {
    const { users, currentUser, updateUser } = useUser();
    const isAdmin = currentUser.role === 'ADMIN';

    // Admin Rolünü Render Eden Şablon
    const roleBodyTemplate = (rowData: AppUser) => {
        return (
            <Dropdown
                value={rowData.role}
                options={ROLE_OPTIONS}
                onChange={(e) => updateUser(rowData.id, { role: e.value })}
                disabled={!isAdmin || rowData.id === currentUser.id} // Kendini rolsüz bırakmasını engelle
                className="w-full md:w-14rem"
            />
        );
    };

    // Teknisyen Uzmanlığını Render Eden Şablon
    const specialtyBodyTemplate = (rowData: AppUser) => {
        if (rowData.role !== 'TEKNISYEN') {
            return <span className="text-500">-</span>;
        }

        return (
            <Dropdown
                value={rowData.specialty || null}
                options={SPECIALTY_OPTIONS}
                onChange={(e) => updateUser(rowData.id, { specialty: e.value })}
                placeholder="Uzmanlık Seçiniz"
                disabled={!isAdmin}
                className="w-full md:w-12rem"
            />
        );
    };

    const statusBodyTemplate = () => {
        return <Tag value="AKTİF" severity="success" />;
    };

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <div className="col-12">
                    <Card title="Kurumsal Personel ve Rol Tanımları (RBAC)" subTitle="Sistem erişim seviyeleri, yetki matrisi ve uzmanlık atamaları.">
                        <DataTable value={users} stripedRows responsiveLayout="scroll" emptyMessage="Kayıtlı personel bulunamadı.">
                            <Column field="sicilNo" header="Sicil No" style={{ minWidth: '8rem' }} />
                            <Column field="fullName" header="Ad Soyad" style={{ minWidth: '12rem' }} />
                            <Column field="email" header="Kurumsal E-Posta" style={{ minWidth: '14rem' }} />
                            <Column field="dahili" header="Dahili Hat" style={{ minWidth: '8rem' }} />
                            <Column field="department" header="Birim / Departman" style={{ minWidth: '12rem' }} />
                            <Column header="Sistem Rolü" body={roleBodyTemplate} style={{ minWidth: '14rem' }} />
                            <Column header="Uzmanlık Alanı" body={specialtyBodyTemplate} style={{ minWidth: '12rem' }} />
                            <Column header="Durum" body={statusBodyTemplate} style={{ minWidth: '6rem' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default KullanicilarPage;