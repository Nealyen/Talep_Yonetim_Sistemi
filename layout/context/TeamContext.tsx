'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ValidationResult {
    success: boolean;
    error?: string;
}

interface TeamContextType {
    teams: string[];
    addTeam: (name: string) => ValidationResult;
    deleteTeam: (name: string) => void;
    resetTeams: () => void;
}

// KURAL: Bu liste, eski (kağıt üzerindeki) sistemdeki grup listesinin birebir
// karşılığıdır. Admin, "Ekip Yönetimi" sayfasından bu listeyi dilediği gibi
// genişletebilir/daraltabilir; bu sadece başlangıç (seed) verisidir.
const DEFAULT_TEAMS: string[] = [
    'SİSTEM',
    'SİSTEM VE NETWORK',
    'NETWORK ALTYAPI',
    'TEKNİK DESTEK YAZILIM',
    'EBYS (Elektronik Belge Yönetimi)',
    'YBS (Yönetim Bilgi Sistemi)',
    'EBA İŞ AKIŞ YÖNETİMİ',
    'WEB',
    'YAZICI VE TARAYICI',
    'E-POSTA DESTEK',
    'TEKNİK DESTEK DONANIM',
    'TOPLANTI DESTEK',
    'SES GÖRÜNTÜ',
    'SİSTEM DESTEK'
];

const TeamContext = createContext<TeamContextType | undefined>(undefined);

export const TeamProvider = ({ children }: { children: React.ReactNode }) => {
    const [teams, setTeams] = useState<string[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_teams');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return DEFAULT_TEAMS;
                }
            }
        }
        return DEFAULT_TEAMS;
    });

    useEffect(() => {
        localStorage.setItem('app_teams', JSON.stringify(teams));
    }, [teams]);

    const addTeam = (name: string): ValidationResult => {
        const trimmed = name.trim();
        if (!trimmed) {
            return { success: false, error: 'Ekip adı boş olamaz.' };
        }
        if (teams.some((t) => t.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
            return { success: false, error: `[${trimmed}] adında bir ekip zaten mevcut.` };
        }
        setTeams((prev) => [...prev, trimmed]);
        return { success: true };
    };

    // NOT: Bir ekip silindiğinde, o ekibe atanmış personelin kaydından da temizlenmesi
    // gerekir. Bu iş, iki context'i (Team + User) birbirine bağımlı kılmamak için burada
    // değil, çağıran tarafta (useEkipYonetimi hook'u) yapılır.
    const deleteTeam = (name: string) => {
        setTeams((prev) => prev.filter((t) => t !== name));
    };

    const resetTeams = () => {
        localStorage.removeItem('app_teams');
        setTeams(DEFAULT_TEAMS);
    };

    return <TeamContext.Provider value={{ teams, addTeam, deleteTeam, resetTeams }}>{children}</TeamContext.Provider>;
};

export const useTeams = () => {
    const context = useContext(TeamContext);
    if (!context) {
        throw new Error('useTeams must be used within a TeamProvider');
    }
    return context;
};
