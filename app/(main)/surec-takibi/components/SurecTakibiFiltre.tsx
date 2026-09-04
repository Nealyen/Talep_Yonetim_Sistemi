import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export interface SurecTakibiFiltreProps {
    search: string;
    onSearchChange: (value: string) => void;
    categoryFilter: string | null;
    onCategoryFilterChange: (value: string | null) => void;
}

export const SurecTakibiFiltre = ({ search, onSearchChange, categoryFilter, onCategoryFilterChange }: SurecTakibiFiltreProps) => {
    return (
        <div className="flex flex-wrap gap-2 mb-3">
            <InputText value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Talep veya çalışan ara..." />
            <Dropdown
                value={categoryFilter}
                options={['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik']}
                onChange={(event) => onCategoryFilterChange(event.value)}
                placeholder="Kategori"
                showClear
            />
        </div>
    );
};

export default SurecTakibiFiltre;
