'use client';

import React, { useRef, useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';

const UzmanAktifGorevlerPage = () => {
    const { tickets, completeTicket, unassignTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    // Yalnızca aktif kullanıcının üzerine atanmış ve henüz kapatılmamış görevler
    const myActiveTickets = tickets.filter((ticket) => {
        const isAssignedToMe = ticket.assignee === currentUser.fullName;
        return isAssignedToMe && ticket.status !== 'KAPATILDI';
    });

    const filteredTickets = myActiveTickets.filter((ticket) => {
        const query = search.toLocaleLowerCase('tr-TR');
        return (
            (!query || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(query)) &&
            (!statusFilter || ticket.status === statusFilter) &&
            (!priorityFilter || ticket.priority === priorityFilter)
        );
    });

    const getStatusSeverity = (status: Ticket['status']) => {
        switch (status) {
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return 'info';
            case 'REDDEDİLDİ': return 'danger';
            default: return null;
        }
    };

    const handleComplete = async (ticketId: string) => {
        const success = await completeTicket(ticketId);
        if (success) {
            toast.current?.show({
                severity: 'success',
                summary: 'Başarılı',
                detail: 'Talep çözüldü olarak işaretlendi ve kullanıcı onayına gönderildi.',
                life: 3000
            });
            setDialogVisible(false);
        }
    };

    const handleRelease = async (ticketId: string) => {
        const success = await unassignTicket(ticketId);
        if (success) {
            toast.current?.show({
                severity: 'info',
                summary: 'Görev Bırakıldı',
                detail: 'Talep üzerinizden kaldırıldı ve genel iş havuzuna iade edildi.',
                life: 3000
            });
            setDialogVisible(false);
        }
    };

    const actionBodyTemplate = (rowData: Ticket) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-search"
                    rounded
                    outlined
                    severity="secondary"
                    tooltip="Detay ve Yönetim"
                    onClick={() => {
                        setSelectedTicket(rowData);
                        setDialogVisible(true);
                    }}
                />
                {rowData.status === 'İŞLEMDE' && (
                    <Button
                        icon="pi pi-check"
                        rounded
                        severity="success"
                        tooltip="Tamamlandı Olarak Bildir"
                        onClick={() => handleComplete(rowData.id)}
                    />
                )}
            </div>
        );
    };

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card 
                        title="Üzerimdeki Aktif Görevler" 
                        subTitle={`Sayın ${currentUser.fullName}, üzerinize atanmış açık teknik talepler listelenmektedir.`}
                    >
                        {isLoading && <Message severity="info" className="w-full mb-3" text="Görevler yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                        <div className="flex flex-wrap gap-2 mb-3">
                            <InputText 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                placeholder="Görev veya talep sahibi ara..." 
                                className="w-full md:w-20rem"
                            />
                            <Dropdown 
                                value={statusFilter} 
                                options={['İŞLEMDE', 'ONAY_BEKLİYOR', 'REDDEDİLDİ']} 
                                onChange={(e) => setStatusFilter(e.value)} 
                                placeholder="Durum Filtresi" 
                                showClear 
                            />
                            <Dropdown 
                                value={priorityFilter} 
                                options={['Düşük', 'Normal', 'Yüksek', 'Kritik']} 
                                onChange={(e) => setPriorityFilter(e.value)} 
                                placeholder="Öncelik Filtresi" 
                                showClear 
                            />
                        </div>

                        <DataTable 
                            value={filteredTickets} 
                            paginator 
                            rows={10} 
                            responsiveLayout="scroll" 
                            emptyMessage="Üzerinize atanmış aktif bir görev bulunmamaktadır."
                        >
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column 
                                field="status" 
                                header="Durum" 
                                style={{ width: '140px' }} 
                                body={(rowData: Ticket) => <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />} 
                            />
                            <Column field="createdAt" header="Oluşturulma" style={{ width: '150px' }} />
                            <Column header="İşlemler" body={actionBodyTemplate} style={{ width: '120px' }} />
                        </DataTable>
                    </Card>
                </div>

                {/* Görev Detay & İşlem Modalı */}
                <Dialog 
                    header={`Görev Yönetim Paneli - ${selectedTicket?.id}`} 
                    visible={dialogVisible} 
                    style={{ width: '650px' }} 
                    onHide={() => setDialogVisible(false)}
                >
                    {selectedTicket && (
                        <div className="flex flex-column gap-4">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="font-bold text-lg">{selectedTicket.title}</span>
                                    <Tag value={selectedTicket.priority} severity={selectedTicket.priority === 'Kritik' ? 'danger' : 'info'} />
                                </div>
                                <p className="m-0 text-700 font-sans text-sm mb-2">{selectedTicket.description}</p>
                                <div className="text-xs text-500">
                                    <strong>Talep Sahibi:</strong> {selectedTicket.requester}
                                </div>
                            </div>

                            {/* Teknisyen Aksiyon Butonları */}
                            <div className="flex gap-2 justify-content-between border-top-1 surface-border pt-3">
                                <Button 
                                    label="Görevi Bırak (Havuza Gönder)" 
                                    icon="pi pi-arrow-left" 
                                    severity="danger" 
                                    outlined 
                                    onClick={() => handleRelease(selectedTicket.id)} 
                                />
                                {selectedTicket.status === 'İŞLEMDE' && (
                                    <Button 
                                        label="Tamamlandı Olarak Bildir" 
                                        icon="pi pi-check-circle" 
                                        severity="success" 
                                        onClick={() => handleComplete(selectedTicket.id)} 
                                    />
                                )}
                            </div>

                            <div>
                                <h6 className="font-bold mb-3">Süreç Tarihçesi</h6>
                                <Timeline 
                                    value={selectedTicket.history} 
                                    opposite={(item) => <small className="text-500">{item.date}</small>} 
                                    content={(item) => (
                                        <div className="mb-2">
                                            <div className="font-bold text-sm">{item.action}</div>
                                            <small className="text-500">İşlem Yapan: {item.user}</small>
                                        </div>
                                    )} 
                                />
                            </div>
                        </div>
                    )}
                </Dialog>
            </div>
        </RoleRouteGuard>
    );
};

export default UzmanAktifGorevlerPage;