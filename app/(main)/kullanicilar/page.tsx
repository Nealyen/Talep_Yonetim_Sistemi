'use client';

import React from 'react';
import { useUser, UserRole, UserProfile, TechnicianExpertise } from '@/layout/context/UserContext';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
];

const EXPERTISE_OPTIONS: { label: string; value: TechnicianExpertise }[] = [
    { label: 'Donanım', value: 'Donanım' },
    { label: 'Yazılım', value: 'Yazılım' }
];

const KullanicilarPage = () => {
    const { users, currentUser, updateUser } = useUser();
    const isAdmin = currentUser.role === 'ADMIN';

    // Admin Rolünü Render Eden Şablon
    const roleBodyTemplate = (rowData: UserProfile) => {
        if (rowData.id === 'usr-default') {
            return <Tag value="SİSTEM YÖNETİCİSİ" severity="danger" />;
        }

        return (
            <Dropdown
                value={rowData.role}
                options={ROLE_OPTIONS}
                onChange={(e) => updateUser(rowData.id, { role: e.value })}
                disabled={!isAdmin}
                className="w-full md:w-14rem"
            />
        );
    };

    // Teknisyen Uzmanlığını Render Eden Şablon
    const expertiseBodyTemplate = (rowData: UserProfile) => {
        if (rowData.role !== 'TEKNISYEN') {
            return <span className="text-500">-</span>;
        }

        return (
            <Dropdown
                value={rowData.expertise || null}
                options={EXPERTISE_OPTIONS}
                onChange={(e) => updateUser(rowData.id, { expertise: e.value })}
                placeholder="Uzmanlık Ata"
                disabled={!isAdmin}
                className="w-full md:w-12rem"
            />
        );
    };

    const statusBodyTemplate = () => {
        return <Tag value="AKTİF" severity="success" />;
    };

    return (
        <div className="grid">
            <div className="col-12">
                <Card title="Kurumsal Personel ve Rol Tanımları (RBAC)" subTitle="Sistem erişim seviyeleri, yetki matrisi ve uzmanlık atamaları.">
                    <DataTable value={users} stripedRows responsiveLayout="scroll" emptyMessage="Kayıtlı personel bulunamadı.">
                        <Column field="sicilNo" header="Sicil/ID" style={{ minWidth: '8rem' }} />
                        <Column field="fullName" header="Ad Soyad" style={{ minWidth: '12rem' }} />
                        <Column field="email" header="Kurumsal E-Posta" style={{ minWidth: '14rem' }} />
                        <Column field="title" header="Ünvan" style={{ minWidth: '12rem' }} />
                        <Column header="Sistem Rolü" body={roleBodyTemplate} style={{ minWidth: '14rem' }} />
                        <Column header="Uzmanlık Alanı" body={expertiseBodyTemplate} style={{ minWidth: '12rem' }} />
                        <Column header="Durum" body={statusBodyTemplate} style={{ minWidth: '6rem' }} />
                    </DataTable>
                </Card>
            </div>
        </div>
    );
};

export default KullanicilarPage;