'use client';

import React, { useState, useRef, forwardRef, useImperativeHandle, useContext } from 'react';
import { useUser, UserRole, SpecialtyType } from '@/layout/context/UserContext';
import { useTickets } from '@/layout/context/TicketContext';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';


const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
];

const EXPERTISE_OPTIONS: { label: string; value: SpecialtyType }[] = [
    { label: 'Donanım Uzmanı', value: 'Donanım' },
    { label: 'Yazılım Uzmanı', value: 'Yazılım' },
    { label: 'Ağ / Altyapı', value: 'Ağ / Altyapı' },
    { label: 'Genel', value: 'Genel' }
];

const roleLabels: Record<UserRole, string> = {
    ADMIN: 'Admin (Yönetici)',
    KOORDINATOR: 'Koordinatör',
    TEKNISYEN: 'Teknisyen (Destek)',
    CALISAN: 'Çalışan (Talep Sahibi)'
};

export const AppTopbar = forwardRef<any, any>((props, ref) => {
    const { onMenuToggle } = useContext(LayoutContext);
    
    // UYUMSUZLUK GİDERİLDİ: Context'teki doğru fonksiyon isimleri çağrıldı.
    const { users, currentUser, setCurrentUser, addUser, resetUsers } = useUser();
const { resetTickets } = useTickets();
    
    const [visible, setVisible] = useState(false);
    const [view, setView] = useState<'list' | 'add'>('list');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const menubuttonRef = useRef(null);

    useImperativeHandle(ref, () => ({
        menubutton: menubuttonRef.current
    }));

    const [formData, setFormData] = useState({
        fullName: '',
        sicilNo: '',
        department: '', 
        email: '',
        dahili: '',
        role: 'CALISAN' as UserRole,
        specialty: null as SpecialtyType | null
    });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);
        
        // TypeScript uyuşmazlığını gidermek için null değerini undefined'a çevir
        const submitData = {
            ...formData,
            specialty: formData.specialty === null ? undefined : formData.specialty
        };
        
        const result = addUser(submitData);
        
        if (result.success) {
            setView('list');
            setVisible(false);
        } else {
            setErrorMsg(result.error || 'Bilinmeyen bir hata oluştu.');
        }
    };

    const handleSwitchUser = (id: string) => {
        const selected = users.find(u => u.id === id);
        if (selected) {
            setCurrentUser(selected);
            setVisible(false);
        }
    };

    const handleReset = () => {
    resetUsers();
    resetTickets();
    window.location.reload();
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
                    label={`${currentUser.fullName} (${roleLabels[currentUser.role]})`}
                    className="p-button-outlined p-button-secondary font-semibold"
                    onClick={() => { setView('list'); setErrorMsg(null); setVisible(true); }} 
                />

                <Dialog header={view === 'list' ? 'Aktif Hesap Seçimi' : 'Yeni Personel / Hesap Ekle'} visible={visible} style={{ width: '40rem' }} onHide={() => setVisible(false)}>
                    {view === 'list' ? (
                        <div className="flex flex-column gap-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <Button 
                                    label="Yeni Hesap Ekle" icon="pi pi-user-plus" size="small" 
                                    onClick={() => {
                                        setFormData({ fullName: '', sicilNo: '', department: '', email: '', dahili: '', role: 'CALISAN', specialty: null });
                                        setErrorMsg(null);
                                        setView('add');
                                    }} 
                                />
                                <Button label="Tüm Talepleri ve Sistemi Sıfırla" icon="pi pi-trash" severity="danger" size="small" outlined onClick={handleReset} />
                            </div>
                            
                            <div className="grid">
                                {users.map(user => {
                                    const isSelected = user.id === currentUser.id;
                                    return (
                                        <div key={user.id} className="col-12 md:col-6">
                                            <div className={`p-3 border-round border-1 cursor-pointer transition-all ${isSelected ? 'border-primary surface-hover shadow-2' : 'surface-border'}`} onClick={() => handleSwitchUser(user.id)}>
                                                <div className="flex justify-content-between align-items-center mb-1">
                                                    <span className="font-bold text-lg">{user.fullName}</span>
                                                    {isSelected && <i className="pi pi-check text-primary font-bold"></i>}
                                                </div>
                                                <Tag value={roleLabels[user.role]} severity={getRoleSeverity(user.role)} className="mt-1" />
                                                {user.specialty && <Tag value={user.specialty} severity="info" rounded className="ml-2 mt-1" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAddUser} className="p-fluid grid">
                            {errorMsg && (
                                <div className="col-12 mb-2">
                                    <Message severity="error" text={errorMsg} className="w-full justify-content-start" />
                                </div>
                            )}
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Personel Adı Soyadı</label>
                                <InputText value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Rol</label>
                                <Dropdown 
                                    value={formData.role} options={ROLE_OPTIONS} 
                                    onChange={(e) => setFormData({...formData, role: e.value, specialty: e.value !== 'TEKNISYEN' ? null : formData.specialty})} 
                                    required disabled={!isAdmin} 
                                />
                            </div>
                            {formData.role === 'TEKNISYEN' && (
                                <div className="field col-12 md:col-6">
                                    <label className="font-bold text-primary">Uzmanlık Alanı</label>
                                    <Dropdown 
                                        value={formData.specialty} options={EXPERTISE_OPTIONS} 
                                        onChange={(e) => setFormData({...formData, specialty: e.value})} 
                                        placeholder="Uzmanlık Seçiniz" required 
                                    />
                                </div>
                            )}
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Sicil No</label>
                                <InputText value={formData.sicilNo} onChange={(e) => setFormData({...formData, sicilNo: e.target.value})} required />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Birim / Departman</label>
                                <InputText value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} required />
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
                                <Button label="İptal" type="button" severity="secondary" outlined onClick={() => { setView('list'); setErrorMsg(null); }} />
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