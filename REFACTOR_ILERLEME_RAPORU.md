# SRP Refactoring İlerleme Raporu

> **GÜNCELLEME:** Mimari, kullanıcı talebiyle "colocation" (birlikte konumlandırma)
> yapısına geçirildi. Aşağıdaki tabloda `hooks/use[X].ts` ve `components/[sayfa]/*`
> olarak yazılanlar artık **proje kökünde değil**, ilgili sayfanın kendi klasöründe:
> `app/(main)/[sayfa-adı]/hooks/use[X].ts` ve `app/(main)/[sayfa-adı]/components/*.tsx`
> şeklinde duruyor. Sadece GERÇEKTEN birden fazla sayfada paylaşılan bileşenler
> (`components/tickets/*`, `components/forms/*`, `components/dashboard/*`) proje
> kökündeki global `components/` klasöründe kaldı.

Bu rapor, projenin "Single Responsibility" mimarisine dönüştürülmesi işleminin hangi
aşamada kaldığını gösterir. Amaç: her sayfanın (1) mantığını bir custom hook'a, (2)
görsel yapısını izole alt bileşenlere, (3) sayfanın kendisini ise sadece bunları
birleştiren ince bir orkestratöre ayırmak.

## ✅ TAMAMLANANLAR (7 sayfa)

Aşağıdaki sayfalar tamamen yeni mimariye taşındı. Her biri için orijinal dosyanın
üzerine yazıldı (eski monolitik hal artık yok):

| Sayfa | Hook | Alt Bileşenler | Orkestratör satır sayısı |
|---|---|---|---|
| `app/(main)/is-havuzu/page.tsx` | `hooks/useIsHavuzu.ts` | `components/is-havuzu/IsHavuzuFiltre.tsx`, `IsHavuzuTablo.tsx` | ~70 satır |
| `app/(main)/taleplerim/page.tsx` | `hooks/useTaleplerim.ts` | `components/taleplerim/TaleplerimFiltre.tsx`, `TaleplerimTablo.tsx` | ~65 satır |
| `app/(main)/tum-talepler/page.tsx` | `hooks/useTumTalepler.ts` | `components/tum-talepler/TumTaleplerTablo.tsx` | ~70 satır |
| `app/(main)/surec-takibi/page.tsx` | `hooks/useSurecTakibi.ts` | `components/surec-takibi/SurecTakibiFiltre.tsx`, `SurecTakibiTablo.tsx` | ~55 satır |
| `app/(main)/uzman-aktif-gorevler/page.tsx` | `hooks/useUzmanAktifGorevler.ts` (genişletildi) | `components/uzman-aktif-gorevler/AktifGorevlerBaslik.tsx`, `AktifGorevlerTablo.tsx`, `DuzenlemeFooteri.tsx` | ~115 satır |
| `app/(main)/kullanicilar/page.tsx` | `hooks/useKullanicilar.ts` | `components/kullanicilar/KullanicilarTablo.tsx` | ~20 satır |
| `app/(main)/yeni-talep/page.tsx` | `hooks/useNewTicketForm.ts` *(zaten mevcuttu, dokunulmadı)* | `components/forms/newTicket/*` *(zaten mevcuttu)* | ~85 satır (zaten uygundu) |

Her hook'ta: tüm `useState`, `useEffect`, context çağrıları, filtreleme mantığı ve
event handler'lar toplandı. UI bileşenleri sadece prop alıp render ediyor, kendi
state'i yok. TypeScript tipleri, PrimeReact class'ları ve import'lar korundu,
hiçbir fonksiyonellik kısaltılmadı/placeholder ile değiştirilmedi.

## ⚠️ KISMEN UYGUN / DOKUNULMADI (düşük öncelik, zaten büyük ölçüde ince)

Bu sayfalar zaten kısa/basit ya da kısmen hook kullanıyor; SRP ihlali diğerlerine göre
çok daha az. Token bütçesi önceliği büyük monolitlere verildiği için bunlar
**bilerek** son sıraya bırakıldı:

- `app/(main)/page.tsx` (Dashboard, 95 satır) — `useDashboardCharts` hook'unu zaten
  kullanıyor, `PerformanceChartCard`/`ActionRequiredPanel` bileşenlerine zaten bölünmüş.
  Eksik: `isTechOrAdmin`, `effectiveViewMode`, `actionTickets` hesaplamaları hâlâ sayfa
  içinde — bunları `useDashboardCharts` hook'una veya yeni bir `useDashboard` hook'una
  taşımak gerekiyor.
- `app/(main)/denetim-izi/page.tsx` (35 satır) — `useAuditLogs` hook'unu zaten
  kullanıyor. Sadece 5 kolonluk basit bir tablo; isterseniz `AuditLogTablo.tsx` olarak
  ayrılabilir ama şu haliyle de son derece ince.

## ❌ HİÇ DOKUNULMADI (yapılması gerekenler)

