import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { AppUser, UserRole, SpecialtyType } from '@/layout/context/UserContext';
import { ROLE_OPTIONS, SPECIALTY_OPTIONS } from '../hooks/useKullanicilar';

export interface KullanicilarTabloProps {
    users: AppUser[];
    currentUser: AppUser;
    isAdmin: boolean;
    onRoleChange: (userId: string, role: UserRole) => void;
    onSpecialtyChange: (userId: string, specialty: SpecialtyType) => void;
}

export const KullanicilarTablo = ({ users, currentUser, isAdmin, onRoleChange, onSpecialtyChange }: KullanicilarTabloProps) => {
    const roleBodyTemplate = (rowData: AppUser) => (
        <Dropdown
            value={rowData.role}
            options={ROLE_OPTIONS}
            onChange={(e) => onRoleChange(rowData.id, e.value)}
            disabled={!isAdmin || rowData.id === currentUser.id} // Kendini rolsüz bırakmasını engelle
            className="w-full md:w-14rem"
        />
    );

    const specialtyBodyTemplate = (rowData: AppUser) => {
        if (rowData.role !== 'TEKNISYEN') {
            return <span className="text-500">-</span>;
        }

        return (
            <Dropdown
                value={rowData.specialty || null}
                options={SPECIALTY_OPTIONS}
                onChange={(e) => onSpecialtyChange(rowData.id, e.value)}
                placeholder="Uzmanlık Seçiniz"
                disabled={!isAdmin}
                className="w-full md:w-12rem"
            />
        );
    };

    const teamsBodyTemplate = (rowData: AppUser) => {
        const userTeams = rowData.teams || [];
        if (userTeams.length === 0) {
            return <span className="text-500">Ekip Atanmadı</span>;
        }
        return (
            <div className="flex flex-wrap gap-1">
                {userTeams.map((team) => (
                    <Tag key={team} value={team} severity="info" rounded />
                ))}
            </div>
        );
    };

    const statusBodyTemplate = () => <Tag value="AKTİF" severity="success" />;

    return (
        <DataTable value={users} stripedRows responsiveLayout="scroll" emptyMessage="Kayıtlı personel bulunamadı.">
            <Column field="sicilNo" header="Sicil No" style={{ minWidth: '8rem' }} />
            <Column field="fullName" header="Ad Soyad" style={{ minWidth: '12rem' }} />
            <Column field="email" header="Kurumsal E-Posta" style={{ minWidth: '14rem' }} />
            <Column field="dahili" header="Dahili Hat" style={{ minWidth: '8rem' }} />
            <Column header="Ekip" body={teamsBodyTemplate} style={{ minWidth: '14rem' }} />
            <Column header="Sistem Rolü" body={roleBodyTemplate} style={{ minWidth: '14rem' }} />
            <Column header="Uzmanlık Alanı" body={specialtyBodyTemplate} style={{ minWidth: '12rem' }} />
            <Column header="Durum" body={statusBodyTemplate} style={{ minWidth: '6rem' }} />
        </DataTable>
    );
};

export default KullanicilarTablo;
