import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import { Ticket, WorkLog } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { CATEGORY_DATA, BARCODE_OPTIONS } from '@/constants/newTicketOptions';
import TicketWorkLogModal from '@/app/components/ticket/TicketWorkLogModal';

export interface TicketEditModalProps {
  visible: boolean;
  ticket: Ticket | null;
  onHide: () => void;
  onSave: (updatedData: Partial<Ticket>) => void;
  footer?: React.ReactNode;
}

// KURAL: Bazı sayfalar (örn. uzman-aktif-gorevler) kendi özel footer'ını (ör. "Havuza
// Bırak", "Devret" butonlarıyla birlikte) geçiriyor ve modalın kendi dahili "Kaydet"
// butonunu göstermiyor. O sayfalarda kaydetmeyi tetiklemek için dışarıdan çağrılabilen
// bu handle kullanılıyor — aksi halde dışarıdaki "Değişiklikleri Kaydet" butonu formdaki
// gerçek verilere hiç erişemez ve hiçbir şey kaydedilmez.
export interface TicketEditModalHandle {
  triggerSave: () => void;
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

// KURAL: Kategori ağacı artık burada ayrıca tanımlanmıyor. "Yeni Talep" formuyla
// (useNewTicketForm.ts) AYNI kaynak olan constants/newTicketOptions.ts -> CATEGORY_DATA
// kullanılıyor. Böylece düzenleme sayfası, talep oluşturma sayfasındaki 12 ana kategori
// ve alt kategorileriyle her zaman birebir uyumlu kalır; iki ayrı/eksik liste sorunu ortadan kalkar.
const categoryTree = CATEGORY_DATA;

const mainCategoryOptions = Object.keys(categoryTree).map((key) => ({ label: key, value: key }));
const priorityOptions: Ticket['priority'][] = ['Düşük', 'Normal', 'Yüksek', 'Kritik'];

const createInitialForm = (ticket: Ticket | null): EditFormState => {
  const defaultCategory = Object.keys(categoryTree)[0] || '';

  // KURAL: "Yeni Talep" formunda seçilen gerçek kategori VE alt kategori
  // ticket.category alanına değil, talep başlığının başına
  // `[KATEGORI] AltKategori` biçiminde yazılıyor (bkz. useNewTicketForm.ts).
  // ticket.category her zaman sadece 4 genel kategoriden birine ("Donanım/Arıza" vb.)
  // sıkıştırılmış durumda olduğundan güvenilir değildir — bu yüzden asıl kategori ve
  // alt kategoriyi önce başlıktan okumayı deniyoruz.
  const titleBracketMatch = ticket?.title?.match(/^\[([^\]]+)\]\s*(.*)$/);
  const rawCategory = (titleBracketMatch?.[1] || ticket?.category || defaultCategory).trim();
  const rawSubCategory = (titleBracketMatch?.[2] || '').trim();

  const matchedMainCat =
    Object.keys(categoryTree).find((key) => key.toUpperCase() === rawCategory.toUpperCase()) || defaultCategory;
  const availableSubs = categoryTree[matchedMainCat] || [];
  const matchedSubCat = availableSubs.find((sub) => sub === rawSubCategory) || availableSubs[0] || '';

