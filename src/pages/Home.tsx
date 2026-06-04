import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  PAY_PERIODS, PayPeriod,
  getPayPeriodDays, formatPaydayFull, formatRangeFull,
  findCurrentPayPeriod, type TimesheetDay,
} from "../data/payPeriods";
import { getStudents, type Student } from "../lib/students";

// ── Timesheet component ────────────────────────────────────────────────────────

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtWeekRange(days: TimesheetDay[]): string {
  const s = days[0].date;
  const e = days[days.length - 1].date;
  if (s.getMonth() === e.getMonth()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${e.getDate()}, ${s.getFullYear()}`;
  }
  return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

function WeekTable({ days, weekLabel }: { days: TimesheetDay[]; weekLabel: string }) {
  return (
    <div className="ts-week-table mb-0">
      {/* Week header */}
      <div className="bg-slate-700 print:bg-[#606060] text-white text-center text-xs font-bold py-1 uppercase tracking-wide border border-black print:text-black print:bg-[#c0c0c0]">
        {weekLabel}
      </div>
      <table className="w-full border-collapse text-xs" style={{ tableLayout: "fixed" }}>
        <colgroup>
          <col style={{ width: "11%" }} />
          <col style={{ width: "9%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "11%" }} />
          <col style={{ width: "29%" }} />
        </colgroup>
        <thead>
          <tr className="bg-slate-100 print:bg-[#e0e0e0]">
            {["DATE","DAY","IN","OUT","MEAL","IN","OUT","TOTAL HOURS","COMMENTS"].map(h => (
              <th key={h} className="border border-black px-1 py-1 text-center font-bold text-[10px] uppercase tracking-wide">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, i) => (
            <tr key={i} className="ts-data-row print:h-[22pt]">
              <td className="border border-black px-1 py-1 text-center font-medium">{day.formatted}</td>
              <td className="border border-black px-1 py-1 text-center font-medium">{day.dayName}</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
              <td className="border border-black px-1 py-1">&nbsp;</td>
            </tr>
          ))}
          {/* Weekly subtotal row */}
          <tr>
            <td colSpan={7} className="border border-black px-2 py-1 text-right text-xs font-semibold uppercase tracking-wide">
              Week {weekLabel.startsWith("WEEK 1") ? "1" : "2"} Total:
            </td>
            <td className="border border-black px-1 py-1">&nbsp;</td>
            <td className="border border-black px-1 py-1">&nbsp;</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

interface TimesheetProps {
  student: Student;
  period: PayPeriod;
}

function Timesheet({ student, period }: TimesheetProps) {
  const { week1, week2 } = getPayPeriodDays(period);

  return (
    <div className="timesheet-card bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden max-w-5xl mx-auto">
      {/* ── Form header ──────────────────────────────── */}
      <div className="ts-header border-b-2 border-black p-4 print:p-2">
        <h1 className="ts-header-title text-center text-xl font-black uppercase tracking-wide">
          NAUGATUCK VALLEY COMMUNITY COLLEGE
        </h1>
        <p className="ts-header-sub text-center text-sm font-semibold uppercase tracking-wide mt-0.5">
          FOR EMPLOYEES PAID WITH FUNDS FROM FEDERAL GRANTS
        </p>
        <p className="text-center text-xs text-slate-500 mt-1 print:hidden">
          FY 2027 · Pay Period {period.id} of 26
        </p>
      </div>

      <div className="p-4 print:p-2 space-y-3">
        {/* ── Employee info grid ───────────────────────── */}
        <table className="ts-info-table w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-1.5 w-1/3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Employee Name</span>
                <span className="font-semibold">{student.name}</span>
              </td>
              <td className="border border-black px-3 py-1.5 w-1/3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Department</span>
                <span className="font-semibold">{student.department}</span>
              </td>
              <td className="border border-black px-3 py-1.5 w-1/3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Pay Period</span>
                <span className="font-semibold">{formatRangeFull(period)}</span>
              </td>
            </tr>
            <tr>
              <td className="border border-black px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Account No.</span>
                <span className="font-semibold">HB 3500</span>
              </td>
              <td className="border border-black px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Grant Title</span>
                <span className="font-semibold">WIOA Out Of School</span>
              </td>
              <td className="border border-black px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 block">Percentage</span>
                <span className="font-semibold">100%</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Week tables ──────────────────────────────── */}
        <div className="space-y-3">
          <WeekTable days={week1} weekLabel={`WEEK 1 OF 2 — ${fmtWeekRange(week1)}`} />
          <WeekTable days={week2} weekLabel={`WEEK 2 OF 2 — ${fmtWeekRange(week2)}`} />
        </div>

        {/* ── Total hours ──────────────────────────────── */}
        <table className="w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="border border-black px-3 py-1.5 font-semibold text-right w-3/4">
                TOTAL HOURS FOR PAY PERIOD:
              </td>
              <td className="border border-black px-3 py-1.5 w-1/4">&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* ── Certification + Signatures ───────────────── */}
        <div className="ts-sig-section border border-black p-3 space-y-3 text-sm">
          <p className="text-xs italic">
            I certify that the above time record is correct and complete, and that I worked the hours stated herein.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Employee Signature</p>
              <div className="border-b border-black w-full" />
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Date</p>
                <div className="border-b border-black w-full" />
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Supervisor Signature</p>
              <div className="border-b border-black w-full" />
              <div className="mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Date</p>
                <div className="border-b border-black w-full" />
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Payday: <span className="font-semibold">{formatPaydayFull(period)}</span>
          </p>
        </div>

        {/* ── For Payroll Office Only ───────────────────── */}
        <div className="ts-payroll-box border-2 border-black p-3">
          <p className="text-xs font-black uppercase tracking-widest text-center mb-3 border-b border-black pb-2">
            FOR PAYROLL OFFICE ONLY
          </p>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Regular Hours</p>
              <div className="border-b border-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Overtime Hours</p>
              <div className="border-b border-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Other</p>
              <div className="border-b border-black" />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Approved By</p>
              <div className="border-b border-black" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4">Date</p>
              <div className="border-b border-black" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Home() {
  const [students, setStudents] = useState<Student[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [period, setPeriod] = useState<PayPeriod | null>(null);
  const timesheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = getStudents();
    setStudents(s);
    // Auto-select current/upcoming pay period
    setPeriod(findCurrentPayPeriod());
  }, []);

  // If student + period both selected, scroll form into view
  useEffect(() => {
    if (student && period && timesheetRef.current) {
      timesheetRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [student, period]);

  const ready = student !== null && period !== null;

  const handlePrint = () => {
    if (!ready) return;
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* ── Top bar (no-print) ──────────────────────── */}
      <header className="no-print bg-[#003087] text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#003087] font-black text-base">N</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight tracking-wide">NAUGATUCK VALLEY</p>
              <p className="text-xs text-blue-200 leading-tight">Community College · FY 2027 Timesheets</p>
            </div>
          </div>
          <Link to="/admin" className="text-xs text-blue-200 hover:text-white transition uppercase tracking-widest">
            Admin ↗
          </Link>
        </div>
      </header>

      {/* ── Controls card (no-print) ─────────────────── */}
      <div className="no-print max-w-6xl mx-auto px-6 py-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex flex-wrap items-end gap-4">
            {/* Student dropdown */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Student
              </label>
              {students.length === 0 ? (
                <div className="border border-dashed border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-400">
                  No students —{" "}
                  <Link to="/admin" className="text-[#003087] underline">upload CSV</Link>
                </div>
              ) : (
                <select
                  value={student?.name ?? ""}
                  onChange={e => {
                    const s = students.find(s => s.name === e.target.value) ?? null;
                    setStudent(s);
                  }}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/30 appearance-none cursor-pointer"
                >
                  <option value="">— Select student —</option>
                  {students.map(s => (
                    <option key={s.name} value={s.name}>
                      {s.name} ({s.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Pay period dropdown */}
            <div className="flex-1 min-w-[260px]">
              <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1.5">
                Pay Period
              </label>
              <select
                value={period?.id ?? ""}
                onChange={e => {
                  const p = PAY_PERIODS.find(p => p.id === Number(e.target.value)) ?? null;
                  setPeriod(p);
                }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-800 bg-white focus:outline-none focus:border-[#003087] focus:ring-1 focus:ring-[#003087]/30 appearance-none cursor-pointer"
              >
                <option value="">— Select pay period —</option>
                {PAY_PERIODS.map(p => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Print button */}
            <button
              onClick={handlePrint}
              disabled={!ready}
              className="shrink-0 flex items-center gap-2 bg-[#003087] hover:bg-[#002060] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-6 py-2.5 text-sm transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
              </svg>
              Print Timesheet
            </button>
          </div>

          {/* Status hint */}
          {!ready && (
            <p className="mt-3 text-xs text-slate-400">
              {!student && !period && "Select a student and pay period above."}
              {student && !period && "Now select a pay period."}
              {!student && period && "Now select a student."}
            </p>
          )}
          {ready && (
            <p className="mt-3 text-xs text-green-600 font-medium">
              ✓ Ready — click Print Timesheet to open the print dialog.
            </p>
          )}
        </div>
      </div>

      {/* ── Timesheet preview ─────────────────────────── */}
      <div ref={timesheetRef} className="max-w-6xl mx-auto px-6 pb-10 print:px-0 print:pb-0 print:max-w-none">
        {ready ? (
          <Timesheet student={student} period={period} />
        ) : (
          <div className="no-print text-center py-20 text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <p className="text-lg font-medium">Timesheet will appear here</p>
            <p className="text-sm mt-1">Select a student and pay period above</p>
          </div>
        )}
      </div>

      {/* ── Footer (no-print) ────────────────────────── */}
      <footer className="no-print text-center py-6 text-xs text-slate-400 border-t border-slate-200">
        Powered by{" "}
        <a href="https://nova-systems.app" target="_blank" rel="noreferrer" className="hover:text-slate-600 transition">
          Nova Systems
        </a>
        {" "}· NVCC Timesheet Generator · FY 2027
      </footer>
    </div>
  );
}
