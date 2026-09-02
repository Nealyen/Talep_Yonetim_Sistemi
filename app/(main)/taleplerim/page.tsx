'use client';

import React, { useState } from 'react';
import { useTickets, Ticket } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Message } from 'primereact/message';
import TicketHistoryModal from '@/app/components/ticket/TicketHistoryModal';
import TicketActionReasonModal from '@/app/components/ticket/TicketActionReasonModal';
import { StatusBadge } from '@/app/components/ui/StatusBadge';
import { WorkLogApprovalButton } from '@/components/tickets/WorkLogApprovalButton';

const TaleplerimPage = () => {
    const { tickets, confirmTicket, isLoading, loadError } = useTickets();
    const { currentUser } = useUser();

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [actionReasonModalVisible, setActionReasonModalVisible] = useState(false);
    const [actionType, setActionType] = useState<'release' | 'complete'>('release');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);

    const normalize = (val: string) => (val ? val.trim().toLocaleLowerCase('tr-TR') : '');

    // KURAL: Rol fark etmeksizin yalnızca aktif kullanıcının açtığı talepler listelenir
    const myCreatedTickets = tickets.filter((ticket) => {
        const requester = normalize(ticket.requester);
        const activeUser = normalize(currentUser.fullName);
        return requester === activeUser || requester.startsWith(activeUser);
    });

    const filteredTickets = myCreatedTickets.filter((ticket) => {
        const query = search.trim().toLocaleLowerCase('tr-TR');
        const matchesSearch =
            !query ||
            ticket.id.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.title.toLocaleLowerCase('tr-TR').includes(query) ||
            ticket.category.toLocaleLowerCase('tr-TR').includes(query);

        const matchesStatus = !statusFilter || ticket.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const actionBodyTemplate = (rowData: Ticket) => {
        return (
            <div className="flex gap-2">
                <Button
                    icon="pi pi-eye"
                    rounded
                    outlined
                    severity="secondary"
                    tooltip="Talep Detayı ve Tarihçe"
                    onClick={() => {
                        setSelectedTicket(rowData);
                        setDialogVisible(true);
                    }}
                />
                {rowData.status === 'ONAY_BEKLİYOR' && (
                    <>
                        <Button
                            icon="pi pi-check"
                            rounded
                            severity="success"
                            tooltip="Çözümü Onayla (Kapat)"
                            onClick={() => confirmTicket(rowData.id, true)}
                        />
                        <Button
                            icon="pi pi-times"
                            rounded
                            severity="danger"
                            tooltip="Sorun Devam Ediyor (İtiraz Et)"
                            onClick={() => confirmTicket(rowData.id, false)}
                        />
                    </>
                )}
            </div>
        );
    };

    const openTicketHistory = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setDialogVisible(true);
    };

    const handleRelease = async (ticketId: string, message?: string) => {
        await confirmTicket(ticketId, false, currentUser.fullName);
        setActionReasonModalVisible(false);
    };

    const handleComplete = async (ticketId: string, message?: string) => {
        await confirmTicket(ticketId, true, currentUser.fullName);
        setActionReasonModalVisible(false);
    };

    return (
        <div className="grid">
            <div className="col-12">
                <Card
                    title={
                        <div className="flex justify-content-between align-items-center gap-2">
                            <span>Açtığım Resmi Talepler</span>
                            <WorkLogApprovalButton />
                        </div>
                    }
                    subTitle={`Sayın ${currentUser.fullName}, sadece sizin tarafınızdan oluşturulan talepler listelenmektedir.`}
                >
                    {isLoading && <Message severity="info" className="w-full mb-3" text="Talepler yükleniyor..." />}
                    {loadError && <Message severity="warn" className="w-full mb-3" text={loadError} />}

                    <div className="flex flex-wrap gap-2 mb-3">
                        <span className="p-input-icon-left w-full md:w-25rem">
                            <i className="pi pi-search text-primary" />
                            <InputText
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Taleplerim'de Arayın..."
                                className="w-full"
                                tooltip="Talep numarası başlık veya Kategori başlıklarına göre anlık arama yapar"
                                tooltipOptions={{ position: 'bottom' }}
                            />
                        </span>

                        <Dropdown
                            value={statusFilter}
                            options={['YENİ', 'İŞLEMDE', 'ONAY_BEKLİYOR', 'KAPATILDI', 'REDDEDİLDİ']}
                            onChange={(e) => setStatusFilter(e.value)}
                            placeholder="Durum Filtresi"
                            showClear
                        />
                    </div>

                    <DataTable
                        value={filteredTickets}
                        paginator
                        rows={10}
                        responsiveLayout="scroll"
                        emptyMessage="Açtığınız herhangi bir aktif talep bulunmamaktadır."
                        onRowClick={(event) => openTicketHistory(event.data as Ticket)}
                        rowClassName={() => 'cursor-pointer hover:surface-hover'}
                    >
                        <Column field="id" header="Talep No" style={{ width: '120px' }} />
                        <Column field="title" header="Talep Başlığı" />
                        <Column field="category" header="Kategori" style={{ width: '150px' }} />
                        <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                        <Column
                            field="status"
                            header="Durum"
                            style={{ width: '160px' }}
                            body={(rowData: Ticket) => <StatusBadge status={rowData.status} />}
                        />
                        <Column field="assignee" header="Atanan Uzman" body={(r: Ticket) => r.assignee || 'Henüz Atanmadı'} />
                        <Column field="createdAt" header="Tarih" style={{ width: '150px' }} />
                        <Column header="İşlem & Akış" body={actionBodyTemplate} style={{ width: '140px' }} />
                    </DataTable>
                </Card>
            </div>

            <TicketHistoryModal
                visible={dialogVisible}
                ticket={selectedTicket}
                onHide={() => setDialogVisible(false)}
                onAction={() => setDialogVisible(false)}
            />

            <TicketActionReasonModal
                visible={actionReasonModalVisible}
                actionType={actionType}
                ticket={selectedTicket}
                onHide={() => setActionReasonModalVisible(false)}
                onConfirm={(messageText) => {
                    if (!selectedTicket) return;
                    if (actionType === 'release') {
                        void handleRelease(selectedTicket.id, messageText);
                    } else {
                        void handleComplete(selectedTicket.id, messageText);
                    }
                }}
            />
        </div>
    );
};

export default TaleplerimPage;
