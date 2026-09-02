'use client';

import React from 'react';
import { Dropdown } from 'primereact/dropdown';

export interface CategoryOption {
    label: string;
    value: string;
}

export interface CategorySelectionSectionProps {
    category: string;
    subCategory: string;
    categoryOptions: CategoryOption[];
    subCategoryOptions: CategoryOption[];
    onCategoryChange: (value: string) => void;
    onSubCategoryChange: (value: string) => void;
}

export const CategorySelectionSection = ({
    category,
    subCategory,
    categoryOptions,
    subCategoryOptions,
    onCategoryChange,
    onSubCategoryChange
}: CategorySelectionSectionProps) => (
    <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
        <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">KATEGORİLER</div>
        <div className="formgrid grid">
            <div className="field col-12 md:col-6 relative">
                <label className="font-bold">Ana Talep Grubu</label>
                <Dropdown value={category} options={categoryOptions} onChange={(e) => onCategoryChange(e.value)} placeholder="Kategori Seçiniz" />
                <input
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                    value={category}
                    required
                    onChange={() => {}}
                />
            </div>
            <div className="field col-12 md:col-6 relative">
                <label className="font-bold">Alt Kategoriler</label>
                <Dropdown
                    value={subCategory}
                    options={subCategoryOptions}
                    onChange={(e) => onSubCategoryChange(e.value)}
                    placeholder="Alt Kategori Seçiniz"
                    disabled={!category}
                />
                <input
                    tabIndex={-1}
                    autoComplete="off"
                    style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                    value={subCategory}
                    required
                    onChange={() => {}}
                />
            </div>
        </div>
    </div>
);

export default CategorySelectionSection;
