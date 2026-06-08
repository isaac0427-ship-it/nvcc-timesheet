// Updated June 2026
import {
  useState, useEffect, useRef, useCallback,
  type ReactNode, type FormEvent,
  type Dispatch, type SetStateAction,
} from "react";
import { Timesheet } from "../components/Timesheet";
import { getStudents, saveStudents, clearStudents, parseStudentCSV } from "../lib/students";
import type { Student } from "../lib/students";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";
import { downloadTimesheetsZip } from "../lib/zipExport";
import ctStateLogo from "../assets/ctstate-logo.png";

/* ── brand tokens ── */
const NAVY  = "#1B3A6B";
const GOLD  = "#C5A028";
const DARK  = "#111827";   // sidebar bg
const CARD_DARK = "#1E293B"; // stat cards

const TEST_STUDENT: Student = {
  name: "Isaac Nova",
  department: "WIOA Out Of School",
  studentId: "WD-2024-01",
  workLocation: "Naugatuck Valley CC",
};
const BLANK_STUDENT: Student = { name: "", department: "", studentId: "", workLocation: "" };

type Tab  = "timesheet" | "records" | "tracker";
type Mode = "byPeriod" | "forStudent" | "all";
interface PrintItem { student: Student; period: PayPeriod; }
interface Props { onLogout: () => void; }

/* ═══════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════ */
interface NavItem { id: Tab | "settings"; label: string; icon: ReactNode; badge?: string; disabled?: boolean; }

