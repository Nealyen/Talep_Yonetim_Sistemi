'use client';

/**
 * SAYFA: Ekip Yönetimi — Rota: "/ekip-yonetimi"
 * KİMLER GÖREBİLİR: ADMIN.
 * NE İŞE YARAR: İki bölümden oluşur: (1) Ekip (grup) adlarının tanımlandığı liste
 * (EkipListesi.tsx), (2) hangi personelin hangi ekip(ler)e dahil olduğunun eşleştirmesi
 * (PersonelEkipEslestirme.tsx). KURAL: Çalışan (CALISAN) rolü en fazla 1 ekibe dahil
 * olabilir; diğer roller (Teknisyen, Koordinatör, Admin) birden fazla ekibe dahil olabilir.
 */

import React from 'react';
import { Card } from 'primereact/card';
import { ConfirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { useEkipYonetimi } from './hooks/useEkipYonetimi';
import { EkipListesi } from './components/EkipListesi';
import { PersonelEkipEslestirme } from './components/PersonelEkipEslestirme';

const EkipYonetimiPage = () => {
    const {
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
    } = useEkipYonetimi();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
                <ConfirmDialog />
                <div className="col-12">
                    <Card title="Ekip Yönetimi" subTitle="Ekip (grup) tanımları ve personelin birden fazla ekibe atanması. Yalnızca Admin rolündeki hesaplar bu sayfayı görebilir.">
                        <div className="grid">
                            <div className="col-12 lg:col-5">
                                <EkipListesi teams={teams} newTeamName={newTeamName} onNewTeamNameChange={setNewTeamName} teamError={teamError} onAddTeam={handleAddTeam} onDeleteTeam={handleDeleteTeam} />
                            </div>
                            <div className="col-12 lg:col-7">
                                <PersonelEkipEslestirme
                                    rows={allRows}
                                    assignableUsers={assignableUsers}
                                    teams={teams}
                                    assignmentError={assignmentError}
                                    hasPendingAction={hasPendingAction}
                                    onUserChange={handleRowUserChange}
                                    onTeamChange={handleRowTeamChange}
                                    isRowReadyToConfirm={isRowReadyToConfirm}
                                    isRowEditing={isRowEditing}
                                    onConfirmRow={handleConfirmRow}
                                    onCancelRow={handleCancelRow}
                                    onDeleteRow={handleDeleteRow}
                                    onAddRow={handleAddAssignmentRow}
                                />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default EkipYonetimiPage;
