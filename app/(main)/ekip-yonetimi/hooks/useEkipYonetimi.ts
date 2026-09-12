'use client';

/**
 * HOOK: Ekip Yönetimi sayfasının tüm state ve iş mantığı burada.
 * NE İŞE YARAR: Ekip ekleme/silme (TeamContext üzerinden), personel-ekip eşleştirme
 * satırlarının üretilmesi, ekip silme öncesi confirmDialog ile onay isteme (bir ekip
 * silinirse o ekibe atanmış personelde ve Kategori Yönetimi'nde referansı kalabilir,
 * bu yüzden onay şart).
 */

import { useState } from 'react';
import { confirmDialog } from 'primereact/confirmdialog';
import { useTeams } from '@/layout/context/TeamContext';
import { useUser } from '@/layout/context/UserContext';

export interface AtamaSatiri {
    id: string;
    userId: string;
    team: string;
    isDraft: boolean;
}

interface EditingState {
    rowId: string;
    // Değişikliğe başlamadan ÖNCEKİ (kayıtlı, gerçek) değerler — onay anında
    // "eski sahibinden doğru şekilde çıkarabilmek" için ayrıca saklanır. Ekrandaki
    // (henüz onaylanmamış) gösterim değeriyle karıştırılmamalıdır.
    originalUserId: string;
    originalTeam: string;
    userId: string;
    team: string;
}

