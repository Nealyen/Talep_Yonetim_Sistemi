import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';

export interface GecmisTaleplerFiltreProps {
    search: string;
    onSearchChange: (value: string) => void;
    categoryFilter: string | null;
    onCategoryFilterChange: (value: string | null) => void;
    categories: string[];
    dateRange: [Date | null, Date | null];
    onDateRangeChange: (range: [Date | null, Date | null]) => void;
}

export const GecmisTaleplerFiltre = ({
    search,
    onSearchChange,
    categoryFilter,
    onCategoryFilterChange,
    categories,
    dateRange,
    onDateRangeChange
}: GecmisTaleplerFiltreProps) => {
    return (
        <div className="flex flex-wrap align-items-center gap-2 mb-3">
            <InputText value={search} onChange={(e) => onSearchChange(e.target.value)} placeholder="Talep, talep sahibi veya uzman ara..." className="w-full md:w-20rem" />

            <Dropdown value={categoryFilter} options={categories} onChange={(e) => onCategoryFilterChange(e.value)} placeholder="Kategori Filtresi" showClear />

            <Calendar
                value={dateRange as [Date, Date] | null}
                onChange={(e) => onDateRangeChange((e.value as [Date | null, Date | null]) || [null, null])}
                selectionMode="range"
                readOnlyInput
                placeholder="Tarih Aralığı Seçin"
                dateFormat="dd.mm.yy"
                showIcon
            />

            {(dateRange[0] || dateRange[1]) && <Button label="Tarihi Temizle" icon="pi pi-times" size="small" text onClick={() => onDateRangeChange([null, null])} />}
        </div>
    );
};

export default GecmisTaleplerFiltre;
