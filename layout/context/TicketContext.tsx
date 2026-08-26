'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/layout/context/UserContext'; // Yeni Kullanıcı Mimarisi ile Entegrasyon

// Rolleri UserContext'e (Yeni Mimariye) uyumlu hale getirdik
export type UserRole = 'CALISAN' | 'TEKNISYEN' | 'KOORDINATOR' | 'ADMIN';

export interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    department: string;
    status: 'AKTİF' | 'PASİF';
}

export interface TicketHistory {
    date: string;
    action: string;
    user: string;
}

export interface Ticket {
    id: string;
    title: string;
    category: 'Donanım/Arıza' | 'Yazılım/Erişim' | 'İdari Hizmet' | 'Güvenlik';
    priority: 'Düşük' | 'Normal' | 'Yüksek' | 'Kritik';
    status: 'YENİ' | 'İNCELEMEDE' | 'İŞLEMDE' | 'ONAY_BEKLİYOR' | 'KAPATILDI' | 'REDDEDİLDİ';
    requester: string;
    assignee: string | null;
    description: string;
    location?: string;
    serialNo?: string;
    createdAt: string;
    history: TicketHistory[];
}

interface TicketContextType {
    tickets: Ticket[];
    users: SystemUser[];
    isLoading: boolean;
    loadError: string | null;
    activeRole: UserRole;
    switchRoleAndReload: (role: UserRole) => void;
    updateUserRole: (userId: string, role: UserRole) => Promise<boolean>;
    addTicket: (ticket: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'status' | 'assignee'>) => Promise<boolean>;
    assignTicket: (ticketId: string, technicianName: string, actorName?: string, actorRole?: UserRole) => Promise<boolean>;
    unassignTicket: (ticketId: string, actorName?: string, actorRole?: UserRole) => Promise<boolean>;
    completeTicket: (ticketId: string, actorName?: string) => Promise<boolean>;
    confirmTicket: (ticketId: string, approved: boolean, actorName?: string) => Promise<boolean>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Aktif kullanıcı ve rol bilgisi doğrudan UserContext üzerinden çekiliyor
    const { users: contextUsers, currentUser } = useUser();
    
    // Varsayılan mock datalar silindi. Sistem BOŞ bir dizi ile başlar.
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Diğer sayfaların çökmemesi için UserContext verileri eski SystemUser arayüzüne köprüleniyor
    const mappedUsers: SystemUser[] = contextUsers.map(u => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        department: u.title,
        status: 'AKTİF'
    }));

    const activeRole = currentUser.role;

    useEffect(() => {
        // Sahte (Mock) API Fetch işlemleri iptal edildi. 
        // Talepler sadece yerel önbellekten (LocalStorage) saf halde çekilir.
        try {
            const savedTickets = localStorage.getItem('system_tickets');
            if (savedTickets) {
                setTickets(JSON.parse(savedTickets));
            } else {
                setTickets([]);
            }
        } catch (e) {
            console.error("Talepler yüklenirken hata:", e);
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveTicketsLocally = (newTickets: Ticket[]) => {
        setTickets(newTickets);
        localStorage.setItem('system_tickets', JSON.stringify(newTickets));
    };

    const switchRoleAndReload = (role: UserRole) => {
        console.warn("switchRoleAndReload devredışı. Roller artık UserContext'ten yönetiliyor.");
    };

    const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
        return false; // UserContext üzerinden yönetiliyor
    };

    const addTicket = async (data: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'status' | 'assignee'>): Promise<boolean> => {
        if (!data.title.trim() || !data.description.trim() || !data.requester.trim()) return false;
        
        const now = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        const newTicket: Ticket = {
            ...data,
            id: `TLP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'YENİ',
            assignee: null,
            createdAt: now,
            history: [
                { date: now, action: 'Talep oluşturuldu.', user: data.requester }
            ]
        };
        
        saveTicketsLocally([newTicket, ...tickets]);
        return true;
    };

    const assignTicket = async (ticketId: string, technicianName: string, actorName?: string, actorRole?: UserRole): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    assignee: technicianName,
                    status: 'İŞLEMDE' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: 'İş teknik personele atandı.', user: actorName || currentUser.fullName }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    const unassignTicket = async (ticketId: string, actorName?: string, actorRole?: UserRole): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    assignee: null,
                    status: 'YENİ' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: 'Teknik personel ataması kaldırıldı.', user: actorName || currentUser.fullName }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    const completeTicket = async (ticketId: string, actorName?: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    status: 'ONAY_BEKLİYOR' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: 'İşlem tamamlandı, onaya sunuldu.', user: actorName || currentUser.fullName }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    const confirmTicket = async (ticketId: string, approved: boolean, actorName?: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    status: approved ? 'KAPATILDI' as const : 'İŞLEMDE' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: approved ? 'Talep onaylandı ve kapatıldı.' : 'Talep reddedildi, işleme geri alındı.', user: actorName || currentUser.fullName }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    return (
        <TicketContext.Provider
            value={{
                tickets,
                users: mappedUsers,
                isLoading,
                loadError: null,
                activeRole,
                switchRoleAndReload,
                updateUserRole,
                addTicket,
                assignTicket,
                unassignTicket,
                completeTicket,
                confirmTicket
            }}
        >
            {children}
        </TicketContext.Provider>
    );
};

export const useTickets = () => {
    const context = useContext(TicketContext);
    if (!context) {
        throw new Error('useTickets must be used within a TicketProvider');
    }
    return context;
};