export const useEkipYonetimi = () => {
    const { teams, addTeam, deleteTeam } = useTeams();
    const { users, updateUser } = useUser();

    const [newTeamName, setNewTeamName] = useState('');
    const [teamError, setTeamError] = useState<string | null>(null);
    const [draftRows, setDraftRows] = useState<AtamaSatiri[]>([]);
    const [editingState, setEditingState] = useState<EditingState | null>(null);
    const [assignmentError, setAssignmentError] = useState<string | null>(null);

    // KURAL: "1 hesap (çalışan hariç) birden fazla gruba dahil olabilsin" — bu sayfa
    // sadece CALISAN dışındaki roller için ekip ataması yapar. CALISAN'ın tek ekibi,
    // "Yeni Personel Ekle" formundaki tekli seçim ile zaten yönetiliyor.
    const assignableUsers = users.filter((u) => u.role !== 'CALISAN');

    // Gerçek (kalıcı) atama satırları, her kullanıcının "teams" dizisinden türetilir.
    const savedRows: AtamaSatiri[] = assignableUsers.flatMap((u) =>
        (u.teams || []).map((team) => ({ id: `${u.id}::${team}`, userId: u.id, team, isDraft: false }))
    );

    // KURAL: Aynı anda yalnızca TEK bir bekleyen işlem olabilir — ya yeni bir taslak
    // satır ya da mevcut bir satırın düzenlenmesi. Biri sürerken diğeri başlatılamaz;
    // bu da "değişiklik yaparken ekleme yapılamasın" kuralını doğal olarak sağlar.
    const hasPendingAction = draftRows.length > 0 || editingState !== null;

    // Düzenlenmekte olan satırın GÖRÜNEN (henüz onaylanmamış) değerlerini tabloya yansıt;
    // gerçek veri (savedRows'un kaynağı olan users.teams) onaylanana kadar değişmez.
    const displayedSavedRows = savedRows.map((row) => (editingState && row.id === editingState.rowId ? { ...row, userId: editingState.userId, team: editingState.team } : row));

    const allRows: AtamaSatiri[] = [...displayedSavedRows, ...draftRows];

    const handleAddTeam = () => {
        const result = addTeam(newTeamName);
        if (result.success) {
            setNewTeamName('');
            setTeamError(null);
        } else {
            setTeamError(result.error || 'Bilinmeyen bir hata oluştu.');
        }
    };

    const handleDeleteTeam = (team: string) => {
        const memberCount = assignableUsers.filter((u) => (u.teams || []).includes(team)).length;
        confirmDialog({
            message:
                memberCount > 0
                    ? `[${team}] ekibini silmek istediğinize emin misiniz? Bu ekibe atanmış ${memberCount} personelin kaydından da otomatik olarak kaldırılacaktır.`
                    : `[${team}] ekibini silmek istediğinize emin misiniz?`,
            header: 'Ekibi Silme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            accept: () => {
                assignableUsers.forEach((u) => {
                    if ((u.teams || []).includes(team)) {
                        updateUser(u.id, { teams: (u.teams || []).filter((t) => t !== team) });
                    }
                });
                deleteTeam(team);
            }
        });
    };

    // KURAL: Zaten bir taslak veya düzenleme sürüyorsa yeni satır eklenemez
    // (buton zaten arayüzde devre dışı bırakılır, burada ek bir güvence olarak duruyor).
    const handleAddAssignmentRow = () => {
        if (hasPendingAction) return;
        setAssignmentError(null);
        setDraftRows((prev) => [...prev, { id: `draft-${Date.now()}`, userId: '', team: '', isDraft: true }]);
    };

    const isDuplicateAssignment = (userId: string, team: string, ignoreRowId?: string) => {
        const user = users.find((u) => u.id === userId);
        if (!user) return false;
        return (user.teams || []).includes(team) && `${user.id}::${team}` !== ignoreRowId;
    };

    // KURAL: Yeni bir satırda kişi+ekip seçildiğinde artık OTOMATİK kaydedilmiyor.
    // Aynı şekilde, ZATEN ONAYLANMIŞ (kalıcı) bir satırda değişiklik yapıldığında da
    // artık anında kaydedilmiyor — satır "düzenleniyor" durumuna geçer, çöp kutusu
    // yerine ONAY (✓) ve İPTAL (✕) ikonları gösterilir. Değişikliğin kalıcı hale
    // gelmesi handleConfirmRow'un çağrılmasına bağlıdır.
    const handleRowUserChange = (row: AtamaSatiri, newUserId: string) => {
        setAssignmentError(null);

        if (row.isDraft) {
            setDraftRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, userId: newUserId } : r)));
            return;
        }

        if (editingState && editingState.rowId === row.id) {
            setEditingState({ ...editingState, userId: newUserId });
        } else if (!hasPendingAction) {
            setEditingState({ rowId: row.id, originalUserId: row.userId, originalTeam: row.team, userId: newUserId, team: row.team });
        }
    };

    const handleRowTeamChange = (row: AtamaSatiri, newTeam: string) => {
        setAssignmentError(null);

        if (row.isDraft) {
            setDraftRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, team: newTeam } : r)));
            return;
        }

        if (editingState && editingState.rowId === row.id) {
            setEditingState({ ...editingState, team: newTeam });
        } else if (!hasPendingAction) {
            setEditingState({ rowId: row.id, originalUserId: row.userId, originalTeam: row.team, userId: row.userId, team: newTeam });
        }
    };

    // Taslak satırda hem kişi hem ekip seçilince "hazır" hale gelir (onay bekler).
    const isRowReadyToConfirm = (row: AtamaSatiri) => row.isDraft && !!row.userId && !!row.team;

    // Zaten kayıtlı bir satır şu anda düzenleniyor mu?
    const isRowEditing = (row: AtamaSatiri) => !row.isDraft && editingState?.rowId === row.id;

    const handleConfirmRow = (row: AtamaSatiri) => {
        setAssignmentError(null);

        // Durum 1: Yeni (taslak) satırın ilk kez onaylanması
        if (row.isDraft) {
            const user = users.find((u) => u.id === row.userId);
            if (!user) return;

            if (isDuplicateAssignment(row.userId, row.team)) {
                setAssignmentError(`[${user.fullName}] zaten [${row.team}] ekibine dahil. Aynı kişiyi aynı ekibe iki kez ekleyemezsiniz.`);
                return;
            }

            updateUser(user.id, { teams: [...(user.teams || []), row.team] });
            setDraftRows((prev) => prev.filter((r) => r.id !== row.id));
            return;
        }

        // Durum 2: Zaten kayıtlı bir satırda yapılan değişikliğin onaylanması
        if (!editingState || editingState.rowId !== row.id) return;

        const { userId: newUserId, team: newTeam } = editingState;

        if (isDuplicateAssignment(newUserId, newTeam, row.id)) {
            const targetUser = users.find((u) => u.id === newUserId);
            setAssignmentError(`[${targetUser?.fullName}] zaten [${newTeam}] ekibine dahil. Aynı kişiyi aynı ekibe iki kez ekleyemezsiniz.`);
            return;
        }

        // Eski sahibi bulurken editingState.originalUserId/originalTeam kullanılıyor
        // (parametre olarak gelen `row` ekrandaki GÖSTERİM değerini taşır, yani zaten
        // seçilmiş yeni kişiyi/ekipi gösterir — bu yüzden "eski sahip" tespiti için asla
        // row.userId/row.team kullanılmamalı, aksi halde eski kayıt hiç silinmez ve
        // hem eski hem yeni kişi için ayrı ayrı satır kalmaya devam eder).
        const oldUser = users.find((u) => u.id === editingState.originalUserId);
        const newUser = users.find((u) => u.id === newUserId);

        if (oldUser && oldUser.id !== newUser?.id) {
            updateUser(oldUser.id, { teams: (oldUser.teams || []).filter((t) => t !== editingState.originalTeam) });
        }

        if (newUser) {
            const withoutOld = (newUser.teams || []).filter((t) => t !== editingState.originalTeam);
            updateUser(newUser.id, { teams: [...withoutOld, newTeam] });
        }

        setEditingState(null);
    };

    // İPTAL: Taslak satırda tam dolu değilken vazgeçmek İSTEĞE bağlı silmeyle aynıdır;
    // düzenlenmekte olan kayıtlı bir satırda ise yapılan değişiklik atılır, satır
    // hiçbir veri kaybı olmadan orijinal (kayıtlı) haline geri döner.
    const handleCancelRow = (row: AtamaSatiri) => {
        setAssignmentError(null);

        if (row.isDraft) {
            setDraftRows((prev) => prev.filter((r) => r.id !== row.id));
            return;
        }

        if (editingState?.rowId === row.id) {
            setEditingState(null);
        }
    };

    const handleDeleteRow = (row: AtamaSatiri) => {
        setAssignmentError(null);

        if (row.isDraft) {
            setDraftRows((prev) => prev.filter((r) => r.id !== row.id));
            return;
        }

        const user = users.find((u) => u.id === row.userId);
        if (!user) return;

        confirmDialog({
            message: `[${user.fullName}] adlı personelin [${row.team}] ekibiyle olan ilişkisini kesmek istediğinize emin misiniz?`,
            header: 'Ekip Eşleşmesini Silme Onayı',
            icon: 'pi pi-exclamation-triangle',
            acceptClassName: 'p-button-danger',
            acceptLabel: 'Evet, Sil',
            rejectLabel: 'Vazgeç',
            accept: () => {
                updateUser(user.id, { teams: (user.teams || []).filter((t) => t !== row.team) });
            }
        });
    };

    return {
        teams,
        newTeamName,
        setNewTeamName,
        teamError,
        assignableUsers,
        allRows,
        assignmentError,
        hasPendingAction,
        handleAddTeam,
        handleDeleteTeam,
        handleAddAssignmentRow,
        handleRowUserChange,
        handleRowTeamChange,
        isRowReadyToConfirm,
        isRowEditing,
        handleConfirmRow,
        handleCancelRow,
        handleDeleteRow
    };
};
