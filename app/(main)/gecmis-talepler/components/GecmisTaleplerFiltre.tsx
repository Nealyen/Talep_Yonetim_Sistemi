/**
 * BİLEŞEN: Geçmiş Talepler filtre çubuğu (arama + kategori + tarih aralığı).
 * DİKKAT: Buradaki Calendar (selectionMode="range") value'suna ASLA [null, null]
 * verilmez — seçim yokken kesinlikle `null` olmalı, aksi halde konsola hata düşer ve
 * panel yanlış konumda açılır. panelClassName="always-bottom-panel" + appendTo="self"
 * ikilisi paneli doğru yere sabitler (bkz. styles/layout/layout.scss).
 */

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
                // KURAL: PrimeReact'in range Calendar'ına ASLA [null, null] gibi
                // "iki elemanlı ama boş" bir dizi verilmez — bileşen bunu geçerli bir
                // aralık sanıp iç formatlama fonksiyonlarında null üzerinde tarih
                // metodu çağırmaya çalışıyor ve konsola hata düşürüyor (bu da hem
                // "1 error" uyarısına hem panelin yanlış/ortalanmış konumlanmasına
                // sebep oluyordu). Seçim yokken value kesinlikle `null` olmalı.
                value={dateRange[0] || dateRange[1] ? (dateRange as [Date, Date]) : null}
                onChange={(e) => onDateRangeChange((e.value as [Date | null, Date | null]) || [null, null])}
                selectionMode="range"
                readOnlyInput
                placeholder="Tarih Aralığı Seçin"
                dateFormat="dd.mm.yy"
                showIcon
                panelClassName="always-bottom-panel"
                appendTo="self"
            />

            {(dateRange[0] || dateRange[1]) && <Button label="Tarihi Temizle" icon="pi pi-times" size="small" text onClick={() => onDateRangeChange([null, null])} />}
        </div>
    );
};

export default GecmisTaleplerFiltre;
