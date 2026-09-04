import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';

export interface TaleplerimFiltreProps {
    search: string;
    onSearchChange: (value: string) => void;
    statusFilter: string | null;
    onStatusFilterChange: (value: string | null) => void;
    dateRange: [Date | null, Date | null];
    onDateRangeChange: (range: [Date | null, Date | null]) => void;
}

export const TaleplerimFiltre = ({ search, onSearchChange, statusFilter, onStatusFilterChange, dateRange, onDateRangeChange }: TaleplerimFiltreProps) => {
    return (
        <div className="flex flex-wrap align-items-center gap-2 mb-3">
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

            <Calendar
                value={dateRange as [Date, Date] | null}
                onChange={(e) => onDateRangeChange((e.value as [Date | null, Date | null]) || [null, null])}
                selectionMode="range"
                readOnlyInput
                placeholder="Tarih Aralığı Seçin"
                dateFormat="dd.mm.yy"
                showIcon
            />

            {(dateRange[0] || dateRange[1]) && (
                <Button label="Tarihi Temizle" icon="pi pi-times" size="small" text onClick={() => onDateRangeChange([null, null])} />
            )}
        </div>
    );
};

export default TaleplerimFiltre;
