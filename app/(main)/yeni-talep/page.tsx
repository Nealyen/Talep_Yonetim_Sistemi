'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTickets } from '@/layout/context/TicketContext';
import { useUser } from '@/layout/context/UserContext';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';

const CATEGORY_DATA: Record<string, string[]> = {
    "AĞ/İNTERNET": [
        "1- Ağ / İnternet Bağlantım çalışmıyor",
        "2- Ağ / İnternet Hattı Çekilmesi",
        "3- İnternet Güvenlik Sistemi Bağlanmak İstediğim Sayfaları Blokluyor",
        "4- Güvenlik Duvarında (Firewall) Kural / Statik IP Tanımlama",
        "5- VPN Bağlantı Problemleri"
    ],
    "BİLGİSAYAR/ÇEVRE BİRİMLERİ": [
        "1- Bilgisayara İşletim Sistemi Kurulması - Format Atılması",
        "2- Bilgisayar Donanım Arızaları (Açılmıyor / Donuyor / İyileştirme)",
        "3- Sarf Malzeme Talebi",
        "4- Bilgisayar ve Monitör Demirbaş Düşü İşlemleri İçin Teknik Rapor Hazırlanması",
        "5- Bilgisayar Talebi / Monitör Talebi",
        "6- Monitör Arızası Bildirimi",
        "7- BHSM Bilgisayar Teslim Edilmesi",
        "8- BHSM Monitör Teslim Edilmesi"
    ],
    "DOSYA PAYLAŞIMI": [
        "1- Dosya sunucusunda paylaşım yetkilendirme işlemleri",
        "3- Kendi Bilgisayarında Dosya Paylaşım Yetkilendirme İşlemleri"
    ],
    "EPOSTA": [
        "2- Bilgisayarımda E-posta Ayarlarının Yapılması",
        "3- E-posta Grup Oluşturma Güncelleme",
        "4- E-posta Gönderme / Alma Problemleri",
        "5- E-posta Hesabı Bilgi Güncelleme",
        "6- E-posta Hesabı Parolamın Yenilenmesi"
    ],
    "EBYS (Elektronik Belge Yönetim Sistemi)": [
        "1- EBYS Hesap Açılması",
        "2- EBYS Hesap Güncelleme",
        "3- EBYS Hesap Kapatılması / Görev Transferi İşlemleri",
        "4- EBYS Vekalet Verme"
    ],
    "İŞ AKIŞI YÖNETİMİ (EBA)": [
        "1- İş Akış Yönetimi Sisteminde Problem Yaşıyorum",
        "2- İş Akış Yönetimi Sisteminde Program Güncelleme",
        "3- İş Akış Yönetimi Sisteminde Vekalet Verilmesi"
    ],
    "KULLANICI HESAPLARI": [
        "1- Admin Yetkisi Verilmesi (Yönetici Onaylı)",
        "2- Bilgisayar Açılış Parolamın Yenilenmesi",
        "3- Bursiyer/Misafir hesabı açılması ve bilgisayar kurulumu",
        "4- VPN hesabımın aktif edilmesi"
    ],
    "KURUMSAL İŞ UYGULAMALARI (YÖNETİM BİLGİ SİSTEMİ)": [
        "1- YBS Güncelleme",
        "2- YBS Hesap Açılması",
        "3- YBS Rol Yetki İşlemleri",
        "4- YBS Yeni Program Rapor Yazılması",
        "5- YBS MKYS,İKYS,EHM,İGT vb. Problem Yaşıyorum"
    ],
    "KONFERANS/TOPLANTI SALONLARI": [
        "Salon Hazırlığı"
    ],
    "UYGULAMA PROGRAMLARI": [
        "1- Uygulama programlarının yüklenmesi",
        "2- Uygulama Programlarında Problem yaşıyorum",
        "3- Uygulama Programlarının Güncellenemesi",
        "4- Virüs Problemi Yaşıyorum"
    ],
    "YAZICILAR/TARAYICILAR": [
        "1- Tarayıcı İşlemleri",
        "2- Yazıcım Çalışıyor Ancak Çıktı Alamıyorum",
        "3- Yazıcı Donanımsal Problemler",
        "4- Yazıcı Kurulumunun Yapılması",
        "5- Yazıcı Demirbaş Düşüm İşlemleri İçin Teknik Rapor Hazırlanması"
    ],
    "WEB HİZMETLERİ": [
        "6- MAM Portal (Intranet) Yeni Sayfa / Olay Oluşturma ve Güncelleme",
        "7- Dosya Düzenleme ve Dönüştürme İşlemleri"
    ]
};

// Mock Barkod Listesi
const BARCODE_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
    label: `MAM-BRK-${1000 + i + 1}`,
    value: `MAM-BRK-${1000 + i + 1}`
}));

