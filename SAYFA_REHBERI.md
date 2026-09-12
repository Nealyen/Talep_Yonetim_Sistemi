# Sayfa Rehberi — Kurumsal Talep Yönetim Portalı

> Bu dosya, projeye sonradan dahil olacak geliştiriciler için yazılmıştır. Her sayfanın
> ne işe yaradığını, kimlerin görebildiğini, hangi dosyalarda yaşadığını ve varsa
> bilinmesi gereken önemli kuralları/tuzakları anlatır. Mimari genel bakış için
> `PROJECT_CONTEXT.md`'ye, kurulum için `README.md`'ye bakın. Bu dosya onların yerine
> değil, **tamamlayıcısı** olarak yazıldı — burada satır satır "hangi sayfa ne iş görür"
> anlatılıyor.

---

## 1. Önce genel çerçeve: Roller ve Context'ler

### Roller (`UserRole`)
Sistemde 4 rol var, her sayfa bu rollere göre görünür/gizlenir (bkz. `layout/AppMenu.tsx` ve
her sayfadaki `RoleRouteGuard`):

- **CALISAN** (Çalışan / Talep Sahibi) — sadece kendi taleplerini açar ve takip eder.
- **TEKNISYEN** (Teknisyen / Destek) — talepleri çözen kişi. Bir veya birden fazla **Ekip**e
  ve bir **Uzmanlık Alanı**na sahip olabilir.
- **KOORDINATOR** — teknisyenleri yönlendirir, tüm talepleri görür, SLA/süreç takibi yapar.
- **ADMIN** (Yönetici) — sistemin tamamına erişir; kullanıcı, ekip ve kategori yönetimi
  sadece Admin'e açıktır.

### Context'ler (global state — `layout/context/`)
Sayfaların neredeyse tamamı bu 4 context'ten veri okur/yazar. Yeni bir sayfa yazarken önce
buradan hangi veriye ihtiyacın olduğunu anla:

| Context | Ne tutar | Kısaca |
|---|---|---|
| `UserContext.tsx` | Kullanıcılar, aktif kullanıcı, rol, ekip listesi, uzmanlık alanı | `useUser()` |
| `TeamContext.tsx` | Ekip (grup) adlarının merkezi listesi | `useTeams()` |
| `CategoryContext.tsx` | Üst Başlık / Alt Başlık / hangi ekibe yönlendirileceği | `useCategories()` |
| `TicketContext.tsx` | Talepler (ticket), talep geçmişi, ekip-içi bildirimler | `useTickets()` |

Hepsi `localStorage`'a yazıyor (gerçek backend henüz yok — mock/prototip aşaması).
Kalıcı depolama anahtarları context dosyalarının içinde yorum satırlarıyla belirtilmiş.

### Ortak kurallar / convention'lar
- **Overlay panel konumlanma hatası:** Dropdown/MultiSelect/Calendar bir tablo satırında ya
  da Dialog içindeyse mutlaka `panelClassName="always-bottom-panel"` + `appendTo="self"`
  ikilisini birlikte kullan (bkz. `styles/layout/layout.scss` içindeki açıklama). appendTo
  olmadan CSS kuralı tek başına paneli sayfanın en altına fırlatır.
- **Silme/geri alınamaz değişiklikler:** `confirmDialog` (primereact/confirmdialog) ile onay
  istenir — bkz. `useKategoriYonetimi.ts`, `useEkipYonetimi.ts` içindeki örnekler. Sayfanın
  en üstünde bir kez `<ConfirmDialog />` render edilmesi yeterli.
- **Sayfa yetkisi:** Bir sayfa sadece belirli rollere açıksa, `page.tsx` içeriği
  `<RoleRouteGuard allowedRoles={[...]}>` ile sarmalanır. Yetkisi olmayan kullanıcı
  otomatik yönlendirilir.
- **Dosya yapısı:** Her sayfa `app/(main)/<sayfa-adi>/` altında `page.tsx` +
  `components/` + `hooks/use<SayfaAdi>.ts` şeklinde organize edilmiş. İş mantığı hook'ta,
  görünüm component'lerde, `page.tsx` sadece ikisini birbirine bağlar.

