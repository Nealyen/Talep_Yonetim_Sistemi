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
    // YENİ EKLENEN: respondToAssignment fonksiyonu Context'ten çekildi
    const { tickets, completeTicket, unassignTicket, assignTicket, respondToAssignment, isLoading, loadError } = useTickets();
    const { currentUser, users } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [delegateDialogVisible, setDelegateDialogVisible] = useState(false);
    // YENİ STATE: Atama Bekleyenler Modalı
    const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
    const [targetTech, setTargetTech] = useState<string>('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    // 1. Zaten Kabul Edilmiş ve Aktif Olan Görevlerim
    const myActiveTickets = tickets.filter((ticket) => {
        const isAssignedToMe = ticket.assignee === currentUser.fullName;
        return isAssignedToMe && ticket.status !== 'KAPATILDI';
    });

    // 2. YENİ: Başkası Tarafından Bana Yönlendirilmiş ve Onayımı Bekleyen Görevler
    const myPendingTickets = tickets.filter((ticket) => {
        return ticket.pendingAssignee === currentUser.fullName && ticket.status === 'ATAMA_BEKLİYOR';
    });

    const filteredTickets = myActiveTickets.filter((ticket) => {
        const query = search.toLocaleLowerCase('tr-TR');
        return (
            (!query || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(query)) &&
            (!statusFilter || ticket.status === statusFilter) &&
            (!priorityFilter || ticket.priority === priorityFilter)
        );
    });

    const availableDelegates = users.filter((u) => 
        (u.role === 'TEKNISYEN' || u.role === 'ADMIN' || u.role === 'KOORDINATOR') &&
        u.fullName !== currentUser.fullName &&
        (selectedTicket ? u.fullName !== selectedTicket.requester : true)
    );

    const getStatusSeverity = (status: Ticket['status']): "info" | "success" | "warning" | "danger" | null => {
        switch (status) {
            case 'YENİ': return 'info';
            case 'İŞLEMDE': return 'warning';
            case 'ONAY_BEKLİYOR': return null; 
            case 'KAPATILDI': return 'success';
            case 'REDDEDİLDİ': return 'danger';
            case 'ATAMA_BEKLİYOR': return 'warning';
            default: return null;
        }
    };

    // ATAMA ONAYLAMA FONKSİYONU
    const handleAcceptAssignment = async (ticketId: string) => {
        const success = await respondToAssignment(ticketId, true, currentUser.fullName);
        if (success) {
            toast.current?.show({ severity: 'success', summary: 'Görev Kabul Edildi', detail: 'Talebi üzerinize aldınız, çalışmaya başlayabilirsiniz.', life: 3000 });
            if (myPendingTickets.length <= 1) setPendingDialogVisible(false);
        }
    };

    // ATAMA REDDETME FONKSİYONU
    const handleRejectAssignment = async (ticketId: string) => {
        const success = await respondToAssignment(ticketId, false, currentUser.fullName);
        if (success) {
            toast.current?.show({ severity: 'info', summary: 'Görev Reddedildi', detail: 'Talep, atamayı yapan kişiye iade edildi.', life: 3000 });
            if (myPendingTickets.length <= 1) setPendingDialogVisible(false);
        }
    };

    const handleComplete = async (ticketId: string) => {
        const success = await completeTicket(ticketId);
        if (success) {
            toast.current?.show({ severity: 'success', summary: 'Başarılı', detail: 'Talep çözüldü olarak işaretlendi ve onaya gönderildi.', life: 3000 });
            setDialogVisible(false);
        }
    };

    const handleRelease = async (ticketId: string) => {
        const success = await unassignTicket(ticketId);
        if (success) {
            toast.current?.show({ severity: 'info', summary: 'Görev Bırakıldı', detail: 'Talep üzerinizden kaldırıldı ve havuza iade edildi.', life: 3000 });
            setDialogVisible(false);
        }
    };

    const handleDelegate = async () => {
        if (!selectedTicket || !targetTech) return;

        // Devretme işlemi de artık yeni Two-Way handshake algoritmasını tetikler
        const success = await assignTicket(selectedTicket.id, targetTech, currentUser.fullName);
        if (success) {
            toast.current?.show({ severity: 'success', summary: 'Görev Devredildi', detail: `Talep onay için [${targetTech}] adlı personele gönderildi.`, life: 3000 });
            setDelegateDialogVisible(false);
            setDialogVisible(false);
            setTargetTech('');
        }
    };

    const actionBodyTemplate = (rowData: Ticket) => {
        return (
            <div className="flex gap-2">
                <Button icon="pi pi-search" rounded outlined severity="secondary" tooltip="Detay ve Yönetim" onClick={() => { setSelectedTicket(rowData); setDialogVisible(true); }} />
                {rowData.status === 'İŞLEMDE' && (
                    <>
                        <Button icon="pi pi-check" rounded severity="success" tooltip="Tamamlandı Olarak Bildir" onClick={() => handleComplete(rowData.id)} />
                        <Button icon="pi pi-times" rounded severity="danger" tooltip="Havuza İade Et" onClick={() => handleRelease(rowData.id)} />
                        <Button icon="pi pi-send" rounded severity="help" tooltip="Görevi Devret" onClick={() => { setSelectedTicket(rowData); setDelegateDialogVisible(true); }} />
                    </>
                )}
            </div>
        );
    };

    const pendingActionBodyTemplate = (rowData: Ticket) => {
        return (
            <div className="flex gap-2">
                <Button label="Kabul Et" icon="pi pi-check" size="small" severity="success" onClick={() => handleAcceptAssignment(rowData.id)} />
                <Button label="Reddet" icon="pi pi-times" size="small" severity="danger" outlined onClick={() => handleRejectAssignment(rowData.id)} />
            </div>
        );
    };

    // Card Başlığı: Atama İşlemleri Butonu Sağ Üste Yerleştirildi
    const cardHeader = (
        <div className="flex align-items-center justify-content-between mb-2">
            <div>
                <div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div>
                <div className="text-sm text-500 font-normal mt-1">Sayın {currentUser.fullName}, üzerinize atanmış açık teknik talepler listelenmektedir.</div>
            </div>
            <Button 
                label="Atama İşlemleri" 
                icon="pi pi-inbox" 
                severity={myPendingTickets.length > 0 ? 'warning' : 'secondary'} 
                badge={myPendingTickets.length > 0 ? myPendingTickets.length.toString() : undefined}
                badgeClassName="p-badge-danger"
                onClick={() => setPendingDialogVisible(true)}
            />
        </div>
    );

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN', 'KOORDINATOR']}>
            <div className="grid">
                <Toast ref={toast} />
                <div className="col-12">
                    <Card title={cardHeader}>
                        {isLoading && <Message severity="info" className="w-full mb-3" text="Görevler yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                        <div className="flex flex-wrap gap-2 mb-3">
                            <InputText value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Görev veya talep sahibi ara..." className="w-full md:w-20rem" />
                            <Dropdown value={statusFilter} options={['İŞLEMDE', 'ONAY_BEKLİYOR', 'REDDEDİLDİ']} onChange={(e) => setStatusFilter(e.value)} placeholder="Durum Filtresi" showClear />
                            <Dropdown value={priorityFilter} options={['Düşük', 'Normal', 'Yüksek', 'Kritik']} onChange={(e) => setPriorityFilter(e.value)} placeholder="Öncelik Filtresi" showClear />
                        </div>

                        <DataTable value={filteredTickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Üzerinize atanmış aktif bir görev bulunmamaktadır.">
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '150px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column field="status" header="Durum" style={{ width: '140px' }} body={(rowData: Ticket) => (
                                <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} className={rowData.status === 'ONAY_BEKLİYOR' ? "bg-purple-600 text-white" : ""} />
                            )} />
                            <Column field="createdAt" header="Oluşturulma" style={{ width: '150px' }} />
                            <Column header="İşlemler" body={actionBodyTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>

                {/* YENİ: Atama İşlemleri (Gelen Kutusu) Modalı */}
                <Dialog 
                    header="Onayınızı Bekleyen Atamalar" 
                    visible={pendingDialogVisible} 
                    style={{ width: '800px' }} 
                    onHide={() => setPendingDialogVisible(false)}
                >
                    {myPendingTickets.length > 0 ? (
                        <DataTable value={myPendingTickets} responsiveLayout="scroll">
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="delegatedBy" header="Atayan / Yönlendiren" style={{ width: '180px' }} />
                            <Column header="İşlem" body={pendingActionBodyTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    ) : (
                        <Message severity="info" text="Şu anda onayınızı bekleyen herhangi bir görev ataması bulunmamaktadır." className="w-full" />
                    )}
                </Dialog>

                {/* Görev Detay & Yönetim Modalı */}
                <Dialog header={`Görev Yönetim Paneli - ${selectedTicket?.id}`} visible={dialogVisible} style={{ width: '650px' }} onHide={() => setDialogVisible(false)}>
                    {selectedTicket && (
                        <div className="flex flex-column gap-4">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between align-items-center mb-2">
                                    <span className="font-bold text-lg">{selectedTicket.title}</span>
                                    <Tag value={selectedTicket.priority} severity={selectedTicket.priority === 'Kritik' ? 'danger' : 'info'} />
                                </div>
                                <p className="m-0 text-700 font-sans text-sm mb-2">{selectedTicket.description}</p>
                                <div className="text-xs text-500"><strong>Talep Sahibi:</strong> {selectedTicket.requester}</div>
                            </div>
                            <div>
                                <h6 className="font-bold mb-3">Süreç Tarihçesi</h6>
                                <Timeline value={selectedTicket.history} opposite={(item) => <small className="text-500">{item.date}</small>} content={(item) => (
                                    <div className="mb-2">
                                        <div className="font-bold text-sm">{item.action}</div>
                                        <small className="text-500">İşlem Yapan: {item.user}</small>
                                    </div>
                                )} />
                            </div>
                        </div>
                    )}
                </Dialog>

                {/* Görev Devretme Alt Modalı */}
                <Dialog header="Görevi Başka Bir Personele Yönlendir" visible={delegateDialogVisible} style={{ width: '450px' }} onHide={() => { setDelegateDialogVisible(false); setTargetTech(''); }}>
                    <div className="p-fluid">
                        {!availableDelegates.length ? (
                            <Message severity="warn" text="Yönlendirilecek uygun personel bulunamadı." className="mb-4" />
                        ) : (
                            <>
                                <label className="font-bold mb-2 block">Yönlendirilecek Personel Seçimi</label>
                                <Dropdown value={targetTech} options={availableDelegates} optionLabel="fullName" optionValue="fullName" onChange={(e) => setTargetTech(e.value)} placeholder="Uzman/Koordinatör seçiniz..." className="mb-4" />
                            </>
                        )}
                        <div className="flex justify-content-end gap-2 mt-2">
                            <Button label="İptal" severity="secondary" onClick={() => setDelegateDialogVisible(false)} />
                            <Button label="Gönder" severity="help" icon="pi pi-send" onClick={handleDelegate} disabled={!targetTech} />
                        </div>
                    </div>
                </Dialog>
            </div>
        </RoleRouteGuard>
    );
};

export default UzmanAktifGorevlerPage;