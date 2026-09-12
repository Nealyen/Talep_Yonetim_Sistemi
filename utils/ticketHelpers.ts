/**
 * DOSYA: Talep (ticket) ile ilgili tarih/süre yardımcı fonksiyonları.
 * NE İŞE YARAR: parseTurkishDate (TR formatındaki "gg.aa.yyyy ss:dd" string'lerini
 * güvenle Date'e çevirir — native `new Date()`'e ASLA güvenilmez, sadece gerçek ISO
 * 8601 formatı için kullanılır), calculateBusinessTime (mesai saatleri hesaba
 * katılarak iki tarih arasındaki gerçek çalışma süresini hesaplar — WorkLog
 * modalinde kullanılır).
 */

export interface BusinessTimeResult {
  days: number;
  hours: number;
  mins: number;
  totalMinutes: number;
}

export const parseTurkishDate = (dateStr?: string | null): Date => {
  if (!dateStr || !dateStr.trim()) return new Date();

  const value = dateStr.trim();

  // KURAL: Native `new Date(value)`'a SADECE gerçek ISO 8601 formatı (örn.
  // "2026-09-02T10:04:00.000Z") için güveniyoruz. "02.09.2026 10:04" gibi TR
  // formatındaki (gün.ay.yıl) string'leri ASLA native Date'e bırakmıyoruz —
  // JS motorları bunu genelde ay.gün.yıl sanıp hata vermeden ama YANLIŞ bir tarih
  // üretiyordu (örn. 2 Eylül'ü 9 Şubat sanmak gibi). Bu sessiz hata, "son 1 ay /
  // son 3 ay" gibi tüm tarih aralığı filtrelerinin hep boş çıkmasına sebep oluyordu.
  const isIsoLike = /^\d{4}-\d{2}-\d{2}/.test(value);
  if (isIsoLike) {
    const isoDate = new Date(value);
    if (!Number.isNaN(isoDate.getTime())) {
      return isoDate;
    }
  }

  const parts = value.match(/\d+/g);
  if (parts && parts.length >= 5) {
    const [day, month, year, hour, minute, second] = parts.map(Number);
    return new Date(year, month - 1, day, hour, minute, second ?? 0);
  }

  const splitParts = value.split(/[.,/ -]/).filter(Boolean);
  if (splitParts.length >= 3) {
    const [first, second, third] = splitParts;
    const day = Number(first);
    const month = Number(second);
    const year = Number(third);

    if (!Number.isNaN(day) && !Number.isNaN(month) && !Number.isNaN(year)) {
      return new Date(year, month - 1, day);
    }
  }

  return new Date();
};

export const calculateBusinessTime = (start: Date | string | null, end: Date | string | null): BusinessTimeResult => {
  const startDate = start instanceof Date ? start : parseTurkishDate(start ?? undefined);
  const endDate = end instanceof Date ? end : parseTurkishDate(end ?? undefined);

  if (!startDate || !endDate || endDate <= startDate) {
    return { days: 0, hours: 0, mins: 0, totalMinutes: 0 };
  }

  let totalMinutes = 0;
  const current = new Date(startDate.getTime());

  while (current < endDate) {
    const day = current.getDay();
    const hour = current.getHours();

    if (day !== 0 && day !== 6 && hour >= 8 && hour < 17) {
      totalMinutes += 1;
    }

    current.setTime(current.getTime() + 60000);
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  return {
    days: 0,
    hours,
    mins,
    totalMinutes,
  };
};

export const parseDateString = (dateStr?: string | null): Date => parseTurkishDate(dateStr);
