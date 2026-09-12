/**
 * BİLEŞEN: Kullanıcı & Rol Yönetimi tablosu.
 * NE İŞE YARAR: Rol değiştirme, ekip ekleme/çıkarma.
 * NOT — EKİP DÜZENLEME: Bilerek satır içine gömülü (permanent) bir checkbox listesi
 * DEĞİL, küçük bir "Düzenle" butonuyla açılan bir OverlayPanel (floating popover)
 * kullanılıyor. Sebep: satır içine gömülü liste, sadece o an düzenlenen satırın
 * boyunu devasa büyütüp diğer satırlarla aynı hizada durmasını bozuyordu (tablo
 * "zıplıyor" gibi görünüyordu). Popover ile satır yüksekliği HER ZAMAN sabit kalır;
 * düzenleme arayüzü sadece geçici olarak, tablonun üzerinde (akışın dışında) açılır.
 */

import React, { useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Checkbox } from 'primereact/checkbox';
import { AppUser, UserRole } from '@/layout/context/UserContext';
import { ROLE_OPTIONS } from '../hooks/useKullanicilar';

export interface KullanicilarTabloProps {
    users: AppUser[];
    currentUser: AppUser;
    isAdmin: boolean;
    teams: string[];
    onRoleChange: (userId: string, role: UserRole) => void;
    onAddTeamToUser: (userId: string, team: string) => void;
    onRemoveTeamFromUser: (userId: string, team: string) => void;
}

// KURAL: Ekip etiketinin üzerine gelince sağında bir "x" beliriyor (imleç ayrılınca
// kayboluyor); tıklanınca o kullanıcıdan o ekibi kaldırıyor. Saf React state ile
// yönetiliyor (CSS hover hilesine bağımlı değil), bu yüzden her ortamda güvenilir çalışır.
const TeamChip = ({ team, onRemove }: { key?: string; team: string; onRemove: () => void }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <span
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className="inline-flex align-items-center gap-1 text-white text-xs font-medium border-round-2xl white-space-nowrap"
            style={{ backgroundColor: 'var(--blue-500, #3B82F6)', padding: '0.25rem 0.5rem' }}
        >
            {team}
            {hovered && (
                <i
                    className="pi pi-times cursor-pointer"
                    style={{ fontSize: '0.65rem' }}
                    onClick={onRemove}
                    role="button"
                    aria-label={`${team} ekibinden çıkar`}
                />
            )}
        </span>
    );
};

export const KullanicilarTablo = ({ users, currentUser, isAdmin, teams, onRoleChange, onAddTeamToUser, onRemoveTeamFromUser }: KullanicilarTabloProps) => {
    const editPanelRef = useRef<OverlayPanel>(null);
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const editingUser = users.find((u) => u.id === editingUserId) || null;

    const roleBodyTemplate = (rowData: AppUser) => (
        <Dropdown
            value={rowData.role}
            options={ROLE_OPTIONS}
            onChange={(e) => onRoleChange(rowData.id, e.value)}
            disabled={!isAdmin || rowData.id === currentUser.id} // Kendini rolsüz bırakmasını engelle
            className="w-full md:w-14rem"
        />
    );

    // KURAL: CALISAN rolü ekibe dahil edilmiyor (bkz. Ekip Yönetimi); onlar için
    // "Ekip Atanmadı" yerine sade bir "-" gösteriliyor, çünkü bu bir eksiklik değil,
    // beklenen durumdur. Diğer roller için "Ekip Atanmadı" bir uyarı/hatırlatma
    // niteliğinde kalmaya devam ediyor.
    const teamsBodyTemplate = (rowData: AppUser) => {
        const userTeams = rowData.teams || [];

        if (rowData.role === 'CALISAN' && userTeams.length === 0) {
            return <span className="text-500">-</span>;
        }

        // CALISAN en fazla 1 ekibe dahil olabilir; zaten 1 tanesi varsa düzenleme butonu gizlenir.
        const canEdit = !(rowData.role === 'CALISAN' && userTeams.length >= 1);

        return (
            <div className="flex flex-wrap align-items-center gap-1" style={{ minHeight: '2rem' }}>
                {userTeams.length === 0 && <span className="text-500">Ekip Atanmadı</span>}
                {userTeams.map((team) => (
                    <TeamChip key={team} team={team} onRemove={() => onRemoveTeamFromUser(rowData.id, team)} />
                ))}
                {isAdmin && canEdit && teams.length > 0 && (
                    <Button
                        icon="pi pi-pencil"
                        rounded
                        text
                        size="small"
                        tooltip="Ekip Düzenle"
                        onClick={(e) => {
                            setEditingUserId(rowData.id);
                            editPanelRef.current?.toggle(e);
                        }}
                    />
                )}
            </div>
        );
    };

    const statusBodyTemplate = () => <Tag value="AKTİF" severity="success" />;

    return (
        <>
            <DataTable value={users} stripedRows responsiveLayout="scroll" emptyMessage="Kayıtlı personel bulunamadı.">
                <Column field="sicilNo" header="Sicil No" style={{ minWidth: '8rem' }} />
                <Column field="fullName" header="Ad Soyad" style={{ minWidth: '12rem' }} />
                <Column field="email" header="Kurumsal E-Posta" style={{ minWidth: '14rem' }} />
                <Column field="dahili" header="Dahili Hat" style={{ minWidth: '8rem' }} />
                <Column header="Ekip" body={teamsBodyTemplate} style={{ minWidth: '16rem' }} />
                <Column header="Sistem Rolü" body={roleBodyTemplate} style={{ minWidth: '14rem' }} />
                <Column header="Durum" body={statusBodyTemplate} style={{ minWidth: '6rem' }} />
            </DataTable>

            {/* KURAL: Tek bir OverlayPanel, hangi satır için açıldığını `editingUserId` ile
                takip ediyor. Böylece her satıra ayrı bir panel eklemek zorunda kalmıyoruz. */}
            <OverlayPanel ref={editPanelRef} onHide={() => setEditingUserId(null)} style={{ width: '18rem' }}>
                {editingUser && (
                    <div>
                        <span className="font-semibold text-sm block mb-2">{editingUser.fullName} — Ekipler</span>
                        <div className="flex flex-column gap-1" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
                            {teams.map((team) => {
                                const userTeams = editingUser.teams || [];
                                const isSelected = userTeams.includes(team);
                                const isDisabled = editingUser.role === 'CALISAN' && userTeams.length >= 1 && !isSelected;

                                return (
                                    <div
                                        key={team}
                                        className={`flex align-items-center gap-2 p-2 border-round transition-colors transition-duration-150 ${isDisabled ? 'opacity-50' : 'cursor-pointer hover:surface-100'} ${isSelected ? 'surface-100' : ''}`}
                                        onClick={() => {
                                            if (isDisabled) return;
                                            if (isSelected) {
                                                onRemoveTeamFromUser(editingUser.id, team);
                                            } else {
                                                onAddTeamToUser(editingUser.id, team);
                                            }
                                        }}
                                    >
                                        <Checkbox checked={isSelected} disabled={isDisabled} onChange={() => {}} />
                                        <span className="text-sm flex-1">{team}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </OverlayPanel>
        </>
    );
};

export default KullanicilarTablo;