/* eslint-disable @next/next/no-img-element */
'use client';

import React from 'react';
import AppMenuitem from './AppMenuitem';
import { MenuProvider } from './context/menucontext';
import { useUser } from '@/layout/context/UserContext';
import { AppMenuItem } from '@/types';

const AppMenu = () => {
    const { currentUser } = useUser();
    const activeRole = currentUser.role;

    const getFilteredMenu = (): AppMenuItem[] => {
        const genelSection: AppMenuItem = {
            label: 'GENEL',
            items: [{ label: 'Gösterge Paneli', icon: 'pi pi-fw pi-home', to: '/' }]
        };

        const talepItems: AppMenuItem[] = [
            { label: 'Yeni Talep Oluştur', icon: 'pi pi-fw pi-plus-circle', to: '/yeni-talep' },
            { label: 'Taleplerim', icon: 'pi pi-fw pi-list', to: '/taleplerim' }
        ];

        if (activeRole === 'ADMIN' || activeRole === 'KOORDINATOR') {
            talepItems.push({ label: 'Tüm Talepler', icon: 'pi pi-fw pi-table', to: '/tum-talepler' });
        }

        // KURAL: Koordinatör, Teknisyen ve Admin yetkilerine sahip olarak kabul edildi
        if (activeRole === 'TEKNISYEN' || activeRole === 'KOORDINATOR' || activeRole === 'ADMIN') {
            talepItems.push({ 
                label: 'Aktif Görevlerim', 
                icon: 'pi pi-fw pi-briefcase', 
                to: '/uzman-aktif-gorevler' 
            });
            talepItems.push({ 
                label: 'Teknik İş Havuzu', 
                icon: 'pi pi-fw pi-server', 
                to: '/is-havuzu' 
            });
        }
        
        if (activeRole === 'KOORDINATOR' || activeRole === 'ADMIN') {
            talepItems.push({ 
                label: activeRole === 'ADMIN' ? 'Sistem Süreç Takibi' : 'Süreç Takip / Koordinatör', 
                icon: 'pi pi-fw pi-sliders-h', 
                to: '/surec-takibi' 
            });
        }

        const kurumsalItems: AppMenuItem[] = [];
        
        if (activeRole === 'ADMIN') {
            kurumsalItems.push({ label: 'Kullanıcı & Rol Yönetimi', icon: 'pi pi-fw pi-users', to: '/kullanicilar' });
            kurumsalItems.push({ label: 'Denetim İzi (Audit Log)', icon: 'pi pi-fw pi-history', to: '/denetim-izi' });
        }

        return [
            genelSection,
            { label: 'TALEP YÖNETİMİ', items: talepItems },
            { label: 'KURUMSAL & YÖNETİM', items: kurumsalItems }
        ];
    };

    const model = getFilteredMenu();

    return (
        <MenuProvider>
            <ul className="layout-menu">
                {model.map((item, i) => {
                    return !item?.seperator ? (
                        <AppMenuitem item={item} root={true} index={i} key={item.label} />
                    ) : (
                        <li className="menu-separator" key={`sep-${i}`}></li>
                    );
                })}
            </ul>
        </MenuProvider>
    );
};

export default AppMenu;