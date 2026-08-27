'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/layout/context/UserContext';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { Card } from 'primereact/card';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import { SelectButton } from 'primereact/selectbutton';

const Dashboard = () => {
    const { currentUser } = useUser();
    const { tickets } = useTickets();
    const router = useRouter();

    const isTechOrAdmin = currentUser.role === 'TEKNISYEN' || currentUser.role === 'KOORDINATOR' || currentUser.role === 'ADMIN';
    
    // ŞALTER (TOGGLE) STATE'İ
    const [viewMode, setViewMode] = useState<'assigned' | 'created'>('assigned');
    const viewOptions = [
        { label: 'Üzerimdeki Aktif Görevler', value: 'assigned' },
        { label: 'Oluşturduğum Talepler', value: 'created' }
    ];

    // OTOMATİK ROL SENKRONİZASYONU (Çalışan hesaba geçildiğinde state kalıntısını engeller)
    const effectiveViewMode = !isTechOrAdmin ? 'created' : viewMode;

    const [charts, setCharts] = useState<any>({
        month1: null,
        month3: null,
        all: null,
        options: {}
    });

    // VERİ FİLTRELEME
    const activeTickets = effectiveViewMode === 'assigned' 
        ? tickets.filter(t => t.assignee === currentUser.fullName)
        : tickets.filter(t => t.requester === currentUser.fullName);

    const parseDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) return d;
        const parts = dateStr.split(/[.,/ -]/);
        if (parts.length >= 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        return new Date();
    };

    const now = new Date();
    const oneMonthAgo = new Date(); oneMonthAgo.setMonth(now.getMonth() - 1);
    const threeMonthsAgo = new Date(); threeMonthsAgo.setMonth(now.getMonth() - 3);

    const tickets1M = activeTickets.filter(t => parseDate(t.createdAt) >= oneMonthAgo);
    const tickets3M = activeTickets.filter(t => parseDate(t.createdAt) >= threeMonthsAgo);
    const ticketsAll = activeTickets;

    const buildChartData = (ticketList: Ticket[], docStyle: CSSStyleDeclaration) => {
        const counts = {
            yeni: ticketList.filter(t => t.status === 'YENİ').length,
            islemde: ticketList.filter(t => t.status === 'İŞLEMDE').length,
            onay: ticketList.filter(t => t.status === 'ONAY_BEKLİYOR').length,
            kapali: ticketList.filter(t => t.status === 'KAPATILDI').length
        };

        const total = counts.yeni + counts.islemde + counts.onay + counts.kapali;
        const activeTaskCount = counts.islemde + counts.onay + counts.yeni;

        const data = {
            labels: ['Yeni/Havuzda', 'İşlemde', 'Onay Bekleyen', 'Kapatılan'],
            datasets: [{
                data: total === 0 ? [1] : [counts.yeni, counts.islemde, counts.onay, counts.kapali],
                backgroundColor: total === 0 ? [docStyle.getPropertyValue('--surface-300')] : [
                    docStyle.getPropertyValue('--blue-500'),
                    docStyle.getPropertyValue('--orange-500'),
                    docStyle.getPropertyValue('--purple-500'),
                    docStyle.getPropertyValue('--green-500')
                ],
                borderWidth: 2,
                borderColor: docStyle.getPropertyValue('--surface-card')
            }]
        };

        return { data, counts, total, activeTaskCount };
    };

    useEffect(() => {
        const documentStyle = getComputedStyle(document.documentElement);
        
        setCharts({
            month1: buildChartData(tickets1M, documentStyle),
            month3: buildChartData(tickets3M, documentStyle),
            all: buildChartData(ticketsAll, documentStyle),
            options: {
                cutout: '65%',
                maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: true } }
            }
        });
    }, [currentUser.fullName, currentUser.role, tickets, effectiveViewMode]);

    const getActionRequiredTickets = () => {
        if (currentUser.role === 'CALISAN') {
            return tickets.filter(t => t.requester === currentUser.fullName && t.status === 'ONAY_BEKLİYOR');
        }
        if (isTechOrAdmin) {
            return tickets.filter(t => t.assignee === currentUser.fullName && t.status === 'İŞLEMDE');
        }
        return [];
    };

    const actionTickets = getActionRequiredTickets();

    const getStatusSeverity = (status: Ticket['status']): "info" | "success" | "warning" | "danger" | null => {
        switch (status) {
            case 'YENİ': return 'info';
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return null; 
            case 'KAPATILDI': return 'success';
            default: return null;
        }
    };

    const CustomLegend = ({ counts, total, activeTaskCount }: { counts: any, total: number, activeTaskCount: number }) => {
        if (total === 0) return <div className="text-center text-500 mt-4">Veri bulunamadı</div>;
        return (
            <div className="mt-4 flex flex-column gap-2 text-sm">
                <div className="flex justify-content-between align-items-center"><span className="flex align-items-center gap-2"><div className="w-1rem h-1rem border-round bg-blue-500"></div> Yeni / Havuzda</span> <span className="font-bold">{counts.yeni}</span></div>
                <div className="flex justify-content-between align-items-center"><span className="flex align-items-center gap-2"><div className="w-1rem h-1rem border-round bg-orange-500"></div> İşlemde</span> <span className="font-bold">{counts.islemde}</span></div>
                <div className="flex justify-content-between align-items-center"><span className="flex align-items-center gap-2"><div className="w-1rem h-1rem border-round bg-purple-500"></div> Onay Bekleyen</span> <span className="font-bold">{counts.onay}</span></div>
                <div className="flex justify-content-between align-items-center"><span className="flex align-items-center gap-2"><div className="w-1rem h-1rem border-round bg-green-500"></div> Çözülen / Kapatılan</span> <span className="font-bold">{counts.kapali}</span></div>
                <div className="flex justify-content-between align-items-center mt-2 pt-2 border-top-1 surface-border"><span className="font-bold">Toplam Kayıt</span> <span className="font-bold text-lg">{total}</span></div>
                {effectiveViewMode === 'assigned' && (
                    <div className="flex justify-content-between align-items-center mt-1 text-500"><span className="font-medium">Aktif Görev Miktarı (Net)</span> <span className="font-bold">{activeTaskCount}</span></div>
                )}
            </div>
        );
    };

    return (
        <div className="grid">
            {isTechOrAdmin && (
                <div className="col-12 flex justify-content-center mb-3">
                    <SelectButton 
                        value={viewMode} 
                        onChange={(e) => e.value && setViewMode(e.value)} 
                        options={viewOptions} 
                        allowEmpty={false}
                    />
                </div>
            )}

            {charts.month1 && (
                <>
                    <div className="col-12 lg:col-4">
                        <Card title="Son 1 Aylık Performans">
                            <div className="flex justify-content-center align-items-center" style={{ height: '220px' }}>
                                <Chart type="doughnut" data={charts.month1.data} options={charts.options} className="w-full" style={{ maxWidth: '220px' }} />
                            </div>
                            <CustomLegend counts={charts.month1.counts} total={charts.month1.total} activeTaskCount={charts.month1.activeTaskCount} />
                        </Card>
                    </div>
                    <div className="col-12 lg:col-4">
                        <Card title="Son 3 Aylık Performans">
                            <div className="flex justify-content-center align-items-center" style={{ height: '220px' }}>
                                <Chart type="doughnut" data={charts.month3.data} options={charts.options} className="w-full" style={{ maxWidth: '220px' }} />
                            </div>
                            <CustomLegend counts={charts.month3.counts} total={charts.month3.total} activeTaskCount={charts.month3.activeTaskCount} />
                        </Card>
                    </div>
                    <div className="col-12 lg:col-4">
                        <Card title="Tüm Zamanlar (Genel Durum)">
                            <div className="flex justify-content-center align-items-center" style={{ height: '220px' }}>
                                <Chart type="doughnut" data={charts.all.data} options={charts.options} className="w-full" style={{ maxWidth: '220px' }} />
                            </div>
                            <CustomLegend counts={charts.all.counts} total={charts.all.total} activeTaskCount={charts.all.activeTaskCount} />
                        </Card>
                    </div>
                </>
            )}

            <div className="col-12">
                <Card>
                    <div className="flex flex-wrap gap-3">
                        <Button label="Yeni Talep Oluştur" icon="pi pi-plus" onClick={() => router.push('/yeni-talep')} />
                        <Button label="Açtığım Taleplere Git" icon="pi pi-list" severity="secondary" outlined onClick={() => router.push('/taleplerim')} />
                        {isTechOrAdmin && (
                            <Button label="Teknik İş Havuzu" icon="pi pi-server" severity="info" outlined onClick={() => router.push('/is-havuzu')} />
                        )}
                    </div>
                </Card>
            </div>

            <div className="col-12">
                {actionTickets.length > 0 ? (
                    <Card title="Aksiyon Bekleyen Talepleriniz" subTitle="Aşağıdaki kayıtlarda doğrudan sizin müdahaleniz veya onayınız beklenmektedir.">
                        <DataTable value={actionTickets} responsiveLayout="scroll">
                            <Column field="id" header="Kayıt No" />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" />
                            <Column 
                                field="status" 
                                header="Durum" 
                                body={(rowData: Ticket) => (
                                    <Tag 
                                        value={rowData.status} 
                                        severity={getStatusSeverity(rowData.status)} 
                                        className={rowData.status === 'ONAY_BEKLİYOR' ? "bg-purple-600 text-white" : ""}
                                    />
                                )} 
                            />
                        </DataTable>
                    </Card>
                ) : (
                    <Card title="Sistem Durumu">
                        <div className="flex align-items-center justify-content-center p-4 border-round surface-ground text-500 font-medium">
                            Şu anda doğrudan aksiyonunuzu bekleyen bir talep bulunmamaktadır.
                        </div>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Dashboard;