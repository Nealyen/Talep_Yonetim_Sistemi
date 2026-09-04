import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { AppUser } from '@/layout/context/UserContext';
import { AtamaSatiri } from '../hooks/useEkipYonetimi';

export interface PersonelEkipEslestirmeProps {
    rows: AtamaSatiri[];
    assignableUsers: AppUser[];
    teams: string[];
    onUserChange: (row: AtamaSatiri, userId: string) => void;
    onTeamChange: (row: AtamaSatiri, team: string) => void;
    onDeleteRow: (row: AtamaSatiri) => void;
    onAddRow: () => void;
}

export const PersonelEkipEslestirme = ({ rows, assignableUsers, teams, onUserChange, onTeamChange, onDeleteRow, onAddRow }: PersonelEkipEslestirmeProps) => {
    const userOptions = assignableUsers.map((u) => ({ label: u.fullName, value: u.id }));

    return (
        <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-sm font-bold text-600 uppercase tracking-wider text-primary mb-3">Birim Personeli — Bağlı Olduğu Gruplar</div>

            <DataTable value={rows} size="small" className="p-datatable-sm mb-3" emptyMessage="Henüz bir ekip ataması yapılmadı.">
                <Column
                    header="Personel"
                    body={(row: AtamaSatiri) => (
                        <Dropdown
                            value={row.userId || null}
                            options={userOptions}
                            onChange={(e) => onUserChange(row, e.value)}
                            placeholder="Personel Seçiniz"
                            filter
                            className="w-full"
                        />
                    )}
                />
                <Column
                    header="Bağlı Olduğu Ekip"
                    body={(row: AtamaSatiri) => (
                        <Dropdown value={row.team || null} options={teams} onChange={(e) => onTeamChange(row, e.value)} placeholder="Ekip Seçiniz" className="w-full" />
                    )}
                />
                <Column
                    header=""
                    style={{ width: '80px' }}
                    body={(row: AtamaSatiri) => <Button icon="pi pi-trash" rounded outlined severity="danger" size="small" tooltip="Eşleşmeyi Sil" onClick={() => onDeleteRow(row)} />}
                />
            </DataTable>

            <Button label="Ekle" icon="pi pi-plus" onClick={onAddRow} />
        </div>
    );
};

export default PersonelEkipEslestirme;
