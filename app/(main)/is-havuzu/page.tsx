'use client';

import React, { useRef, useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';

const IsHavuzuPage = () => {
    const { tickets, assignTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);
    
    const [search, setSearch] = useState('');
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    const isTechnician = currentUser.role === 'TEKNISYEN' || currentUser.role === 'ADMIN';

    // KURAL: Havuzda yalnızca henüz kimseye atanmamış (boşta) ve 'YENİ' durumundaki açık talepler listelenir
    const unassignedTickets = tickets.filter((ticket) => 
        !ticket.assignee && ticket.status === 'YENİ'
    );

    const filteredTickets = unassignedTickets.filter((ticket) =>
        (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
        (!priorityFilter || ticket.priority === priorityFilter)
    );

    const actionBodyTemplate = (rowData: Ticket) => {
        if (!isTechnician) {
            return <span className="text-500 text-sm">Salt Okunur</span>;
        }

        // Görevler Ayrılığı Kontrolü: Talep sahibi ile aktif teknisyen aynı kişi mi?
        const isMyOwnTicket = rowData.requester.trim().toLocaleLowerCase('tr-TR') === currentUser.fullName.trim().toLocaleLowerCase('tr-TR');

        return (
            <Button
                label={isMyOwnTicket ? "Kendi Talebiniz" : "İşi Üzerime Al"} 
                icon={isMyOwnTicket ? "pi pi-ban" : "pi pi-plus"} 
                size="small" 
                severity={isMyOwnTicket ? "secondary" : "info"}
                disabled={isMyOwnTicket}
                tooltip={isMyOwnTicket ? "Kendi oluşturduğunuz talebi doğrudan üzerinize alamazsınız." : "Talebi üzerinize atayın"}
                tooltipOptions={{ position: 'left' }}
                onClick={async () => {
                    if (isMyOwnTicket) return;

                    const assigned = await assignTicket(rowData.id, currentUser.fullName);
                    if (assigned) {
                        toast.current?.show({ 
                            severity: 'success', 
                            summary: 'Görev Zimmetlendi', 
                            detail: 'Talep üzerinize alındı ve "Aktif Görevlerim" sayfasına aktarıldı.', 
                            life: 2500 
                        });
                    }
                }}
            />
        );
    };

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card 
                        title="Teknik Servis İş Havuzu" 
                        subTitle="Müdahale bekleyen ve henüz bir teknisyene atanmamış sahipsiz talepler."
                    >
                        {isLoading && <Message severity="info" className="w-full mb-3" text="İş havuzu yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                            <InputText 
                                value={search} 
                                onChange={(event) => setSearch(event.target.value)} 
                                placeholder="Talep veya birim ara..." 
                                className="w-full md:w-20rem"
                            />
                            <Dropdown 
                                value={priorityFilter} 
                                options={['Düşük', 'Normal', 'Yüksek', 'Kritik']} 
                                onChange={(event) => setPriorityFilter(event.value)} 
                                placeholder="Aciliyet Filtresi" 
                                showClear 
                            />
                        </div>

                        <DataTable 
                            value={filteredTickets} 
                            paginator 
                            rows={10} 
                            responsiveLayout="scroll" 
                            emptyMessage="Havuzda atanmayı bekleyen açık iş bulunmamaktadır."
                        >
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column 
                                field="status" 
                                header="Durum" 
                                style={{ width: '120px' }} 
                                body={() => <Tag value="HAVUZDA" severity="info" />} 
                            />
                            <Column header="Müdahale" body={actionBodyTemplate} style={{ width: '160px' }} />
                        </DataTable>
                    </Card>
                </div>
            </div>
        </RoleRouteGuard>
    );
};

export default IsHavuzuPage;