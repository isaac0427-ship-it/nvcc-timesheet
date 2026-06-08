// Updated June 2026
import { useState, useEffect, useRef, useCallback, type ReactNode, type FormEvent, type Dispatch, type SetStateAction } from "react";
import { Timesheet } from "../components/Timesheet";
import { getStudents, saveStudents, clearStudents, parseStudentCSV } from "../lib/students";
import type { Student } from "../lib/students";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";
import { downloadTimesheetsZip } from "../lib/zipExport";

const NAVY = "#1B3A6B";
const GOLD = "#C5A028";

const TEST_STUDENT: Student = {
  name: "Isaac Nova",
  department: "WIOA Out Of School",
  studentId: "WD-2024-01",
  workLocation: "Naugatuck Valley CC",
};
const BLANK_STUDENT: Student = { name: "", department: "", studentId: "", workLocation: "" };

type Tab = "timesheet" | "records" | "tracker";
type Mode = "byPeriod" | "forStudent" | "all";
interface PrintItem { student: Student; period: PayPeriod; }
interface Props { onLogout: () => void; }

/* ── CT State shield ── */
function CTShield({ size = 36, onDark = false }: { size?: number; onDark?: boolean }) {
  const s = size / 36;
  return (
    <svg width={size} height={Math.round(43 * s)} viewBox="0 0 36 43" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,2 L34,2 L34,26 L18,41 L2,26 Z" fill={onDark ? "white" : NAVY} />
      <rect x="2" y="15" width="32" height="2" fill={onDark ? NAVY : "white"} fillOpacity="0.6" />
      <text x="18" y="14" textAnchor="middle" fill={onDark ? NAVY : "white"} fontSize="9" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
      <text x="18" y="26" textAnchor="middle" fill={GOLD} fontSize="5.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1.2">STATE</text>
    </svg>
  );
}

/* ── App header ── */
function Header({ onLogout, onHome }: { onLogout: () => void; onHome: () => void }) {
  return (
    <header className="no-print flex items-center justify-between px-4 sm:px-6 shrink-0"
      style={{ background: NAVY, borderBottom: `3px solid ${GOLD}`, minHeight: "58px" }}>
      <button className="flex items-center gap-3 hover:opacity-80 transition" onClick={onHome}>
        <CTShield size={30} />
        <div>
          <p className="text-white font-black text-sm leading-tight">CT State</p>
          <p className="text-white/50 text-[9px] tracking-widest uppercase">Naugatuck Valley</p>
        </div>
        <div className="hidden md:block h-5 w-px bg-white/20 mx-1" />
        <div className="hidden md:block">
          <p className="text-white text-xs font-black uppercase tracking-widest">WAVE Program Portal</p>
          <p className="text-white/40 text-[10px]">WIOA Out Of School · FY 2027</p>
        </div>
      </button>
      <button onClick={onLogout}
        className="text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-lg px-3 py-1.5 text-xs font-semibold transition">
        Sign Out
      </button>
    </header>
  );
}

/* ── Tab nav ── */
function TabNav({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string }[] = [
    { id: "timesheet", label: "Timesheet" },
    { id: "records",   label: "Student Records" },
    { id: "tracker",   label: "Student Tracker" },
  ];
  return (
    <nav className="no-print flex bg-white border-b border-slate-200 overflow-x-auto shrink-0">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className="relative flex items-center gap-2 px-5 py-4 text-xs font-black uppercase tracking-wider whitespace-nowrap transition-colors"
          style={{ color: active === t.id ? NAVY : "#94a3b8" }}>
          {t.label}
          {t.id === "tracker" && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full font-black" style={{ background: GOLD, color: "#000" }}>Soon</span>
          )}
          {active === t.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: NAVY }} />
          )}
        </button>
      ))}
    </nav>
  );
}

