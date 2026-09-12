/**
 * BİLEŞEN: Kategori Yönetimi — Üst Başlık listesi (sol panel, "klasör" görünümü).
 * Her satırda o üst başlığa ait kaç alt başlık olduğunu gösteren bir rozet var.
 */

import React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { Badge } from 'primereact/badge';

export interface UstBaslikListItem {
    ustBaslik: string;
    count: number;
}

export interface UstBaslikListesiProps {
    items: UstBaslikListItem[];
    selected: string | null;
    onSelect: (ustBaslik: string) => void;
    newName: string;
    onNewNameChange: (value: string) => void;
    error: string | null;
    onAdd: () => void;
    onDelete: (ustBaslik: string) => void;
}

export const UstBaslikListesi = ({ items, selected, onSelect, newName, onNewNameChange, error, onAdd, onDelete }: UstBaslikListesiProps) => {
    return (
        <div className="surface-card p-3 border-round border-1 surface-border h-full">
            <div className="text-sm font-bold text-600 uppercase tracking-wider text-primary mb-3">Üst Başlıklar</div>

            {error && <Message severity="error" className="w-full mb-3" text={error} />}

            <ul className="list-none p-0 m-0 flex flex-column gap-1 mb-3" style={{ maxHeight: '460px', overflowY: 'auto' }}>
                {items.length === 0 && <li className="text-500 text-sm p-2">Henüz tanımlı üst başlık yok.</li>}
                {items.map(({ ustBaslik, count }) => {
                    const isActive = ustBaslik === selected;
                    return (
                        <li
                            key={ustBaslik}
                            className={`flex align-items-center justify-content-between p-2 border-round cursor-pointer transition-colors transition-duration-150 ${
                                isActive ? 'surface-200 border-left-3 border-primary' : 'hover:surface-100'
                            }`}
                            onClick={() => onSelect(ustBaslik)}
                        >
                            <span className={`text-sm ${isActive ? 'font-bold text-primary' : 'text-900'}`}>{ustBaslik}</span>
                            <div className="flex align-items-center gap-2">
                                <Badge value={count} severity={count > 0 ? 'info' : undefined} />
                                <Button
                                    icon="pi pi-trash"
                                    rounded
                                    text
                                    severity="danger"
                                    size="small"
                                    tooltip="Üst Başlığı Sil"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(ustBaslik);
                                    }}
                                />
                            </div>
                        </li>
                    );
                })}
            </ul>

            <div className="flex gap-2 pt-2 border-top-1 surface-border">
                <InputText
                    value={newName}
                    onChange={(e) => onNewNameChange(e.target.value)}
                    placeholder="Yeni üst başlık adı..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onAdd();
                    }}
                />
                <Button label="Ekle" icon="pi pi-plus" onClick={onAdd} />
            </div>
        </div>
    );
};

export default UstBaslikListesi;
