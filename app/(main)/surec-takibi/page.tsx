'use client';

import React, { useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';
import { ManualAssignDialog } from '@/components/tickets/ManualAssignDialog';

const KoordinatorPage = () => {
    const { tickets, assignTicket, unassignTicket, isLoading, loadError } = useTickets();
    const { users, currentUser } = useUser();

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [selectedTech, setSelectedTech] = useState<string>('');
    const [assignDialog, setAssignDialog] = useState(false);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

    // Teknisyen, Admin ve Koordinatör atanabilir; talep sahibi veya mevcut atanan hariç tutulur
    const availableTechnicians = users.filter((u) => {
        const isValidRole = ['TEKNISYEN', 'ADMIN', 'KOORDINATOR'].includes(u.role);
        const isNotRequester = selectedTicket ? u.fullName !== selectedTicket.requester : true;
        const isNotCurrentAssignee = selectedTicket ? u.fullName !== selectedTicket.assignee : true;

        return isValidRole && isNotRequester && isNotCurrentAssignee;
    });

    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.status !== 'KAPATILDI' &&
            (!search || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR'))) &&
            (!categoryFilter || ticket.category === categoryFilter)
    );

    const handleManualAssign = async () => {
        if (!selectedTicket || !selectedTech) return;

        const isSoDViolation = selectedTicket.requester === selectedTech;

        if (isSoDViolation) {
            confirmDialog({
                message: `DİKKAT: [${selectedTech}] bu talebin bizzat sahibidir. Görevler Ayrılığı (SoD) ilkesi gereği bir personel kendi açtığı talebi teknik olarak üstlenemez. Yine de zorlamak istiyor musunuz?`,
                header: 'SoD İhlali Uyarısı',
                icon: 'pi pi-exclamation-triangle',
                acceptClassName: 'p-button-danger',
                acceptLabel: 'Riski Kabul Et ve Ata',
                rejectLabel: 'İptal',
                accept: async () => {
                    if (await assignTicket(selectedTicket.id, selectedTech, currentUser.fullName)) {
                        setAssignDialog(false);
                        setSelectedTech('');
                    }
                }
            });
            return;
        }

        if (await assignTicket(selectedTicket.id, selectedTech, currentUser.fullName)) {
            setAssignDialog(false);
            setSelectedTech('');
        }
    };

    return (
        <RoleRouteGuard allowedRoles={['KOORDINATOR', 'ADMIN']}>
            <div className="grid">
                <ConfirmDialog />

                <div className="col-12">
                    <Card title="Süreç Denetim ve Koordinatör Masası" subTitle="Kurumsal SLA takibi, doğrudan personel görevlendirme ve müdahale merkezi.">
                        {isLoading && <Message severity="info" className="w-full mb-3" text="Talepler ve uzmanlar yükleniyor..." />}
                        {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}
                        <div className="flex flex-wrap gap-2 mb-3">
                            <InputText value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Talep veya çalışan ara..." />
                            <Dropdown
                                value={categoryFilter}
                                options={['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik']}
                                onChange={(event) => setCategoryFilter(event.value)}
                                placeholder="Kategori"
                                showClear
                            />
                        </div>
                        <DataTable value={filteredTickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Talep bulunamadı.">
                            <Column field="id" header="Kayıt ID" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Tanımı" />
                            <Column field="category" header="Kategori" style={{ width: '140px' }} />
                            <Column field="priority" header="Öncelik" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" />
                            <Column
                                field="assignee"
                                header="Görevli Uzman"
                                body={(r: Ticket) => {
                                    if (r.status === 'ATAMA_BEKLİYOR') return <span className="text-orange-500 font-bold">{r.pendingAssignee} (Onay Bekliyor)</span>;
                                    return r.assignee || <span className="text-red-500 font-bold">ATANMADI</span>;
                                }}
                            />
                            <Column
                                header="Koordinasyon"
                                body={(rowData: Ticket) => (
                                    <div className="flex gap-2">
                                        <Button
                                            label={rowData.assignee || rowData.pendingAssignee ? 'Uzmanı Değiştir' : 'Uzman Ata'}
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
                                        {(rowData.assignee || rowData.pendingAssignee) && !['KAPATILDI', 'REDDEDİLDİ'].includes(rowData.status) && (
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

                <ManualAssignDialog
                    visible={assignDialog}
                    ticket={selectedTicket}
                    availableTechnicians={availableTechnicians}
                    selectedTech={selectedTech}
                    onTechChange={setSelectedTech}
                    onHide={() => {
                        setAssignDialog(false);
                        setSelectedTicket(null);
                        setSelectedTech('');
                    }}
                    onConfirm={handleManualAssign}
                />
            </div>
        </RoleRouteGuard>
    );
};

export default KoordinatorPage;