function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  const items: NavItem[] = [
    {
      id: "timesheet",
      label: "Timesheet",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
      ),
    },
    {
      id: "records",
      label: "Student Records",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
      ),
    },
    {
      id: "tracker",
      label: "Student Tracker",
      badge: "Soon",
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
      ),
    },
    {
      id: "settings",
      label: "Settings",
      disabled: true,
      icon: (
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <aside className="no-print flex flex-col shrink-0" style={{ width: 228, background: DARK, height: "100vh", position: "sticky", top: 0 }}>
      {/* Logo */}
      <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <img src={ctStateLogo} alt="CT State Community College"
          style={{ height: 30, filter: "brightness(0) invert(1)", opacity: 0.92, display: "block" }} />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "14px 10px", overflowY: "auto" }}>
        {items.map((item) => {
          const isActive = item.id === active;
          const isDisabled = !!item.disabled;
          return (
            <button key={item.id}
              onClick={() => !isDisabled && item.id !== "settings" && onChange(item.id as Tab)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", padding: "10px 12px", marginBottom: 3,
                borderRadius: 8, border: "none", textAlign: "left", cursor: isDisabled ? "not-allowed" : "pointer",
                background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                color: isActive ? "#fff" : "rgba(255,255,255,0.52)",
                opacity: isDisabled ? 0.35 : 1,
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={(e) => { if (!isActive && !isDisabled) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
              <span style={{ flexShrink: 0 }}>{item.icon}</span>
              <span style={{ fontSize: 13.5, fontWeight: isActive ? 600 : 400, flex: 1 }}>{item.label}</span>
              {item.badge && (
                <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 20, background: GOLD, color: "#000", letterSpacing: "0.04em" }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>PD</span>
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", lineHeight: 1.2 }}>Program Director</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>WAVE Program · NVCC</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════
   TOP BAR
═══════════════════════════════════════════ */
function TopBar({ title, sub, onLogout }: { title: string; sub: string; onLogout: () => void }) {
  return (
    <header className="no-print flex items-center gap-4 shrink-0"
      style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 28px", height: 68, zIndex: 10 }}>
      {/* Welcome */}
      <div style={{ minWidth: 0, flex: "0 0 auto" }}>
        <p style={{ fontSize: 11, color: "#94A3B8", marginBottom: 1 }}>Welcome back,</p>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#0F172A", lineHeight: 1.1 }}>{title}</h1>
        <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 1 }}>{sub}</p>
      </div>

      {/* Search */}
      <div style={{ flex: 1, maxWidth: 380, margin: "0 auto" }}>
        <div style={{ position: "relative" }}>
          <svg style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input placeholder="Search students, pay periods…"
            style={{ width: "100%", paddingLeft: 36, paddingRight: 14, paddingTop: 9, paddingBottom: 9, borderRadius: 8, border: "1px solid #E2E8F0", fontSize: 13, background: "#F8FAFC", color: "#0F172A", outline: "none" }}
            onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
            onBlur={(e) => e.currentTarget.style.borderColor = "#E2E8F0"} />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
        <button style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", cursor: "pointer" }}>
          <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>
        <button onClick={onLogout}
          style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
          <div style={{ width: 22, height: 22, borderRadius: "50%", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "#fff" }}>PD</span>
          </div>
          Sign Out
        </button>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════
   STATS CARDS
═══════════════════════════════════════════ */
function StatsCard({ title, value, sub, icon, color = CARD_DARK }: {
  title: string; value: string | number; sub: string; icon?: ReactNode; color?: string;
}) {
  return (
    <div style={{ background: color, borderRadius: 12, padding: "20px 22px", color: "#fff", position: "relative", overflow: "hidden" }}>
      <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>{title}</p>
      <p style={{ fontSize: 30, fontWeight: 900, lineHeight: 1, marginBottom: 6 }}>{value}</p>
      <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{sub}</p>
      {icon && (
        <div style={{ position: "absolute", right: 18, top: 18, opacity: 0.2 }}>
          {icon}
        </div>
      )}
    </div>
  );
}

/* ── card wrapper ── */
function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #E2E8F0", padding: "20px 22px", ...style }}>
      {children}
    </div>
  );
}

/* ── card heading ── */
function CardTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{children}</h2>
      {action}
    </div>
  );
}

/* ═══════════════════════════════════════════
   TIMESHEET TAB
═══════════════════════════════════════════ */
function TimesheetTab({
  effectiveStudents, isTestMode, setPrintQueue, isPrinting, studentCount,
}: {
  effectiveStudents: Student[]; isTestMode: boolean;
  setPrintQueue: Dispatch<SetStateAction<PrintItem[]>>;
  isPrinting: boolean; studentCount: number;
}) {
  const [mode, setMode]           = useState<Mode>("forStudent");
  const [selectedName, setSelectedName] = useState(effectiveStudents[0]?.name ?? "");
  const [periodIdx, setPeriodIdx] = useState(() => { const c = findCurrentPayPeriod(); return c ? c.id - 1 : 0; });
  const [fromIdx, setFromIdx]     = useState(0);
  const [toIdx, setToIdx]         = useState(PAY_PERIODS.length - 1);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);

  const selectedStudent = effectiveStudents.find((s) => s.name === selectedName) ?? effectiveStudents[0];
  const selectedPeriod  = PAY_PERIODS[periodIdx];
  const currentPP       = findCurrentPayPeriod();
  const [lo, hi]        = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  const allCount        = effectiveStudents.length * (hi - lo + 1);

  useEffect(() => {
    if (!effectiveStudents.find((s) => s.name === selectedName)) setSelectedName(effectiveStudents[0]?.name ?? "");
  }, [effectiveStudents, selectedName]);

  const printByPeriod   = () => { if (selectedPeriod) setPrintQueue([{ student: BLANK_STUDENT, period: selectedPeriod }]); };
  const printForStudent = () => { if (selectedStudent && selectedPeriod) setPrintQueue([{ student: selectedStudent, period: selectedPeriod }]); };
  const printAll = () => {
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

  const selCls = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#fff", outline: "none", color: "#0F172A" } as React.CSSProperties;
  const lblCls = { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", color: "#64748B", marginBottom: 6, display: "block" as const };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatsCard title="Total Students" value={studentCount} sub="Active in Program" color={NAVY}
          icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>}
        />
        <StatsCard title="Current Pay Period" value={currentPP ? `PP ${currentPP.id}` : "—"} sub={currentPP ? currentPP.label : "FY 2027"} color={CARD_DARK}
          icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5" /></svg>}
        />
        <StatsCard title="WIOA Program" value="100%" sub="Out Of School · HB 3500" color={CARD_DARK}
          icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" /></svg>}
        />
        <StatsCard title="Pay Periods" value="26" sub="FY 2027 Total" color={CARD_DARK}
          icon={<svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></svg>}
        />
      </div>

      {/* Mode selector + config */}
      <Card>
        <CardTitle>Timesheet Generator</CardTitle>

        {/* Mode tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
          {([["byPeriod", "By Pay Period"], ["forStudent", "For Student"], ["all", "Generate All"]] as [Mode, string][]).map(([m, label]) => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                padding: "7px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: mode === m ? NAVY : "#F1F5F9",
                color: mode === m ? "#fff" : "#64748B",
              }}>
              {label}
            </button>
          ))}
        </div>

        {mode === "byPeriod" && (
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ width: 240, flexShrink: 0 }}>
              <label style={lblCls}>Pay Period</label>
              <select value={periodIdx} onChange={(e) => setPeriodIdx(+e.target.value)} style={selCls}>
                {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
              </select>
              <button onClick={printByPeriod} disabled={isPrinting}
                style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: isPrinting ? 0.5 : 1 }}>
                Print Blank Timesheet
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={lblCls}>Preview</label>
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <div style={{ zoom: "0.62" }}>{selectedPeriod && <Timesheet student={BLANK_STUDENT} period={selectedPeriod} />}</div>
              </div>
            </div>
          </div>
        )}

        {mode === "forStudent" && (
          <div style={{ display: "flex", gap: 24 }}>
            <div style={{ width: 240, flexShrink: 0 }}>
              {isTestMode && (
                <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", marginBottom: 12 }}>
                  Test mode — using Isaac Nova.
                </div>
              )}
              <label style={lblCls}>Student</label>
              <select value={selectedName} onChange={(e) => setSelectedName(e.target.value)} style={{ ...selCls, marginBottom: 12 }}>
                {effectiveStudents.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
              <label style={lblCls}>Pay Period</label>
              <select value={periodIdx} onChange={(e) => setPeriodIdx(+e.target.value)} style={selCls}>
                {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
              </select>
              <button onClick={printForStudent} disabled={isPrinting}
                style={{ marginTop: 14, width: "100%", padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: isPrinting ? 0.5 : 1 }}>
                Print Timesheet
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <label style={lblCls}>Preview</label>
              <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid #E2E8F0", background: "#F8FAFC" }}>
                <div style={{ zoom: "0.62" }}>{selectedPeriod && selectedStudent && <Timesheet student={selectedStudent} period={selectedPeriod} />}</div>
              </div>
            </div>
          </div>
        )}

        {mode === "all" && (
          <div style={{ maxWidth: 480 }}>
            {isTestMode && (
              <div style={{ background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, padding: "8px 12px", fontSize: 12, color: "#92400E", marginBottom: 16 }}>
                Test mode — using Isaac Nova. Add real students in Student Records.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div>
                <label style={lblCls}>From</label>
                <select value={fromIdx} onChange={(e) => setFromIdx(+e.target.value)} style={selCls}>
                  {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                </select>
              </div>
              <div>
                <label style={lblCls}>To</label>
                <select value={toIdx} onChange={(e) => setToIdx(+e.target.value)} style={selCls}>
                  {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                </select>
              </div>
            </div>
            <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: "#475569" }}>
              <strong style={{ color: "#0F172A" }}>{effectiveStudents.length}</strong> students ×{" "}
              <strong style={{ color: "#0F172A" }}>{hi - lo + 1}</strong> periods ={" "}
              <strong style={{ color: NAVY }}>{allCount} timesheets</strong>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={printAll} disabled={isPrinting}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: isPrinting ? 0.5 : 1 }}>
                Print All
              </button>
              <button onClick={handleZip} disabled={!!zipProgress}
                style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#F1F5F9", color: "#475569", fontWeight: 700, fontSize: 13, border: "1px solid #E2E8F0", cursor: "pointer", opacity: zipProgress ? 0.6 : 1 }}>
                {zipProgress ? `${zipProgress.done}/${zipProgress.total}…` : `ZIP (${allCount})`}
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   STUDENT RECORDS TAB
═══════════════════════════════════════════ */
function StudentRecordsTab({
  students, setStudents, isTestMode, studentCount,
}: {
  students: Student[]; setStudents: Dispatch<SetStateAction<Student[]>>;
  isTestMode: boolean; studentCount: number;
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
    const updated = modalMode === "add"
      ? [...(isTestMode ? [] : students), ns]
      : (isTestMode ? [TEST_STUDENT] : students).map((s) => s.name === editTarget?.name ? ns : s);
    saveStudents(updated); setStudents(updated); setModalMode(null); setEditTarget(null);
  };

  const handleDelete = () => {
    if (!editTarget) return;
    const updated = students.filter((s) => s.name !== editTarget.name);
    if (!updated.length) { clearStudents(); setStudents([]); } else { saveStudents(updated); setStudents(updated); }
    setModalMode(null); setEditTarget(null);
  };

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { students: parsed, errors } = parseStudentCSV(e.target?.result as string);
      if (!parsed.length) { setCsvErrors(errors); return; }
      saveStudents(parsed); setStudents(parsed); setCsvErrors(errors.length ? errors : []); setCsvOk(true);
    };
    reader.readAsText(file);
  }, [setStudents]);

  const inpStyle: React.CSSProperties = { width: "100%", border: "1px solid #E2E8F0", borderRadius: 8, padding: "9px 12px", fontSize: 13, background: "#fff", outline: "none", boxSizing: "border-box" };
  const lblStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748B", marginBottom: 5, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatsCard title="Total Students" value={studentCount} sub="WIOA Out Of School" color={NAVY} />
        <StatsCard title="Active Program" value="1" sub="WIOA Out Of School" color={CARD_DARK} />
        <StatsCard title="Grant" value="HB 3500" sub="Federal Funding" color={CARD_DARK} />
        <StatsCard title="Funding" value="100%" sub="Program Coverage" color={CARD_DARK} />
      </div>

      {/* Table */}
      <Card style={{ padding: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", borderBottom: "1px solid #F1F5F9" }}>
          <div>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>Student Records</h2>
            <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{displayStudents.length} student{displayStudents.length !== 1 ? "s" : ""} enrolled</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => fileRef.current?.click()}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontSize: 12, fontWeight: 600, color: "#475569", cursor: "pointer" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
              Upload CSV
            </button>
            <button onClick={openAdd}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 8, background: NAVY, border: "none", fontSize: 12, fontWeight: 700, color: "#fff", cursor: "pointer" }}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Student
            </button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept=".csv,text/csv" style={{ display: "none" }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />

        {csvOk && (
          <div style={{ margin: "0 22px 0", padding: "8px 14px", background: "#ECFDF5", border: "1px solid #A7F3D0", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#065F46" }}>✓ {students.length} students loaded from CSV</span>
            <button onClick={() => { clearStudents(); setStudents([]); setCsvOk(false); }} style={{ fontSize: 11, color: "#EF4444", fontWeight: 700, background: "none", border: "none", cursor: "pointer" }}>Clear</button>
          </div>
        )}
        {csvErrors.slice(0, 2).map((e, i) => <p key={i} style={{ fontSize: 12, color: "#D97706", margin: "6px 22px 0" }}>{e}</p>)}
        {isTestMode && (
          <div style={{ margin: "12px 22px 0", padding: "8px 14px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 8, fontSize: 12, color: "#92400E" }}>
            Test mode — showing Isaac Nova. Add students or upload a CSV to start your real roster.
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F5F9" }}>
                {["Student Name", "Work Location / School", "Student ID", "Program", "Action"].map((h, i) => (
                  <th key={h} style={{ padding: "11px 22px", textAlign: i === 4 ? "right" : "left", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94A3B8", background: "#FAFAFA" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayStudents.map((s, i) => (
                <tr key={s.name + i} style={{ borderBottom: "1px solid #F8FAFC" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#F8FAFC"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <td style={{ padding: "13px 22px", fontWeight: 600, color: "#0F172A" }}>{s.name}</td>
                  <td style={{ padding: "13px 22px", color: "#64748B" }}>{s.workLocation || <span style={{ color: "#CBD5E1", fontStyle: "italic" }}>—</span>}</td>
                  <td style={{ padding: "13px 22px", color: "#64748B", fontFamily: "monospace", fontSize: 12 }}>{s.studentId || <span style={{ color: "#CBD5E1", fontStyle: "italic" }}>—</span>}</td>
                  <td style={{ padding: "13px 22px" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, background: "#EFF6FF", color: "#1D4ED8" }}>{s.department}</span>
                  </td>
                  <td style={{ padding: "13px 22px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button onClick={() => openEdit(s)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", color: "#64748B", display: "flex", alignItems: "center" }} title="Edit">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" /></svg>
                      </button>
                      <button onClick={() => openDelete(s)} style={{ padding: "5px 8px", borderRadius: 6, border: "1px solid #FEE2E2", background: "#FFF5F5", cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center" }} title="Delete">
                        <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {displayStudents.length === 0 && (
            <div style={{ padding: "48px 22px", textAlign: "center" }}>
              <p style={{ color: "#94A3B8", fontWeight: 600, fontSize: 14 }}>No students yet</p>
              <p style={{ color: "#CBD5E1", fontSize: 12, marginTop: 4 }}>Upload a CSV or click "Add Student"</p>
            </div>
          )}
        </div>
      </Card>

      {/* Add/Edit modal */}
      {(modalMode === "add" || modalMode === "edit") && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModalMode(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 440, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#0F172A", marginBottom: 22, textTransform: "uppercase", letterSpacing: "0.04em" }}>{modalMode === "add" ? "Add Student" : "Edit Student"}</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div><label style={lblStyle}>Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inpStyle} placeholder="First Last" /></div>
              <div><label style={lblStyle}>Department / Program</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} style={inpStyle} placeholder="WIOA Out Of School" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div><label style={lblStyle}>Student ID</label><input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} style={inpStyle} placeholder="WD-2024-01" /></div>
                <div><label style={lblStyle}>Work Location</label><input value={form.workLocation} onChange={(e) => setForm({ ...form, workLocation: e.target.value })} style={inpStyle} placeholder="NVCC" /></div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSave} disabled={!form.name.trim()} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: NAVY, color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", opacity: form.name.trim() ? 1 : 0.4 }}>{modalMode === "add" ? "Add Student" : "Save Changes"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {modalMode === "delete" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: 16 }} onClick={() => setModalMode(null)}>
          <div style={{ background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 360, boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "#FEF2F2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              <svg width="18" height="18" style={{ color: "#EF4444" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#0F172A", marginBottom: 6 }}>Delete {editTarget?.name}?</h3>
            <p style={{ fontSize: 12, color: "#94A3B8", marginBottom: 22 }}>This cannot be undone.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setModalMode(null)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", fontWeight: 600, fontSize: 13, color: "#475569", cursor: "pointer" }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: "#EF4444", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   STUDENT TRACKER TAB
═══════════════════════════════════════════ */
function StudentTrackerTab() {
  const [email, setEmail]       = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleNotify = (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const saved = JSON.parse(localStorage.getItem("tracker-waitlist") || "[]") as string[];
    if (!saved.includes(email.trim())) { saved.push(email.trim()); localStorage.setItem("tracker-waitlist", JSON.stringify(saved)); }
    setSubmitted(true);
  };

  const features = ["Attendance Tracking", "Check-In / Check-Out", "Program Analytics", "WIOA Reporting", "Progress Notes", "Export & Print"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16 }}>
        <StatsCard title="Status" value="Soon" sub="Coming Fall 2026" color={NAVY} />
        <StatsCard title="Features" value={features.length.toString()} sub="Planned capabilities" color={CARD_DARK} />
        <StatsCard title="Program" value="WIOA" sub="Out Of School" color={CARD_DARK} />
        <StatsCard title="Launch" value="Fall" sub="2026 Release" color={CARD_DARK} />
      </div>

      {/* Hero card */}
      <Card style={{ background: NAVY, border: "none", position: "relative", overflow: "hidden", minHeight: 360 }}>
        {/* Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)`, backgroundSize: "44px 44px", pointerEvents: "none" }} />
        {/* Glow */}
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle,rgba(197,160,40,0.1) 0%,transparent 65%)`, pointerEvents: "none" }} />

        <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 340, padding: "40px 24px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 30, border: `1px solid rgba(197,160,40,0.4)`, background: "rgba(197,160,40,0.1)", marginBottom: 24 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD }} />
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.22em", color: GOLD }}>Coming Fall 2026</span>
          </div>

          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 900, color: "#fff", lineHeight: 1.05, marginBottom: 14, letterSpacing: "-0.02em" }}>
            Student <span style={{ color: GOLD }}>Tracker</span>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", maxWidth: 500, lineHeight: 1.6, marginBottom: 28 }}>
            Real-time attendance, check-in/check-out, and program analytics — coming Fall 2026.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 32 }}>
            {features.map((f) => (
              <span key={f} style={{ fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {f}
              </span>
            ))}
          </div>

          {/* Email signup */}
          <div style={{ width: "100%", maxWidth: 360, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "20px 22px" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Get notified at launch</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>Enter your email to be first to know.</p>
            {!submitted ? (
              <form onSubmit={handleNotify} style={{ display: "flex", gap: 8 }}>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                  style={{ flex: 1, borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "#fff", padding: "8px 12px", fontSize: 12, outline: "none" }} />
                <button type="submit" style={{ padding: "8px 16px", borderRadius: 8, background: GOLD, color: "#000", fontWeight: 800, fontSize: 12, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
                  Notify Me
                </button>
              </form>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8, background: "rgba(197,160,40,0.12)", border: "1px solid rgba(197,160,40,0.3)" }}>
                <svg width="14" height="14" style={{ color: GOLD, flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                <span style={{ fontSize: 13, fontWeight: 600, color: GOLD }}>You're on the list!</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════ */
const TAB_TITLES: Record<Tab, { title: string; sub: string }> = {
  timesheet: { title: "Program Director", sub: "CT State Community College · Naugatuck Valley" },
  records:   { title: "Student Records",  sub: "CT State Community College · WAVE Program" },
  tracker:   { title: "Student Tracker",  sub: "CT State Community College · Coming Fall 2026" },
};

export default function Dashboard({ onLogout }: Props) {
  const [activeTab, setActiveTab]   = useState<Tab>("timesheet");
  const [students, setStudents]     = useState<Student[]>(() => getStudents());
  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const isTestMode        = students.length === 0;
  const effectiveStudents = isTestMode ? [TEST_STUDENT] : students;
  const studentCount      = isTestMode ? 0 : students.length;

  useEffect(() => {
    if (!printQueue.length) return;
    setIsPrinting(true);
    const tid = setTimeout(() => window.print(), 120);
    const after = () => { setPrintQueue([]); setIsPrinting(false); };
    window.addEventListener("afterprint", after, { once: true });
    return () => { clearTimeout(tid); window.removeEventListener("afterprint", after); };
  }, [printQueue]);

  const { title, sub } = TAB_TITLES[activeTab];

  return (
    <>
      <div className="no-print" style={{ display: "flex", height: "100vh", background: "#F1F5F9", overflow: "hidden" }}>
        <Sidebar active={activeTab} onChange={setActiveTab} />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          <TopBar title={title} sub={sub} onLogout={onLogout} />

          <main style={{ flex: 1, overflowY: "auto", padding: 24 }}>
            {activeTab === "timesheet" && (
              <TimesheetTab effectiveStudents={effectiveStudents} isTestMode={isTestMode} setPrintQueue={setPrintQueue} isPrinting={isPrinting} studentCount={studentCount} />
            )}
            {activeTab === "records" && (
              <StudentRecordsTab students={students} setStudents={setStudents} isTestMode={isTestMode} studentCount={studentCount} />
            )}
            {activeTab === "tracker" && <StudentTrackerTab />}
          </main>
        </div>

        {isPrinting && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 32, height: 32, border: `3px solid ${NAVY}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: NAVY }}>Preparing print…</p>
            </div>
          </div>
        )}
      </div>

      {/* Print portal — always in DOM, shown only when printing */}
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
