/**
 * BİLEŞEN: Personel-Ekip Eşleştirme — Ekip Yönetimi sayfasının SAĞ tarafı.
 * NE İŞE YARAR: Her personelin hangi ekip(ler)e dahil olduğunu satır satır gösterir
 * ve düzenlenmesini sağlar. KURAL: Çalışan (CALISAN) rolü en fazla 1 ekibe dahil
 * olabilir, diğer roller birden fazla ekibe dahil olabilir.
 */

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import { AppUser } from '@/layout/context/UserContext';
import { AtamaSatiri } from '../hooks/useEkipYonetimi';

export interface PersonelEkipEslestirmeProps {
    rows: AtamaSatiri[];
    assignableUsers: AppUser[];
    teams: string[];
    assignmentError: string | null;
    hasPendingAction: boolean;
    onUserChange: (row: AtamaSatiri, userId: string) => void;
    onTeamChange: (row: AtamaSatiri, team: string) => void;
    isRowReadyToConfirm: (row: AtamaSatiri) => boolean;
    isRowEditing: (row: AtamaSatiri) => boolean;
    onConfirmRow: (row: AtamaSatiri) => void;
    onCancelRow: (row: AtamaSatiri) => void;
    onDeleteRow: (row: AtamaSatiri) => void;
    onAddRow: () => void;
}

export const PersonelEkipEslestirme = ({
    rows,
    assignableUsers,
    teams,
    assignmentError,
    hasPendingAction,
    onUserChange,
    onTeamChange,
    isRowReadyToConfirm,
    isRowEditing,
    onConfirmRow,
    onCancelRow,
    onDeleteRow,
    onAddRow
}: PersonelEkipEslestirmeProps) => {
    const userOptions = assignableUsers.map((u) => ({ label: u.fullName, value: u.id }));

    
    // Aynı anda sadece tek bir bekleyen işlem (yeni satır ya da düzenleme) olabilir.
    // "Şu an aktif olan bekleyen satır" ya yeni eklenen taslak satırdır (henüz boş
    // olsa bile) ya da düzenlenmekte olan kayıtlı satırdır — bu satır ASLA kilitlenmez.
    // Diğer tüm satırlar, bir bekleyen işlem sürerken kilitlenir.
    const isActivePendingRow = (row: AtamaSatiri) => row.isDraft || isRowEditing(row);
    const isRowLockedByOther = (row: AtamaSatiri) => hasPendingAction && !isActivePendingRow(row);

    return (
        <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-sm font-bold text-600 uppercase tracking-wider text-primary mb-3">Birim Personeli — Bağlı Olduğu Gruplar</div>

            {assignmentError && <Message severity="error" className="w-full mb-3" text={assignmentError} />}

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
                            disabled={isRowLockedByOther(row)}
                            className="w-full"
                        />
                    )}
                />
                <Column
                    header="Bağlı Olduğu Ekip"
                    body={(row: AtamaSatiri) => (
                        <Dropdown
                            value={row.team || null}
                            options={teams}
                            onChange={(e) => onTeamChange(row, e.value)}
                            placeholder="Ekip Seçiniz"
                            disabled={isRowLockedByOther(row)}
                            className="w-full"
                        />
                    )}
                />
                <Column
                    header=""
                    style={{ width: '110px' }}
                    body={(row: AtamaSatiri) => {
                        // KURAL: Ya yeni eklenen (taslak) bir satırda hem kişi hem ekip
                        // seçilmişse, ya da zaten kayıtlı bir satırda değişiklik yapılıyorsa
                        // (düzenleniyorsa), çöp kutusu yerine ONAY (✓) + İPTAL (✕) ikon
                        // çifti gösterilir. Değişiklik sadece ✓'a basılınca kalıcı olur.
                        const showConfirmCancel = isRowReadyToConfirm(row) || isRowEditing(row);

                        if (showConfirmCancel) {
                            return (
                                <div className="flex gap-1">
                                    <Button
                                        icon="pi pi-check"
                                        rounded
                                        severity="success"
                                        size="small"
                                        tooltip="Değişikliği Onayla"
                                        onClick={() => onConfirmRow(row)}
                                    />
                                    <Button
                                        icon="pi pi-times"
                                        rounded
                                        outlined
                                        severity="secondary"
                                        size="small"
                                        tooltip="Vazgeç"
                                        onClick={() => onCancelRow(row)}
                                    />
                                </div>
                            );
                        }

                        // Normal (bekleyen bir işlemi olmayan, zaten kayıtlı) satır → çöp kutusu.
                        return (
                            <Button
                                icon="pi pi-trash"
                                rounded
                                outlined
                                severity="danger"
                                size="small"
                                tooltip="Eşleşmeyi Sil"
                                disabled={isRowLockedByOther(row)}
                                onClick={() => onDeleteRow(row)}
                            />
                        );
                    }}
                />
            </DataTable>

            <Button
                label="Ekle"
                icon="pi pi-plus"
                onClick={onAddRow}
                disabled={hasPendingAction}
                tooltip={hasPendingAction ? 'Önce bekleyen işlemi onaylayın ya da vazgeçin' : undefined}
                tooltipOptions={{ position: 'top' }}
            />
        </div>
    );
};

export default PersonelEkipEslestirme;
