'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/layout/context/UserContext';

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
    // YENİ STATÜ: ATAMA_BEKLİYOR eklendi
    status: 'YENİ' | 'İNCELEMEDE' | 'İŞLEMDE' | 'ATAMA_BEKLİYOR' | 'ONAY_BEKLİYOR' | 'KAPATILDI' | 'REDDEDİLDİ';
    requester: string;
    assignee: string | null;
    // YENİ ALANLAR: Two-Way Handshake için
    pendingAssignee?: string | null; 
    delegatedBy?: string | null;
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
    // YENİ FONKSİYON: Atamaya Yanıt Verme
    respondToAssignment: (ticketId: string, accepted: boolean, actorName: string) => Promise<boolean>;
    unassignTicket: (ticketId: string, actorName?: string, actorRole?: UserRole) => Promise<boolean>;
    completeTicket: (ticketId: string, actorName?: string) => Promise<boolean>;
    confirmTicket: (ticketId: string, approved: boolean, actorName?: string) => Promise<boolean>;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { users: contextUsers, currentUser } = useUser();
    
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const mappedUsers: SystemUser[] = contextUsers.map(u => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        department: u.department || 'Belirtilmemiş',
        status: 'AKTİF'
    }));

    const activeRole = currentUser.role;

    useEffect(() => {
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
        return false; 
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

    // ADIM 2: ATAMA MANTIĞI DEĞİŞTİRİLDİ (Onaya Gönderme)
    const assignTicket = async (ticketId: string, technicianName: string, actorName?: string, actorRole?: UserRole): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const currentActor = actorName || currentUser.fullName;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    pendingAssignee: technicianName,
                    delegatedBy: currentActor,
                    status: 'ATAMA_BEKLİYOR' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: `Görev, kabul onayı için [${technicianName}] adlı uzmana iletildi.`, user: currentActor }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    // ADIM 3: ATAMAYA YANIT VERME MANTIĞI (Kabul / Ret)
    const respondToAssignment = async (ticketId: string, accepted: boolean, actorName: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                if (accepted) {
                    // KABUL EDİLDİ: Hedef kişi kalıcı görevli olur
                    return {
                        ...t,
                        assignee: t.pendingAssignee || actorName,
                        pendingAssignee: null,
                        delegatedBy: null,
                        status: 'İŞLEMDE' as const,
                        history: [
                            ...t.history,
                            { date: new Date().toLocaleString('tr-TR'), action: 'İş devri KABUL EDİLDİ ve çalışmaya başlandı.', user: actorName }
                        ]
                    };
                } else {
                    // REDDEDİLDİ: İşlem gönderenin üzerine zimmetlenir ve İŞLEMDE kalır
                    const fallbackAssignee = t.delegatedBy || null;
                    return {
                        ...t,
                        assignee: fallbackAssignee,
                        pendingAssignee: null,
                        delegatedBy: null,
                        status: fallbackAssignee ? 'İŞLEMDE' as const : 'YENİ' as const,
                        history: [
                            ...t.history,
                            { date: new Date().toLocaleString('tr-TR'), action: `İş devri REDDEDİLDİ. Görev, atamayı yapan kişiye (${fallbackAssignee}) iade edildi.`, user: actorName }
                        ]
                    };
                }
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
                    pendingAssignee: null,
                    delegatedBy: null,
                    status: 'YENİ' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: 'Görev ataması kaldırılarak iş havuza iade edildi.', user: actorName || currentUser.fullName }
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
                        { date: new Date().toLocaleString('tr-TR'), action: 'İşlem tamamlandı, çözüm onaya sunuldu.', user: actorName || currentUser.fullName }
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
                        { date: new Date().toLocaleString('tr-TR'), action: approved ? 'Çözüm onaylandı ve talep kapatıldı.' : 'Çözüm reddedildi, işleme geri alındı.', user: actorName || currentUser.fullName }
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
                respondToAssignment,
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