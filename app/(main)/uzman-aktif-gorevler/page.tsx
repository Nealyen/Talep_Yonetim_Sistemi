'use client';

import React, { useRef, useState } from 'react';
import { useTickets, Ticket, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Message } from 'primereact/message';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Calendar } from 'primereact/calendar';
import { Checkbox } from 'primereact/checkbox';
import { RoleRouteGuard } from '@/layout/RoleRouteGuard';

const categoryTree: Record<string, string[]> = {
    'AĞ / İNTERNET': ['İnternet Erişimi & Filtre', 'VPN Bağlantısı', 'Wi-Fi / Kablosuz Ağ', 'IP / Port Talebi'],
    'DONANIM / ÇEVRE BİRİMLERİ': ['Kasa / Monitör Arızası', 'Klavye / Mouse Değişimi', 'RAM / Disk Arızası', 'Donanım Temini'],
    'YAZILIM / İŞLETİM SİSTEMİ': ['İşletim Sistemi Hatası', 'Ofis / Lisans Programları', 'Kurumsal Portal / Web', 'Yazılım Kurulumu'],
    'YAZICI / TARAYICI': ['Toner Değişimi', 'Ağ Yazıcısı Tanımlama', 'Donanım / Kağıt Sıkışması'],
    'E-POSTA / HESAP': ['Şifre Sıfırlama', 'Yeni Hesap Açılışı', 'E-posta Kota Artırımı', 'Yetkilendirme']
};

const mainCategoryOptions = Object.keys(categoryTree).map((k) => ({ label: k, value: k }));
const priorityOptions = ['Düşük', 'Normal', 'Yüksek', 'Kritik'];