  return {
    category: matchedMainCat,
    subCategory: matchedSubCat,
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

export const TicketEditModal = forwardRef<TicketEditModalHandle, TicketEditModalProps>(({ visible, ticket, onHide, onSave, footer }, ref) => {
  const { currentUser, users } = useUser();
  // KURAL: Mesai kaydı eklerken/düzenlerken personel listesi ve "kimin adına"
  // sorusu için ihtiyaç duyulan bilgiler; sayfa bazında ayrıca prop geçmeye
  // gerek kalmasın diye modal doğrudan UserContext'ten okuyor.
  const eligibleTechnicians = users.filter((u) => u.role === 'TEKNISYEN' || u.role === 'ADMIN' || u.role === 'KOORDINATOR');

  const [editForm, setEditForm] = useState<EditFormState>(createInitialForm(ticket));
  // Yazdırma öncesi "kaydedilmemiş değişiklik var mı" kontrolü için son kaydedilen/yüklenen halin anlık görüntüsü
  const [savedSnapshot, setSavedSnapshot] = useState<string>('');
  const [showUnsavedPrintWarning, setShowUnsavedPrintWarning] = useState(false);

  useEffect(() => {
    if (!ticket) {
      const emptyForm = createInitialForm(null);
      setEditForm(emptyForm);
      setSavedSnapshot(JSON.stringify(emptyForm));
      setShowUnsavedPrintWarning(false);
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

    const nextForm: EditFormState = {
      ...baseForm,
      description: cleanDescription,
      ulasilacakDahiliNo: extractedDahili,
      cepTelNo: extractedCep,
      odaNo: extractedOda,
      workLogs: ticket.workLogs || [],
      attachedFiles: ticket.attachedFiles || [],
    };

    // Form yüklendiği/dialog açıldığı an, bu hali "kaydedilmiş/temiz" durum olarak
    // aynı anda işaretliyoruz — ayrı bir effect'te yapılırsa bir render gecikmesi
    // yüzünden dialog her açıldığında yanlışlıkla "kaydedilmedi" uyarısı tetiklenir.
    setEditForm(nextForm);
    setSavedSnapshot(JSON.stringify(nextForm));
    setShowUnsavedPrintWarning(false);
  }, [ticket, visible]);

  const isDirty = JSON.stringify(editForm) !== savedSnapshot;

  const shouldShowBarkodNo = /YAZICI/i.test(editForm.category || '');

  // KURAL: "Yeni Talep" formu (useNewTicketForm.ts) gerçek kategoriyi ticket.category'ye
  // değil başlığa yazıyor; ticket.category alanına HER ZAMAN şu 4 genel değerden biri
  // gidiyor (süreç-takibi sayfası ve uzman atama mantığı bu 4 değeri bekliyor).
  // Burada kaydederken de aynı kuralı uyguluyoruz; aksi halde kaydettiğimiz an
  // ticket.category'yi gerçek (12'li) kategoriyle ezip süreç-takibi filtrelerini kırarız.
  const LEGACY_CATEGORY_BUCKETS = ['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik'] as const;
  const toLegacyCategoryBucket = (realCategory: string): Ticket['category'] =>
    (LEGACY_CATEGORY_BUCKETS as readonly string[]).includes(realCategory) ? (realCategory as Ticket['category']) : 'Donanım/Arıza';

  const handleSave = () => {
    // KURAL: Gerçek kategori/alt kategori başlıktaki `[KATEGORI] AltKategori` önekinden
    // okunduğu için, kullanıcı düzenleme ekranında kategoriyi değiştirirse bu değişikliğin
    // kalıcı olması adına başlığı da güncelliyoruz — ama SADECE ticket zaten bu önekle
    // oluşturulmuşsa (yani "Yeni Talep" formundan gelmişse). Eski/önekesiz başlıklara
    // dokunmuyoruz ki farklı bir görünüm/rapor mantığını bozmayalım.
    const hadBracketTitle = /^\[([^\]]+)\]/.test(ticket?.title || '');
    const titleRest = (ticket?.title || '').replace(/^\[([^\]]+)\]\s*/, '');
    const updatedTitle = hadBracketTitle ? `[${editForm.category}] ${editForm.subCategory || titleRest}` : ticket?.title;

    const partialUpdate: Partial<Ticket> = {
      title: updatedTitle,
      category: toLegacyCategoryBucket(editForm.category),
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

    // Kaydet'e basıldığı an bu hali "temiz" (kaydedilmiş) kabul ediyoruz;
    // böylece Yazdır butonu artık engellenmez.
    setSavedSnapshot(JSON.stringify(editForm));
    setShowUnsavedPrintWarning(false);
    onSave(partialUpdate);
  };

  useImperativeHandle(ref, () => ({
    triggerSave: handleSave,
  }));

  // KURAL: Mesai onay mekanizması tamamen kaldırıldı. "Mesai Ekle" artık ayrı bir
  // sayfaya/hook'a bağımlı değil; bu modalın kendi içinde yönetiliyor. Eklenen/
  // düzenlenen/silinen kayıtlar SADECE editForm.workLogs (yerel form state) üzerinde
  // değişir — hiçbir şey context'e/localStorage'a hemen yazılmaz. Kalıcı olması için
  // kullanıcının ana "Kaydet" butonuna basması gerekir (handleSave zaten
  // editForm.workLogs'u partialUpdate içine koyuyor).
  const [workLogModalVisible, setWorkLogModalVisible] = useState(false);
  const [editingWorkLog, setEditingWorkLog] = useState<WorkLog | null>(null);
  const [pendingDeleteLogId, setPendingDeleteLogId] = useState<string | null>(null);

  const openAddWorkLog = () => {
    setEditingWorkLog(null);
    setWorkLogModalVisible(true);
  };

  const openEditWorkLog = (log: WorkLog) => {
    setEditingWorkLog(log);
    setWorkLogModalVisible(true);
  };

  const handleWorkLogSave = (log: WorkLog) => {
    setEditForm((prev) => {
      const exists = prev.workLogs.some((item) => item.id === log.id);
      const nextWorkLogs = exists ? prev.workLogs.map((item) => (item.id === log.id ? log : item)) : [...prev.workLogs, log];
      return { ...prev, workLogs: nextWorkLogs };
    });
    setWorkLogModalVisible(false);
    setEditingWorkLog(null);
  };

  const requestDeleteWorkLog = (log: WorkLog) => setPendingDeleteLogId(log.id);
  const cancelDeleteWorkLog = () => setPendingDeleteLogId(null);
  const confirmDeleteWorkLog = () => {
    setEditForm((prev) => ({ ...prev, workLogs: prev.workLogs.filter((item) => item.id !== pendingDeleteLogId) }));
    setPendingDeleteLogId(null);
  };

  const handlePrintClick = () => {
    if (isDirty) {
      setShowUnsavedPrintWarning(true);
      return;
    }
    window.print();
  };

  // KURAL: Pencereyi kapatırken (İptal, X, dışarı tıklama veya ESC) kaydedilmemiş
  // değişiklik varsa doğrudan kapatmak yerine önce onay istiyoruz. Önceden "isDirty"
  // sadece Yazdır butonunda kontrol ediliyordu; kapatma tamamen kontrolsüzdü ve
  // yapılan hiçbir uyarı olmadan sessizce kayboluyordu.
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const requestClose = () => {
    if (isDirty) {
      setShowExitConfirm(true);
      return;
    }
    onHide();
  };

  const discardAndClose = () => {
    setShowExitConfirm(false);
    onHide();
  };

  return (
    <>
    <Dialog
      header={
        <div className="flex align-items-center justify-content-between pr-4">
          <span>Talep Yönetim & Düzenleme</span>
          <Button
            label="Yazdır"
            icon="pi pi-print"
            size="small"
            severity="secondary"
            outlined
            onClick={handlePrintClick}
          />
        </div>
      }
      visible={visible}
      style={{ width: '1100px', maxWidth: '95vw' }}
      dismissableMask
      footer={footer ?? (
        <div className="flex justify-content-end gap-2">
          <Button label="İptal" severity="secondary" onClick={requestClose} />
          <Button label="Kaydet" severity="success" icon="pi pi-save" onClick={handleSave} />
        </div>
      )}
      onHide={requestClose}
    >
      <div className="flex flex-column gap-3 py-2">
        {showUnsavedPrintWarning && isDirty && (
          <Message
            severity="warn"
            className="w-full"
            text="Değişiklikleriniz henüz kaydedilmedi. Çıktı alabilmek için önce aşağıdaki 'Kaydet' butonuyla değişiklikleri kaydedin ya da 'İptal' ile vazgeçin."
          />
        )}
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
            <div className="field col-12 md:col-4">
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
              <div className="field col-12 md:col-3">
                <label className="text-sm font-semibold text-700">Cihaz Barkod No</label>
                <Dropdown
                  value={editForm.barkodNo}
                  options={BARCODE_OPTIONS}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, barkodNo: e.value }))}
                  placeholder="Barkod Seçiniz"
                  filter
                  showClear
                  className="w-full"
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
            <Button label="Mesai Ekle" icon="pi pi-plus" size="small" severity="secondary" outlined onClick={openAddWorkLog} />
          </div>