---

## 2. Sayfa sayfa rehber

### 🏠 Gösterge Paneli — `/` (`app/(main)/page.tsx`)
**Kim görür:** Herkes.
**Ne işe yarar:** Rol bazlı özet ekranı. Teknisyen için "Üzerimdeki Aktif Görevler /
Oluşturduğum Talepler" arasında geçiş yapılabilen performans grafikleri gösterir
(`hooks/useDashboardCharts.ts`, `components/dashboard/PerformanceChartCard.tsx`).
Admin/Koordinatör için her zaman sistem geneli veri gösterilir (kişisel görünüm anlamsız
olduğu için toggle onlara gösterilmez). Ayrıca "Aksiyon Gerektiren" işleri listeleyen bir
panel var (`components/dashboard/ActionRequiredPanel.tsx`).

### ➕ Yeni Talep Oluştur — `/yeni-talep`
**Kim görür:** Herkes.
**Ne işe yarar:** Talep formu. Üst Başlık / Alt Başlık seçimi artık statik değil,
**Kategori Yönetimi**'nde tanımlanan kataloğa (`CategoryContext`) bağlı — pasif işaretlenen
alt başlıklar burada görünmez. Form gönderildiğinde talep, alt başlığın Kategori
Yönetimi'nde atanmış olduğu ekibe otomatik yönlendirilir.
**Dosyalar:** `page.tsx` tek dosya (henüz ayrı hook/component'e bölünmemiş; form mantığı
`hooks/useNewTicketForm.ts` içinde, form alanları `components/forms/newTicket/` altında).

