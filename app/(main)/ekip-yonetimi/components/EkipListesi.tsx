import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';

export interface EkipListesiProps {
    teams: string[];
    newTeamName: string;
    onNewTeamNameChange: (value: string) => void;
    teamError: string | null;
    onAddTeam: () => void;
    onDeleteTeam: (team: string) => void;
}

export const EkipListesi = ({ teams, newTeamName, onNewTeamNameChange, teamError, onAddTeam, onDeleteTeam }: EkipListesiProps) => {
    const teamRows = teams.map((team, index) => ({ sira: index + 1, team }));

    return (
        <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="text-sm font-bold text-600 uppercase tracking-wider text-primary mb-3">Ekipler</div>

            {teamError && <Message severity="error" className="w-full mb-3" text={teamError} />}

            <DataTable value={teamRows} size="small" className="p-datatable-sm mb-3" emptyMessage="Henüz tanımlı ekip yok.">
                <Column field="sira" header="Sıra No" style={{ width: '100px' }} />
                <Column field="team" header="Ekip" />
                <Column
                    header=""
                    style={{ width: '80px' }}
                    body={(row: { team: string }) => (
                        <Button icon="pi pi-trash" rounded outlined severity="danger" size="small" tooltip="Ekibi Sil" onClick={() => onDeleteTeam(row.team)} />
                    )}
                />
            </DataTable>

            <div className="flex gap-2">
                <InputText
                    value={newTeamName}
                    onChange={(e) => onNewTeamNameChange(e.target.value)}
                    placeholder="Yeni ekip adı..."
                    className="flex-1"
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') onAddTeam();
                    }}
                />
                <Button label="Ekle" icon="pi pi-plus" onClick={onAddTeam} />
            </div>
        </div>
    );
};

export default EkipListesi;