          <DataTable value={editForm.workLogs} emptyMessage="Henüz bir mesai kaydı bulunmamaktadır." size="small" className="p-datatable-sm" responsiveLayout="scroll">
            <Column field="fullName" header="Ad Soyad" style={{ width: '20%' }} />
            <Column field="sicilNo" header="Sicil No" style={{ width: '14%' }} />
            <Column field="startDate" header="Başlangıç Tarihi" style={{ width: '18%' }} />
            <Column field="endDate" header="Bitiş Tarihi" style={{ width: '18%' }} />
            <Column
              field="durationStr"
              header="Mesai Süresi"
              style={{ width: '15%' }}
              body={(row: WorkLog) => <span className="font-semibold text-primary">{row.durationStr}</span>}
            />
            <Column
              header="İşlemler"
              style={{ width: '15%' }}
              body={(row: WorkLog) => (
                <div className="flex gap-2">
                  <Button icon="pi pi-pencil" rounded outlined size="small" severity="secondary" tooltip="Düzenle" onClick={() => openEditWorkLog(row)} />
                  <Button icon="pi pi-trash" rounded outlined size="small" severity="danger" tooltip="Sil" onClick={() => requestDeleteWorkLog(row)} />
                </div>
              )}
            />
          </DataTable>
        </div>
      </div>
    </Dialog>