/* ── Big action card (inside Timesheet tab) ── */
function ActionCard({ active, onClick, icon, title, subtitle }: {
  active: boolean; onClick: () => void; icon: ReactNode; title: string; subtitle: string;
}) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center gap-3 rounded-2xl py-8 px-4 text-center transition-all border-2 w-full sm:flex-1 hover:shadow-lg active:scale-[0.98]"
      style={active ? { background: NAVY, borderColor: NAVY } : { background: "white", borderColor: "#e2e8f0" }}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={active ? { background: "rgba(255,255,255,0.15)" } : { background: "#f1f5f9" }}>
        {icon}
      </div>
      <div>
        <p className="font-black text-sm" style={{ color: active ? "white" : "#1e293b" }}>{title}</p>
        <p className="text-xs mt-1 leading-snug" style={{ color: active ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>{subtitle}</p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   HOME PAGE — shown first after login
═══════════════════════════════════════════ */
function HomePage({ onNavigate, onLogout }: { onNavigate: (tab: Tab) => void; onLogout: () => void }) {
  const cards: {
    tab: Tab;
    icon: ReactNode;
    title: string;
    desc: string;
    soon?: boolean;
  }[] = [
    {
      tab: "timesheet",
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: GOLD }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
      title: "Timesheet Generator",
      desc: "Generate, print, and export WIOA Out Of School timesheets for any student or pay period.",
    },
    {
      tab: "records",
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: GOLD }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      ),
      title: "Student Records",
      desc: "Manage your WIOA Out Of School student roster — add, edit, upload CSV, and track work locations.",
    },
    {
      tab: "tracker",
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} style={{ color: GOLD }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
      title: "Student Tracker",
      desc: "Real-time attendance, check-in/check-out, and program analytics. Coming Fall 2026.",
      soon: true,
    },
  ];

  return (
    <div className="no-print min-h-screen flex flex-col" style={{ background: NAVY }}>
      {/* Subtle grid texture */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: "52px 52px", pointerEvents: "none", zIndex: 0 }} />
      {/* Radial gold glow */}
      <div style={{ position: "fixed", top: "45%", left: "50%", transform: "translate(-50%, -50%)", width: "900px", height: "900px", borderRadius: "50%", background: `radial-gradient(circle, rgba(197,160,40,0.07) 0%, transparent 65%)`, pointerEvents: "none", zIndex: 0 }} />

      {/* Top bar */}
      <div className="relative flex items-center justify-between px-6 sm:px-10 pt-6 pb-2 shrink-0" style={{ zIndex: 1 }}>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD }} />
          <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: "rgba(255,255,255,0.4)" }}>CT State Naugatuck Valley</span>
        </div>
        <button onClick={onLogout}
          className="text-white/40 hover:text-white/70 text-xs font-semibold transition">
          Sign Out
        </button>
      </div>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12 text-center" style={{ zIndex: 1 }}>
        {/* Shield */}
        <div className="mb-6">
          <CTShield size={64} onDark />
        </div>

        {/* Title */}
        <p className="text-xs font-black uppercase tracking-[0.28em] mb-3" style={{ color: GOLD }}>WAVE Program</p>
        <h1 className="text-white font-black leading-tight mb-3"
          style={{ fontSize: "clamp(1.75rem, 5vw, 3rem)", letterSpacing: "-0.02em" }}>
          Management Portal
        </h1>
        <p className="text-xs mb-12" style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em" }}>
          POWERED BY NOVA SYSTEMS
        </p>

        {/* Cards */}
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
          {cards.map((c) => (
            <button key={c.tab} onClick={() => onNavigate(c.tab)}
              className="group relative flex flex-col text-left rounded-2xl p-6 transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.border = `1px solid rgba(197,160,40,0.5)`; e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)"; e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}>

              {/* Coming soon badge */}
              {c.soon && (
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(197,160,40,0.15)", border: "1px solid rgba(197,160,40,0.3)" }}>
                  <span className="w-1 h-1 rounded-full" style={{ background: GOLD }} />
                  <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: GOLD }}>Fall 2026</span>
                </div>
              )}

              {/* Icon */}
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{ background: "rgba(197,160,40,0.1)", border: "1px solid rgba(197,160,40,0.2)" }}>
                {c.icon}
              </div>

              {/* Text */}
              <h2 className="text-white font-black text-base mb-2 leading-tight">{c.title}</h2>
              <p className="text-xs leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>{c.desc}</p>

              {/* CTA */}
              <div className="mt-auto flex items-center gap-1.5 text-xs font-black uppercase tracking-wider"
                style={{ color: c.soon ? "rgba(197,160,40,0.5)" : GOLD }}>
                {c.soon ? "Coming Soon" : "Enter Portal"}
                {!c.soon && (
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="relative flex items-center justify-between px-6 sm:px-10 py-5 shrink-0" style={{ zIndex: 1 }}>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "10px" }}>CT State Naugatuck Valley · WIOA Out Of School · FY 2027</p>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em" }}>NOVA SYSTEMS</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   TIMESHEET TAB
═══════════════════════════════════════════ */
function TimesheetTab({
  effectiveStudents,
  isTestMode,
  setPrintQueue,
  isPrinting,
}: {
  effectiveStudents: Student[];
  isTestMode: boolean;
  setPrintQueue: Dispatch<SetStateAction<PrintItem[]>>;
  isPrinting: boolean;
}) {
  const [mode, setMode] = useState<Mode>("forStudent");
  const [selectedName, setSelectedName] = useState(effectiveStudents[0]?.name ?? "");
  const [periodIdx, setPeriodIdx] = useState(() => { const c = findCurrentPayPeriod(); return c ? c.id - 1 : 0; });
  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(PAY_PERIODS.length - 1);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);

  const selectedStudent = effectiveStudents.find((s) => s.name === selectedName) ?? effectiveStudents[0];
  const selectedPeriod  = PAY_PERIODS[periodIdx];
  const [lo, hi]        = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  const allCount        = effectiveStudents.length * (hi - lo + 1);

  useEffect(() => {
    if (!effectiveStudents.find((s) => s.name === selectedName)) setSelectedName(effectiveStudents[0]?.name ?? "");
  }, [effectiveStudents, selectedName]);

  const printByPeriod   = () => { if (selectedPeriod) setPrintQueue([{ student: BLANK_STUDENT, period: selectedPeriod }]); };
  const printForStudent = () => { if (selectedStudent && selectedPeriod) setPrintQueue([{ student: selectedStudent, period: selectedPeriod }]); };
  const printAll        = () => {
    const items: PrintItem[] = [];
    for (let pi = lo; pi <= hi; pi++) { const p = PAY_PERIODS[pi]; if (p) effectiveStudents.forEach((s) => items.push({ student: s, period: p })); }
    if (items.length) setPrintQueue(items);
  };
  const handleZip = async () => {
    const periods = PAY_PERIODS.slice(lo, hi + 1);
    setZipProgress({ done: 0, total: effectiveStudents.length * periods.length });
    try { await downloadTimesheetsZip(effectiveStudents, periods, (d, t) => setZipProgress({ done: d, total: t })); }
    finally { setZipProgress(null); }
  };

  const selectCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white";
  const lblCls    = "block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5";
  const iconColor = (m: Mode) => mode === m ? "white" : NAVY;

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f0f4f9" }}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">

        <div className="flex flex-col sm:flex-row gap-3">
          <ActionCard active={mode === "byPeriod"} onClick={() => setMode("byPeriod")}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: iconColor("byPeriod") }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" /></svg>}
            title="Generate by Pay Period" subtitle="Blank form with dates auto-filled" />
          <ActionCard active={mode === "forStudent"} onClick={() => setMode("forStudent")}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: iconColor("forStudent") }}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
            title="Generate for Student" subtitle="Select student + pay period" />
          <ActionCard active={mode === "all"} onClick={() => setMode("all")}
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: iconColor("all") }}><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" /></svg>}
            title="Generate All" subtitle="All students × all pay periods" />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

          {mode === "byPeriod" && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="space-y-4 md:w-64 shrink-0">
                <div><label className={lblCls}>Pay Period</label>
                  <select value={periodIdx} onChange={(e) => setPeriodIdx(+e.target.value)} className={selectCls}
                    onFocus={(e) => e.currentTarget.style.borderColor = NAVY} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
                  </select>
                </div>
                <button onClick={printByPeriod} disabled={isPrinting}
                  className="w-full font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white disabled:opacity-40 hover:opacity-90 transition"
                  style={{ background: NAVY }}>Print Blank Timesheet</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={lblCls}>Preview</p>
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <div style={{ zoom: "0.65" }}>{selectedPeriod && <Timesheet student={BLANK_STUDENT} period={selectedPeriod} />}</div>
                </div>
              </div>
            </div>
          )}

          {mode === "forStudent" && (
            <div className="flex flex-col md:flex-row gap-6">
              <div className="space-y-4 md:w-64 shrink-0">
                {isTestMode && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">Test mode — using Isaac Nova. Add students in Student Records.</div>}
                <div><label className={lblCls}>Student</label>
                  <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)} className={selectCls}
                    onFocus={(e) => e.currentTarget.style.borderColor = NAVY} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    {effectiveStudents.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                  </select>
                </div>
                <div><label className={lblCls}>Pay Period</label>
                  <select value={periodIdx} onChange={(e) => setPeriodIdx(+e.target.value)} className={selectCls}
                    onFocus={(e) => e.currentTarget.style.borderColor = NAVY} onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}>
                    {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
                  </select>
                </div>
                <button onClick={printForStudent} disabled={isPrinting}
                  className="w-full font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white disabled:opacity-40 hover:opacity-90 transition"
                  style={{ background: NAVY }}>Print Timesheet</button>
              </div>
              <div className="flex-1 min-w-0">
                <p className={lblCls}>Preview</p>
                <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                  <div style={{ zoom: "0.65" }}>{selectedPeriod && selectedStudent && <Timesheet student={selectedStudent} period={selectedPeriod} />}</div>
                </div>
              </div>
            </div>
          )}

          {mode === "all" && (
            <div className="space-y-4 max-w-lg">
              {isTestMode && <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">Test mode — using Isaac Nova. Add students in Student Records for bulk printing.</div>}
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lblCls}>From Pay Period</label>
                  <select value={fromIdx} onChange={(e) => setFromIdx(+e.target.value)} className={selectCls}>
                    {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                  </select>
                </div>
                <div><label className={lblCls}>To Pay Period</label>
                  <select value={toIdx} onChange={(e) => setToIdx(+e.target.value)} className={selectCls}>
                    {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                  </select>
                </div>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-500">
                <strong className="text-slate-800">{effectiveStudents.length}</strong> students ×{" "}
                <strong className="text-slate-800">{hi - lo + 1}</strong> periods ={" "}
                <strong style={{ color: NAVY }}>{allCount} timesheets</strong>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={printAll} disabled={isPrinting}
                  className="flex-1 font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white disabled:opacity-40 hover:opacity-90 transition"
                  style={{ background: NAVY }}>Print All Timesheets</button>
                <button onClick={handleZip} disabled={!!zipProgress}
                  className="flex-1 border border-slate-200 hover:border-slate-400 text-slate-600 disabled:opacity-40 rounded-xl py-3 text-xs uppercase tracking-widest font-black transition">
                  {zipProgress ? `${zipProgress.done} / ${zipProgress.total}…` : `Download ZIP (${allCount})`}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STUDENT RECORDS TAB
═══════════════════════════════════════════ */
function StudentRecordsTab({
  students,
  setStudents,
  isTestMode,
}: {
  students: Student[];
  setStudents: Dispatch<SetStateAction<Student[]>>;
  isTestMode: boolean;
}) {
  const [modalMode, setModalMode] = useState<"add" | "edit" | "delete" | null>(null);
  const [editTarget, setEditTarget] = useState<Student | null>(null);
  const [form, setForm] = useState({ name: "", department: "WIOA Out Of School", studentId: "", workLocation: "" });
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [csvOk, setCsvOk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayStudents = isTestMode ? [TEST_STUDENT] : students;

  const openAdd = () => { setForm({ name: "", department: "WIOA Out Of School", studentId: "", workLocation: "" }); setModalMode("add"); };
  const openEdit = (s: Student) => { setEditTarget(s); setForm({ name: s.name, department: s.department, studentId: s.studentId, workLocation: s.workLocation }); setModalMode("edit"); };
  const openDelete = (s: Student) => { setEditTarget(s); setModalMode("delete"); };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const ns: Student = { name: form.name.trim(), department: form.department.trim(), studentId: form.studentId.trim(), workLocation: form.workLocation.trim() };
    let updated: Student[];
    if (modalMode === "add") { updated = [...(isTestMode ? [] : students), ns]; }
    else { updated = (isTestMode ? [TEST_STUDENT] : students).map((s) => (s.name === editTarget?.name ? ns : s)); }
    saveStudents(updated); setStudents(updated); setModalMode(null); setEditTarget(null);
  };

  const handleDelete = () => {
    if (!editTarget) return;
    const updated = students.filter((s) => s.name !== editTarget.name);
    if (updated.length === 0) { clearStudents(); setStudents([]); } else { saveStudents(updated); setStudents(updated); }
    setModalMode(null); setEditTarget(null);
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { students: parsed, errors } = parseStudentCSV(e.target?.result as string);
      if (!parsed.length) { setCsvErrors(errors); return; }
      saveStudents(parsed); setStudents(parsed);
      setCsvErrors(errors.length ? errors : []); setCsvOk(true);
    };
    reader.readAsText(file);
  }, [setStudents]);

  const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-slate-400";
  const lblCls   = "block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1.5";

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#f0f4f9" }}>
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="font-black text-base uppercase tracking-wider" style={{ color: NAVY }}>Student Records</h2>
            <p className="text-slate-400 text-xs mt-0.5">WIOA Out Of School · {displayStudents.length} student{displayStudents.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 border border-slate-200 bg-white hover:border-slate-400 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 transition">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload CSV
            </button>
            <button onClick={openAdd} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-black text-white transition hover:opacity-90" style={{ background: NAVY }}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Student
            </button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

        {csvOk && (
          <div className="mb-4 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2">
            <p className="text-xs text-emerald-700 font-bold">✓ {students.length} students loaded from CSV</p>
            <button onClick={() => { clearStudents(); setStudents([]); setCsvOk(false); }} className="text-[10px] text-red-500 hover:text-red-700 font-bold">Clear</button>
          </div>
        )}
        {csvErrors.slice(0, 2).map((e, i) => <p key={i} className="text-xs text-amber-600 mb-1">{e}</p>)}
        {isTestMode && (
          <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-medium">
            Test mode — showing Isaac Nova. Click "Add Student" or upload a CSV to start your real roster.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100" style={{ background: "#f8fafc" }}>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Name</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Work Location / School</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Student ID</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Department</th>
                  <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayStudents.map((s, i) => (
                  <tr key={s.name + i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500">{s.workLocation || <span className="text-slate-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{s.studentId || <span className="text-slate-300 italic">—</span>}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{s.department}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition" title="Edit">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                        </button>
                        <button onClick={() => openDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition" title="Delete">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayStudents.length === 0 && (
            <div className="py-16 text-center">
              <p className="text-slate-400 font-semibold text-sm">No students yet</p>
              <p className="text-slate-300 text-xs mt-1">Upload a CSV or click "Add Student"</p>
            </div>
          )}
        </div>
      </div>

      {(modalMode === "add" || modalMode === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-black text-sm uppercase tracking-wider mb-5" style={{ color: NAVY }}>
              {modalMode === "add" ? "Add Student" : "Edit Student"}
            </h3>
            <div className="space-y-4">
              <div><label className={lblCls}>Full Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="First Last" required />
              </div>
              <div><label className={lblCls}>Department / Program</label>
                <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className={inputCls} placeholder="WIOA Out Of School" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={lblCls}>Student ID</label>
                  <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className={inputCls} placeholder="WD-2024-01" />
                </div>
                <div><label className={lblCls}>Work Location / School</label>
                  <input value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} className={inputCls} placeholder="NVCC" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalMode(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:border-slate-400 transition">Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim()} className="flex-1 rounded-xl py-2.5 text-sm font-black text-white disabled:opacity-40 hover:opacity-90 transition" style={{ background: NAVY }}>
                {modalMode === "add" ? "Add Student" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMode === "delete" && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setModalMode(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 className="font-black text-sm mb-1">Delete {editTarget?.name}?</h3>
            <p className="text-slate-400 text-xs mb-5">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setModalMode(null)} className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-bold text-slate-500 hover:border-slate-400 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 bg-red-500 hover:bg-red-600 rounded-xl py-2.5 text-sm font-black text-white transition">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STUDENT TRACKER — luxury coming soon page
═══════════════════════════════════════════ */
function StudentTrackerPage({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const saved = JSON.parse(localStorage.getItem("tracker-waitlist") || "[]") as string[];
    if (!saved.includes(email.trim())) { saved.push(email.trim()); localStorage.setItem("tracker-waitlist", JSON.stringify(saved)); }
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-y-auto" style={{ background: NAVY }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)`, backgroundSize: "48px 48px", pointerEvents: "none" }} />
      <div style={{ position: "fixed", top: "38%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", borderRadius: "50%", background: `radial-gradient(circle, rgba(197,160,40,0.09) 0%, transparent 68%)`, pointerEvents: "none" }} />

      <div className="relative flex items-center justify-between px-6 sm:px-12 pt-7 pb-2 shrink-0">
        <div className="flex items-center gap-3">
          <CTShield size={32} onDark />
          <div>
            <p className="text-white font-black text-xs uppercase tracking-widest leading-tight">CT State</p>
            <p className="text-white/40 text-[9px] tracking-widest uppercase">Naugatuck Valley</p>
          </div>
        </div>
        <button onClick={onBack} className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-semibold transition px-3 py-2 rounded-xl border border-white/10 hover:border-white/30">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
          Back
        </button>
      </div>

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8"
          style={{ border: `1px solid rgba(197,160,40,0.4)`, background: "rgba(197,160,40,0.1)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: GOLD, animation: "pulse 2s infinite" }} />
          <span className="text-xs font-black uppercase tracking-[0.22em]" style={{ color: GOLD }}>Coming Fall 2026</span>
        </div>
        <h1 className="text-white font-black leading-none mb-5" style={{ fontSize: "clamp(3rem, 9vw, 5.5rem)", letterSpacing: "-0.025em" }}>
          Student <span style={{ color: GOLD }}>Tracker</span>
        </h1>
        <p className="mb-12 max-w-xl leading-relaxed" style={{ color: "rgba(255,255,255,0.5)", fontSize: "clamp(0.875rem, 2.2vw, 1.05rem)" }}>
          Real-time attendance, check-in/check-out, and program analytics —<br className="hidden sm:block" />
          coming Fall 2026.
        </p>
        <div className="flex flex-wrap gap-2 justify-center mb-14">
          {["Attendance Tracking", "Check-In / Check-Out", "Program Analytics", "WIOA Reporting", "Progress Notes", "Export & Print"].map((f) => (
            <span key={f} className="px-3.5 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {f}
            </span>
          ))}
        </div>
        <div className="w-full max-w-sm rounded-2xl p-6"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(12px)" }}>
          <p className="text-white font-black text-sm mb-1">Get notified when it launches</p>
          <p className="mb-4 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>Enter your email and we'll let you know the moment Student Tracker goes live.</p>
          {!submitted ? (
            <form onSubmit={handleNotify} className="flex flex-col gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none"
                style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white" }} />
              <button type="submit" className="w-full py-3 rounded-xl font-black text-sm uppercase tracking-wider transition hover:opacity-90" style={{ background: GOLD, color: "#000" }}>
                Notify Me
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(197,160,40,0.12)", border: "1px solid rgba(197,160,40,0.3)" }}>
              <svg className="w-4 h-4 shrink-0" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              <p className="text-sm font-semibold" style={{ color: GOLD }}>You're on the list!</p>
            </div>
          )}
        </div>
      </div>

      <div className="relative flex items-center justify-between px-6 sm:px-12 py-6 shrink-0">
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "10px" }}>CT State Naugatuck Valley · WAVE Program · WIOA Out Of School</p>
        <p style={{ color: "rgba(255,255,255,0.18)", fontSize: "10px", fontWeight: 600 }}>Nova Systems</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
export default function Dashboard({ onLogout }: Props) {
  const [showHome, setShowHome]       = useState(true);
  const [activeTab, setActiveTab]     = useState<Tab>("timesheet");
  const [students, setStudents]       = useState<Student[]>(() => getStudents());
  const [printQueue, setPrintQueue]   = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting]   = useState(false);

  const isTestMode        = students.length === 0;
  const effectiveStudents = isTestMode ? [TEST_STUDENT] : students;

  const navigateTo = (tab: Tab) => { setActiveTab(tab); setShowHome(false); };

  useEffect(() => {
    if (!printQueue.length) return;
    setIsPrinting(true);
    const tid = setTimeout(() => window.print(), 120);
    const after = () => { setPrintQueue([]); setIsPrinting(false); };
    window.addEventListener("afterprint", after, { once: true });
    return () => { clearTimeout(tid); window.removeEventListener("afterprint", after); };
  }, [printQueue]);

  if (showHome) {
    return (
      <>
        <HomePage onNavigate={navigateTo} onLogout={onLogout} />
        <div className="print-portal" />
      </>
    );
  }

  return (
    <>
      {activeTab !== "tracker" ? (
        <div className="no-print min-h-screen flex flex-col">
          <Header onLogout={onLogout} onHome={() => setShowHome(true)} />
          <TabNav active={activeTab} onChange={setActiveTab} />

          {activeTab === "timesheet" && (
            <TimesheetTab effectiveStudents={effectiveStudents} isTestMode={isTestMode} setPrintQueue={setPrintQueue} isPrinting={isPrinting} />
          )}
          {activeTab === "records" && (
            <StudentRecordsTab students={students} setStudents={setStudents} isTestMode={isTestMode} />
          )}

          {isPrinting && (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full border-[3px] animate-spin mx-auto mb-3" style={{ borderColor: NAVY, borderTopColor: "transparent" }} />
                <p className="font-black text-xs uppercase tracking-widest" style={{ color: NAVY }}>Preparing print…</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <StudentTrackerPage onBack={() => setActiveTab("timesheet")} />
      )}

      <div className="print-portal">
        {printQueue.map((item, i) => (
          <div key={i} className={i < printQueue.length - 1 ? "ts-print-break" : ""}>
            <Timesheet student={item.student} period={item.period} />
          </div>
        ))}
      </div>
    </>
  );
}
