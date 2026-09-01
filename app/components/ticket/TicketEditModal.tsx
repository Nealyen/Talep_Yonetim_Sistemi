import React, { useEffect, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Ticket, WorkLog } from '@/layout/context/TicketContext';

export interface TicketEditModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onHide: () => void;
  onSave: (updatedData: Partial<Ticket>) => void;
  footer?: React.ReactNode;
  onOpenWorkLog?: () => void;
}

interface EditFormState {
  category: string;
  subCategory: string;
  priority: Ticket['priority'];
  description: string;
  requester: string;
  email: string;
  sicilNo: string;
  barkodNo: string;
  kullaniciDahiliNo: string;
  computerName: string;
  ipNo: string;
  ulasilacakDahiliNo: string;
  cepTelNo: string;
  odaNo: string;
  attachedFiles: string[];
  workLogs: WorkLog[];
}

const categoryTree: Record<string, string[]> = {
  'AĞ / İNTERNET': ['İnternet Erişimi & Filtre', 'VPN Bağlantısı', 'Wi-Fi / Kablosuz Ağ', 'IP / Port Talebi'],
  'DONANIM / ÇEVRE BİRİMLERİ': ['Kasa / Monitör Arızası', 'Klavye / Mouse Değişimi', 'RAM / Disk Arızası', 'Donanım Temini'],
  'YAZILIM / İŞLETİM SİSTEMİ': ['İşletim Sistemi Hatası', 'Ofis / Lisans Programları', 'Kurumsal Portal / Web', 'Yazılım Kurulumu'],
  'YAZICI / TARAYICI': ['Toner Değişimi', 'Ağ Yazıcısı Tanımlama', 'Donanım / Kağıt Sıkışması'],
  'E-POSTA / HESAP': ['Şifre Sıfırlama', 'Yeni Hesap Açılışı', 'E-posta Kota Artırımı', 'Yetkilendirme'],
};

const mainCategoryOptions = Object.keys(categoryTree).map((key) => ({ label: key, value: key }));
const priorityOptions: Ticket['priority'][] = ['Düşük', 'Normal', 'Yüksek', 'Kritik'];

const createInitialForm = (ticket: Ticket | null): EditFormState => {
  const category = ticket?.category || 'AĞ / İNTERNET';
  const matchedMainCat = Object.keys(categoryTree).find((key) => category.toUpperCase().includes(key.split(' ')[0])) || 'AĞ / İNTERNET';
  const availableSubs = categoryTree[matchedMainCat] || [];

  return {
    category: matchedMainCat,
    subCategory: availableSubs[0] || '',
    priority: ticket?.priority || 'Normal',
    description: ticket?.description || '',
    requester: ticket?.requester || 'Bilinmeyen Kullanıcı',
    email: `${(ticket?.requester || 'kullanici').toLowerCase().replace(/\s+/g, '')}@tubitak.gov.tr`,
    sicilNo: ticket?.sicilNo || '4812',
    barkodNo: ticket?.barkodNo || '',
    kullaniciDahiliNo: ticket?.kullaniciDahiliNo || '3104',
    computerName: ticket?.computerName || 'MAM-1907SV.MAM.GOV.TR',
    ipNo: ticket?.ipNo || '10.9.3.07',
    ulasilacakDahiliNo: ticket?.ulasilacakDahiliNo || '',
    cepTelNo: ticket?.cepTelNo || '',
    odaNo: ticket?.odaNo || '',
    attachedFiles: ticket?.attachedFiles || [],
    workLogs: ticket?.workLogs || [],
  };
};

