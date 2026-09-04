'use client';

import { useUser, UserRole, SpecialtyType } from '@/layout/context/UserContext';

export const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
];

export const SPECIALTY_OPTIONS: { label: string; value: SpecialtyType }[] = [
    { label: 'Donanım Uzmanı', value: 'Donanım' },
    { label: 'Yazılım Uzmanı', value: 'Yazılım' },
    { label: 'Ağ / Altyapı', value: 'Ağ / Altyapı' },
    { label: 'Genel', value: 'Genel' }
];

export const useKullanicilar = () => {
    const { users, currentUser, updateUser } = useUser();
    const isAdmin = currentUser.role === 'ADMIN';

    const handleRoleChange = (userId: string, role: UserRole) => updateUser(userId, { role });
    const handleSpecialtyChange = (userId: string, specialty: SpecialtyType) => updateUser(userId, { specialty });

    return {
        users,
        currentUser,
        isAdmin,
        handleRoleChange,
        handleSpecialtyChange
    };
};
