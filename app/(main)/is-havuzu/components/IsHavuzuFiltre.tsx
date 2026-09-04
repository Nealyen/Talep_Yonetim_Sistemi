import React from 'react';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

export interface IsHavuzuFiltreProps {
    search: string;
    onSearchChange: (value: string) => void;
    priorityFilter: string | null;
    onPriorityFilterChange: (value: string | null) => void;
}

export const IsHavuzuFiltre = ({ search, onSearchChange, priorityFilter, onPriorityFilterChange }: IsHavuzuFiltreProps) => {
    return (
        <div className="flex flex-wrap gap-2 mb-3">
            <InputText value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Talep veya birim ara..." className="w-full md:w-20rem" />
            <Dropdown
                value={priorityFilter}
                options={['Düşük', 'Normal', 'Yüksek', 'Kritik']}
                onChange={(event) => onPriorityFilterChange(event.value)}
                placeholder="Aciliyet Filtresi"
                showClear
            />
        </div>
    );
};

export default IsHavuzuFiltre;