export const TicketEditModal = ({ visible, ticket, onHide, onSave, footer, onOpenWorkLog }: TicketEditModalProps) => {
  const [editForm, setEditForm] = useState<EditFormState>(createInitialForm(ticket));

  useEffect(() => {
    if (!ticket) {
      setEditForm(createInitialForm(null));
      return;
    }

    const baseForm = createInitialForm(ticket);
    const rawDescription = ticket.description || '';

    let extractedDahili = ticket.ulasilacakDahiliNo || '';
    let extractedCep = ticket.cepTelNo || '';
    let extractedOda = ticket.odaNo || '';

    if (rawDescription.includes('Ulaşılacak Dahili:')) {
      extractedDahili = rawDescription.match(/Ulaşılacak Dahili:\s*([^\n]+)/)?.[1].trim() || extractedDahili;
    }
    if (rawDescription.includes('Cep Tel:')) {
      extractedCep = rawDescription.match(/Cep Tel:\s*([^\n]+)/)?.[1].trim() || extractedCep;
    }
    if (rawDescription.includes('Oda No:')) {
      extractedOda = rawDescription.match(/Oda No:\s*([^\n]+)/)?.[1].trim() || extractedOda;
    }

    let cleanDescription = rawDescription;
    const index = cleanDescription.indexOf('Açıklamalar:');
    if (index !== -1) {
      cleanDescription = cleanDescription.substring(index + 'Açıklamalar:'.length).trim();
    } else if (cleanDescription.includes('Bilgisayar Adı:')) {
      cleanDescription = '';
    }

    setEditForm({
      ...baseForm,
      description: cleanDescription,
      ulasilacakDahiliNo: extractedDahili,
      cepTelNo: extractedCep,
      odaNo: extractedOda,
      workLogs: ticket.workLogs || [],
      attachedFiles: ticket.attachedFiles || [],
    });
  }, [ticket, visible]);

  const shouldShowBarkodNo = /YAZICI|DONANIM/i.test(editForm.category || '');

  const handleSave = () => {
    const partialUpdate: Partial<Ticket> = {
      category: editForm.category,
      priority: editForm.priority,
      requester: editForm.requester,
      description: editForm.description,
      sicilNo: editForm.sicilNo,
      barkodNo: editForm.barkodNo,
      kullaniciDahiliNo: editForm.kullaniciDahiliNo,
      computerName: editForm.computerName,
      ipNo: editForm.ipNo,
      ulasilacakDahiliNo: editForm.ulasilacakDahiliNo,
      cepTelNo: editForm.cepTelNo,
      odaNo: editForm.odaNo,
      attachedFiles: editForm.attachedFiles,
      workLogs: editForm.workLogs,
    };

    onSave(partialUpdate);
  };

  return (
    <Dialog
      header="Talep Yönetim & Düzenleme"
      visible={visible}
      style={{ width: '850px', maxWidth: '95vw' }}
      dismissableMask
      footer={footer ?? (
        <div className="flex justify-content-end gap-2">
          <Button label="İptal" severity="secondary" onClick={onHide} />
          <Button label="Kaydet" severity="success" icon="pi pi-save" onClick={handleSave} />
        </div>
      )}
      onHide={onHide}
    >
      <div className="flex flex-column gap-3 py-2">
        <div className="surface-card p-3 border-round border-1 surface-border">
          <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">TALEP EDEN BİLGİLERİ</span>
          <div className="grid grid-nogutter gap-3">
            <div className="col-12 md:col-3">
              <small className="text-500 block mb-1">Adı Soyadı</small>
              <div className="text-900 font-medium">{editForm.requester}</div>
            </div>
            <div className="col-12 md:col-2">
              <small className="text-500 block mb-1">Sicil No</small>
              <div className="text-900 font-medium">{editForm.sicilNo}</div>
            </div>
            <div className="col-12 md:col-2">
              <small className="text-500 block mb-1">Dahili No</small>
              <div className="text-900 font-medium">{editForm.kullaniciDahiliNo}</div>
            </div>
            <div className="col-12 md:col-4">
              <small className="text-500 block mb-1">E-Posta Adresi</small>
              <div className="text-900 font-medium truncate">{editForm.email}</div>
            </div>
          </div>
        </div>

        <div className="surface-card p-3 border-round border-1 surface-border">
          <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">KATEGORİLER</span>
          <div className="grid">
            <div className="col-12 md:col-5">
              <label className="text-sm font-semibold text-700 block mb-1">Ana Talep Grubu</label>
              <Dropdown
                value={editForm.category}
                options={mainCategoryOptions}
                onChange={(e) => {
                  const newCategory = e.value;
                  const defaultSub = categoryTree[newCategory]?.[0] || '';
                  setEditForm((prev) => ({ ...prev, category: newCategory, subCategory: defaultSub }));
                }}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-4">
              <label className="text-sm font-semibold text-700 block mb-1">Alt Kategoriler</label>
              <Dropdown
                value={editForm.subCategory}
                options={(categoryTree[editForm.category] || []).map((item) => ({ label: item, value: item }))}
                onChange={(e) => setEditForm((prev) => ({ ...prev, subCategory: e.value }))}
                className="w-full"
              />
            </div>
            <div className="col-12 md:col-3">
              <label className="text-sm font-semibold text-700 block mb-1">Öncelik / Aciliyet</label>
              <Dropdown
                value={editForm.priority}
                options={priorityOptions}
                onChange={(e) => setEditForm((prev) => ({ ...prev, priority: e.value }))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="surface-card p-3 border-round border-1 surface-border">
          <span className="text-xs font-bold text-600 uppercase tracking-wider block mb-3 text-primary">TALEP BİLGİLERİ</span>
          <div className="grid formgrid p-fluid">
            <div className="field col-12 md:col-3">
              <label className="text-sm font-semibold text-700">Bilgisayar Adı</label>
              <InputText value={editForm.computerName} disabled />
            </div>
            <div className="field col-12 md:col-3">
              <label className="text-sm font-semibold text-700">IP Numarası</label>
              <InputText value={editForm.ipNo} disabled />
            </div>
            <div className="field col-12 md:col-2">
              <label className="text-sm font-semibold text-700">Ulaşılacak Dahili</label>
              <InputText
                value={editForm.ulasilacakDahiliNo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, ulasilacakDahiliNo: e.target.value }))}
              />
            </div>
            {shouldShowBarkodNo && (
              <div className="field col-12 md:col-2">
                <label className="text-sm font-semibold text-700">Cihaz Barkod No</label>
                <InputText
                  value={editForm.barkodNo}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, barkodNo: e.target.value }))}
                />
              </div>
            )}
            <div className="field col-12 md:col-2">
              <label className="text-sm font-semibold text-700">Cep Tel No</label>
              <InputText
                value={editForm.cepTelNo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, cepTelNo: e.target.value }))}
              />
            </div>
            <div className="field col-12 md:col-2">
              <label className="text-sm font-semibold text-700">Oda No</label>
              <InputText
                value={editForm.odaNo}
                onChange={(e) => setEditForm((prev) => ({ ...prev, odaNo: e.target.value }))}
              />
            </div>
          </div>

          <label className="text-sm font-semibold text-700 block mt-2 mb-2">Talebe İlişkin Açıklamalar</label>
          <InputTextarea
            value={editForm.description}
            onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
            rows={4}
            autoResize
            className="w-full mb-3"
          />

          <div className="flex flex-wrap align-items-center justify-content-between p-2 border-round surface-ground gap-2">
            <div className="flex align-items-center gap-2">
              <Button label="Dosya Ekle" icon="pi pi-plus" size="small" severity="info" />
              <span className="text-xs text-500">* Maksimum 30 MB</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {editForm.attachedFiles.map((file, index) => (
                <Tag key={`${file}-${index}`} icon="pi pi-file" value={file} severity="info" className="text-xs" />
              ))}
            </div>
          </div>
        </div>

        <div className="surface-card p-3 border-round border-1 surface-border">
          <div className="flex justify-content-between align-items-center mb-3">
            <span className="text-xs font-bold text-600 uppercase tracking-wider text-primary">MESAİ / ÇALIŞMA SÜRESİ KAYITLARI</span>
            <Button label="Mesai Ekle" icon="pi pi-plus" size="small" severity="secondary" outlined onClick={onOpenWorkLog} />
          </div>

          <DataTable value={editForm.workLogs} emptyMessage="Henüz bir mesai kaydı bulunmamaktadır." size="small" className="p-datatable-sm" responsiveLayout="scroll">
            <Column field="fullName" header="Ad Soyad" style={{ width: '22%' }} />
            <Column field="sicilNo" header="Sicil No" style={{ width: '18%' }} />
            <Column field="startDate" header="Başlangıç Tarihi" style={{ width: '20%' }} />
            <Column field="endDate" header="Bitiş Tarihi" style={{ width: '20%' }} />
            <Column
              field="durationStr"
              header="Mesai Süresi"
              style={{ width: '20%' }}
              body={(row: WorkLog) => <span className="font-semibold text-primary">{row.durationStr}</span>}
            />
          </DataTable>
        </div>
      </div>
    </Dialog>
  );
};

export default TicketEditModal;
