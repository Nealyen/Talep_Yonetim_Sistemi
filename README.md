# Kurumsal Talep Yönetim Portalı

Next.js, TypeScript ve PrimeReact ile hazırlanmış frontend prototipidir. Mevcut veya geliştirilecek backend servisine bağlanacak ticket, rol ve iş akışı ekranlarını sunar.

## Çalıştırma

```bash
npm install
npm run dev
```

Uygulama `http://localhost:3001` adresinde açılır. Üretim derlemesi için `npm run build` kullanılabilir.

## Prototip kapsamı

- Sağ üstteki test rolü seçicisi hızlı frontend senaryoları için korunur.
- Admin ve koordinatörler tüm talepleri görebilir ve atama yapabilir.
- Teknik uzmanlar yalnızca kendi üzerindeki işler ile uzmanlık kategorilerine uygun boş işleri görür.
- Talep sahipleri yalnızca kendi taleplerini ve onay bekleyen işlerini görür.
- Yüklenme, veri erişim hatası ve işlem sonuçları kullanıcıya bildirilir.
- `data/*.json` dosyaları yalnızca geçici demo verisidir; üretimde backend ve veritabanı kullanılacaktır.

## Backend entegrasyon notları

Gerçek backend, oturumdan gelen kullanıcı ve rol bilgilerini esas almalıdır. Ticket durum geçişleri, uzmanlık kontrolü ve görünürlük kuralları yalnızca frontend'e bırakılmamalıdır. Gerçek SMS veya e-posta doğrulaması kimlik servisi tarafından sağlanacaktır.

## Temel API sözleşmesi

- `GET /api/tickets`: Kullanıcının rolüne göre filtrelenmiş talepler
- `POST /api/tickets`: Yeni talep oluşturma
- `PATCH /api/tickets/:id`: Atama, tamamlama ve talep sahibi onayı
- `GET /api/users`: Admin/koordinatör ekranları için kullanıcı ve uzmanlık bilgileri

## Kod yapısı

- `app/(main)`: Ana iş akışı ekranları
- `layout/context/TicketContext.tsx`: Frontend ticket işlemleri ve demo veri erişimi
- `app/api`: Geçici mock API route'ları
- `data`: Geçici JSON verileri
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Learn More

To learn more about Next.js, take a look at the following resources:

-   [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
-   [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
