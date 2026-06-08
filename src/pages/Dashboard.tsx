// Updated June 2026
import { useState, useEffect, useRef, useCallback } from "react";
import { Timesheet } from "../components/Timesheet";
import { getStudents, saveStudents, clearStudents, parseStudentCSV } from "../lib/students";
import type { Student } from "../lib/students";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";
import { downloadTimesheetsZip } from "../lib/zipExport";

const NAVY = "#1B3A6B";

const TEST_STUDENT: Student = {
  name: "Isaac Nova",
  department: "WIOA Out Of School",
  studentId: "Naugatuck Valley CC",
};

const BLANK_STUDENT: Student = { name: "", department: "", studentId: "" };

type Mode = "byPeriod" | "forStudent" | "all";
interface PrintItem { student: Student; period: PayPeriod; }
interface Props { onLogout: () => void; }

/* ── Header ── */
function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header
      className="no-print flex items-center justify-between px-6 shrink-0"
      style={{ background: NAVY, borderBottom: "3px solid #C5A028", minHeight: "56px" }}
    >
      <div className="flex items-center gap-3">
        <svg width="140" height="36" viewBox="0 0 140 36" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,2 L26,2 L26,20 L14,31 L2,20 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1" />
          <line x1="2" y1="13" x2="26" y2="13" stroke="white" strokeWidth="2" />
          <text x="14" y="12" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
          <text x="14" y="23" textAnchor="middle" fill="#C5A028" fontSize="4.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">STATE</text>
          <text x="34" y="14" fill="white" fontSize="11" fontWeight="900" fontFamily="Arial,sans-serif">CT STATE</text>
          <text x="34" y="26" fill="white" fontSize="8.5" fontWeight="400" fontFamily="Arial,sans-serif" opacity="0.75">Naugatuck Valley</text>
        </svg>
        <div className="hidden sm:block h-5 w-px bg-white/20" />
        <div className="hidden sm:block">
          <p className="text-white text-xs font-black uppercase tracking-widest">Timesheet Manager</p>
          <p className="text-white/40 text-[10px]">FY 2027 · WIOA Out Of School</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
      >
        Sign Out
      </button>
    </header>
  );
}

/* ── Big action button card ── */
function ActionCard({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-7 px-5 text-center transition-all border-2 hover:shadow-md"
      style={
        active
          ? { background: NAVY, borderColor: NAVY, color: "white" }
          : { background: "white", borderColor: "#e2e8f0", color: "#1e293b" }
      }
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center"
        style={active ? { background: "rgba(255,255,255,0.15)" } : { background: "#f1f5f9" }}
      >
        {icon}
      </div>
      <div>
        <p className="font-black text-sm">{title}</p>
        <p
          className="text-xs mt-0.5 leading-snug"
          style={{ color: active ? "rgba(255,255,255,0.65)" : "#94a3b8" }}
        >
          {subtitle}
        </p>
      </div>
    </button>
  );
}

