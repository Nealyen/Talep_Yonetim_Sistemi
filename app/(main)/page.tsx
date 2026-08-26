'use client';

import React, { useEffect, useState } from 'react';
import { useTickets } from '@/layout/context/TicketContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

const Dashboard = () => {
    const { tickets, activeRole } = useTickets();
    const [currentUserName, setCurrentUserName] = useState('');
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('authUser');
        if (savedUser) {
            try {
                setCurrentUserName(JSON.parse(savedUser).name || '');
                setCurrentUserRole(JSON.parse(savedUser).role || null);
            } catch {
                setCurrentUserName('');
            }
        }
    }, []);

    const visibleTickets = tickets.filter((ticket) => {
        const isTestRole = currentUserRole !== null && currentUserRole !== activeRole;
        if (isTestRole || !currentUserName) return true;
        if (activeRole === 'TALEP_SAHIBI') return ticket.requester.includes(currentUserName);
        if (activeRole === 'TEKNIK_UZMAN') return ticket.assignee?.includes(currentUserName);
        return true;
    });

    const totalTickets = visibleTickets.length;
    const pendingTickets = visibleTickets.filter((t) => t.status === 'YENİ' || t.status === 'İŞLEMDE').length;
    const awaitingApproval = visibleTickets.filter((t) => t.status === 'ONAY_BEKLİYOR').length;
    const closedTickets = visibleTickets.filter((t) => t.status === 'KAPATILDI').length;
    const criticalCount = visibleTickets.filter((t) => t.priority === 'Kritik' && t.status !== 'KAPATILDI').length;
    const recentTitle = activeRole === 'ADMIN' ? 'Son İşlemler (Sistem Geneli)' : activeRole === 'TEKNIK_UZMAN' ? 'Son İşlemlerim (Teknik Uzman)' : 'Son İşlemlerim';

    return (
        <div className="grid">
            {/* Metrik Kartları */}
            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-2">Toplam Talep Kaydı</span>
                            <div className="text-900 font-medium text-xl">{totalTickets} Adet</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-folder text-blue-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">Aktif Havuz </span>
                    <span className="text-500">tüm birimler</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-2">İşlemdeki Talepler</span>
                            <div className="text-900 font-medium text-xl">{pendingTickets} Adet</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-spin pi-cog text-orange-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-orange-500 font-medium">{criticalCount} Kritik </span>
                    <span className="text-500">müdahale bekliyor</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-2">Kullanıcı Onayı Bekleyen</span>
                            <div className="text-900 font-medium text-xl">{awaitingApproval} Adet</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-clock text-purple-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-purple-500 font-medium">Two-Way Handshake </span>
                    <span className="text-500">onay aşaması</span>
                </div>
            </div>

            <div className="col-12 lg:col-6 xl:col-3">
                <div className="card mb-0">
                    <div className="flex justify-content-between mb-3">
                        <div>
                            <span className="block text-500 font-medium mb-2">Tamamlanan / Kapatılan</span>
                            <div className="text-900 font-medium text-xl">{closedTickets} Adet</div>
                        </div>
                        <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                            <i className="pi pi-check-circle text-green-500 text-xl" />
                        </div>
                    </div>
                    <span className="text-green-500 font-medium">%{(totalTickets > 0 ? (closedTickets / totalTickets) * 100 : 0).toFixed(0)} </span>
                    <span className="text-500">başarılı kapanma oranı</span>
                </div>
            </div>

            {/* Canlı İşlem Masası Tablosu */}
            <div className="col-12 mt-4">
                <div className="card">
                    <h5>{recentTitle}</h5>
                    <DataTable value={visibleTickets} rows={5} paginator responsiveLayout="scroll" emptyMessage="Görüntülenecek işlem bulunamadı.">
                        <Column field="id" header="ID" style={{ width: '120px' }} />
                        <Column field="title" header="Talep Başlığı" />
                        <Column field="category" header="Kategori" style={{ width: '150px' }} />
                        <Column field="requester" header="Talep Sahibi" />
                        <Column field="assignee" header="Atanan Personel" body={(r) => r.assignee || 'Havuzda Bekliyor'} />
                        <Column
                            field="status"
                            header="Durum"
                            body={(r) => (
                                <Tag
                                    value={r.status}
                                    severity={
                                        r.status === 'KAPATILDI' ? 'success' : r.status === 'ONAY_BEKLİYOR' ? 'warning' : r.status === 'İŞLEMDE' ? 'warning' : 'info'
                                    }
                                />
                            )}
                        />
                    </DataTable>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;