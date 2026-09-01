export interface BusinessTimeResult {
  days: number;
  hours: number;
  mins: number;
  totalMinutes: number;
}

export const parseTurkishDate = (dateStr?: string | null): Date => {
  if (!dateStr || !dateStr.trim()) return new Date();

  const value = dateStr.trim();
  const isoDate = new Date(value);
  if (!Number.isNaN(isoDate.getTime())) {
    return isoDate;
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