### 📋 Taleplerim — `/taleplerim`
**Kim görür:** Herkes (ama sadece kendi açtığı talepleri görür).
**Ne işe yarar:** Kullanıcının kendi oluşturduğu, henüz kapanmamış taleplerin listesi ve
filtreleme (arama, kategori, tarih aralığı).
**Dikkat:** `TaleplerimFiltre.tsx` içindeki tarih aralığı seçici (`Calendar`,
`selectionMode="range"`) — value'ya asla `[null, null]` verilmez, seçim yokken kesinlikle
`null` olmalı (aksi halde konsola hata düşer, bkz. layout.scss'teki not).

### 📖 Geçmiş Talepler (Arşiv) — `/gecmis-talepler`
**Kim görür:** Herkes; ama Admin/Koordinatör "Tüm Talepler" / "Kendi Taleplerim" arasında
geçiş yapabilir (`SelectButton`), diğer roller sadece kendi geçmişini görür.
**Ne işe yarar:** Kapatılmış taleplerin kalıcı arşivi. Aynı tarih aralığı Calendar kuralı
burada da geçerli.

### 🗂️ Tüm Talepler — `/tum-talepler`
**Kim görür:** KOORDINATOR, ADMIN.
**Ne işe yarar:** Sistemdeki tüm (açık + kapalı) taleplerin genel izleme panosu. Admin
yetkisiyle sahibi olunmayan talepler de düzenlenebilir (`onEdit` → `TicketEditModal`).

### 💼 Aktif Görevlerim — `/uzman-aktif-gorevler`
**Kim görür:** TEKNISYEN, KOORDINATOR, ADMIN.
**Ne işe yarar:** Kullanıcının üzerine aldığı/atandığı açık işlerin listesi. Ayrıca iki
şey daha barındırır:
1. **Atama İşlemleri** penceresi — onay bekleyen atamalar (`ATAMA_BEKLİYOR`) + salt-bilgi
   ekip bildirimleri (bkz. aşağıdaki "Ekip Bildirimleri" bölümü). Buton rozetindeki sayı
   ikisinin toplamı.
2. Satır bazlı düzenleme/çözme akışı (`DuzenlemeFooteri.tsx`).

**Ekip Bildirimleri nedir?** Bir kullanıcı bir talebi havuzdan üstüne aldığında veya
kendisine atanan bir işi kabul ettiğinde, onunla aynı ekip(ler)de olan diğer herkese
"X kullanıcısı Y talebini üstüne almıştır" şeklinde bilgilendirme amaçlı (onay
gerektirmeyen, sadece ✕ ile kapatılabilen) bir bildirim düşer. Mantık `TicketContext.tsx`
içindeki `pushTeamNotifications` / `dismissTeamNotification` fonksiyonlarında.

### 🛠️ Teknik İş Havuzu — `/is-havuzu`
**Kim görür:** TEKNISYEN, KOORDINATOR, ADMIN.
**Ne işe yarar:** Henüz kimseye atanmamış, "YENİ" durumundaki talepler. Bir talep belirli
bir ekibe eşlenmişse (Kategori Yönetimi'nde tanımlı), havuzda **sadece o ekipteki
teknisyenlere** görünür — "her rol her işi görmesin" kuralı. Ekibi atanmamış (boş) talepler
herkese açık kalır. Admin/Koordinatör her zaman tüm havuzu görür.

### 📊 Sistem Süreç Takibi — `/surec-takibi`
**Kim görür:** KOORDINATOR, ADMIN.
**Ne işe yarar:** SLA takibi ve doğrudan personel görevlendirme masası — koordinatörün
işleri manuel olarak teknisyenlere dağıtabildiği merkezi ekran.

### 👥 Kullanıcı & Rol Yönetimi — `/kullanicilar`
**Kim görür:** ADMIN.
**Ne işe yarar:** Personel listesi; rol değiştirme, ekip atama/çıkarma (satır içi checkbox
listesiyle), Teknisyen için Uzmanlık Alanı atama. Ayrıca alt kısımda "Yeni Rol Tanımla"
bir taslak alan var — **bu görsel bir iskelet, gerçek bir yetkilendirme sistemine bağlı
değil** (component state'te tutulur, sayfa yenilenince kaybolur). Gerçek RBAC ileride ayrı
bir iş olarak ele alınmalı.
**Dikkat — Uzmanlık Alanı:** Artık sabit bir liste değil, Kategori Yönetimi'ndeki Üst
Başlık listesinden geliyor (`useCategories().ustBasliklar`). Yeni personel eklerken
Teknisyen rolü seçiliyse Uzmanlık Alanı seçimi kod içinde açıkça zorunlu kılınmış
(`AppTopbar.tsx` → `handleAddUser`).

### 🧩 Ekip Yönetimi — `/ekip-yonetimi`
**Kim görür:** ADMIN.
**Ne işe yarar:** İki bölüm: (1) Ekip (grup) adlarının kendisinin tanımlandığı liste
(`EkipListesi.tsx`), (2) hangi personelin hangi ekip(ler)e dahil olduğunun eşleştirmesi
(`PersonelEkipEslestirme.tsx`). Çalışan (CALISAN) rolü en fazla 1 ekibe dahil olabilir,
diğer roller birden fazla ekibe dahil olabilir.

### 🏷️ Kategori Yönetimi — `/kategori-yonetimi`
**Kim görür:** ADMIN.
**Ne işe yarar:** "Yeni Talep Oluştur" formunun besleneceği Üst Başlık / Alt Başlık
kataloğu ve her alt başlığın otomatik yönlendirileceği ekip. Sol panelde Üst Başlıklar
(klasör mantığı), sağ panelde seçili Üst Başlığın Alt Başlıkları listelenir.
**Önemli:** Alt Başlık artık serbest metin değil — `constants/newTicketOptions.ts`
içindeki resmî katalogdan (`CATEGORY_DATA`) seçilen bir **dropdown**. Aynı üst başlıkta
başka bir satırda zaten kullanılan katalog değeri tekrar seçilemez (mükerrer kayıt
önleniyor). Değişiklik `confirmDialog` ile onay ister. Süreç Ölçüm ve Pasif checkbox'ları
var; Pasif işaretlenen alt başlık "Yeni Talep Oluştur" formunda görünmez.

### 📜 Denetim İzi (Audit Log) — `/denetim-izi`
**Kim görür:** ADMIN.
**Ne işe yarar:** 5651 sayılı kanun ve kurumsal kalite standartlarına uygun,
değiştirilemez işlem kayıtları (kim, ne zaman, hangi talepte, ne yaptı). Veri
`hooks/useAuditLogs.ts`'ten geliyor.

### ❓ SSS — `/sss`
**Kim görür:** Herkes.
**Ne işe yarar:** Statik Sıkça Sorulan Sorular ve kullanıcı rehberi metni.

### 📄 Yönerge — `/yonerge`
**Kim görür:** Herkes.
**Ne işe yarar:** Kurumsal Arıza ve Talep Yönetim Yönergesi — resmi standartlar ve SLA
taahhütlerinin okunabilir metni. Statik içerik sayfası.

---

## 2.1 Şablon / kullanılmayan sayfalar (`app/(full-page)/`)

Bu 4 sayfa, projenin temelini oluşturan PrimeReact "Sakai" şablonundan gelen hazır
kalıplardır. **Hiçbiri projenin geri kalanından bir link/redirect ile çağrılmıyor** —
yani şu an fiilen kullanılmayan, ileride ihtiyaç olursa kullanılmaya hazır bekleyen
demo/iskelet sayfalardır. Yanlışlıkla "eksik bir özellik" sanılmasın diye burada
ayrıca listeliyoruz:

- **`/auth/access`** (`app/(full-page)/auth/access/page.tsx`) — "Erişim Reddedildi"
  şablonu. Gerçekte kullanılan yetkisiz-erişim davranışı bu DEĞİL — `RoleRouteGuard.tsx`
  (bkz. `layout/RoleRouteGuard.tsx`) yetkisiz erişimde kullanıcıyı doğrudan `/` (ana
  sayfa)'ya yönlendiriyor (`router.replace('/')`), bu sayfaya hiç uğramıyor.
- **`/auth/error`** (`app/(full-page)/auth/error/page.tsx`) — Genel hata şablonu, bağlı değil.
- **`/landing`** (`app/(full-page)/landing/page.tsx`) — Lorem-ipsum dolu, "SAKAI" markalı
  pazarlama sayfası şablonu. Kurumsal talep portalıyla alakası yok, silinebilir.
- **`/pages/notfound`** (`app/(full-page)/pages/notfound/page.tsx`) — 404 şablonu.
  Next.js'in gerçek/otomatik 404 mekanizması bu DEĞİL (bkz. aşağıdaki `app/error.tsx`
  ile farkı).

## 2.2 Next.js özel dosyaları (sayfa değil ama render edilir)

- **`app/error.tsx`** — Next.js'in **gerçekten aktif** global hata sınırı (Error
  Boundary). Herhangi bir sayfada beklenmeyen bir çalışma zamanı hatası olduğunda
  Next.js bunu otomatik gösterir. `app/(full-page)/auth/error/page.tsx` ile
  karıştırılmamalı — o statik ve bağlantısız bir şablon, bu ise gerçek mekanizma.

## 3. Sık karışan noktalar (gelecekte hata yapmamak için)

1. **"Uzmanlık Alanı" ile "Ekip" farklı kavramlar.** Ekip = kişinin dahil olduğu grup(lar)
   (İş Havuzu görünürlüğünü belirler). Uzmanlık Alanı = kişinin Teknisyen olarak hangi Üst
   Başlık konusunda yetkin olduğu bilgisi (Kategori Yönetimi'nden beslenir). İkisi ayrı
   context/alan, birbirinin yerine geçmez.
2. **CATEGORY_DATA (`constants/newTicketOptions.ts`) sadece SEED/başlangıç verisidir.**
   Asıl çalışan veri `CategoryContext` içinde `localStorage`'da tutulur
   (`app_category_headers`, `app_category_items`). CATEGORY_DATA'yı elle değiştirmek,
   zaten kurulmuş bir projede hiçbir şeyi değiştirmez — sadece "Kategori Yönetimi"
   sayfasındaki Alt Başlık dropdown'ının **katalog referansı** olarak kullanılıyor.
3. **"Yeni Rol Tanımla" gerçek değil.** Kullanıcı & Rol Yönetimi sayfasındaki bu alan sadece
   arayüz taslağı — gerçek yetkilendirmeye bağlanmadı.
4. **Overlay panel taşması gördüğünde** önce `appendTo="self"` eklenip eklenmediğini
   kontrol et — bölüm 1'deki convention'a bak.
