'use client';

/**
 * HOOK: Kategori Yönetimi sayfasının tüm state ve iş mantığı.
 * NE İŞE YARAR: Üst/Alt Başlık ekleme-silme, getAltBaslikOptions (satırın dropdown
 * seçeneklerini resmi katalogdan, aynı üst başlıkta zaten kullanılanları çıkararak
 * üretir), handleAltBaslikSelect (seçim değişince confirmDialog ile onay ister).
 * Üst başlık silinirse altındaki TÜM alt başlıklar da silinir — bu yüzden silme
 * öncesi açıkça uyarı gösterilir.
 */

import { useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { useCategories, CategoryItem } from '@/layout/context/CategoryContext';
import { useTeams } from '@/layout/context/TeamContext';
import { CATEGORY_DATA } from '@/constants/newTicketOptions';

export const useKategoriYonetimi = () => {
    const { ustBasliklar, items, addUstBaslik, deleteUstBaslik, addAltBaslik, updateAltBaslik, deleteAltBaslik } = useCategories();
    const { teams } = useTeams();

    const [selectedUstBaslik, setSelectedUstBaslik] = useState<string | null>(ustBasliklar[0] || null);
    const [newUstBaslikName, setNewUstBaslikName] = useState('');
    const [ustBaslikError, setUstBaslikError] = useState<string | null>(null);
    const [newAltBaslikName, setNewAltBaslikName] = useState('');
    const [altBaslikError, setAltBaslikError] = useState<string | null>(null);

    // Sol panelde her üst başlığın yanında kaç alt başlığı olduğunu gösteren rozet.
    const ustBaslikListesi = ustBasliklar.map((ust) => ({
        ustBaslik: ust,
        count: items.filter((item) => item.ustBaslik === ust).length
    }));

    const filteredItems: CategoryItem[] = selectedUstBaslik ? items.filter((item) => item.ustBaslik === selectedUstBaslik) : [];

    // KURAL: Alt Başlık artık serbest metin değil, "Yeni Talep Oluştur" formunun da
    // kaynağı olan resmî katalogdan (CATEGORY_DATA) seçilir. Bir satırın dropdown'ı,
    // aynı üst başlıkta BAŞKA bir satır tarafından zaten kullanılan katalog
    // değerlerini göstermez (mükerrer alt başlık oluşmasın diye). Satırın kendi
    // mevcut değeri katalogda yoksa (elle girilmiş eski/özel bir isimse) yine de
    // listenin başında "şu anki seçim" olarak görünür ki dropdown boş açılmasın.
    const getAltBaslikOptions = (item: CategoryItem): { label: string; value: string }[] => {
        const catalog = CATEGORY_DATA[item.ustBaslik] || [];
        const usedByOtherRows = new Set(
            items.filter((i) => i.ustBaslik === item.ustBaslik && i.id !== item.id).map((i) => i.altBaslik)
        );
        const available = catalog.filter((name) => !usedByOtherRows.has(name));
        const withCurrent = available.includes(item.altBaslik) || !item.altBaslik ? available : [item.altBaslik, ...available];
        return withCurrent.map((name) => ({ label: name, value: name }));
    };

    const handleSelectUstBaslik = (ust: string) => {
        setSelectedUstBaslik(ust);
        setNewAltBaslikName('');
        setAltBaslikError(null);
    };

    const handleAddUstBaslik = () => {
        const result = addUstBaslik(newUstBaslikName);
        if (result.success) {
            setNewUstBaslikName('');
            setUstBaslikError(null);
            // Yeni eklenen üst başlık, kullanıcının içeriğini hemen doldurabilmesi için otomatik seçilir.
            setSelectedUstBaslik(newUstBaslikName.trim());
        } else {
            setUstBaslikError(result.error || 'Bilinmeyen bir hata oluştu.');
        }
    };

    // KURAL: Bir üst başlık silinirse altındaki TÜM alt başlıklar da silinir. Bu geri
    // alınamaz ve "Yeni Talep Oluştur" formundan o kategori tamamen kalkar; bu yüzden
    // özellikle içi dolu bir üst başlık silinmeden önce açıkça uyarılır.
    const handleDeleteUstBaslik = (ust: string) => {
        const subCount = items.filter((item) => item.ustBaslik === ust).length;
        confirmDialog({
            message:
                subCount > 0
                    ? `[${ust}] üst başlığını silmek istediğinize emin misiniz? Bu başlığa bağlı ${subCount} alt başlık da KALICI OLARAK silinecek ve "Yeni Talep Oluştur" formunda görünmeyecek.`
                    : `[${ust}] üst başlığını silmek istediğinize emin misiniz?`,
            header: 'Üst Başlık Silme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            accept: () => {
                deleteUstBaslik(ust);
                setSelectedUstBaslik((prev) => (prev === ust ? null : prev));
            }
        });
    };

    const handleAddAltBaslik = () => {
        if (!selectedUstBaslik) return;
        const result = addAltBaslik(selectedUstBaslik, newAltBaslikName);
        if (result.success) {
            setNewAltBaslikName('');
            setAltBaslikError(null);
        } else {
            setAltBaslikError(result.error || 'Bilinmeyen bir hata oluştu.');
        }
    };

    // KURAL: Alt başlık artık dropdown'dan seçiliyor; yanlışlıkla tıklayıp
    // değiştirmeyi önlemek için değişiklik önce onay ister, kabul edilmeden
    // veriye işlenmez.
    const handleAltBaslikSelect = (item: CategoryItem, newAltBaslik: string) => {
        if (newAltBaslik === item.altBaslik) return;
        confirmDialog({
            message: `[${item.altBaslik}] alt başlığını [${newAltBaslik}] olarak değiştirmek istediğinize emin misiniz?`,
            header: 'Alt Başlık Değişikliği Onayı',
            icon: 'pi pi-question-circle',
            acceptLabel: 'Evet, Değiştir',
            rejectLabel: 'Vazgeç',
            accept: () => {
                const result = updateAltBaslik(item.id, { altBaslik: newAltBaslik });
                setAltBaslikError(result.success ? null : result.error || 'Bilinmeyen bir hata oluştu.');
            }
        });
    };

    const handleTeamChange = (id: string, team: string) => {
        updateAltBaslik(id, { ekip: team });
    };

    const handleToggleSurecOlcum = (id: string, value: boolean) => {
        updateAltBaslik(id, { surecOlcum: value });
    };

    const handleTogglePasif = (id: string, value: boolean) => {
        updateAltBaslik(id, { pasif: value });
    };

    const handleDeleteAltBaslik = (item: CategoryItem) => {
        confirmDialog({
            message: `[${item.altBaslik}] alt başlığını silmek istediğinize emin misiniz? Bu alt başlık "Yeni Talep Oluştur" formunda artık görünmeyecek.`,
            header: 'Alt Başlık Silme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            accept: () => deleteAltBaslik(item.id)
        });
    };

    return {
        teams,
        ustBaslikListesi,
        selectedUstBaslik,
        filteredItems,
        getAltBaslikOptions,
        newUstBaslikName,
        setNewUstBaslikName,
        ustBaslikError,
        newAltBaslikName,
        setNewAltBaslikName,
        altBaslikError,
        handleSelectUstBaslik,
        handleAddUstBaslik,
        handleDeleteUstBaslik,
        handleAddAltBaslik,
        handleAltBaslikSelect,
        handleTeamChange,
        handleToggleSurecOlcum,
        handleTogglePasif,
        handleDeleteAltBaslik
    };
};

export default useKategoriYonetimi;
