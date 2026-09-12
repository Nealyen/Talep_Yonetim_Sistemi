/**
 * API ROUTE: POST /api/upload (Pages Router tarzı eski API handler)
 * NE İŞE YARAR: Sahte/mock dosya yükleme uç noktası — gerçekte hiçbir şey kaydetmez,
 * sadece başarı yanıtı döner. components/forms/newTicket/TicketDetailsSection.tsx
 * içindeki FileUpload bileşeninin `url` prop'u burayı gösteriyor (gerçek dosya
 * depolama backend'i bağlanana kadar geçici çözüm).
 */

export default function handler(req: any, res: any) {
    res.status(200).setHeader('Access-Control-Allow-Origin', '*').json({ name: 'Fake Upload Process' });
}
