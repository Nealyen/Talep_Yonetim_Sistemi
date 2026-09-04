'use client';

import { useState } from 'react';
import { useTeams } from '@/layout/context/TeamContext';
import { useUser } from '@/layout/context/UserContext';

export interface AtamaSatiri {
    id: string;
    userId: string;
    team: string;
    isDraft: boolean;
}

export const useEkipYonetimi = () => {
    const { teams, addTeam, deleteTeam } = useTeams();
    const { users, updateUser } = useUser();

    const [newTeamName, setNewTeamName] = useState('');
    const [teamError, setTeamError] = useState<string | null>(null);
    const [draftRows, setDraftRows] = useState<AtamaSatiri[]>([]);

    // KURAL: "1 hesap (çalışan hariç) birden fazla gruba dahil olabilsin" — bu sayfa
    // sadece CALISAN dışındaki roller için ekip ataması yapar. CALISAN'ın tek ekibi,
    // "Yeni Personel Ekle" formundaki tekli seçim ile zaten yönetiliyor.
    const assignableUsers = users.filter((u) => u.role !== 'CALISAN');

    // Gerçek (kalıcı) atama satırları, her kullanıcının "teams" dizisinden türetilir.
    const savedRows: AtamaSatiri[] = assignableUsers.flatMap((u) =>
        (u.teams || []).map((team) => ({ id: `${u.id}::${team}`, userId: u.id, team, isDraft: false }))
    );

    const allRows: AtamaSatiri[] = [...savedRows, ...draftRows];

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
        // Ekip silinmeden önce, o ekibe atanmış tüm personelin kaydından da temizlenir.
        assignableUsers.forEach((u) => {
            if ((u.teams || []).includes(team)) {
                updateUser(u.id, { teams: (u.teams || []).filter((t) => t !== team) });
            }
        });
        deleteTeam(team);
    };

    const handleAddAssignmentRow = () => {
        setDraftRows((prev) => [...prev, { id: `draft-${Date.now()}`, userId: '', team: '', isDraft: true }]);
    };

    const commitDraftIfComplete = (draft: AtamaSatiri) => {
        if (!draft.userId || !draft.team) return;
        const user = users.find((u) => u.id === draft.userId);
        if (!user) return;
        if (!(user.teams || []).includes(draft.team)) {
            updateUser(user.id, { teams: [...(user.teams || []), draft.team] });
        }
        setDraftRows((prev) => prev.filter((r) => r.id !== draft.id));
    };

    const handleRowUserChange = (row: AtamaSatiri, newUserId: string) => {
        if (row.isDraft) {
            const updatedDraft = { ...row, userId: newUserId };
            setDraftRows((prev) => prev.map((r) => (r.id === row.id ? updatedDraft : r)));
            commitDraftIfComplete(updatedDraft);
            return;
        }

        // Kalıcı satırda kişi değişimi: eski kullanıcıdan bu ekibi çıkar, yeni kullanıcıya ekle.
        const oldUser = users.find((u) => u.id === row.userId);
        const newUser = users.find((u) => u.id === newUserId);
        if (oldUser) {
            updateUser(oldUser.id, { teams: (oldUser.teams || []).filter((t) => t !== row.team) });
        }
        if (newUser && !(newUser.teams || []).includes(row.team)) {
            updateUser(newUser.id, { teams: [...(newUser.teams || []), row.team] });
        }
    };

    const handleRowTeamChange = (row: AtamaSatiri, newTeam: string) => {
        if (row.isDraft) {
            const updatedDraft = { ...row, team: newTeam };
            setDraftRows((prev) => prev.map((r) => (r.id === row.id ? updatedDraft : r)));
            commitDraftIfComplete(updatedDraft);
            return;
        }

        const user = users.find((u) => u.id === row.userId);
        if (!user) return;
        const withoutOld = (user.teams || []).filter((t) => t !== row.team);
        updateUser(user.id, { teams: withoutOld.includes(newTeam) ? withoutOld : [...withoutOld, newTeam] });
    };

    const handleDeleteRow = (row: AtamaSatiri) => {
        if (row.isDraft) {
            setDraftRows((prev) => prev.filter((r) => r.id !== row.id));
            return;
        }
        const user = users.find((u) => u.id === row.userId);
        if (!user) return;
        updateUser(user.id, { teams: (user.teams || []).filter((t) => t !== row.team) });
    };

    return {
        teams,
        newTeamName,
        setNewTeamName,
        teamError,
        assignableUsers,
        allRows,
        handleAddTeam,
        handleDeleteTeam,
        handleAddAssignmentRow,
        handleRowUserChange,
        handleRowTeamChange,
        handleDeleteRow
    };
};