    <TicketWorkLogModal
      visible={workLogModalVisible}
      ticket={ticket}
      currentUser={currentUser}
      eligibleTechnicians={eligibleTechnicians}
      editingLog={editingWorkLog}
      onHide={() => {
        setWorkLogModalVisible(false);
        setEditingWorkLog(null);
      }}
      onSave={handleWorkLogSave}
    />

    <Dialog
      visible={!!pendingDeleteLogId}
      onHide={cancelDeleteWorkLog}
      header="Mesai Kaydını Sil"
      style={{ width: '420px', maxWidth: '95vw' }}
    >
      <p className="m-0 mb-3">
        Bu mesai kaydını silmek istediğinize emin misiniz? Bu işlem, ana <strong>&quot;Kaydet&quot;</strong> butonuna basıldığında kalıcı olacaktır.
      </p>
      <div className="flex justify-content-end gap-2">
        <Button label="Vazgeç" severity="secondary" onClick={cancelDeleteWorkLog} />
        <Button label="Evet, Sil" severity="danger" icon="pi pi-trash" onClick={confirmDeleteWorkLog} />
      </div>
    </Dialog>
    <Dialog
      visible={showExitConfirm}
      onHide={() => setShowExitConfirm(false)}
      header="Kaydedilmemiş Değişiklikler"
      style={{ width: '440px', maxWidth: '95vw' }}
    >
      <p className="m-0 mb-3">
        Bu talepte kaydedilmemiş değişiklikleriniz var (mesai kaydı, kategori, açıklama vb.). Kaydetmeden çıkarsanız bu değişiklikler kaybolacak. Yine de çıkmak istediğinize emin misiniz?
      </p>
      <div className="flex justify-content-end gap-2">
        <Button label="Vazgeç, Düzenlemeye Devam Et" severity="secondary" onClick={() => setShowExitConfirm(false)} />
        <Button label="Evet, Kaydetmeden Çık" severity="danger" icon="pi pi-sign-out" onClick={discardAndClose} />
      </div>
    </Dialog>
    </>
  );
});

TicketEditModal.displayName = 'TicketEditModal';

export default TicketEditModal;