1. **`app/(main)/sss/page.tsx`** (34 satır) — muhtemelen statik SSS içeriği.
   İncelenip, eğer içinde state/mantık varsa hook + bileşene bölünmeli.
2. **`app/(main)/yonerge/page.tsx`** (29 satır) — muhtemelen statik yönerge/talimat
   içeriği. Aynı şekilde incelenmesi gerekiyor.
3. **`app/(full-page)/landing/page.tsx`** (557 satır, projedeki EN BÜYÜK dosya) —
   Bu bir pazarlama/tanıtım (landing) sayfası. İş mantığı (talep yönetimi) ile
   doğrudan ilgili olmadığı için bilinçli olarak en sona bırakıldı, ama satır sayısı
   itibarıyla muhtemelen en çok SRP ihlali barındıran dosya budur. Hero/Features/
   Pricing/Footer gibi bölümlere ayrılmalı (örn. `components/landing/HeroSection.tsx`,
   `FeaturesSection.tsx` vb.) ve varsa state/animasyon mantığı `hooks/useLandingPage.ts`
   içine alınmalı.
4. **`app/(full-page)/auth/access/page.tsx`** ve **`app/(full-page)/auth/error/page.tsx`**
   (36'şar satır) — küçük, muhtemelen statik hata sayfaları. Muhtemelen bölünmeye
   gerek yok ama kontrol edilmedi.
5. **`app/(full-page)/pages/notfound/page.tsx`** (56 satır) — 404 sayfası, muhtemelen
   statik; kontrol edilmedi.
6. **`layout/AppTopbar.tsx`** (213 satır) ve **`layout/AppMenu.tsx`** gibi layout
   dosyaları — bunlar "sayfa" değil ama içlerinde epey state/mantık barındırıyor
   (özellikle AppTopbar'daki profil/şifre değiştirme akışı). SRP kapsamına dahil
   edilmek istenirse ayrı bir tur gerekir.
7. **`app/components/ticket/TicketEditModal.tsx`** (521 satır) ve
   **`app/components/ticket/TicketWorkLogModal.tsx`** (244 satır) — bunlar zaten
   "modal" olarak izole edilmiş component'ler (sayfa değil), ama TicketEditModal
   özellikle uzun. İsterseniz bunun içindeki form state'i de kendi hook'una
   (`hooks/useTicketEditForm.ts`) taşınabilir; şu an dokunulmadı çünkü bu dosya
   üzerinde önceki turlarda kritik bug düzeltmeleri yapıldı ve riski artırmamak için
   bu refactor turunda elle sürülmedi.

## 🆕 GÜNCELLEME (2. tur) — Ekip/Rol sistemi ve Taleplerim geliştirmeleri

Bu turda yapılanlar:

1. **"Birim / Departman" → "Ekip" (tamamlandı):** `UserContext.tsx`'teki `department` alanı
   kaldırıldı, yerine `teams: string[]` geldi. Yeni `layout/context/TeamContext.tsx`
   eklendi (merkezi ekip listesi, `localStorage` ile kalıcı). `AppTopbar.tsx`'teki
   "Yeni Personel Ekle" formu, `KullanicilarTablo.tsx`, `TicketContext.tsx` ve
   `TicketAssignModal.tsx` buna göre güncellendi.

2. **"Ekip Yönetimi" sayfası (tamamlandı, sadece ADMIN):**
   `app/(main)/ekip-yonetimi/` — eski sistemdeki 2 tablolu tasarım (ekip listesi +
   kişi-ekip eşleştirme, bir kişi birden fazla satırda/ekipte olabiliyor) birebir
   uygulandı. CALISAN rolü bu atamaya dahil değil (tek ekipleri "Yeni Personel"
   formundan zaten seçiliyor).

3. **Taleplerim tarih filtresi (tamamlandı):** `useTaleplerim.ts` hook'una
   `dateRange` state'i ve `Calendar` (range) bileşeni eklendi.

4. **Dashboard grafiklerine tıklama → Taleplerim'e yönlendirme (tamamlandı):**
   `PerformanceChartCard.tsx`'e `onCardClick` prop'u eklendi; Dashboard'daki "Son 1
   Ay / Son 3 Ay / Tüm Zamanlar" kartları artık tıklanabilir ve
   `/taleplerim?range=1m` (veya `3m`/`all`) adresine yönlendiriyor.
   `useTaleplerim.ts` bu `range` parametresini okuyup tarih filtresini otomatik
   dolduruyor (durumdan/state'ten bağımsız, sadece tarihe göre).

5. **Kapatılmış taleplerin 1 ay sonra Taleplerim'den kalkması (tamamlandı):**
   `Ticket` tipine `closedAt?: string` eklendi, `confirmTicket` onaylandığında bu
   alanı dolduruyor. `useTaleplerim.ts`, kapatılıp üzerinden 1 aydan fazla geçen
   talepleri artık listelemiyor.

6. **"Geçmiş Talepler" sayfası (tamamlandı, HERKESE AÇIK):**
   `app/(main)/gecmis-talepler/` — sistemdeki tüm kapatılmış talepleri (kim açtığı/
   kime atandığı fark etmeksizin) gösteren, rol kısıtlaması OLMAYAN yeni bir sayfa.
   Menüye "Geçmiş Talepler" olarak eklendi.

7. **"Yeni Rol Tanımla" alanı (tamamlandı, SADECE GÖRSEL):** Kullanıcılar (RBAC)
   sayfasına, admin'in yeni bir rol adı + yetki listesi girip "taslak" olarak
   ekleyebildiği bir bölüm eklendi. **Bilerek gerçek bir işleve bağlanmadı** — arayüzde
   sarı "Ön İzleme — henüz aktif değil" etiketi ve mavi bilgi kutusu ile bunun
   sadece görsel bir taslak olduğu, sayfa yenilenince sıfırlanacağı ve gerçek
   yetkilendirmeyi etkilemediği açıkça belirtiliyor. Gerçek bir rol sistemine
   dönüştürülmesi (UserRole tipinin genişletilmesi, RoleRouteGuard'ların
   güncellenmesi vb.) ayrı, çok daha büyük bir iştir.

## 🆕 GÜNCELLEME (3. tur) — Dashboard ve Geçmiş Talepler iyileştirmeleri

1. **Dashboard kart yükseklik eşitsizliği düzeltildi:** `PerformanceChartCard.tsx`'e
   `h-full flex flex-column` eklendi, artık 3 kart (Son 1 Ay / Son 3 Ay / Tüm
   Zamanlar) her zaman eşit yükseklikte, altta boşluk kalmıyor.

2. **Dashboard grafiklerinde artık gerçek veri görünüyor:** `useDashboardCharts.ts`
   düzeltildi — Admin ve Koordinatör rollerinde "üzerime atanan / benim açtığım"
   kişisel filtrelemesi anlamsız kalıyordu (bu roller genelde kendi adına az talep
   açar/üstlenir, bu yüzden hep "Veri bulunamadı" görünüyordu). Artık bu iki rol
   için grafikler HER ZAMAN sistemdeki TÜM taleplere göre hesaplanıyor. Teknisyen
   için kişisel görünüm seçici (Üzerimdeki Görevler/Oluşturduğum Talepler) korundu,
   Admin/Koordinatör'den bu anlamsız kalan seçici kaldırıldı. Ayrıca veri yokken
   grafiğin üzerine gelince çıkan yanıltıcı "Yeni/Havuzda: 1" tooltip'i de düzeltildi.

3. **"Geçmiş Talepler" sayfası artık role göre kapsam değiştiriyor:**
   - Admin ve Koordinatör HARİÇ herkes SADECE kendi açtığı geçmiş talepleri görür.
   - Admin/Koordinatör'e, başlığın yanında Dashboard'daki gibi bir "Kendi
     Taleplerim / Tüm Talepler" seçici eklendi — istedikleri zaman ikisi arasında
     geçiş yapabiliyorlar.
   - Arama kutusunun yanına bir **Kategori filtresi** (dropdown) eklendi.


- Dashboard (`app/(main)/page.tsx`) içindeki `isTechOrAdmin`/`effectiveViewMode`/
  `actionTickets` hesaplamaları hâlâ sayfa içinde, kendi hook'una taşınmadı.
- `sss`, `yonerge`, `landing/page.tsx` (557 satır), auth/404 sayfaları — hiç
  incelenmedi.
- `lib/mock-db.ts` içindeki eski `department` alanları bilinçli olarak
  değiştirilmedi (canlı arayüzden hiç kullanılmayan, Node tarafı/legacy bir dosya
  olduğu için dokunmadım — risk/fayda dengesi uygun değildi).
- "Yeni Rol Tanımla" alanının gerçek bir yetkilendirme sistemine bağlanması.



Yukarıdaki "TAMAMLANANLAR" bölümündeki 7 dosya için kullanılan desen birebir
tekrarlanabilir:

1. Sayfanın tüm `useState`/`useEffect`/context çağrılarını `hooks/use[Sayfa].ts`
   dosyasına taşı, hook'un sonunda kullanılacak her şeyi tek bir obje olarak return et.
2. Görsel parçaları (filtre çubuğu, tablo, form alanları, modallar) işlevine göre
   `components/[sayfa-adi]/` altında ayrı dosyalara böl; her biri sadece prop alsın.
3. Orijinal `page.tsx` dosyasını sil, yerine sadece hook'u çağırıp bileşenlere prop
   geçen ince bir orkestratör yaz.
4. `npx tsc --noEmit` ile tip hatası kontrolü yap (bu ortamda `node_modules` eksik
   olduğu için "Cannot find module" ve "implicitly has an 'any' type" hataları
   normaldir/göz ardı edilebilir — gerçek projenizde `npm install` sonrası kaybolur).
