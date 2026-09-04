'use client';

import { useState } from 'react';
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

// KURAL: Bu izinler listesi şimdilik sadece "Yeni Rol Tanımla" formunun görsel
// iskeletini doldurmak için var. Henüz gerçek bir yetkilendirme (RBAC enforcement)
// mekanizmasına bağlı DEĞİL — bkz. useKullanicilar.handleAddDraftRole açıklaması.
export const PERMISSION_OPTIONS = [
    'Talep Görüntüleme',
    'Talep Oluşturma',
    'Talep Atama',
    'Talep Düzenleme',
    'Kullanıcı Yönetimi',
    'Ekip Yönetimi',
    'Denetim İzi Görüntüleme',
    'Raporları Görüntüleme'
];

export interface TaslakRol {
    id: string;
    name: string;
    permissions: string[];
}

export const useKullanicilar = () => {
    const { users, currentUser, updateUser } = useUser();
    const isAdmin = currentUser.role === 'ADMIN';

    const handleRoleChange = (userId: string, role: UserRole) => updateUser(userId, { role });
    const handleSpecialtyChange = (userId: string, specialty: SpecialtyType) => updateUser(userId, { specialty });

    // KURAL: "Yeni Rol Tanımla" alanı, kullanıcının açık isteğiyle ŞİMDİLİK SADECE
    // GÖRSEL olarak eklendi — gerçek bir rol sistemine (kod genelinde UserRole tipi
    // hâlâ sabit 'CALISAN' | 'TEKNISYEN' | 'KOORDINATOR' | 'ADMIN' dörtlüsü) bağlı
    // değil. Burada oluşturulan roller sadece bu sekmede, tarayıcı hafızasında
    // (component state) tutulur; sayfa yenilendiğinde kaybolur ve sistemin geri
    // kalanında (yetkilendirme, sayfa erişimi vb.) hiçbir etkisi yoktur. Gerçek
    // işleve dönüştürülmesi ayrı bir görev olarak ele alınmalıdır.
    const [draftRoles, setDraftRoles] = useState<TaslakRol[]>([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRolePermissions, setNewRolePermissions] = useState<string[]>([]);
    const [roleFormError, setRoleFormError] = useState<string | null>(null);

    const handleAddDraftRole = () => {
        const trimmed = newRoleName.trim();
        if (!trimmed) {
            setRoleFormError('Rol adı boş olamaz.');
            return;
        }
        if (draftRoles.some((r) => r.name.toLocaleLowerCase('tr-TR') === trimmed.toLocaleLowerCase('tr-TR'))) {
            setRoleFormError(`[${trimmed}] adında bir taslak rol zaten eklendi.`);
            return;
        }

        setDraftRoles((prev) => [...prev, { id: `draft-role-${Date.now()}`, name: trimmed, permissions: newRolePermissions }]);
        setNewRoleName('');
        setNewRolePermissions([]);
        setRoleFormError(null);
    };

    const handleDeleteDraftRole = (id: string) => setDraftRoles((prev) => prev.filter((r) => r.id !== id));

    return {
        users,
        currentUser,
        isAdmin,
        handleRoleChange,
        handleSpecialtyChange,
        draftRoles,
        newRoleName,
        setNewRoleName,
        newRolePermissions,
        setNewRolePermissions,
        roleFormError,
        handleAddDraftRole,
        handleDeleteDraftRole
    };
};

