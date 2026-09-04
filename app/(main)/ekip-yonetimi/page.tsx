'use client';

import React from 'react';
import { Card } from 'primereact/card';
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
        handleAddTeam,
        handleDeleteTeam,
        handleAddAssignmentRow,
        handleRowUserChange,
        handleRowTeamChange,
        handleDeleteRow
    } = useEkipYonetimi();

    return (
        <RoleRouteGuard allowedRoles={['ADMIN']}>
            <div className="grid">
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
                                    onUserChange={handleRowUserChange}
                                    onTeamChange={handleRowTeamChange}
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
