'use client';

/**
 * BİLEŞEN: Üst Bar (Topbar) — GÖRÜNENDEN ÇOK DAHA FAZLASINI YAPIYOR.
 * NE İŞE YARAR: Sadece logo/menü açma butonu değil; aynı zamanda "Yeni Personel /
 * Hesap Ekle" formunun TAMAMINI barındırır (Dialog içinde): rol seçimi, ekip
 * seçimi (SADECE CALISAN dışındaki roller için — forma gömülü sabit checkbox
 * listesi; MultiSelect'in Dialog içinde taşma hatası verdiği tespit edildiği
 * için bilerek checkbox listesine çevrilmiştir, bkz. styles/layout/layout.scss'teki
 * always-bottom-panel notu). Ayrıca aktif kullanıcı simülasyonu (gerçek login
 * olmadığı için "kullanıcı değiştir" burada yapılır) da bu dosyadadır.
 */

import React, { useState, useRef, forwardRef, useImperativeHandle, useContext } from 'react';
import { useUser, UserRole } from '@/layout/context/UserContext';
import { useTeams } from '@/layout/context/TeamContext';
import { useTickets } from '@/layout/context/TicketContext';
import { LayoutContext } from '@/layout/context/layoutcontext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Message } from 'primereact/message';


const ROLE_OPTIONS: { label: string; value: UserRole }[] = [
    { label: 'Çalışan (Talep Sahibi)', value: 'CALISAN' },
    { label: 'Teknisyen (Destek)', value: 'TEKNISYEN' },
    { label: 'Koordinatör', value: 'KOORDINATOR' },
    { label: 'Admin (Yönetici)', value: 'ADMIN' }
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
    const { teams } = useTeams();
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
        teams: [] as string[],
        email: '',
        dahili: '',
        role: 'CALISAN' as UserRole
    });

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        const result = addUser(formData);

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

                <Dialog header={view === 'list' ? 'Aktif Hesap Seçimi' : 'Yeni Personel / Hesap Ekle'} visible={visible} style={{ width: '44rem' }} onHide={() => setVisible(false)}>
                    {view === 'list' ? (
                        <div className="flex flex-column gap-3">
                            <div className="flex justify-content-between align-items-center mb-2">
                                <Button 
                                    label="Yeni Hesap Ekle" icon="pi pi-user-plus" size="small" 
                                    onClick={() => {
                                        setFormData({ fullName: '', sicilNo: '', teams: [], email: '', dahili: '', role: 'CALISAN' });
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
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        role: e.value,
                                        // KURAL: Çalışan (CALISAN) rolünün hiç ekibi olmaz (bkz. Ekip
                                        // alanının altındaki koşullu render); rol CALISAN'a
                                        // değiştirilirse önceden seçilmiş ekipler temizlenir.
                                        teams: e.value === 'CALISAN' ? [] : formData.teams
                                    })} 
                                    required disabled={!isAdmin} 
                                    panelClassName="always-bottom-panel"
                                    appendTo="self"
                                />
                            </div>
                            <div className="field col-12 md:col-6">
                                <label className="font-bold">Sicil No</label>
                                <InputText value={formData.sicilNo} onChange={(e) => setFormData({...formData, sicilNo: e.target.value})} required />
                            </div>
                            {formData.role !== 'CALISAN' && (
                                <div className="field col-12">
                                    <div className="flex align-items-center justify-content-between mb-2">
                                        <label className="font-bold m-0">Ekip</label>
                                        {formData.teams.length > 0 && (
                                            <span className="text-sm text-600">
                                                {formData.teams.length} ekip seçildi
                                                <Button
                                                    type="button"
                                                    label="Temizle"
                                                    link
                                                    className="p-0 ml-2 text-sm"
                                                    onClick={() => setFormData({ ...formData, teams: [] })}
                                                />
                                            </span>
                                        )}
                                    </div>
                                    {/* KURAL: Burada bilerek açılır panel (MultiSelect) yerine formun
                                        içine gömülü, sabit ve kaydırılabilir bir Checkbox listesi
                                        kullanılıyor. Sebep: Dialog içindeki MultiSelect'in açılır
                                        paneli, Dialog'un kendi konumlandırma/kaydırma bağlamıyla
                                        çakışıp "İptal" butonunun üzerine biniyordu. Sabit liste bu
                                        sınıfın tüm örneklerini kalıcı olarak ortadan kaldırır. */}
                                    {teams.length === 0 ? (
                                        <div className="border-1 surface-border border-round p-3 text-center text-500 text-sm">
                                            Henüz tanımlı ekip yok. "Ekip Yönetimi" sayfasından ekip ekleyebilirsiniz.
                                        </div>
                                    ) : (
                                        <div
                                            className="border-1 surface-border border-round p-2 surface-ground grid gap-0"
                                            style={{ maxHeight: '13rem', overflowY: 'auto' }}
                                        >
                                            {teams.map((team) => {
                                                const checked = formData.teams.includes(team);
                                                return (
                                                    <div key={team} className="col-12 md:col-6">
                                                        <div
                                                            className={`flex align-items-center gap-2 p-2 border-round cursor-pointer transition-colors transition-duration-150 ${checked ? 'surface-100 border-1 border-primary' : 'border-1 border-transparent hover:surface-100'}`}
                                                            onClick={() =>
                                                                setFormData({
                                                                    ...formData,
                                                                    teams: checked ? formData.teams.filter((t) => t !== team) : [...formData.teams, team]
                                                                })
                                                            }
                                                        >
                                                            <Checkbox inputId={`add-user-team-${team}`} checked={checked} onChange={() => {}} />
                                                            <label htmlFor={`add-user-team-${team}`} className="cursor-pointer text-sm flex-1" onClick={(e) => e.preventDefault()}>
                                                                {team}
                                                            </label>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}
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