const UzmanAktifGorevlerPage = () => {
    const { tickets, completeTicket, unassignTicket, assignTicket, respondToAssignment, updateTicket, isLoading, loadError } = useTickets();
    const { currentUser, users } = useUser();
    const toast = useRef<Toast>(null);

    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [dialogVisible, setDialogVisible] = useState(false); 
    const [editDialogVisible, setEditDialogVisible] = useState(false); 
    const [delegateDialogVisible, setDelegateDialogVisible] = useState(false);
    const [pendingDialogVisible, setPendingDialogVisible] = useState(false);
    const [workLogDialogVisible, setWorkLogDialogVisible] = useState(false);
    
    // Düzenleme Form State
    const [editForm, setEditForm] = useState({
        category: '', subCategory: '', priority: 'Normal' as Ticket['priority'], description: '',
        requester: '', email: '', sicilNo: '', kullaniciDahiliNo: '', computerName: '', ipNo: '',
        ulasilacakDahiliNo: '', cepTelNo: '', odaNo: '', attachedFiles: [] as string[],
        workLogs: [] as WorkLog[]
    });

    // Mesai Ekleme Form State (Özelleştirilebilir 3 input eklendi)
    const [workLogForm, setWorkLogForm] = useState({
        isDifferentUser: false,
        selectedUser: currentUser,
        startDate: null as Date | null,
        endDate: null as Date | null,
        manualDays: 0,
        manualHours: 0,
        manualMins: 0
    });

    const [targetTech, setTargetTech] = useState<string>('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

    const myActiveTickets = tickets.filter((ticket) => ticket.assignee === currentUser.fullName && ticket.status !== 'KAPATILDI');
    const myPendingTickets = tickets.filter((ticket) => ticket.pendingAssignee === currentUser.fullName && ticket.status === 'ATAMA_BEKLİYOR');

    const filteredTickets = myActiveTickets.filter((ticket) => {
        const query = search.toLocaleLowerCase('tr-TR');
        return (
            (!query || `${ticket.id} ${ticket.title} ${ticket.requester}`.toLocaleLowerCase('tr-TR').includes(query)) &&
            (!statusFilter || ticket.status === statusFilter) &&
            (!priorityFilter || ticket.priority === priorityFilter)
        );
    });

    const eligibleTechnicians = users.filter((u) => u.role === 'TEKNISYEN' || u.role === 'ADMIN' || u.role === 'KOORDINATOR');
    const availableDelegates = eligibleTechnicians.filter((u) => u.fullName !== currentUser.fullName && (selectedTicket ? u.fullName !== selectedTicket.requester : true));

    const getStatusSeverity = (status: Ticket['status']): "info" | "success" | "warning" | "danger" | null => {
        switch (status) {
            case 'YENİ': return 'info'; case 'İŞLEMDE': return 'warning'; case 'ONAY_BEKLİYOR': return null; 
            case 'KAPATILDI': return 'success'; case 'REDDEDİLDİ': return 'danger'; case 'ATAMA_BEKLİYOR': return 'warning'; default: return null;
        }
    };

    // YARDIMCI 1: TR Tarih Metnini Date Objesine Çevirici
    const parseTurkishDate = (dateStr: string) => {
        const parts = dateStr.match(/\d+/g);
        if (parts && parts.length >= 5) {
            const [d, m, y, hr, min] = parts.map(Number);
            return new Date(y, m - 1, d, hr, min, parts[5] ? Number(parts[5]) : 0);
        }
        return new Date();
    };

    // YARDIMCI 2: Hafta İçi (08:00 - 17:00) İş Saati Hesaplayıcı
    const calculateBusinessTime = (start: Date, end: Date) => {
        if (!start || !end || end <= start) return { days: 0, hours: 0, mins: 0 };
        
        let mins = 0;
        let curr = new Date(start.getTime());
        while (curr < end) {
            const d = curr.getDay();
            const h = curr.getHours();
            // Pazar(0), Cumartesi(6) hariç. Saat 08:00 - 16:59 arası 1'er dakika sayılır
            if (d !== 0 && d !== 6 && h >= 8 && h < 17) {
                mins++;
            }
            curr.setTime(curr.getTime() + 60000); // 1 dakika ekle
        }

        // Gün kullanmadan saatleri üst üste yığma mantığı (örn: 25 Saat 30 Dk)
        const hours = Math.floor(mins / 60);
        const remainderMins = mins % 60;
        
        return { days: 0, hours: hours, mins: remainderMins };
    };

    const openEditDialog = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        
        const rawCategory = ticket.category || 'AĞ / İNTERNET';
        const matchedMainCat = Object.keys(categoryTree).find(k => rawCategory.toUpperCase().includes(k.split(' ')[0])) || 'AĞ / İNTERNET';
        const availableSubs = categoryTree[matchedMainCat] || [];

        let rawDesc = ticket.description || '';
        let extractedDahili = ticket.ulasilacakDahiliNo || '';
        let extractedCep = ticket.cepTelNo || '';
        let extractedOda = ticket.odaNo || '';

        if (rawDesc.includes('Ulaşılacak Dahili:')) extractedDahili = rawDesc.match(/Ulaşılacak Dahili:\s*([^\n]+)/)?.[1].trim() || extractedDahili;
        if (rawDesc.includes('Cep Tel:')) extractedCep = rawDesc.match(/Cep Tel:\s*([^\n]+)/)?.[1].trim() || extractedCep;
        if (rawDesc.includes('Oda No:')) extractedOda = rawDesc.match(/Oda No:\s*([^\n]+)/)?.[1].trim() || extractedOda;

        let cleanDescription = rawDesc;
        const index = cleanDescription.indexOf('Açıklamalar:');
        if (index !== -1) {
            cleanDescription = cleanDescription.substring(index + 'Açıklamalar:'.length).trim();
        } else if (cleanDescription.includes('Bilgisayar Adı:')) {
            cleanDescription = '';
        }
        
        setEditForm({
            category: matchedMainCat, subCategory: availableSubs[0] || '', priority: ticket.priority || 'Normal', description: cleanDescription,
            requester: ticket.requester || 'Bilinmeyen Kullanıcı', email: `${(ticket.requester || 'kullanici').toLowerCase().replace(/\s+/g, '')}@tubitak.gov.tr`,
            sicilNo: ticket.sicilNo || '4812', kullaniciDahiliNo: ticket.kullaniciDahiliNo || '3104', computerName: ticket.computerName || 'MAM-1907SV.MAM.GOV.TR', ipNo: ticket.ipNo || '10.9.3.07',
            ulasilacakDahiliNo: extractedDahili, cepTelNo: extractedCep, odaNo: extractedOda,
            attachedFiles: ticket.attachedFiles || [], // Hata logu kalıntısı kaldırıldı, sadece eklenenler görünür
            workLogs: ticket.workLogs || []
        });
        
        setDialogVisible(false);
        setEditDialogVisible(true);
    };

    const handleOpenWorkLogDialog = () => {
        let assignmentDate = new Date();
        if (selectedTicket) {
            const history = selectedTicket.history || [];
            // Kullanıcının işe müdahil olduğu ilk işlemi (en eski kayıt) bul
            const userHistory = history.filter(h => h.user === currentUser.fullName);
            if (userHistory.length > 0) {
                assignmentDate = parseTurkishDate(userHistory[0].date); // Kronolojik olarak [0] ilk kayıttır
            } else {
                assignmentDate = parseTurkishDate(selectedTicket.createdAt); // Bulunamazsa ticket açılış tarihi
            }
        }

        const endDate = new Date(); // Bitiş tarihi her zaman anlık zaman
        const calc = calculateBusinessTime(assignmentDate, endDate);

        setWorkLogForm({
            isDifferentUser: false,
            selectedUser: currentUser,
            startDate: assignmentDate,
            endDate: endDate,
            manualDays: calc.days,
            manualHours: calc.hours,
            manualMins: calc.mins
        });
        setWorkLogDialogVisible(true);
    };

    // Takvimden tarih değiştiğinde hesaplamayı tekrar tetikle
    const onDateChange = (field: 'startDate' | 'endDate', val: Date | null) => {
        setWorkLogForm(prev => {
            const newState = { ...prev, [field]: val };
            if (newState.startDate && newState.endDate) {
                const calc = calculateBusinessTime(newState.startDate, newState.endDate);
                newState.manualDays = calc.days;
                newState.manualHours = calc.hours;
                newState.manualMins = calc.mins;
            }
            return newState;
        });
    };

    const handleAddWorkLog = () => {
        if (!workLogForm.startDate || !workLogForm.endDate) {
            toast.current?.show({ severity: 'warn', summary: 'Uyarı', detail: 'Başlangıç ve bitiş tarihlerini eksiksiz giriniz.', life: 3000 });
            return;
        }
        if (workLogForm.endDate.getTime() <= workLogForm.startDate.getTime()) {
            toast.current?.show({ severity: 'error', summary: 'Hata', detail: 'Bitiş tarihi başlangıç tarihinden sonra olmalıdır.', life: 3000 });
            return;
        }

        // Manuel düzenlenen saati/dakikayı string'e çevir
        const durationParts = [];
        if (workLogForm.manualDays > 0) durationParts.push(`${workLogForm.manualDays} Gün`);
        if (workLogForm.manualHours > 0) durationParts.push(`${workLogForm.manualHours} Saat`);
        if (workLogForm.manualMins > 0) durationParts.push(`${workLogForm.manualMins} Dk`);
        const finalDurationStr = durationParts.join(' ') || '0 Dk';

        const targetUser = workLogForm.isDifferentUser ? workLogForm.selectedUser : currentUser;
        const assignedFullName = targetUser?.fullName || currentUser.fullName;

        const newLog: WorkLog = {
            id: Math.random().toString(36).substring(2, 9),
            fullName: assignedFullName,
            sicilNo: `S-${Math.floor(1000 + Math.random() * 9000)}`,
            startDate: workLogForm.startDate.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            endDate: workLogForm.endDate.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            durationStr: finalDurationStr
        };

        setEditForm(prev => ({ ...prev, workLogs: [...prev.workLogs, newLog] }));
        setWorkLogDialogVisible(false);
        toast.current?.show({ severity: 'success', summary: 'Mesai Eklendi', detail: 'Mesai kaydı listeye eklendi.', life: 2000 });
    };

    const handleSaveEdit = async () => {
        if (!selectedTicket) return;
        const generatedTitle = `[${editForm.category}] ${editForm.subCategory}`;
        const success = await updateTicket(selectedTicket.id, {
            title: generatedTitle, category: `${editForm.category} - ${editForm.subCategory}`, priority: editForm.priority,
            description: editForm.description, ulasilacakDahiliNo: editForm.ulasilacakDahiliNo, cepTelNo: editForm.cepTelNo, odaNo: editForm.odaNo, workLogs: editForm.workLogs
        }, currentUser.fullName);
        if (success) { toast.current?.show({ severity: 'success', summary: 'Kayıt Güncellendi', detail: 'Değişiklikler kaydedildi.', life: 3000 }); setEditDialogVisible(false); }
    };

    const onRowClick = (event: any) => openEditDialog(event.data as Ticket);
    const confirmSave = () => confirmDialog({ message: 'Yapılan değişiklikleri kaydetmek istediğinize emin misiniz?', header: 'Kayıt Onayı', icon: 'pi pi-exclamation-triangle', acceptLabel: 'Evet, Kaydet', rejectLabel: 'İptal', acceptClassName: 'p-button-success', accept: handleSaveEdit });
    const handleRelease = async (ticketId: string) => { await unassignTicket(ticketId); setDialogVisible(false); setEditDialogVisible(false); };
    const confirmRelease = () => { if (!selectedTicket) return; confirmDialog({ message: 'Bu görevi havuza iade etmek istediğinize emin misiniz?', header: 'Havuza Bırakma Onayı', icon: 'pi pi-info-circle', acceptLabel: 'Evet, Bırak', rejectLabel: 'İptal', acceptClassName: 'p-button-danger', accept: () => handleRelease(selectedTicket.id) }); };
    const handleAddFile = () => { const fakeFileName = `ek_belge_${editForm.attachedFiles.length + 1}.pdf`; setEditForm(prev => ({ ...prev, attachedFiles: [...prev.attachedFiles, fakeFileName] })); toast.current?.show({ severity: 'info', summary: 'Dosya Eklendi', detail: `${fakeFileName} eklendi.`, life: 2000 }); };
    const handleAcceptAssignment = async (ticketId: string) => { await respondToAssignment(ticketId, true, currentUser.fullName); setPendingDialogVisible(false); };
    const handleRejectAssignment = async (ticketId: string) => { await respondToAssignment(ticketId, false, currentUser.fullName); setPendingDialogVisible(false); };
    const handleComplete = async (ticketId: string) => { await completeTicket(ticketId); setDialogVisible(false); setEditDialogVisible(false); };
    const handleDelegate = async () => { if (!selectedTicket || !targetTech) return; await assignTicket(selectedTicket.id, targetTech, currentUser.fullName); setDelegateDialogVisible(false); setEditDialogVisible(false); setDialogVisible(false); setTargetTech(''); };

    const actionBodyTemplate = (rowData: Ticket) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button icon="pi pi-search" rounded outlined severity="secondary" tooltip="Önizleme ve Tarihçe" onClick={(e) => { e.stopPropagation(); setSelectedTicket(rowData); setDialogVisible(true); }} />
            {rowData.status === 'İŞLEMDE' && (
                <>
                    <Button icon="pi pi-check" rounded severity="success" tooltip="Tamamlandı Olarak Bildir" onClick={(e) => { e.stopPropagation(); handleComplete(rowData.id); }} />
                    <Button icon="pi pi-times" rounded severity="danger" tooltip="Havuza İade Et" onClick={(e) => { e.stopPropagation(); handleRelease(rowData.id); }} />
                    <Button icon="pi pi-send" rounded severity="help" tooltip="Görevi Devret" onClick={(e) => { e.stopPropagation(); setSelectedTicket(rowData); setDelegateDialogVisible(true); }} />
                </>
            )}
        </div>
    );

    const editModalFooter = (
        <div className="flex flex-wrap justify-content-between align-items-center w-full gap-2 pt-2 border-top-1 surface-border">
            <div className="flex flex-wrap gap-2">
                <Button label="Tarihçe / Detay" icon="pi pi-history" severity="secondary" outlined size="small" onClick={() => { setEditDialogVisible(false); setDialogVisible(true); }} />
                {selectedTicket?.status === 'İŞLEMDE' && (
                    <>
                        <Button label="Havuza Bırak" icon="pi pi-arrow-circle-left" severity="danger" outlined size="small" onClick={confirmRelease} />
                        <Button label="Devret" icon="pi pi-send" severity="help" outlined size="small" onClick={() => setDelegateDialogVisible(true)} />
                    </>
                )}
            </div>
            <div className="flex gap-2">
                <Button label="Değişiklikleri Kaydet" icon="pi pi-check" severity="success" onClick={confirmSave} />
            </div>
        </div>
    );

    return (
        <RoleRouteGuard allowedRoles={['TEKNISYEN', 'ADMIN', 'KOORDINATOR']}>
            <div className="grid">
                <Toast ref={toast} />
                <ConfirmDialog />
                <div className="col-12">
                    <Card title={<div className="flex justify-content-between"><div><div className="text-xl font-bold">Üzerimdeki Aktif Görevler</div></div><Button label="Atama İşlemleri" icon="pi pi-inbox" severity={myPendingTickets.length > 0 ? 'warning' : 'secondary'} badge={myPendingTickets.length > 0 ? myPendingTickets.length.toString() : undefined} badgeClassName="p-badge-danger" onClick={() => setPendingDialogVisible(true)} /></div>}>
                        <DataTable value={filteredTickets} paginator rows={10} responsiveLayout="scroll" emptyMessage="Aktif bir görev bulunmamaktadır." onRowClick={onRowClick} rowClassName={() => 'cursor-pointer hover:surface-hover'}>
                            <Column field="id" header="Kayıt No" style={{ width: '120px' }} />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="category" header="Kategori" style={{ width: '180px' }} />
                            <Column field="priority" header="Aciliyet" style={{ width: '100px' }} />
                            <Column field="requester" header="Talep Sahibi" style={{ width: '180px' }} />
                            <Column field="status" header="Durum" style={{ width: '140px' }} body={(r: Ticket) => <Tag value={r.status} severity={getStatusSeverity(r.status)} />} />
                            <Column header="İşlemler" body={actionBodyTemplate} style={{ width: '200px' }} />
                        </DataTable>
                    </Card>
                </div>

                {/* DÜZENLEME PANELİ */}
                <Dialog header="Talep Yönetim & Düzenleme" visible={editDialogVisible} style={{ width: '850px', maxWidth: '95vw' }} dismissableMask footer={editModalFooter} onHide={() => setEditDialogVisible(false)}>
                    <div className="flex flex-column gap-3 py-2">
                        <div className="surface-card p-3 border-round border-1 surface-border">
                            <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">TALEP EDEN BİLGİLERİ</span>
                            <div className="grid grid-nogutter gap-3">
                                <div className="col-12 md:col-3"><small className="text-500 block mb-1">Adı Soyadı</small><div className="text-900 font-medium">{editForm.requester}</div></div>
                                <div className="col-12 md:col-2"><small className="text-500 block mb-1">Sicil No</small><div className="text-900 font-medium">{editForm.sicilNo}</div></div>
                                <div className="col-12 md:col-2"><small className="text-500 block mb-1">Dahili No</small><div className="text-900 font-medium">{editForm.kullaniciDahiliNo}</div></div>
                                <div className="col-12 md:col-4"><small className="text-500 block mb-1">E-Posta Adresi</small><div className="text-900 font-medium truncate">{editForm.email}</div></div>
                            </div>
                        </div>

                        <div className="surface-card p-3 border-round border-1 surface-border">
                            <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">KATEGORİLER</span>
                            <div className="grid">
                                <div className="col-12 md:col-5">
                                    <label className="text-sm font-semibold text-700 block mb-1">Ana Talep Grubu</label>
                                    <Dropdown value={editForm.category} options={mainCategoryOptions} onChange={(e) => { const newCat = e.value; const defaultSub = categoryTree[newCat]?.[0] || ''; setEditForm({ ...editForm, category: newCat, subCategory: defaultSub }); }} className="w-full" />
                                </div>
                                <div className="col-12 md:col-4">
                                    <label className="text-sm font-semibold text-700 block mb-1">Alt Kategoriler</label>
                                    <Dropdown value={editForm.subCategory} options={(categoryTree[editForm.category] || []).map(s => ({ label: s, value: s }))} onChange={(e) => setEditForm({ ...editForm, subCategory: e.value })} className="w-full" />
                                </div>
                                <div className="col-12 md:col-3">
                                    <label className="text-sm font-semibold text-700 block mb-1">Öncelik / Aciliyet</label>
                                    <Dropdown value={editForm.priority} options={priorityOptions} onChange={(e) => setEditForm({ ...editForm, priority: e.value })} className="w-full" />
                                </div>
                            </div>
                        </div>

                        <div className="surface-card p-3 border-round border-1 surface-border">
                            <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">TALEP BİLGİLERİ</span>
                            <div className="grid formgrid p-fluid">
                                <div className="field col-12 md:col-3"><label className="text-sm font-semibold text-700">Bilgisayar Adı</label><InputText value={editForm.computerName} disabled /></div>
                                <div className="field col-12 md:col-3"><label className="text-sm font-semibold text-700">IP Numarası</label><InputText value={editForm.ipNo} disabled /></div>
                                <div className="field col-12 md:col-2"><label className="text-sm font-semibold text-700">Ulaşılacak Dahili</label><InputText value={editForm.ulasilacakDahiliNo} onChange={(e) => setEditForm({ ...editForm, ulasilacakDahiliNo: e.target.value })} /></div>
                                <div className="field col-12 md:col-2"><label className="text-sm font-semibold text-700">Cep Tel No</label><InputText value={editForm.cepTelNo} onChange={(e) => setEditForm({ ...editForm, cepTelNo: e.target.value })} /></div>
                                <div className="field col-12 md:col-2"><label className="text-sm font-semibold text-700">Oda No</label><InputText value={editForm.odaNo} onChange={(e) => setEditForm({ ...editForm, odaNo: e.target.value })} /></div>
                            </div>
                            <label className="text-sm font-semibold text-700 block mt-2 mb-2">Talebe İlişkin Açıklamalar</label>
                            <InputTextarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={4} autoResize className="w-full mb-3" />
                            <div className="flex flex-wrap align-items-center justify-content-between p-2 border-round surface-ground gap-2">
                                <div className="flex align-items-center gap-2"><Button label="Dosya Ekle" icon="pi pi-plus" size="small" severity="info" onClick={handleAddFile} /><span className="text-xs text-500">* Maksimum 30 MB</span></div>
                                <div className="flex flex-wrap gap-1">{editForm.attachedFiles.map((f, i) => <Tag key={i} icon="pi pi-file" value={f} severity="info" className="text-xs" />)}</div>
                            </div>
                        </div>

                        {/* 4. MESAİ KAYITLARI */}
                        <div className="surface-card p-3 border-round border-1 surface-border">
                            <div className="flex justify-content-between align-items-center mb-3">
                                <span className="text-xs font-bold text-600 uppercase tracking-wider text-primary">MESAİ / ÇALIŞMA SÜRESİ KAYITLARI</span>
                                <Button label="Mesai Ekle" icon="pi pi-plus" size="small" severity="secondary" outlined onClick={handleOpenWorkLogDialog} />
                            </div>
                            <DataTable value={editForm.workLogs} emptyMessage="Henüz bir mesai kaydı bulunmamaktadır." size="small" className="p-datatable-sm" responsiveLayout="scroll">
                                <Column field="fullName" header="Ad Soyad" style={{ width: '22%' }} />
                                <Column field="sicilNo" header="Sicil No" style={{ width: '18%' }} />
                                <Column field="startDate" header="Başlangıç Tarihi" style={{ width: '20%' }} />
                                <Column field="endDate" header="Bitiş Tarihi" style={{ width: '20%' }} />
                                <Column field="durationStr" header="Mesai Süresi" style={{ width: '20%' }} body={(r: WorkLog) => <span className="font-semibold text-primary">{r.durationStr}</span>} />
                            </DataTable>
                        </div>
                    </div>
                </Dialog>

                {/* YENİ: MESAİ KAYDI EKLEME ALT MODALI (DÜZENLENEBİLİR ALANLAR) */}
                <Dialog header="Mesai / Çalışma Kaydı Ekle" visible={workLogDialogVisible} style={{ width: '480px' }} dismissableMask onHide={() => setWorkLogDialogVisible(false)}>
                    <div className="flex flex-column gap-3 p-fluid mt-2">
                        <div className="flex align-items-center gap-2">
                            <Checkbox inputId="diffUser" checked={workLogForm.isDifferentUser} onChange={(e) => setWorkLogForm(p => ({ ...p, isDifferentUser: e.checked ?? false }))} />
                            <label htmlFor="diffUser" className="text-sm font-medium cursor-pointer">Başka bir personel adına ekle</label>
                        </div>
                        
                        {workLogForm.isDifferentUser ? (
                            <div>
                                <label className="font-semibold block mb-1">Personel Seçimi</label>
                                <Dropdown value={workLogForm.selectedUser} options={eligibleTechnicians} optionLabel="fullName" onChange={(e) => setWorkLogForm(p => ({ ...p, selectedUser: e.value }))} placeholder="Personel Seçin" />
                            </div>
                        ) : (
                            <div><label className="font-semibold block mb-1">Personel</label><InputText value={currentUser.fullName} disabled /></div>
                        )}

                        <div className="grid">
                            <div className="col-12 md:col-6">
                                <label className="font-semibold block mb-1 text-sm">Başlangıç (İşi Alma Anı)</label>
                                <Calendar value={workLogForm.startDate} onChange={(e) => onDateChange('startDate', e.value as Date)} showTime hourFormat="24" showIcon />
                            </div>
                            <div className="col-12 md:col-6">
                                <label className="font-semibold block mb-1 text-sm">Bitiş (Şu An)</label>
                                <Calendar value={workLogForm.endDate} onChange={(e) => onDateChange('endDate', e.value as Date)} showTime hourFormat="24" showIcon />
                            </div>
                        </div>

                        {/* Düzenlenebilir Mesai Süresi Çıktıları */}
                        <div className="surface-ground p-3 border-round mt-2">
                            <label className="font-bold block mb-2 text-sm text-700">Hesaplanan Çalışma Süresi (Düzenlenebilir)</label>
                            <div className="grid formgrid p-fluid">
                                <div className="field col-4 mb-0">
                                    <label className="text-xs text-500">Gün</label>
                                    <InputNumber value={workLogForm.manualDays} onValueChange={(e) => setWorkLogForm(p => ({ ...p, manualDays: e.value || 0 }))} showButtons min={0} />
                                </div>
                                <div className="field col-4 mb-0">
                                    <label className="text-xs text-500">Saat</label>
                                    <InputNumber value={workLogForm.manualHours} onValueChange={(e) => setWorkLogForm(p => ({ ...p, manualHours: e.value || 0 }))} showButtons min={0} />
                                </div>
                                <div className="field col-4 mb-0">
                                    <label className="text-xs text-500">Dakika</label>
                                    <InputNumber value={workLogForm.manualMins} onValueChange={(e) => setWorkLogForm(p => ({ ...p, manualMins: e.value || 0 }))} showButtons min={0} max={59} />
                                </div>
                            </div>
                            <small className="text-400 block mt-2">* Hesaplama, hafta içi mesai saatlerini (08:00 - 17:00) kapsar. Gerekirse alanları manuel revize edebilirsiniz.</small>
                        </div>

                        <div className="flex justify-content-end gap-2 mt-2">
                            <Button label="İptal" severity="secondary" onClick={() => setWorkLogDialogVisible(false)} />
                            <Button label="Listeye Ekle" severity="success" icon="pi pi-plus" onClick={handleAddWorkLog} />
                        </div>
                    </div>
                </Dialog>

                {/* DİĞER EKRANLAR (Büyüteç, Atama Kutusu vb.) */}
                <Dialog header={`Görev Süreç Tarihçesi - ${selectedTicket?.id}`} visible={dialogVisible} style={{ width: '650px' }} dismissableMask footer={<div className="flex justify-content-end w-full pt-2"><Button label="Kapat" icon="pi pi-times" severity="secondary" onClick={() => setDialogVisible(false)} /></div>} onHide={() => setDialogVisible(false)}>
                    {selectedTicket && (
                        <div className="flex flex-column gap-4">
                            <div className="surface-ground p-3 border-round">
                                <div className="flex justify-content-between align-items-center mb-2"><span className="font-bold text-lg">{selectedTicket.title}</span><Tag value={selectedTicket.priority} severity={selectedTicket.priority === 'Kritik' ? 'danger' : 'info'} /></div>
                                <p className="m-0 text-700 font-sans text-sm mb-2">{selectedTicket.description}</p>
                                <div className="text-xs text-500"><strong>Talep Sahibi:</strong> {selectedTicket.requester}</div>
                            </div>
                            <div><h6 className="font-bold mb-3">Süreç Tarihçesi</h6><Timeline value={selectedTicket.history} opposite={(item) => <small className="text-500">{item.date}</small>} content={(item) => (<div className="mb-2"><div className="font-bold text-sm">{item.action}</div><small className="text-500">İşlem Yapan: {item.user}</small></div>)} /></div>
                        </div>
                    )}
                </Dialog>
                
                <Dialog header="Onayınızı Bekleyen Atamalar" visible={pendingDialogVisible} style={{ width: '800px' }} dismissableMask onHide={() => setPendingDialogVisible(false)}>
                    {myPendingTickets.length > 0 ? (
                        <DataTable value={myPendingTickets} responsiveLayout="scroll">
                            <Column field="id" header="Kayıt No" />
                            <Column field="title" header="Talep Başlığı" />
                            <Column field="delegatedBy" header="Atayan / Yönlendiren" />
                            <Column header="İşlem" body={(r) => (<div className="flex gap-2"><Button label="Kabul Et" icon="pi pi-check" size="small" severity="success" onClick={() => handleAcceptAssignment(r.id)} /><Button label="Reddet" icon="pi pi-times" size="small" severity="danger" outlined onClick={() => handleRejectAssignment(r.id)} /></div>)} />
                        </DataTable>
                    ) : <Message severity="info" text="Onay bekleyen görev yok." className="w-full" />}
                </Dialog>

                <Dialog header="Görevi Başka Bir Personele Yönlendir" visible={delegateDialogVisible} style={{ width: '450px' }} dismissableMask onHide={() => { setDelegateDialogVisible(false); setTargetTech(''); }}>
                    <div className="p-fluid">
                        {!availableDelegates.length ? <Message severity="warn" text="Yönlendirilecek personel bulunamadı." /> : <><label className="font-bold mb-2 block">Personel Seçimi</label><Dropdown value={targetTech} options={availableDelegates} optionLabel="fullName" optionValue="fullName" onChange={(e) => setTargetTech(e.value)} placeholder="Seçiniz..." /></>}
                        <div className="flex justify-content-end gap-2 mt-3"><Button label="İptal" severity="secondary" onClick={() => setDelegateDialogVisible(false)} /><Button label="Gönder" severity="help" icon="pi pi-send" onClick={handleDelegate} disabled={!targetTech} /></div>
                    </div>
                </Dialog>
            </div>
        </RoleRouteGuard>
    );
};

export default UzmanAktifGorevlerPage;