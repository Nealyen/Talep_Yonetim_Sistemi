'use client';

/**
 * CONTEXT: Talep (Ticket) yönetimi — projenin EN BÜYÜK ve EN KRİTİK context'i (550+
 * satır).
 * NE TUTAR: Tüm talepler (Ticket[] — durum, atanan kişi, ekip, geçmiş/history, mesai
 * kayıtları/WorkLog dahil) ve ekip içi bildirimler (TeamNotification[]).
 * ÖNEMLİ İŞ AKIŞLARI: addTicket (yeni talep + Kategori Yönetimi'ne göre otomatik ekip
 * ataması), assignTicket (havuzdan üstüne alma / manuel atama — pendingAssignee ile
 * "atama önerisi" akışı), respondToAssignment (öneriyi kabul/red), completeTicket,
 * requestWorkLogApproval / resolveWorkLogApproval (mesai onay akışı).
 * EKİP BİLDİRİMLERİ: pushTeamNotifications — bir kullanıcı bir talebi üstüne
 * aldığında/kabul ettiğinde, aynı ekip(ler)deki herkese "X kullanıcısı Y talebini
 * üstüne almıştır" şeklinde salt-bilgi (onay gerektirmeyen) bir bildirim düşürür.
 * dismissTeamNotification bunu SADECE o kullanıcı için kapatır (dismissedBy dizisi),
 * diğerleri hâlâ görmeye devam eder.
 * KALICILIK: localStorage, 'system_tickets' ve 'team_notifications' anahtarları.
 * SAĞLADIĞI HOOK: useTickets().
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUser } from '@/layout/context/UserContext';
import { useCategories } from '@/layout/context/CategoryContext';

export type UserRole = 'CALISAN' | 'TEKNISYEN' | 'KOORDINATOR' | 'ADMIN';

export interface SystemUser {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    teams: string[];
    status: 'AKTİF' | 'PASİF';
}

export interface TicketHistory {
    date: string;
    action: string;
    user: string;
}

// EKİP BİLDİRİMİ: Bir kullanıcı bir talebi üstüne aldığında veya kendisine
// atanan bir görevi kabul ettiğinde, aynı ekip(ler)de bulunduğu diğer kullanıcılara
// bilgilendirme amaçlı (kabul/red gerektirmeyen) bir bildirim düşer.
export interface TeamNotification {
    id: string;
    ticketId: string;
    team: string;
    actorName: string;
    message: string;
    createdAt: string;
    dismissedBy: string[];
}

// 1. YENİ EKLENEN MESAİ KAYDI ARAYÜZÜ (WorkLog)
export interface WorkLog {
    id: string;
    fullName: string;
    sicilNo: string;
    startDate: string;
    endDate: string;
    durationStr: string;
    description?: string;
    status?: 'PENDING' | 'APPROVED' | 'REJECTED';
    requestedBy?: string;
}

export interface Ticket {
    id: string;
    title: string;
    category: 'Donanım/Arıza' | 'Yazılım/Erişim' | 'İdari Hizmet' | 'Güvenlik' | string;
    priority: 'Düşük' | 'Normal' | 'Yüksek' | 'Kritik';
    status: 'YENİ' | 'İNCELEMEDE' | 'İŞLEMDE' | 'ATAMA_BEKLİYOR' | 'ONAY_BEKLİYOR' | 'KAPATILDI' | 'REDDEDİLDİ';
    requester: string;
    assignee: string | null;
    pendingAssignee?: string | null; 
    delegatedBy?: string | null;
    // Bu talebin Kategori Yönetimi'nde tanımlı alt başlığa göre otomatik olarak
    // eşlendiği ekip. İş havuzu görünürlüğü ve "kime atanabilir" kısıtlaması bu
    // alana göre yapılır. Boşsa (henüz ekip ataması yapılmamış kategori) herkese açıktır.
    team?: string;
    description: string;
    location?: string;
    serialNo?: string;
    createdAt: string;
    closedAt?: string;
    history: TicketHistory[];
    barkodNo?: string;
    
    sicilNo?: string;
    kullaniciDahiliNo?: string;
    computerName?: string;
    ipNo?: string;
    ulasilacakDahiliNo?: string;
    cepTelNo?: string;
    odaNo?: string;
    attachedFiles?: string[];
    
    // 2. TICKET MODELİNE MESAİ KAYITLARI DİZİSİ EKLENDİ
    workLogs?: WorkLog[];
    pendingWorkLogs?: WorkLog[];
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
    assignTicket: (ticketId: string, technicianName: string, actorName?: string, actorRole?: UserRole, message?: string) => Promise<boolean>;
    respondToAssignment: (ticketId: string, accepted: boolean, actorName: string) => Promise<boolean>;
    unassignTicket: (ticketId: string, actorName?: string, actorRole?: UserRole, message?: string) => Promise<boolean>;
    completeTicket: (ticketId: string, actorName?: string, actorRole?: UserRole, message?: string) => Promise<boolean>;
    confirmTicket: (ticketId: string, approved: boolean, actorName?: string) => Promise<boolean>;
    updateTicket: (ticketId: string, updatedData: Partial<Ticket>, actor: string, actorRole?: UserRole) => Promise<boolean>;
    requestWorkLogApproval: (ticketId: string, log: WorkLog) => Promise<boolean>;
    resolveWorkLogApproval: (ticketId: string, logId: string, isApproved: boolean) => Promise<boolean>;
    resetTickets: () => void;
    teamNotifications: TeamNotification[];
    dismissTeamNotification: (notificationId: string, actorName?: string) => void;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export const TicketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { users: contextUsers, currentUser } = useUser();
    const { items: categoryItems } = useCategories();
    
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [teamNotifications, setTeamNotifications] = useState<TeamNotification[]>([]);

    const mappedUsers: SystemUser[] = contextUsers.map(u => ({
        id: u.id,
        name: u.fullName,
        email: u.email,
        role: u.role,
        teams: u.teams || [],
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

        try {
            const savedNotifications = localStorage.getItem('team_notifications');
            setTeamNotifications(savedNotifications ? JSON.parse(savedNotifications) : []);
        } catch (e) {
            console.error("Ekip bildirimleri yüklenirken hata:", e);
            setTeamNotifications([]);
        }
    }, []);

    const saveTicketsLocally = (newTickets: Ticket[]) => {
        setTickets(newTickets);
        localStorage.setItem('system_tickets', JSON.stringify(newTickets));
    };

    // KURAL: Aktör (actorName) ile en az bir ortak ekibi olan tüm kullanıcılara
    // (aktörün kendisi hariç) bilgilendirme amaçlı bir ekip bildirimi düşürür.
    // Aktörün birden fazla ekibi varsa her ekip için ayrı bir bildirim üretilir,
    // böylece mesajda hangi ortak ekip üzerinden geldiği net kalır.
    const pushTeamNotifications = (actorName: string, ticketId: string, bodyText: string) => {
        const actor = mappedUsers.find(u => u.name === actorName);
        if (!actor || !actor.teams || actor.teams.length === 0) return;

        const hasTeammate = (team: string) =>
            mappedUsers.some(u => u.name !== actorName && u.teams.includes(team));

        const newNotifications: TeamNotification[] = actor.teams
            .filter(hasTeammate)
            .map((team) => ({
                id: `tn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                ticketId,
                team,
                actorName,
                message: `Sizinle ${team} ekibinde ortak olan ${actorName} adlı kullanıcı, ${bodyText}`,
                createdAt: new Date().toLocaleString('tr-TR'),
                dismissedBy: [],
            }));

        if (newNotifications.length === 0) return;

        setTeamNotifications(prev => {
            const updated = [...newNotifications, ...prev];
            localStorage.setItem('team_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const dismissTeamNotification = (notificationId: string, actorName?: string) => {
        const who = actorName || currentUser.fullName;
        setTeamNotifications(prev => {
            const updated = prev.map(n =>
                n.id === notificationId
                    ? { ...n, dismissedBy: n.dismissedBy.includes(who) ? n.dismissedBy : [...n.dismissedBy, who] }
                    : n
            );
            localStorage.setItem('team_notifications', JSON.stringify(updated));
            return updated;
        });
    };

    const switchRoleAndReload = (role: UserRole) => {};
    const updateUserRole = async (userId: string, role: UserRole): Promise<boolean> => { return false; };

    const generateUniqueTicketId = (existingTickets: Ticket[]): string => {
    const year = new Date().getFullYear();
    const existingIds = new Set(existingTickets.map((t) => t.id));

    let candidateId: string;
    do {
        candidateId = `TLP-${year}-${Math.floor(1000 + Math.random() * 9000)}`;
    } while (existingIds.has(candidateId));

    return candidateId;
};

const addTicket = async (data: Omit<Ticket, 'id' | 'createdAt' | 'history' | 'status' | 'assignee'>): Promise<boolean> => {
    if (!data.title.trim() || !data.requester.trim()) return false;
    
    const now = new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const newTicket: Ticket = {
        ...data,
        id: generateUniqueTicketId(tickets),
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

    const assignTicket = async (ticketId: string, technicianName: string, actorName?: string, actorRole?: UserRole, message?: string): Promise<boolean> => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const currentActor = actorName || currentUser.fullName;
    const messageText = message?.trim();

    // KURAL: Bir kişi işi doğrudan KENDİSİNE atıyorsa (örn. iş havuzundan üzerine alma),
    // kendi kendinden onay beklemesi anlamsızdır — talep doğrudan aktif hale gelir.
    // "Atama Bekliyor" / kabul-red akışı yalnızca BAŞKASINA devir yapıldığında işler.
    const isSelfAssignment = technicianName === currentActor;

    if (isSelfAssignment) {
        const selfAssignText = messageText
            ? `Talep [${technicianName}] tarafından üzerine alındı. Açıklama: ${messageText}`
            : `Talep [${technicianName}] tarafından üzerine alındı.`;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    assignee: technicianName,
                    pendingAssignee: null,
                    delegatedBy: null,
                    status: 'İŞLEMDE' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: selfAssignText, user: currentActor }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        pushTeamNotifications(technicianName, ticketId, `"${ticketId}" numaralı talebi üstüne almıştır.`);
        return true;
    }

    const actionText = messageText
        ? `Görev, kabul onayı için [${technicianName}] adlı uzmana iletildi. Açıklama: ${messageText}`
        : `Görev, kabul onayı için [${technicianName}] adlı uzmana iletildi.`;

    const updated = tickets.map(t => {
        if (t.id === ticketId) {
            return {
                ...t,
                pendingAssignee: technicianName,
                delegatedBy: currentActor,
                status: 'ATAMA_BEKLİYOR' as const,
                history: [
                    ...t.history,
                    { date: new Date().toLocaleString('tr-TR'), action: actionText, user: currentActor }
                ]
            };
        }
        return t;
    });
    saveTicketsLocally(updated);
    return true;
};

    const respondToAssignment = async (ticketId: string, accepted: boolean, actorName: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const delegatedByBeforeUpdate = ticket.delegatedBy;

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                if (accepted) {
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
                    }
                }
            }
            return t;
        });
        saveTicketsLocally(updated);

        if (accepted) {
            const bodyText = delegatedByBeforeUpdate
                ? `${delegatedByBeforeUpdate} tarafından üstüne atanan "${ticketId}" numaralı görevi onaylamıştır.`
                : `"${ticketId}" numaralı görevi onaylamıştır.`;
            pushTeamNotifications(actorName, ticketId, bodyText);
        }

        return true;
    };

    const unassignTicket = async (ticketId: string, actorName?: string, actorRole?: UserRole, message?: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const actor = actorName || currentUser.fullName;
        const messageText = message?.trim();
        const actionText = messageText
            ? `Görev ataması kaldırılarak iş havuza iade edildi. Açıklama: ${messageText}`
            : 'Görev ataması kaldırılarak iş havuza iade edildi.';

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
                        { date: new Date().toLocaleString('tr-TR'), action: actionText, user: actor }
                    ]
                };
            }
            return t;
        });
        saveTicketsLocally(updated);
        return true;
    };

    const completeTicket = async (ticketId: string, actorName?: string, actorRole?: UserRole, message?: string): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const actor = actorName || currentUser.fullName;
        const messageText = message?.trim();
        const actionText = messageText
            ? `İşlem tamamlandı, çözüm onaya sunuldu. Açıklama: ${messageText}`
            : 'İşlem tamamlandı, çözüm onaya sunuldu.';

        const updated = tickets.map(t => {
            if (t.id === ticketId) {
                return {
                    ...t,
                    status: 'ONAY_BEKLİYOR' as const,
                    history: [
                        ...t.history,
                        { date: new Date().toLocaleString('tr-TR'), action: actionText, user: actor }
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
                    // KURAL: "Geçmiş Talepler" arşivlemesi ve "1 ay sonra Taleplerim'den
                    // düşme" kuralı için, talebin ne zaman kapatıldığını history metnini
                    // ayrıştırmak yerine doğrudan bu alandan güvenilir şekilde okuyoruz.
                    closedAt: approved ? new Date().toISOString() : t.closedAt,
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

    const requestWorkLogApproval = async (ticketId: string, log: WorkLog): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const pendingLog: WorkLog = {
            ...log,
            status: 'PENDING',
            requestedBy: log.requestedBy || currentUser.fullName,
        };

        const updated = tickets.map((t) => {
            if (t.id !== ticketId) return t;

            const existingWorkLogs = Array.isArray(t.workLogs) ? t.workLogs : [];
            const existingPending = Array.isArray(t.pendingWorkLogs) ? t.pendingWorkLogs : [];

            const nextWorkLogs = existingWorkLogs.some(item => item.id === pendingLog.id)
                ? existingWorkLogs.map(item => item.id === pendingLog.id ? pendingLog : item)
                : [...existingWorkLogs, pendingLog];

            const nextPending = existingPending.some(item => item.id === pendingLog.id)
                ? existingPending.map(item => item.id === pendingLog.id ? pendingLog : item)
                : [...existingPending, pendingLog];

            return {
                ...t,
                workLogs: nextWorkLogs,
                pendingWorkLogs: nextPending,
                history: [
                    ...t.history,
                    { date: new Date().toLocaleString('tr-TR'), action: `Mesai onayı istendi. ${pendingLog.fullName} için ${pendingLog.durationStr} çalışma kaydı.`, user: pendingLog.requestedBy || currentUser.fullName }
                ]
            };
        });

        saveTicketsLocally(updated);
        return true;
    };

    const resolveWorkLogApproval = async (ticketId: string, logId: string, isApproved: boolean): Promise<boolean> => {
        const ticket = tickets.find(t => t.id === ticketId);
        if (!ticket) return false;

        const updated = tickets.map((t) => {
            if (t.id !== ticketId) return t;

            const pendingLogs = Array.isArray(t.pendingWorkLogs) ? t.pendingWorkLogs : [];
            const workLogs = Array.isArray(t.workLogs) ? t.workLogs : [];
            const target = pendingLogs.find(item => item.id === logId) || workLogs.find(item => item.id === logId);
            if (!target) return t;

            const resolvedLog: WorkLog = {
                ...target,
                status: isApproved ? 'APPROVED' : 'REJECTED',
                requestedBy: target.requestedBy || currentUser.fullName,
            };

            return {
                ...t,
                workLogs: workLogs.some(item => item.id === logId)
                    ? workLogs.map(item => item.id === logId ? resolvedLog : item)
                    : [...workLogs, resolvedLog],
                pendingWorkLogs: pendingLogs.filter(item => item.id !== logId),
                history: [
                    ...t.history,
                    { date: new Date().toLocaleString('tr-TR'), action: isApproved ? `Mesai onayı kabul edildi. ${resolvedLog.fullName} için ${resolvedLog.durationStr}.` : `Mesai onayı reddedildi. ${resolvedLog.fullName} için ${resolvedLog.durationStr}.`, user: currentUser.fullName }
                ]
            };
        });

        saveTicketsLocally(updated);
        return true;
    };

    const updateTicket = async (ticketId: string, updatedData: Partial<Ticket>, actor: string, actorRole?: UserRole): Promise<boolean> => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return false;

    const now = new Date().toLocaleString('tr-TR');
    const updatedTitle = updatedData.title ?? ticket.title;
    const titleMatch = updatedTitle.match(/^\[([^\]]+)\]\s*(.*)$/);
    const updatedTeam = titleMatch
        ? categoryItems.find(
              (item) =>
                  item.ustBaslik.toLocaleUpperCase('tr-TR') === titleMatch[1].trim().toLocaleUpperCase('tr-TR') &&
                  item.altBaslik.toLocaleUpperCase('tr-TR') === titleMatch[2].trim().toLocaleUpperCase('tr-TR')
          )?.ekip || undefined
        : updatedData.team;

    // KURAL: ADMIN, kendisine ait olmayan (başka bir uzmana atanmış) bir talebi
    // düzenlerse bu sıradan bir güncelleme değil, bir müdahaledir. Bu durum hem
    // talebin kendi Süreç Tarihçesi'nde hem de (history üzerinden otomatik olarak)
    // Denetim İzi sayfasında ayrıca ve açıkça işaretlenir.
    const isAdminOverride = actorRole === 'ADMIN' && !!ticket.assignee && ticket.assignee !== actor;

    const updated = tickets.map((t) => {
        if (t.id === ticketId) {
            const changes: string[] = [];
            if (updatedData.priority && updatedData.priority !== t.priority) changes.push(`Öncelik güncellendi`);
            if (updatedData.odaNo && updatedData.odaNo !== t.odaNo) changes.push(`Oda No güncellendi`);
            if (updatedData.workLogs && updatedData.workLogs.length > (t.workLogs?.length || 0)) changes.push(`Mesai kaydı eklendi`);
            
            const changeSummary = changes.length > 0 ? ` (${changes.join(', ')})` : '';
            const adminNote = isAdminOverride
                ? ` — ADMIN MÜDAHALESİ: Bu talep [${t.assignee}] adlı uzmana ait olmasına rağmen ADMIN [${actor}] tarafından düzenlendi.`
                : '';

            return {
                ...t,
                ...updatedData,
                team: updatedTeam,
                history: [
                    ...t.history,
                    { action: `Talep bilgileri güncellendi${changeSummary}${adminNote}`, user: actor, date: now }
                ]
            };
        }
        return t;
    });
    
    saveTicketsLocally(updated);
    return true;
};

    const resetTickets = () => {
        localStorage.removeItem('system_tickets');
        setTickets([]);
    };

    return (
        <TicketContext.Provider value={{ tickets, users: mappedUsers, isLoading, loadError: null, activeRole, switchRoleAndReload, updateUserRole, addTicket, assignTicket, respondToAssignment, unassignTicket, completeTicket, confirmTicket, updateTicket, requestWorkLogApproval, resolveWorkLogApproval, resetTickets, teamNotifications, dismissTeamNotification }}>
            {children}
        </TicketContext.Provider>
    );
};

export const useTickets = () => {
    const context = useContext(TicketContext);
    if (!context) { throw new Error('useTickets must be used within a TicketProvider'); }
    return context;
};