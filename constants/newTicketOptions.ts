export const CATEGORY_DATA: Record<string, string[]> = {
    'AĞ/İNTERNET': [
        '1- Ağ / İnternet Bağlantım çalışmıyor',
        '2- Ağ / İnternet Hattı Çekilmesi',
        '3- İnternet Güvenlik Sistemi Bağlanmak İstediğim Sayfaları Blokluyor',
        '4- Güvenlik Duvarında (Firewall) Kural / Statik IP Tanımlama',
        '5- VPN Bağlantı Problemleri'
    ],
    'BİLGİSAYAR/ÇEVRE BİRİMLERİ': [
        '1- Bilgisayara İşletim Sistemi Kurulması - Format Atılması',
        '2- Bilgisayar Donanım Arızaları (Açılmıyor / Donuyor / İyileştirme)',
        '3- Sarf Malzeme Talebi',
        '4- Bilgisayar ve Monitör Demirbaş Düşü İşlemleri İçin Teknik Rapor Hazırlanması',
        '5- Bilgisayar Talebi / Monitör Talebi',
        '6- Monitör Arızası Bildirimi',
        '7- BHSM Bilgisayar Teslim Edilmesi',
        '8- BHSM Monitör Teslim Edilmesi'
    ],
    'DOSYA PAYLAŞIMI': ['1- Dosya sunucusunda paylaşım yetkilendirme işlemleri', '3- Kendi Bilgisayarında Dosya Paylaşım Yetkilendirme İşlemleri'],
    EPOSTA: [
        '2- Bilgisayarımda E-posta Ayarlarının Yapılması',
        '3- E-posta Grup Oluşturma Güncelleme',
        '4- E-posta Gönderme / Alma Problemleri',
        '5- E-posta Hesabı Bilgi Güncelleme',
        '6- E-posta Hesabı Parolamın Yenilenmesi'
    ],
    'EBYS (Elektronik Belge Yönetim Sistemi)': [
        '1- EBYS Hesap Açılması',
        '2- EBYS Hesap Güncelleme',
        '3- EBYS Hesap Kapatılması / Görev Transferi İşlemleri',
        '4- EBYS Vekalet Verme'
    ],
    'İŞ AKIŞI YÖNETİMİ (EBA)': [
        '1- İş Akış Yönetimi Sisteminde Problem Yaşıyorum',
        '2- İş Akış Yönetimi Sisteminde Program Güncelleme',
        '3- İş Akış Yönetimi Sisteminde Vekalet Verilmesi'
    ],
    'KULLANICI HESAPLARI': [
        '1- Admin Yetkisi Verilmesi (Yönetici Onaylı)',
        '2- Bilgisayar Açılış Parolamın Yenilenmesi',
        '3- Bursiyer/Misafir hesabı açılması ve bilgisayar kurulumu',
        '4- VPN hesabımın aktif edilmesi'
    ],
    'KURUMSAL İŞ UYGULAMALARI (YÖNETİM BİLGİ SİSTEMİ)': [
        '1- YBS Güncelleme',
        '2- YBS Hesap Açılması',
        '3- YBS Rol Yetki İşlemleri',
        '4- YBS Yeni Program Rapor Yazılması',
        '5- YBS MKYS,İKYS,EHM,İGT vb. Problem Yaşıyorum'
    ],
    'KONFERANS/TOPLANTI SALONLARI': ['Salon Hazırlığı'],
    'UYGULAMA PROGRAMLARI': [
        '1- Uygulama programlarının yüklenmesi',
        '2- Uygulama Programlarında Problem yaşıyorum',
        '3- Uygulama Programlarının Güncellenemesi',
        '4- Virüs Problemi Yaşıyorum'
    ],
    'YAZICILAR/TARAYICILAR': [
        '1- Tarayıcı İşlemleri',
        '2- Yazıcım Çalışıyor Ancak Çıktı Alamıyorum',
        '3- Yazıcı Donanımsal Problemler',
        '4- Yazıcı Kurulumunun Yapılması',
        '5- Yazıcı Demirbaş Düşüm İşlemleri İçin Teknik Rapor Hazırlanması'
    ],
    'WEB HİZMETLERİ': ['6- MAM Portal (Intranet) Yeni Sayfa / Olay Oluşturma ve Güncelleme', '7- Dosya Düzenleme ve Dönüştürme İşlemleri']
};

// Mock Barkod Listesi
export const BARCODE_OPTIONS = Array.from({ length: 100 }, (_, i) => ({
    label: `MAM-BRK-${1000 + i + 1}`,
    value: `MAM-BRK-${1000 + i + 1}`
}));
