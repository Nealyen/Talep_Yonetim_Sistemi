'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle, useContext } from 'react';
import { useUser, UserRole, TechnicianExpertise } from '@/layout/context/UserContext';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
];

const EXPERTISE_OPTIONS: { label: string; value: TechnicianExpertise }[] = [
    { label: 'Donanım Uzmanı', value: 'Donanım' },
    { label: 'Yazılım Uzmanı', value: 'Yazılım' }
];

export const AppTopbar = forwardRef<any, any>((props, ref) => {
    const { onMenuToggle } = useContext(LayoutContext);
    const { users, currentUser, switchUser, addUser, resetSystem } = useUser();
    const [visible, setVisible] = useState(false);
    const [view, setView] = useState<'list' | 'add'>('list');

    const menubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    const [formData, setFormData] = useState({
        fullName: '',
        sicilNo: '',
        title: '',
        email: '',
        dahili: '',
        role: 'CALISAN' as UserRole,
        expertise: null as TechnicianExpertise
    });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        addUser(formData);
        setView('list');
        setVisible(false);
    };

    const getRoleSeverity = (role: UserRole) => {
        if (role === 'ADMIN') return 'danger';
        if (role === 'KOORDINATOR') return 'warning';
        if (role === 'TEKNISYEN') return 'info';
        return 'success';
    };

    const isAdmin = currentUser.role === 'ADMIN';

    return (
        <div className="layout-topbar flex justify-content-between align-items-center px-4 py-3 surface-card border-bottom-1 surface-border">
            <div className="flex align-items-center gap-2">
                <button ref={menubuttonRef} type="button" className="p-link layout-menu-button layout-topbar-button" onClick={onMenuToggle}>
                    <i className="pi pi-bars" />
                </button>
                <span className="text-xl font-bold text-900 ml-2">KURUMSAL TALEP PORTALI</span>
            </div>

            <div className="flex align-items-center gap-3">
                <Button 
                    type="button" icon="pi pi-user" 
                    label={`${currentUser.fullName} (${currentUser.roleLabel})`}
                    className="p-button-outlined p-button-secondary font-semibold"
                    onClick={() => { setView('list'); setVisible(true); }} 
                />

                <Dialog header={view === 'list' ? 'Aktif Hesap Seçimi' : 'Yeni Personel / Hesap Ekle'} visible={visible} style={{ width: '40rem' }} onHide={() => setVisible(false)}>
                    {view === 'list' ? (
                        <div className="flex flex-column gap-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <Button 
                                    label="Yeni Hesap Ekle" icon="pi pi-user-plus" size="small" 
                                    onClick={() => {
                                        setFormData({ fullName: '', sicilNo: '', title: '', email: '', dahili: '', role: 'CALISAN', expertise: null });
                                        setView('add');
                                    }} 
                                />
                                <Button label="Tüm Talepleri ve Sistemi Sıfırla" icon="pi pi-trash" severity="danger" size="small" outlined onClick={resetSystem} />
                            </div>
                            
                            <div className="grid">
                                {users.map(user => {
                                    const isSelected = user.id === currentUser.id;
                                    return (
                                        <div key={user.id} className="col-12 md:col-6">
                                            <div className={`p-3 border-round border-1 cursor-pointer transition-all ${isSelected ? 'border-primary surface-hover shadow-2' : 'surface-border'}`} onClick={() => { switchUser(user.id); setVisible(false); }}>
                                                <div className="flex justify-content-between align-items-center mb-1">
                                                    <span className="font-bold text-lg">{user.fullName}</span>
                                                    {isSelected && <i className="pi pi-check text-primary font-bold"></i>}
                                                </div>
                                                <Tag value={user.roleLabel} severity={getRoleSeverity(user.role)} className="mt-1" />
                                                {user.expertise && <Tag value={user.expertise} severity="info" rounded className="ml-2 mt-1" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddUser} className="p-fluid grid">
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Personel Adı Soyadı</label>
                                <InputText value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Rol</label>
                                <Dropdown 
                                    value={formData.role} options={ROLE_OPTIONS} 
                                    onChange={(e) => setFormData({...formData, role: e.value, expertise: e.value !== 'TEKNISYEN' ? null : formData.expertise})} 
                                    required disabled={!isAdmin} 
                                />
                            </div>
                            {/* Yalnızca Teknisyen Seçildiğinde Gözüken Uzmanlık Alanı */}
                            {formData.role === 'TEKNISYEN' && (
                                <div className="field col-12 md:col-6">
                                    <label className="font-bold text-primary">Uzmanlık Alanı</label>
                                    <Dropdown 
                                        value={formData.expertise} options={EXPERTISE_OPTIONS} 
                                        onChange={(e) => setFormData({...formData, expertise: e.value})} 
                                        placeholder="Uzmanlık Seçiniz" required 
                                    />
                                </div>
                            )}
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Sicil No</label>
                                <InputText value={formData.sicilNo} onChange={(e) => setFormData({...formData, sicilNo: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Ünvan</label>
                                <InputText value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">E-Posta Adresi</label>
                                <InputText type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Dahili No</label>
                                <InputText value={formData.dahili} onChange={(e) => setFormData({...formData, dahili: e.target.value})} required />
                            </div>
                            <div className="col-12 flex gap-2 mt-3">
                                <Button label="Kaydet ve Giriş Yap" type="submit" severity="success" />
                                <Button label="İptal" type="button" severity="secondary" outlined onClick={() => setView('list')} />
                            </div>
                        </form>
                    )}
                </Dialog>
            </div>
        </div>
    );
});

AppTopbar.displayName = 'AppTopbar';
export default AppTopbar;