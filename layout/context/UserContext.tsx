'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'CALISAN' | 'TEKNISYEN' | 'KOORDINATOR' | 'ADMIN';
export type TechnicianExpertise = 'Donanım' | 'Yazılım' | null;

export interface UserProfile {
    id: string;
    fullName: string;
    sicilNo: string;
    title: string;
    email: string;
    dahili: string;
    role: UserRole;
    roleLabel: string;
    expertise?: TechnicianExpertise;
}

const DEFAULT_USERS: UserProfile[] = [
    {
        id: 'usr-default',
        fullName: 'deneme1',
        sicilNo: '1923',
        title: 'deneme1',
        email: 'deneme@gmail.com',
        dahili: '1907',
        role: 'ADMIN',
        roleLabel: 'Admin (Yönetici)'
    }
];

interface UserContextType {
    users: UserProfile[];
    currentUser: UserProfile;
    switchUser: (id: string) => void;
    addUser: (userData: Omit<UserProfile, 'id' | 'roleLabel'>) => void;
    updateUser: (id: string, updates: Partial<UserProfile>) => void;
    resetSystem: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
    const [currentUser, setCurrentUser] = useState<UserProfile>(DEFAULT_USERS[0]);

    useEffect(() => {
        try {
            const savedUsers = localStorage.getItem('system_users');
            const activeUserId = localStorage.getItem('active_user_id');

            let currentUsersList = DEFAULT_USERS;
            if (savedUsers) {
                currentUsersList = JSON.parse(savedUsers);
                setUsers(currentUsersList);
            } else {
                localStorage.setItem('system_users', JSON.stringify(DEFAULT_USERS));
            }

            if (activeUserId) {
                const found = currentUsersList.find((u: UserProfile) => u.id === activeUserId);
                if (found) {
                    setCurrentUser(found);
                } else {
                    setCurrentUser(currentUsersList[0]);
                    localStorage.setItem('active_user_id', currentUsersList[0].id);
                }
            } else {
                localStorage.setItem('active_user_id', currentUsersList[0].id);
            }
        } catch (e) {
            console.error('LocalStorage okuma hatası:', e);
        }
    }, []);

    const switchUser = (id: string) => {
        const target = users.find(u => u.id === id);
        if (target) {
            setCurrentUser(target);
            localStorage.setItem('active_user_id', target.id);
            window.location.reload();
        }
    };

    const getRoleLabel = (role: UserRole) => {
        const roleLabels: Record<UserRole, string> = {
            CALISAN: 'Çalışan (Talep Sahibi)',
            TEKNISYEN: 'Teknisyen (Destek)',
            KOORDINATOR: 'Koordinatör',
            ADMIN: 'Admin (Yönetici)'
        };
        return roleLabels[role];
    };

    const addUser = (userData: Omit<UserProfile, 'id' | 'roleLabel'>) => {
        const newUser: UserProfile = {
            ...userData,
            id: `usr-${Date.now()}`,
            roleLabel: getRoleLabel(userData.role),
            expertise: userData.role === 'TEKNISYEN' ? userData.expertise : undefined
        };

        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        localStorage.setItem('system_users', JSON.stringify(updatedUsers));
        
        setCurrentUser(newUser);
        localStorage.setItem('active_user_id', newUser.id);
    };

    const updateUser = (id: string, updates: Partial<UserProfile>) => {
        const updatedUsers = users.map(u => {
            if (u.id === id) {
                const newRole = updates.role || u.role;
                return {
                    ...u,
                    ...updates,
                    roleLabel: getRoleLabel(newRole),
                    // Eğer rol teknisyenlikten çıkarılırsa uzmanlığı temizle
                    expertise: newRole === 'TEKNISYEN' ? (updates.expertise !== undefined ? updates.expertise : u.expertise) : undefined
                };
            }
            return u;
        });
        setUsers(updatedUsers);
        localStorage.setItem('system_users', JSON.stringify(updatedUsers));
        
        if (currentUser.id === id) {
            const updatedActiveUser = updatedUsers.find(u => u.id === id);
            if (updatedActiveUser) setCurrentUser(updatedActiveUser);
        }
    };

    const resetSystem = () => {
        localStorage.clear();
        window.location.href = '/'; 
    };

    return (
        <UserContext.Provider value={{ users, currentUser, switchUser, addUser, updateUser, resetSystem }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) throw new Error('useUser must be used within a UserProvider');
    return context;
};