const YeniTalepPage = () => {
    const router = useRouter();
    const { addTicket } = useTickets();
    const { currentUser } = useUser();
    const toast = useRef<Toast>(null);

    // Dinamik Kategori Seçimi
    const [category, setCategory] = useState<string>('');
    const [subCategory, setSubCategory] = useState<string>('');

    // Ortak Talep Parametreleri
    const [pcName, setPcName] = useState('MAM-1907SV.MAM.GOV.TR');
    const [ipAddress, setIpAddress] = useState('09.9.3.07');
    const [contactExt, setContactExt] = useState(currentUser.dahili);
    const [mobile, setMobile] = useState('');
    const [roomNo, setRoomNo] = useState('');
    const [barcodeNo, setBarcodeNo] = useState('');
    const [description, setDescription] = useState('');
    
    // Form Kontrolü
    const [isSubmitting, setIsSubmitting] = useState(false);
    const submitLock = useRef(false);

    // Aktif kullanıcı değiştiğinde formdaki dahili numarasını senkronize et
    useEffect(() => {
        setContactExt(currentUser.dahili);
    }, [currentUser]);

    const categoryOptions = Object.keys(CATEGORY_DATA).map(key => ({ label: key, value: key }));
    const subCategoryOptions = category ? CATEGORY_DATA[category].map(item => ({ label: item, value: item })) : [];

    const isPrinterSelected = category === 'YAZICILAR/TARAYICILAR';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (submitLock.current) return;

        if (!category || !subCategory) {
            toast.current?.show({ severity: 'warn', summary: 'Eksik Seçim', detail: 'Ana kategori ve alt tür seçimi zorunludur.', life: 3000 });
            return;
        }

        if (isPrinterSelected && !barcodeNo) {
            toast.current?.show({ severity: 'warn', summary: 'Eksik Barkod', detail: 'Lütfen işlem yapılacak cihazın barkod numarasını seçiniz.', life: 3000 });
            return;
        }

        submitLock.current = true;
        setIsSubmitting(true);

        const generatedTitle = `[${category}] ${subCategory}`;
        const structuredDetails = `
Bilgisayar Adı: ${pcName}
IP Numarası: ${ipAddress}
Ulaşılacak Dahili: ${contactExt}
Cep Tel: ${mobile}
Oda No: ${roomNo}${isPrinterSelected && barcodeNo ? `\nCihaz Barkod No: ${barcodeNo}` : ''}

Açıklamalar:
${description}
        `.trim();

        const mappedCategory = ['Donanım/Arıza', 'Yazılım/Erişim', 'İdari Hizmet', 'Güvenlik'].includes(category) ? category : 'Donanım/Arıza';

        const created = await addTicket({
            title: generatedTitle,
            category: mappedCategory as any,
            priority: 'Normal',
            description: structuredDetails,
            location: roomNo,
            requester: currentUser.fullName
        });

        if (!created) {
            submitLock.current = false;
            setIsSubmitting(false);
            toast.current?.show({ severity: 'error', summary: 'Talep Oluşturulamadı', detail: 'İşlem başarısız oldu.', life: 3000 });
            return;
        }

        toast.current?.show({ severity: 'success', summary: 'Kayıt Oluşturuldu', detail: 'Talebiniz başarıyla iletildi.', life: 2000 });
        setTimeout(() => router.push('/taleplerim'), 1200);
    };

    return (
        <div className="grid">
            <Toast ref={toast} />
            <div className="col-12 lg:col-10 lg:col-offset-1">
                <Card title="İş Talep Sistemi" subTitle="BİLGİ TEKNOLOJİLERİ MÜDÜRLÜĞÜ (BTM)">
                    <form onSubmit={handleSubmit} className="p-fluid">
                        
                        {/* TALEP EDEN BİLGİLERİ (Aktif Kullanıcıdan Dinamik Gelen Alan) */}
                        <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
                            <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">
                                TALEP EDEN BİLGİLERİ
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">Personelin Adı Soyadı</label>
                                    <InputText value={currentUser.fullName} readOnly disabled />
                                </div>
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">Sicil No</label>
                                    <InputText value={currentUser.sicilNo} readOnly disabled />
                                </div>
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">Ünvan</label>
                                    <InputText value={currentUser.title} readOnly disabled />
                                </div>
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">E-Posta Adresi</label>
                                    <InputText value={currentUser.email} readOnly disabled />
                                </div>
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">Dahili No</label>
                                    <InputText value={currentUser.dahili} readOnly disabled />
                                </div>
                                <div className="field col-12 md:col-6 lg:col-4">
                                    <label className="font-bold">Oluşturma Tarihi</label>
                                    <InputText value={new Date().toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} readOnly disabled />
                                </div>
                            </div>
                        </div>

                        {/* KATEGORİ SEÇİMİ */}
                        <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
                            <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">
                                KATEGORİLER
                            </div>
                            <div className="formgrid grid">
                                <div className="field col-12 md:col-6 relative">
                                    <label className="font-bold">Ana Talep Grubu</label>
                                    <Dropdown
                                        value={category}
                                        options={categoryOptions}
                                        onChange={(e) => {
                                            setCategory(e.value);
                                            setSubCategory('');
                                            setBarcodeNo('');
                                        }}
                                        placeholder="Kategori Seçiniz"
                                    />
                                    <input
                                        tabIndex={-1}
                                        autoComplete="off"
                                        style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                                        value={category}
                                        required
                                        onChange={() => {}}
                                    />
                                </div>
                                <div className="field col-12 md:col-6 relative">
                                    <label className="font-bold">Alt Kategoriler</label>
                                    <Dropdown
                                        value={subCategory}
                                        options={subCategoryOptions}
                                        onChange={(e) => setSubCategory(e.value)}
                                        placeholder="Alt Kategori Seçiniz"
                                        disabled={!category}
                                    />
                                    <input
                                        tabIndex={-1}
                                        autoComplete="off"
                                        style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                                        value={subCategory}
                                        required
                                        onChange={() => {}}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* TALEP BİLGİLERİ */}
                        <div className="surface-card p-4 border-round mb-4 border-1 surface-border">
                            <div className="text-primary font-bold mb-3 text-lg pb-2 border-bottom-1 surface-border">
                                TALEP BİLGİLERİ
                            </div>
                            <div className="formgrid grid">
                                <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-3'}`}>
                                    <label className="font-bold block" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        Bilgisayar Adı
                                    </label>
                                    <InputText value={pcName} onChange={(e) => setPcName(e.target.value)} required />
                                </div>
                                <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-3'}`}>
                                    <label className="font-bold block" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        IP Numarası
                                    </label>
                                    <InputText value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required />
                                </div>
                                <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                                    <label className="font-bold block" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        Ulaşılacak Dahil No
                                    </label>
                                    <InputText value={contactExt} onChange={(e) => setContactExt(e.target.value)} required />
                                </div>
                                <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                                    <label className="font-bold block" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        Cep Tel No
                                    </label>
                                    <InputText value={mobile} onChange={(e) => setMobile(e.target.value)} required />
                                </div>
                                <div className={`field col-12 md:col-4 ${isPrinterSelected ? 'lg:col-2' : 'lg:col-2'}`}>
                                    <label className="font-bold block" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                        İşin Yapılacağı Oda No
                                    </label>
                                    <InputText value={roomNo} onChange={(e) => setRoomNo(e.target.value)} required />
                                </div>

                                {isPrinterSelected && (
                                    <div className="field col-12 md:col-4 lg:col-2 relative">
                                        <label className="font-bold block text-primary" style={{ minHeight: '2.5rem', display: 'flex', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
                                            Cihaz Barkod No
                                        </label>
                                        <Dropdown 
                                            value={barcodeNo} 
                                            options={BARCODE_OPTIONS} 
                                            onChange={(e) => setBarcodeNo(e.target.value)} 
                                            placeholder="Barkod Seçiniz" 
                                            filter 
                                            filterPlaceholder="Barkod Ara..."
                                            emptyFilterMessage="Eşleşen barkod bulunamadı"
                                            emptyMessage="Kayıtlı barkod yok"
                                            panelClassName="always-bottom-panel"
                                            appendTo="self"
                                        />
                                        <input
                                            tabIndex={-1}
                                            autoComplete="off"
                                            style={{ opacity: 0, width: '100%', height: '1px', position: 'absolute', bottom: 0, left: 0, pointerEvents: 'none' }}
                                            value={barcodeNo}
                                            required
                                            onChange={() => {}}
                                        />
                                    </div>
                                )}
                                
                                <div className="field col-12 mt-3">
                                    <label className="font-bold block text-center mb-2">Talebe İlişkin Açıklamalar (Talebinize ilişkin ayrıntıları ve açıklamaları buraya yazınız.)</label>
                                    <InputTextarea 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        rows={6} 
                                    />
                                </div>

                                <div className="field col-12 mt-3">
                                    <div className="flex align-items-center">
                                        <label className="font-bold mr-3">Dosyalar</label>
                                        <FileUpload 
                                            mode="basic" 
                                            name="demo[]" 
                                            url="/api/upload" 
                                            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                                            maxFileSize={30000000} 
                                            chooseLabel="Ekle" 
                                        />
                                    </div>
                                    <small className="text-red-500 font-bold block mt-2">* Dosya boyutu en fazla 30 Megabyte olmalıdır.</small>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-content-start gap-3 mt-4">
                            <Button label="Talebi Gönder" icon="pi pi-check" type="submit" severity="success" outlined loading={isSubmitting} className="w-auto px-5" />
                            <Button label="İptal" icon="pi pi-times" type="button" severity="danger" outlined onClick={() => router.push('/taleplerim')} className="w-auto px-5" />
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default YeniTalepPage;