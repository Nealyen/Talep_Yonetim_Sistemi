/**
 * BİLEŞEN: Kategori Yönetimi — Alt Başlık tablosu (sağ panel).
 * NE İŞE YARAR: Seçili Üst Başlığın Alt Başlıklarını, her birinin Ekip/Süreç
 * Ölçüm/Pasif ayarını gösterir. Alt Başlık artık serbest metin değil, resmî katalogdan
 * (constants/newTicketOptions.ts → CATEGORY_DATA) seçilen bir Dropdown'dır. Aynı üst
 * başlıkta başka bir satırda zaten kullanılan katalog değeri tekrar seçilemez.
 * Değişiklik confirmDialog ile onay ister (bkz. useKategoriYonetimi.ts).
 */

import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';
import { CategoryItem } from '@/layout/context/CategoryContext';

export interface AltBaslikTablosuProps {
    selectedUstBaslik: string | null;
    items: CategoryItem[];
    teams: string[];
    getAltBaslikOptions: (item: CategoryItem) => { label: string; value: string }[];
    newAltBaslikName: string;
    onNewAltBaslikNameChange: (value: string) => void;
    error: string | null;
    onAddAltBaslik: () => void;
    onAltBaslikSelect: (item: CategoryItem, newAltBaslik: string) => void;
    onTeamChange: (id: string, team: string) => void;
    onToggleSurecOlcum: (id: string, value: boolean) => void;
    onTogglePasif: (id: string, value: boolean) => void;
    onDeleteAltBaslik: (item: CategoryItem) => void;
}

export const AltBaslikTablosu = ({
    selectedUstBaslik,
    items,
    teams,
    getAltBaslikOptions,
    newAltBaslikName,
    onNewAltBaslikNameChange,
    error,
    onAddAltBaslik,
    onAltBaslikSelect,
    onTeamChange,
    onToggleSurecOlcum,
    onTogglePasif,
    onDeleteAltBaslik
}: AltBaslikTablosuProps) => {
    if (!selectedUstBaslik) {
        return (
            <div className="surface-card p-3 border-round border-1 surface-border h-full flex align-items-center justify-content-center">
                <span className="text-500">Soldan bir üst başlık seçin ya da yeni bir üst başlık ekleyin.</span>
            </div>
        );
    }

    const teamOptions = [{ label: 'Atanmadı', value: '' }, ...teams.map((t) => ({ label: t, value: t }))];

    return (
        <div className="surface-card p-3 border-round border-1 surface-border h-full">
            <div className="text-sm font-bold text-600 uppercase tracking-wider text-primary mb-3">
                Alt Başlıklar — <span className="text-900">{selectedUstBaslik}</span>
            </div>

            {error && <Message severity="error" className="w-full mb-3" text={error} />}

            <DataTable value={items} size="small" className="p-datatable-sm mb-3" emptyMessage="Bu üst başlıkta henüz alt başlık yok.">
                <Column
                    header="Alt Başlık"
                    body={(row: CategoryItem) => (
                        // KURAL: Katalogdaki (CATEGORY_DATA) seçilmemiş alt başlıklar listelenir;
                        // aynı üst başlıkta başka bir satırda zaten kullanılan değerler burada
                        // görünmez (mükerrer kayıt oluşmasın diye). Seçim değiştirildiğinde
                        // doğrudan uygulanmaz — hook tarafında bir onay penceresi açılır.
                        <Dropdown
                            value={row.altBaslik}
                            options={getAltBaslikOptions(row)}
                            onChange={(e) => onAltBaslikSelect(row, e.value)}
                            className="w-full"
                            placeholder="Alt Başlık Seçiniz"
                            panelClassName="always-bottom-panel"
                            appendTo="self"
                            emptyMessage="Bu üst başlıkta seçilebilecek başka katalog değeri yok"
                        />
                    )}
                    style={{ minWidth: '260px' }}
                />
                <Column
                    header="Ekip"
                    body={(row: CategoryItem) => (
                        <Dropdown
                            value={row.ekip}
                            options={teamOptions}
                            onChange={(e) => onTeamChange(row.id, e.value)}
                            className="w-full"
                            placeholder="Atanmadı"
                        />
                    )}
                    style={{ minWidth: '220px' }}
                />
                <Column
                    header="Süreç Ölçüm"
                    body={(row: CategoryItem) => (
                        <Checkbox checked={row.surecOlcum} onChange={(e) => onToggleSurecOlcum(row.id, !!e.checked)} />
                    )}
                    style={{ width: '110px', textAlign: 'center' }}
                    alignHeader="center"
                />
                <Column
                    header="Pasif"
                    body={(row: CategoryItem) => <Checkbox checked={row.pasif} onChange={(e) => onTogglePasif(row.id, !!e.checked)} />}
                    style={{ width: '80px', textAlign: 'center' }}
                    alignHeader="center"
                />
                <Column
                    header=""
                    style={{ width: '70px' }}
                    body={(row: CategoryItem) => (
                        <Button icon="pi pi-trash" rounded outlined severity="danger" size="small" tooltip="Alt Başlığı Sil" onClick={() => onDeleteAltBaslik(row)} />
                    )}
                />
            </DataTable>

            <div className="flex gap-2 pt-2 border-top-1 surface-border">
                <InputText
                    value={newAltBaslikName}
                    onChange={(e) => onNewAltBaslikNameChange(e.target.value)}
                    placeholder="Yeni alt başlık adı..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onAddAltBaslik();
                    }}
                />
                <Button label="Ekle" icon="pi pi-plus" onClick={onAddAltBaslik} />
            </div>
        </div>
    );
};

export default AltBaslikTablosu;
