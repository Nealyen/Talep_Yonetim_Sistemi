'use client';

//aktif kullancıyı tutan kısım

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'CALISAN' | 'TEKNISYEN' | 'KOORDINATOR' | 'ADMIN';
export type SpecialtyType = 'Donanım' | 'Yazılım' | 'Ağ / Altyapı' | 'Genel';

export interface AppUser {
    id: string;
    fullName: string;
    role: UserRole;
    email: string;
    sicilNo: string;
    dahili: string;
    title?: string;
    specialty?: SpecialtyType;
    department?: string;
}

interface ValidationResult {
    success: boolean;
    error?: string;
}

interface UserContextType {
    currentUser: AppUser;
    setCurrentUser: (user: AppUser) => void;
    users: AppUser[];
    addUser: (user: Omit<AppUser, 'id'>) => ValidationResult;
    updateUser: (id: string, updatedFields: Partial<AppUser>) => ValidationResult;
    deleteUser: (id: string) => boolean;
    resetUsers: () => void;
}

const DEFAULT_USERS: AppUser[] = [
    {
        id: '0001',
        fullName: 'admin1',
        role: 'ADMIN',
        email: 'admin@kurum.local',
        sicilNo: '0000',
        dahili: '0000',
        department: 'Bilgi İşlem Daire Bşk.'
    }
];

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<AppUser[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('app_users');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch {
                    return DEFAULT_USERS;
                }
            }
        }
        return DEFAULT_USERS;
    });

    const [currentUser, setCurrentUser] = useState<AppUser>(() => users[0] || DEFAULT_USERS[0]);

    useEffect(() => {
        localStorage.setItem('app_users', JSON.stringify(users));
    }, [users]);

    // TEKİLLİK DOĞRULAMA MOTORU (UNIQUE CONSTRAINT ENGINE)
    const validateUniqueConstraints = (data: { email: string; sicilNo: string; dahili: string }, excludeUserId?: string): ValidationResult => {
        const targetEmail = data.email.trim().toLowerCase();
        const targetSicil = data.sicilNo.trim().toUpperCase();
        const targetDahili = data.dahili.trim();

        const otherUsers = excludeUserId ? users.filter(u => u.id !== excludeUserId) : users;

        if (otherUsers.some(u => u.email.trim().toLowerCase() === targetEmail)) {
            return { success: false, error: `HATA: [${data.email}] e-posta adresi başka bir kullanıcıya kayıtlıdır.` };
        }

        if (otherUsers.some(u => u.sicilNo.trim().toUpperCase() === targetSicil)) {
            return { success: false, error: `HATA: [${data.sicilNo}] Sicil Numarası başka bir kullanıcıya aittir.` };
        }

        if (otherUsers.some(u => u.dahili.trim() === targetDahili)) {
            return { success: false, error: `HATA: [${data.dahili}] Dahili Hat numarası sistemde zaten kullanımda.` };
        }

        return { success: true };
    };

    // KULLANICI EKLEME
    const addUser = (userData: Omit<AppUser, 'id'>): ValidationResult => {
        const validation = validateUniqueConstraints(userData);
        if (!validation.success) {
            return validation;
        }

        const newUser: AppUser = {
            ...userData,
            id: `usr-${Date.now().toString().slice(-4)}`,
            email: userData.email.trim().toLowerCase(),
            sicilNo: userData.sicilNo.trim().toUpperCase(),
            dahili: userData.dahili.trim()
        };

        setUsers(prev => [...prev, newUser]);
        return { success: true };
    };

    // KULLANICI GÜNCELLEME
    const updateUser = (id: string, updatedFields: Partial<AppUser>): ValidationResult => {
        const target = users.find(u => u.id === id);
        if (!target) return { success: false, error: 'Kullanıcı bulunamadı.' };

        const checkData = {
            email: updatedFields.email ?? target.email,
            sicilNo: updatedFields.sicilNo ?? target.sicilNo,
            dahili: updatedFields.dahili ?? target.dahili
        };

        const validation = validateUniqueConstraints(checkData, id);
        if (!validation.success) {
            return validation;
        }

        setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updatedFields } : u)));

        if (currentUser.id === id) {
            setCurrentUser(prev => ({ ...prev, ...updatedFields }));
        }

        return { success: true };
    };

    // KULLANICI SİLME
    const deleteUser = (id: string): boolean => {
        if (users.length <= 1) return false; // Son kalan kullanıcı silinemez
        setUsers(prev => prev.filter(u => u.id !== id));
        if (currentUser.id === id) {
            setCurrentUser(users.find(u => u.id !== id) || DEFAULT_USERS[0]);
        }
        return true;
    };

    // FABRİKA AYARLARINA SIFIRLA
    const resetUsers = () => {
        localStorage.removeItem('app_users');
        setUsers(DEFAULT_USERS);
        setCurrentUser(DEFAULT_USERS[0]);
    };

    return (
        <UserContext.Provider value={{ currentUser, setCurrentUser, users, addUser, updateUser, deleteUser, resetUsers }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};