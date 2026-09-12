'use client';

/**
 * CONTEXT: Kategori (Üst Başlık / Alt Başlık) kataloğu — "Yeni Talep Oluştur"
 * formunun TEK KAYNAĞI (source of truth).
 * NE TUTAR: ustBasliklar (string[]) ve items (CategoryItem[] — her biri {id,
 * ustBaslik, altBaslik, ekip, surecOlcum, pasif}). Bir üst başlık silinirse
 * altındaki TÜM alt başlıklar da silinir (cascade) — bu davranış çağıran tarafta
 * (useKategoriYonetimi.ts) bir confirmDialog ile açıkça onaylatılır. Pasif
 * işaretlenen alt başlıklar "Yeni Talep Oluştur" formunda görünmez.
 * KALICILIK: localStorage. Başlangıç (seed) verisi constants/newTicketOptions.ts
 * içindeki CATEGORY_DATA'dan gelir ama SONRASINDA bağımsız çalışır — CATEGORY_DATA'yı
 * elle değiştirmek zaten kurulu bir projede hiçbir şeyi otomatik güncellemez.
 * SAĞLADIĞI FONKSİYONLAR: addUstBaslik, deleteUstBaslik, addAltBaslik, updateAltBaslik,
 * deleteAltBaslik — bkz. useCategories() hook'u.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CATEGORY_DATA } from '@/constants/newTicketOptions';

export interface ValidationResult {
    success: boolean;
    error?: string;
}

export interface CategoryItem {
    id: string;
    ustBaslik: string;
    altBaslik: string;
    // Bu alt başlığa gelen bir talep otomatik olarak hangi ekibe yönlendirilecek.
    // Boş string = henüz atanmamış (talep formunda görünür ama otomatik yönlendirme yapılmaz).
    ekip: string;
    surecOlcum: boolean;
    pasif: boolean;
}

interface CategoryContextType {
    ustBasliklar: string[];
    items: CategoryItem[];
    addUstBaslik: (name: string) => ValidationResult;
    deleteUstBaslik: (name: string) => void;
    addAltBaslik: (ustBaslik: string, altBaslik: string) => ValidationResult;
    updateAltBaslik: (id: string, updates: Partial<Pick<CategoryItem, 'altBaslik' | 'ekip' | 'surecOlcum' | 'pasif'>>) => ValidationResult;
    deleteAltBaslik: (id: string) => void;
    resetCategories: () => void;
}

// KURAL: Bu, Excel'de yaşayan "Üst Başlık → Alt Başlık" tablosunun (constants/newTicketOptions.ts
// içindeki CATEGORY_DATA) birebir başlangıç (seed) verisidir. Ekip ataması ilk kurulumda boş
// bırakılır; Admin bunu "Kategori Yönetimi" sayfasından tek tek doldurur.
const SEED_USTBASLIKLAR: string[] = Object.keys(CATEGORY_DATA);

const SEED_ITEMS: CategoryItem[] = Object.entries(CATEGORY_DATA).flatMap(([ustBaslik, altBasliklar]) =>
    altBasliklar.map((altBaslik, index) => ({
        id: `${ustBaslik}__${index}`,
        ustBaslik,
        altBaslik,
        ekip: '',
        surecOlcum: false,
        pasif: false
    }))
);

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
    const [ustBasliklar, setUstBasliklar] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_category_headers');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return SEED_USTBASLIKLAR;
                }
            }
        }
        return SEED_USTBASLIKLAR;
    });

    const [items, setItems] = useState<CategoryItem[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_category_items');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return SEED_ITEMS;
                }
            }
        }
        return SEED_ITEMS;
    });

    useEffect(() => {
        localStorage.setItem('app_category_headers', JSON.stringify(ustBasliklar));
    }, [ustBasliklar]);

    useEffect(() => {
        localStorage.setItem('app_category_items', JSON.stringify(items));
    }, [items]);

    const addUstBaslik = (name: string): ValidationResult => {
        const trimmed = name.trim();
        if (!trimmed) {
            return { success: false, error: 'Üst başlık adı boş olamaz.' };
        }
        if (ustBasliklar.some((u) => u.toLocaleUpperCase('tr-TR') === trimmed.toLocaleUpperCase('tr-TR'))) {
            return { success: false, error: `[${trimmed}] adında bir üst başlık zaten mevcut.` };
        }
        setUstBasliklar((prev) => [...prev, trimmed]);
        return { success: true };
    };

    // KURAL: Bir üst başlık silindiğinde, altındaki tüm alt başlıklar da (kendi içinde
    // tutarlılığı bozmamak için) otomatik olarak silinir. Bu "cascade" davranışı çağıran
    // tarafta (hook) kullanıcıya önceden bir onay penceresiyle açıkça bildirilir.
    const deleteUstBaslik = (name: string) => {
        setUstBasliklar((prev) => prev.filter((u) => u !== name));
        setItems((prev) => prev.filter((item) => item.ustBaslik !== name));
    };

    const addAltBaslik = (ustBaslik: string, altBaslik: string): ValidationResult => {
        const trimmed = altBaslik.trim();
        if (!trimmed) {
            return { success: false, error: 'Alt başlık adı boş olamaz.' };
        }
        const duplicate = items.some(
            (item) => item.ustBaslik === ustBaslik && item.altBaslik.toLocaleUpperCase('tr-TR') === trimmed.toLocaleUpperCase('tr-TR')
        );
        if (duplicate) {
            return { success: false, error: `[${trimmed}] bu üst başlıkta zaten mevcut.` };
        }
        setItems((prev) => [
            ...prev,
            { id: `item-${Date.now()}`, ustBaslik, altBaslik: trimmed, ekip: '', surecOlcum: false, pasif: false }
        ]);
        return { success: true };
    };

    const updateAltBaslik: CategoryContextType['updateAltBaslik'] = (id, updates) => {
        if (updates.altBaslik !== undefined) {
            const trimmed = updates.altBaslik.trim();
            if (!trimmed) {
                return { success: false, error: 'Alt başlık adı boş olamaz.' };
            }
            const current = items.find((item) => item.id === id);
            const duplicate = items.some(
                (item) =>
                    item.id !== id &&
                    current &&
                    item.ustBaslik === current.ustBaslik &&
                    item.altBaslik.toLocaleUpperCase('tr-TR') === trimmed.toLocaleUpperCase('tr-TR')
            );
            if (duplicate) {
                return { success: false, error: `[${trimmed}] bu üst başlıkta zaten mevcut.` };
            }
            updates = { ...updates, altBaslik: trimmed };
        }

        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
        return { success: true };
    };

    const deleteAltBaslik = (id: string) => {
        setItems((prev) => prev.filter((item) => item.id !== id));
    };

    const resetCategories = () => {
        localStorage.removeItem('app_category_headers');
        localStorage.removeItem('app_category_items');
        setUstBasliklar(SEED_USTBASLIKLAR);
        setItems(SEED_ITEMS);
    };

    return (
        <CategoryContext.Provider
            value={{ ustBasliklar, items, addUstBaslik, deleteUstBaslik, addAltBaslik, updateAltBaslik, deleteAltBaslik, resetCategories }}
        >
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
};