export default function Dashboard({ onLogout }: Props) {
  const [students, setStudents]     = useState<Student[]>(() => getStudents());
  const [mode, setMode]             = useState<Mode>("forStudent");
  const [selectedName, setSelectedName] = useState<string>(() => {
    const s = getStudents();
    return s.length ? s[0].name : TEST_STUDENT.name;
  });
  const [periodIdx, setPeriodIdx]   = useState<number>(() => {
    const cur = findCurrentPayPeriod();
    return cur ? cur.id - 1 : 0;
  });
  const [fromIdx, setFromIdx]       = useState(0);
  const [toIdx, setToIdx]           = useState(PAY_PERIODS.length - 1);
  const [csvErrors, setCsvErrors]   = useState<string[]>([]);
  const [csvOk, setCsvOk]           = useState(false);
  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const isTestMode     = students.length === 0;
  const effectiveStudents = isTestMode ? [TEST_STUDENT] : students;
  const selectedStudent  = effectiveStudents.find((s) => s.name === selectedName) ?? effectiveStudents[0];
  const selectedPeriod   = PAY_PERIODS[periodIdx];
  const [lo, hi]         = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  const allPeriodCount   = hi - lo + 1;
  const allCount         = effectiveStudents.length * allPeriodCount;

  /* keep selectedName in sync when student list changes */
  useEffect(() => {
    if (!effectiveStudents.find((s) => s.name === selectedName)) {
      setSelectedName(effectiveStudents[0]?.name ?? "");
    }
  }, [effectiveStudents, selectedName]);

  /* print queue trigger */
  useEffect(() => {
    if (!printQueue.length) return;
    setIsPrinting(true);
    const tid = setTimeout(() => window.print(), 120);
    const after = () => { setPrintQueue([]); setIsPrinting(false); };
    window.addEventListener("afterprint", after, { once: true });
    return () => { clearTimeout(tid); window.removeEventListener("afterprint", after); };
  }, [printQueue]);

  /* CSV upload */
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const { students: parsed, errors } = parseStudentCSV(e.target?.result as string);
      if (!parsed.length) { setCsvErrors(errors); return; }
      saveStudents(parsed);
      setStudents(parsed);
      setSelectedName(parsed[0].name);
      setCsvErrors(errors.length ? errors : []);
      setCsvOk(true);
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
    e.target.value = "";
  };

  const printByPeriod = () => {
    if (!selectedPeriod) return;
    setPrintQueue([{ student: BLANK_STUDENT, period: selectedPeriod }]);
  };

  const printForStudent = () => {
    if (!selectedStudent || !selectedPeriod) return;
    setPrintQueue([{ student: selectedStudent, period: selectedPeriod }]);
  };

  const printAll = () => {
    const items: PrintItem[] = [];
    for (let pi = lo; pi <= hi; pi++) {
      const p = PAY_PERIODS[pi];
      if (p) effectiveStudents.forEach((s) => items.push({ student: s, period: p }));
    }
    if (!items.length) return;
    setPrintQueue(items);
  };

  const handleZip = async () => {
    const periods = PAY_PERIODS.slice(lo, hi + 1);
    setZipProgress({ done: 0, total: effectiveStudents.length * periods.length });
    try {
      await downloadTimesheetsZip(effectiveStudents, periods, (done, total) => setZipProgress({ done, total }));
    } finally {
      setZipProgress(null);
    }
  };

  /* Determine preview timesheet to show */
  const previewStudent = mode === "byPeriod" ? BLANK_STUDENT : selectedStudent;
  const previewPeriod  = selectedPeriod;

  return (
    <>
      <div className="no-print min-h-screen flex flex-col" style={{ background: "#f0f4f9" }}>
        <Header onLogout={onLogout} />

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-6 space-y-6">

            {/* ── Section 1: Timesheet Generator ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: NAVY }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                  </svg>
                  <p className="text-white font-black text-[10px] uppercase tracking-widest">Section 1</p>
                </div>
                <h2 className="font-black text-base uppercase tracking-wider" style={{ color: NAVY }}>
                  Timesheet Generator
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] text-slate-400 font-medium">WIOA Out Of School · FY 2027</span>
              </div>

            {/* ── Three Action Buttons ── */}
            <div className="flex gap-4">
              <ActionCard
                active={mode === "byPeriod"}
                onClick={() => setMode("byPeriod")}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: mode === "byPeriod" ? "white" : NAVY }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                }
                title="Generate by Pay Period"
                subtitle="Blank timesheet with dates auto-filled"
              />
              <ActionCard
                active={mode === "forStudent"}
                onClick={() => setMode("forStudent")}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: mode === "forStudent" ? "white" : NAVY }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
                title="Generate for Student"
                subtitle="Select student + pay period"
              />
              <ActionCard
                active={mode === "all"}
                onClick={() => setMode("all")}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    style={{ color: mode === "all" ? "white" : NAVY }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                  </svg>
                }
                title="Generate All"
                subtitle="All students × all pay periods"
              />
            </div>

            {/* ── Active Panel ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              {mode === "byPeriod" && (
                <div className="flex gap-8 items-start">
                  <div className="space-y-4 min-w-[260px]">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Pay Period</label>
                      <select
                        value={periodIdx}
                        onChange={(e) => setPeriodIdx(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={printByPeriod}
                      disabled={isPrinting}
                      className="w-full font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white transition disabled:opacity-40 hover:opacity-90"
                      style={{ background: NAVY }}
                    >
                      Print Blank Timesheet
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preview</p>
                    <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                      <div style={{ zoom: "0.68" }}>
                        {previewPeriod && <Timesheet student={BLANK_STUDENT} period={previewPeriod} />}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === "forStudent" && (
                <div className="flex gap-8 items-start">
                  <div className="space-y-4 min-w-[260px]">
                    {isTestMode && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">
                        Test mode — using Isaac Nova. Upload a roster below to switch.
                      </div>
                    )}
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Student</label>
                      <select
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white font-semibold"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {effectiveStudents.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Pay Period</label>
                      <select
                        value={periodIdx}
                        onChange={(e) => setPeriodIdx(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={printForStudent}
                      disabled={isPrinting}
                      className="w-full font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white transition disabled:opacity-40 hover:opacity-90"
                      style={{ background: NAVY }}
                    >
                      Print Timesheet
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Preview</p>
                    <div className="bg-slate-50 rounded-xl overflow-hidden border border-slate-200">
                      <div style={{ zoom: "0.68" }}>
                        {previewPeriod && previewStudent && (
                          <Timesheet student={previewStudent} period={previewPeriod} />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {mode === "all" && (
                <div className="space-y-4 max-w-lg">
                  {isTestMode && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-700 font-medium">
                      Test mode — using Isaac Nova. Upload a roster below to print all students.
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">From Pay Period</label>
                      <select
                        value={fromIdx}
                        onChange={(e) => setFromIdx(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                      >
                        {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">To Pay Period</label>
                      <select
                        value={toIdx}
                        onChange={(e) => setToIdx(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none bg-white"
                      >
                        {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-500">
                    <strong className="text-slate-800">{effectiveStudents.length}</strong> students &times;{" "}
                    <strong className="text-slate-800">{allPeriodCount}</strong> periods ={" "}
                    <strong style={{ color: NAVY }}>{allCount} timesheets</strong>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={printAll}
                      disabled={isPrinting}
                      className="flex-1 font-black rounded-xl py-3 text-xs uppercase tracking-widest text-white transition disabled:opacity-40 hover:opacity-90"
                      style={{ background: NAVY }}
                    >
                      Print All Timesheets
                    </button>
                    <button
                      onClick={handleZip}
                      disabled={!!zipProgress}
                      className="flex-1 border border-slate-200 hover:border-slate-400 text-slate-600 hover:text-slate-800 disabled:opacity-40 rounded-xl py-3 text-xs uppercase tracking-widest font-black transition"
                    >
                      {zipProgress
                        ? `${zipProgress.done} / ${zipProgress.total} files…`
                        : `Download ZIP (${allCount} files)`}
                    </button>
                  </div>
                </div>
              )}
            </div>{/* end active panel */}

            </div>{/* end Section 1 */}

            {/* ── Section 2: Student Tracker ── */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                  style={{ background: NAVY }}
                >
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                  <p className="text-white font-black text-[10px] uppercase tracking-widest">Section 2</p>
                </div>
                <h2 className="font-black text-base uppercase tracking-wider" style={{ color: NAVY }}>
                  Student Tracker
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Coming soon banner */}
              <div
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: NAVY }}
              >
                <div
                  className="px-8 py-10 flex items-center justify-between"
                  style={{ background: NAVY }}
                >
                  <div>
                    <div
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-3"
                      style={{ background: "#C5A028", color: "#000" }}
                    >
                      Coming Soon
                    </div>
                    <h3 className="text-white font-black text-xl mb-1">Student Tracker</h3>
                    <p className="text-white/60 text-sm leading-relaxed max-w-md">
                      Track attendance, hours, progress notes, and program outcomes for every WIOA Out Of School student — all in one place.
                    </p>
                  </div>
                  <div className="hidden md:flex items-center justify-center w-20 h-20 rounded-2xl" style={{ background: "rgba(255,255,255,0.08)" }}>
                    <svg className="w-10 h-10 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
                    </svg>
                  </div>
                </div>
                <div className="px-8 py-4 flex items-center gap-4" style={{ background: "#162f56" }}>
                  <svg className="w-4 h-4 shrink-0" style={{ color: "#C5A028" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                  <p className="text-white/50 text-xs">
                    <span style={{ color: "#C5A028" }} className="font-bold">WAVE Program</span> · CT State Naugatuck Valley · WIOA Out Of School
                  </p>
                </div>
              </div>
            </div>{/* end Section 2 */}

            {/* ── Student Roster ── */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Student Roster</p>

              <div className="flex gap-3 mb-4">
                {/* Drop zone */}
                <div
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer transition group"
                >
                  <svg className="w-5 h-5 mx-auto text-slate-300 group-hover:text-blue-400 mb-1 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400 group-hover:text-blue-500 transition">Upload CSV</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Name, Department, Work Location</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />
              </div>

              {csvOk && students.length > 0 && (
                <div className="mb-3 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  <p className="text-xs text-emerald-700 font-bold">✓ {students.length} students loaded</p>
                  <button
                    onClick={() => { clearStudents(); setStudents([]); setSelectedName(TEST_STUDENT.name); setCsvOk(false); }}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                  >
                    Clear
                  </button>
                </div>
              )}

              {csvErrors.slice(0, 2).map((e, i) => (
                <p key={i} className="text-[10px] text-amber-600 mb-1">{e}</p>
              ))}

              {isTestMode && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-xs text-slate-500 mb-2">
                  <span className="font-bold text-slate-600">Test student:</span> Isaac Nova — WIOA Out Of School · Naugatuck Valley CC
                </div>
              )}

              {!isTestMode && students.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {students.map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-slate-700">{s.name}</span>
                        {s.studentId && <span className="text-slate-400 ml-2">{s.studentId}</span>}
                      </div>
                      <span className="text-slate-400 text-[10px]">{s.department}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Printing overlay */}
        {isPrinting && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center">
              <div
                className="w-8 h-8 rounded-full border-[3px] animate-spin mx-auto mb-3"
                style={{ borderColor: NAVY, borderTopColor: "transparent" }}
              />
              <p className="font-black text-xs uppercase tracking-widest" style={{ color: NAVY }}>
                Preparing print…
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Print portal */}
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
