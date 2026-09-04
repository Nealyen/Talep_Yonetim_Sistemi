import React from 'react';
import { InputText } from 'primereact/inputtext';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { PERMISSION_OPTIONS, TaslakRol } from '../hooks/useKullanicilar';

export interface YeniRolTanimlaProps {
    newRoleName: string;
    onNewRoleNameChange: (value: string) => void;
    newRolePermissions: string[];
    onNewRolePermissionsChange: (value: string[]) => void;
    roleFormError: string | null;
    draftRoles: TaslakRol[];
    onAddRole: () => void;
    onDeleteRole: (id: string) => void;
}

export const YeniRolTanimla = ({
    newRoleName,
    onNewRoleNameChange,
    newRolePermissions,
    onNewRolePermissionsChange,
    roleFormError,
    draftRoles,
    onAddRole,
    onDeleteRole
}: YeniRolTanimlaProps) => {
    return (
        <div className="surface-card p-3 border-round border-1 surface-border">
            <div className="flex align-items-center justify-content-between mb-3">
                <span className="text-sm font-bold text-600 uppercase tracking-wider text-primary">Yeni Rol Tanımla</span>
                <Tag value="Ön İzleme — henüz aktif değil" severity="warning" />
            </div>

            <Message
                severity="info"
                className="w-full mb-3"
                text="Bu alan şu an sadece arayüz taslağıdır. Burada tanımlanan roller sayfa yenilendiğinde silinir ve sistemde gerçek bir yetki oluşturmaz."
            />

            {roleFormError && <Message severity="error" className="w-full mb-3" text={roleFormError} />}

            <div className="grid">
                <div className="field col-12 md:col-5">
                    <label className="font-semibold text-sm block mb-2">Rol Adı</label>
                    <InputText value={newRoleName} onChange={(e) => onNewRoleNameChange(e.target.value)} placeholder="Örn: Raporlama Sorumlusu" className="w-full" />
                </div>
                <div className="field col-12 md:col-7">
                    <label className="font-semibold text-sm block mb-2">Yetkiler</label>
                    <MultiSelect
                        value={newRolePermissions}
                        options={PERMISSION_OPTIONS}
                        onChange={(e) => onNewRolePermissionsChange(e.value)}
                        placeholder="Yetki(ler) Seçiniz"
                        display="chip"
                        className="w-full"
                    />
                </div>
            </div>

            <Button label="Rolü Ekle" icon="pi pi-plus" onClick={onAddRole} className="mb-3" />

            {draftRoles.length > 0 && (
                <div className="flex flex-column gap-2">
                    {draftRoles.map((role) => (
                        <div key={role.id} className="flex align-items-center justify-content-between p-2 border-round surface-100">
                            <div>
                                <span className="font-semibold mr-2">{role.name}</span>
                                {role.permissions.map((p) => (
                                    <Tag key={p} value={p} severity="secondary" className="mr-1" />
                                ))}
                                {role.permissions.length === 0 && <span className="text-500 text-sm">Yetki atanmadı</span>}
                            </div>
                            <Button icon="pi pi-trash" rounded outlined severity="danger" size="small" onClick={() => onDeleteRole(role.id)} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default YeniRolTanimla;
