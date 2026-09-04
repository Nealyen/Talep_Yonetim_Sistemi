import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export interface TaleplerimFiltreProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string | null;
    onStatusFilterChange: (value: string | null) => void;
}

export const TaleplerimFiltre = ({ search, onSearchChange, statusFilter, onStatusFilterChange }: TaleplerimFiltreProps) => {
    return (
        <div className="flex flex-wrap gap-2 mb-3">
            <span className="p-input-icon-left w-full md:w-25rem">
                <i className="pi pi-search text-primary" />
                <InputText
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Taleplerim'de Arayın..."
                    className="w-full"
                    tooltip="Talep numarası başlık veya Kategori başlıklarına göre anlık arama yapar"
                    tooltipOptions={{ position: 'bottom' }}
                />
            </span>

            <Dropdown
                value={statusFilter}
                options={['YENİ', 'İŞLEMDE', 'ONAY_BEKLİYOR', 'KAPATILDI', 'REDDEDİLDİ']}
                onChange={(e) => onStatusFilterChange(e.value)}
                placeholder="Durum Filtresi"
                showClear
            />
        </div>
    );
};

export default TaleplerimFiltre;
