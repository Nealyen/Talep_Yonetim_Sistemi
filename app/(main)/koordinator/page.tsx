'use client';

import React, { useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import RoleRouteGuard from '@/components/RoleRouteGuard';

const KoordinatorPage = () => {
    const { tickets, assignTicket, unassignTicket, isLoading, loadError } = useTickets();
    const { users } = useUser(); // Kullanıcı verilerini yeni mimariden (UserContext) çekiyoruz
    
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [selectedTech, setSelectedTech] = useState<string>('');
    const [assignDialog, setAssignDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    const getTechnicianKey = (technicianName: string) => technicianName.split(' (')[0].trim();
    
    // Üzerinde işlemde olan kayıt bulunan meşgul teknisyenleri filtreleme
    const busyTechnicianKeys = new Set(
        tickets
            .filter((ticket) => ticket.assignee && !['KAPATILDI', 'REDDEDİLDİ'].includes(ticket.status))
            .filter((ticket) => ticket.id !== selectedTicket?.id)
            .map((ticket) => getTechnicianKey(ticket.assignee as string))
    );

    // Yeni UserContext yapısına göre uygun teknisyenleri filtreleme
    const availableTechnicians = users.filter((technician) => {
        const technicianKey = getTechnicianKey(technician.fullName);
        
        // Uzmanlık ve Kategori Eşleştirmesi (Örn: "Donanım/Arıza" -> "Donanım")
        let isExpertMatch = true;
        if (selectedTicket && technician.expertise) {
            isExpertMatch = selectedTicket.category.includes(technician.expertise);
        }

        return (
            technician.role === 'TEKNISYEN' &&
            isExpertMatch &&
            technicianKey !== (selectedTicket?.assignee ? getTechnicianKey(selectedTicket.assignee) : null) &&
            !busyTechnicianKeys.has(technicianKey)
        );
    });

    const filteredTickets = tickets.filter((ticket) => ticket.status !== 'KAPATILDI' && (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) && (!categoryFilter || ticket.category === categoryFilter));

    const handleManualAssign = async () => {
        if (selectedTicket && selectedTech && (await assignTicket(selectedTicket.id, selectedTech))) {
            setAssignDialog(false);
            setSelectedTech('');
        }
    };

    return (
        <RoleRouteGuard allowedRole="KOORDINATOR">
            <div className="grid">
            <div className="col-12">
                <Card title="Süreç Denetim ve Koordinatör Masası" subTitle="Kurumsal SLA takibi, doğrudan personel görevlendirme ve müdahale merkezi.">
                    {isLoading && <Message severity="info" className="w-full mb-3" text="Talepler ve uzmanlar yükleniyor..." />}
                    {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}
                    <div className="flex flex-wrap gap-2 mb-3">
                        <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Talep veya çalışan ara..." />
                        <Dropdown value={categoryFilter} options={['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik']} onChange={(event) => setCategoryFilter(event.value)} placeholder="Kategori" showClear />
                    </div>
                    <DataTable value={filteredTickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Talep bulunamadı.">
                        <Column field="id" header="Kayıt ID" style={{ width: '120px' }} />
                        <Column field="title" header="Talep Tanımı" />
                        <Column field="category" header="Kategori" style={{ width: '140px' }} />
                        <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
                        <Column field="requester" header="Talep Sahibi" />
                        <Column field="assignee" header="Görevli Uzman" body={(r: Ticket) => r.assignee || <span className="text-red-500 font-bold">ATANMADI</span>} />
                        <Column
                            header="Koordinasyon"
                            body={(rowData: Ticket) => (
                                <div className="flex gap-2">
                                    <Button
                                        label={rowData.assignee ? 'Uzman Değiştir' : 'Uzman Ata'}
                                        icon="pi pi-user-edit"
                                        size="small"
                                        severity="help"
                                        onClick={() => {
                                            setSelectedTicket(rowData);
                                            setSelectedTech('');
                                            setAssignDialog(true);
                                        }}
                                        disabled={['KAPATILDI', 'REDDEDİLDİ'].includes(rowData.status)}
                                    />
                                    {rowData.assignee && !['KAPATILDI', 'REDDEDİLDİ'].includes(rowData.status) && (
                                        <Button
                                            label="İlişkiyi Kes"
                                            icon="pi pi-user-minus"
                                            size="small"
                                            severity="danger"
                                            outlined
                                            onClick={() => unassignTicket(rowData.id)}
                                        />
                                    )}
                                </div>
                            )}
                            style={{ width: '280px' }}
                        />
                    </DataTable>
                </Card>
            </div>

            <Dialog
                header={`${selectedTicket?.assignee ? 'Teknik Uzman Değiştir' : 'Teknik Personel Görevlendir'} - ${selectedTicket?.id}`}
                visible={assignDialog}
                style={{ width: '450px' }}
                onHide={() => {
                    setAssignDialog(false);
                    setSelectedTicket(null);
                    setSelectedTech('');
                }}
            >
                <div className="p-fluid">
                    <label className="font-bold mb-2 block">Yeni Teknik Uzman</label>
                    <Dropdown
                        value={selectedTech}
                        options={availableTechnicians}
                        optionLabel="fullName" // Yeni veri yapısına uygun değiştirildi
                        optionValue="fullName" // Yeni veri yapısına uygun değiştirildi
                        onChange={(e) => setSelectedTech(e.value)}
                        placeholder={availableTechnicians.length ? 'Uzman Listesinden Seçin' : 'Müsait veya yetkin uzman bulunmuyor'}
                        className="mb-4"
                        disabled={!availableTechnicians.length}
                    />
                    <div className="flex justify-content-end gap-2">
                        <Button label="İptal" severity="secondary" onClick={() => setAssignDialog(false)} />
                        <Button label="Uzmanı Kaydet" severity="info" onClick={handleManualAssign} disabled={!selectedTech} />
                    </div>
                </div>
            </Dialog>
            </div>
        </RoleRouteGuard>
    );
};

export default KoordinatorPage;