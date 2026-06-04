export interface PayPeriod {
  id: number;
  label: string;
  startDate: Date;
  endDate: Date;
  payday: Date;
}

export interface TimesheetDay {
  date: Date;
  dayName: string;
  formatted: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
// Sun=0 Mon=1 Tue=2 Wed=3 Thu=4 Fri=5 Sat=6
const DAY_ABBR = ["SUN","MON","TUE","WED","THURS","FRI","SAT"];

function addDays(base: Date, n: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
}

function fmt(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtFull(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtRange(start: Date, end: Date): string {
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${MONTHS[start.getMonth()]} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${fmt(start)} – ${fmt(end)}, ${start.getFullYear()}`;
  }
  return `${fmtFull(start)} – ${fmtFull(end)}`;
}

// PP1 starts Friday June 12, 2026. Payday = start + 28 days. Each PP = 14 days.
const PP1_START = new Date(2026, 5, 12);

export const PAY_PERIODS: PayPeriod[] = Array.from({ length: 26 }, (_, i) => {
  const start = addDays(PP1_START, i * 14);
  const end   = addDays(start, 13);
  const payday = addDays(start, 28);
  return {
    id:        i + 1,
    label:     `PP${i + 1}: ${fmtRange(start, end)} — Payday ${fmt(payday)}`,
    startDate: start,
    endDate:   end,
    payday,
  };
});

export function getPayPeriodDays(pp: PayPeriod): { week1: TimesheetDay[]; week2: TimesheetDay[] } {
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(pp.startDate, i);
    return { date: d, dayName: DAY_ABBR[d.getDay()], formatted: fmt(d) };
  });
  return { week1: days.slice(0, 7), week2: days.slice(7) };
}

export function formatPaydayFull(pp: PayPeriod): string {
  return fmtFull(pp.payday);
}

export function formatRangeFull(pp: PayPeriod): string {
  return fmtRange(pp.startDate, pp.endDate);
}

export function findCurrentPayPeriod(): PayPeriod | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const pp of PAY_PERIODS) {
    if (today >= pp.startDate && today <= pp.endDate) return pp;
  }
  // Return next upcoming period
  for (const pp of PAY_PERIODS) {
    if (pp.startDate > today) return pp;
  }
  return PAY_PERIODS[PAY_PERIODS.length - 1] ?? null;
}
