# Proje: Kurumsal Arıza ve Talep Yönetim Portalı (TÜBİTAK/ITIL Uyumlu)

## 1. Mimari ve Teknoloji Yığını
- **Frontend Çatısı:** Next.js (App Router) + TypeScript + React
- **UI Kütüphanesi:** PrimeReact (Sakai Admin Şablonu Temelli)
- **Durum Yönetimi & Mock DB:** `layout/context/TicketContext.tsx` ticket ve kullanıcı ekranlarını API sözleşmesine bağlar. Tema tercihi cookie'de, test rolü ve prototip kullanıcı oturumu tarayıcı depolamasında tutulur.
- **Mock Backend:** `data/employee-registry.json` kart ID + telefon personel eşleştirmesini, `data/users.json` rol/uzmanlık bilgisini, `data/tickets.json` talepleri, `data/audit-log.json` işlem izini tutar. `lib/mock-db.ts` ve API route'ları gerçek MVC backend gelene kadar geçici veri katmanıdır.

## 2. Rol Mimarisi ve Erişim Kuralları (RBAC)
- **TALEP_SAHIBI (Çalışan):** Sadece kendi taleplerini açar (`/yeni-talep`), takip eder (`/taleplerim`) ve çözümü onaylar/reddeder.
- **TEKNIK_UZMAN (Tamirci):** İş havuzunu görür (`/is-havuzu`), işi üzerine alır ve 'Tamamlandı' olarak bildirir.
- **KOORDINATOR (Rehber/Süreç Yöneticisi):** Tüm talepleri denetler (`/koordinator`), uzman ataması yapar.
- **ADMIN (Sistem Yöneticisi):** Tam yetkili. Denetim İzi (`/denetim-izi`) ve Kullanıcı Yönetimi (`/kullanicilar`) ekranlarına erişir.
- **Kimlik Akışı:** Personel kart ID'si ve kayıtlı telefon eşleştirilir; prototipte SMS OTP `123456` olarak simüle edilir. Üretimde bu kod gerçek SMS sağlayıcısına bağlanmalıdır.
- **Rol Yönetimi:** Sağ üstteki rol seçici prototip testleri için korunur ve değişimde ana sayfaya yönlendirir. Gerçek kullanıcı rol ataması ADMIN aktörüyle `/api/users` üzerinden yapılır; geçici JSON kaynağı MVC backend ile değiştirilebilir.

## 3. Tamamlanan Sayfalar ve Mantık
- `app/(main)/yeni-talep/page.tsx`: Serbest metin ihtiyacını minimuma indiren Donanım, Yazılım, İdari ve Güvenlik alt kırılımlarına sahip parametrik form.
- `app/(main)/taleplerim/page.tsx`: İki taraflı doğrulama (Two-way Handshake) butonları ve denetim çizelgesi (Timeline Dialog) içeren tablo.
- `app/(main)/is-havuzu/page.tsx`: Teknik personelin açık işleri üzerine alıp tamamladığı ekran.
- `app/(main)/koordinator/page.tsx`: Manuel personel görevlendirme masası.
- Atama Edge Case'leri: Koordinatör ve teknik uzman ekranlarında mevcut uzman değiştirilebilir; aktif atamanın ilişkisi kesilerek iş yeniden havuza alınabilir.
- `app/(main)/page.tsx`: Temizlenmiş kurumsal metrikler ve canlı işlem akışı.
- `app/(main)/denetim-izi/page.tsx`, `/kullanicilar`, `/sss`, `/yonerge`: Yönetim ve bilgi sayfaları. Audit kayıtları JSON audit log ve ticket geçmişinden tarih sıralı birleştirilir.
- `app/(full-page)/auth/login/page.tsx`: Kart ID + telefon ile mock OTP üzerinden giriş ve ilk kayıt aktivasyonu.
- `app/(main)/page.tsx`: Role göre son işlemler ve metrik görünümü.

## 4. Frontend çalışma kuralları
1. **Test rolü:** Sağ üstteki rol seçicisi hızlı frontend senaryoları için korunur; gerçek kimlik doğrulama bu projenin kapsamı değildir.
2. **Görünürlük:** Admin ve koordinatör tüm talepleri görür. Teknik uzman yalnızca kendi üzerindeki işleri ve uzmanlık kategorisine uygun, henüz atanmamış işleri görür. Talep sahibi yalnızca kendi taleplerini görür.
3. **Durumlar:** Sayfalar veri yüklenirken yükleniyor mesajı, API erişiminde uyarı ve işlemlerde Toast sonucu göstermelidir.
4. **Backend sınırı:** Gerçek backend, veritabanı ve SMS/e-posta doğrulaması daha sonra bağlanacaktır. Rol, uzmanlık ve ticket durum kontrolleri API tarafında da uygulanmalıdır.
5. **Dokümantasyon:** Frontend davranışı veya API sözleşmesi değiştiğinde README ve bu bağlam dosyası aynı değişiklik içinde güncellenir.