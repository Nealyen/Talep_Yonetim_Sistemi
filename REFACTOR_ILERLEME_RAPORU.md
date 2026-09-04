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

## Nasıl devam edilir?

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
