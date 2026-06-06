import { useState, useEffect, useRef, useCallback } from "react";
import { Timesheet } from "../components/Timesheet";
import { getStudents, saveStudents, clearStudents, parseStudentCSV } from "../lib/students";
import type { Student } from "../lib/students";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";
import { downloadTimesheetsZip } from "../lib/zipExport";

const NAVY = "#1B3A6B";
const GOLD = "#C5A028";

interface PrintItem { student: Student; period: PayPeriod; }
interface Props { onLogout: () => void; }

/* ── Header ── */
function Header({ onLogout }: { onLogout: () => void }) {
  return (
    <header
      className="no-print flex items-center justify-between px-5 shrink-0"
      style={{ background: NAVY, borderBottom: `3px solid ${GOLD}`, minHeight: "56px" }}
    >
      <div className="flex items-center gap-3">
        <svg width="144" height="38" viewBox="0 0 144 38" xmlns="http://www.w3.org/2000/svg">
          <path d="M2,2 L28,2 L28,22 L15,34 L2,22 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1" />
          <line x1="2" y1="14" x2="28" y2="14" stroke="white" strokeWidth="2.2" />
          <text x="15" y="13" textAnchor="middle" fill="white" fontSize="8" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
          <text x="15" y="24" textAnchor="middle" fill={GOLD} fontSize="5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">STATE</text>
          <text x="36" y="15" fill="white" fontSize="12" fontWeight="900" fontFamily="Arial,sans-serif">CT STATE</text>
          <text x="36" y="28" fill="white" fontSize="9" fontWeight="400" fontFamily="Arial,sans-serif" opacity="0.75">Naugatuck Valley</text>
        </svg>
        <div className="hidden sm:block h-6 w-px bg-white/20" />
        <div className="hidden sm:block">
          <p className="text-white text-xs font-black uppercase tracking-widest">Timesheet Manager</p>
          <p className="text-white/40 text-[10px] mt-0.5">FY 2027 · WIOA Out Of School</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <p className="text-white text-xs font-bold">Tracy Mahar</p>
          <p className="text-white/50 text-[10px]">Program Coordinator</p>
        </div>
        <button
          onClick={onLogout}
          className="text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
}

/* ── Section heading ── */
function SectionLabel({ num, title }: { num: string; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-black text-white shrink-0"
        style={{ background: NAVY }}
      >
        {num}
      </span>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{title}</p>
    </div>
  );
}

export default function Dashboard({ onLogout }: Props) {
  const [students, setStudents]       = useState<Student[]>(() => getStudents());
  const [selectedName, setSelectedName] = useState<string>(() => getStudents()[0]?.name ?? "");
  const [search, setSearch]           = useState("");
  const [periodIdx, setPeriodIdx]     = useState<number>(() => {
    const cur = findCurrentPayPeriod();
    return cur ? cur.id - 1 : 0;
  });
  const [fromIdx, setFromIdx]         = useState(0);
  const [toIdx, setToIdx]             = useState(PAY_PERIODS.length - 1);
  const [csvErrors, setCsvErrors]     = useState<string[]>([]);
  const [csvOk, setCsvOk]             = useState(false);
  const [printQueue, setPrintQueue]   = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting]   = useState(false);
  const [zipProgress, setZipProgress] = useState<{ done: number; total: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const selectedStudent = students.find((s) => s.name === selectedName);
  const selectedPeriod  = PAY_PERIODS[periodIdx];
  const [lo, hi]        = fromIdx <= toIdx ? [fromIdx, toIdx] : [toIdx, fromIdx];
  const allPeriodCount  = hi - lo + 1;
  const allCount        = students.length * allPeriodCount;
  const filteredStudents = search
    ? students.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : students;

  /* ── Print queue trigger ── */
  useEffect(() => {
    if (!printQueue.length) return;
    setIsPrinting(true);
    const tid = setTimeout(() => window.print(), 120);
    const after = () => { setPrintQueue([]); setIsPrinting(false); };
    window.addEventListener("afterprint", after, { once: true });
    return () => { clearTimeout(tid); window.removeEventListener("afterprint", after); };
  }, [printQueue]);

  /* ── CSV upload ── */
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

  const loadTestData = () => {
    const test: Student[] = [
      { name: "Marcus Johnson",  department: "WIOA Out Of School", studentId: "WD-2024-01" },
      { name: "Destiny Rivera",  department: "WIOA Out Of School", studentId: "WD-2024-02" },
      { name: "Jaylen Thompson", department: "WIOA Out Of School", studentId: "WD-2024-03" },
      { name: "Aaliyah Cruz",    department: "WIOA Out Of School", studentId: "WD-2024-04" },
      { name: "Kevin Martinez",  department: "WIOA Out Of School", studentId: "WD-2024-05" },
    ];
    saveStudents(test);
    setStudents(test);
    setSelectedName(test[0].name);
    setCsvOk(true);
    setCsvErrors([]);
  };

  const printSingle = () => {
    if (!selectedStudent || !selectedPeriod) return;
    setPrintQueue([{ student: selectedStudent, period: selectedPeriod }]);
  };

  const printAll = () => {
    if (!students.length) return;
    const items: PrintItem[] = [];
    for (let pi = lo; pi <= hi; pi++) {
      const p = PAY_PERIODS[pi];
      if (p) students.forEach((s) => items.push({ student: s, period: p }));
    }
    if (!items.length) return;
    setPrintQueue(items);
  };

  const handleZip = async () => {
    if (!students.length) return;
    const periods = PAY_PERIODS.slice(lo, hi + 1);
    setZipProgress({ done: 0, total: students.length * periods.length });
    try {
      await downloadTimesheetsZip(students, periods, (done, total) => setZipProgress({ done, total }));
    } finally {
      setZipProgress(null);
    }
  };

  const btnPrimary = {
    background: NAVY,
    color: "white",
  } as React.CSSProperties;

  return (
    <>
      <div className="no-print min-h-screen flex flex-col" style={{ background: "#f0f4f9" }}>
        <Header onLogout={onLogout} />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Sidebar ── */}
          <aside
            className="flex flex-col border-r border-slate-200 bg-white shrink-0 overflow-y-auto"
            style={{ width: "340px" }}
          >
            <div className="p-4 space-y-5">

              {/* ── Section 1: Student Roster ── */}
              <div>
                <SectionLabel num="1" title="Student Roster" />

                {/* Drop zone */}
                <div
                  onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-xl p-4 text-center cursor-pointer transition group"
                >
                  <svg className="w-6 h-6 mx-auto text-slate-300 group-hover:text-blue-400 mb-1.5 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-400 group-hover:text-blue-500 transition">Upload CSV</p>
                  <p className="text-[10px] text-slate-300 mt-0.5">Name, Department, StudentID</p>
                </div>
                <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={onFileChange} className="hidden" />

                <button
                  onClick={loadTestData}
                  className="w-full mt-2 border border-dashed border-slate-200 hover:border-blue-300 text-slate-400 hover:text-blue-500 rounded-xl py-2 text-[10px] font-bold uppercase tracking-widest transition"
                >
                  Load Test Data (5 Students)
                </button>

                {csvOk && students.length > 0 && (
                  <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                    <p className="text-xs text-emerald-700 font-bold">✓ {students.length} students loaded</p>
                    <button
                      onClick={() => { clearStudents(); setStudents([]); setSelectedName(""); setCsvOk(false); }}
                      className="text-[10px] text-red-500 hover:text-red-700 font-bold"
                    >
                      Clear
                    </button>
                  </div>
                )}
                {csvErrors.slice(0, 2).map((e, i) => (
                  <p key={i} className="text-[10px] text-amber-600 mt-1">{e}</p>
                ))}

                {students.length > 0 && (
                  <div className="mt-3">
                    <div className="relative mb-2">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                      </svg>
                      <input
                        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search students…"
                        className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      />
                    </div>
                    <div className="space-y-1 max-h-44 overflow-y-auto">
                      {filteredStudents.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => setSelectedName(s.name)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs transition"
                          style={selectedName === s.name
                            ? { background: NAVY, color: "white" }
                            : {}}
                        >
                          <p className={`font-semibold ${selectedName === s.name ? "text-white" : "text-slate-700"}`}>{s.name}</p>
                          {s.studentId && (
                            <p className={`text-[10px] ${selectedName === s.name ? "text-white/60" : "text-slate-400"}`}>{s.studentId}</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* ── Section 2: Generate Single Timesheet ── */}
              <div>
                <SectionLabel num="2" title="Generate Timesheet" />
                {students.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Upload a roster first.</p>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Student</label>
                      <select
                        value={selectedName}
                        onChange={(e) => setSelectedName(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white font-semibold"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {students.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Pay Period</label>
                      <select
                        value={periodIdx}
                        onChange={(e) => setPeriodIdx(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none bg-white"
                        onFocus={(e) => e.currentTarget.style.borderColor = NAVY}
                        onBlur={(e) => e.currentTarget.style.borderColor = "#e2e8f0"}
                      >
                        {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>{pp.label}</option>)}
                      </select>
                    </div>
                    <button
                      onClick={printSingle}
                      disabled={isPrinting}
                      className="w-full font-black rounded-xl py-2.5 text-[10px] uppercase tracking-widest transition disabled:opacity-40 flex items-center justify-center gap-2 hover:opacity-90"
                      style={btnPrimary}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                      </svg>
                      Print Timesheet
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* ── Section 3: Generate All ── */}
              <div>
                <SectionLabel num="3" title="Generate All &amp; Print" />
                {students.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Upload a roster first.</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">From PP</label>
                        <select
                          value={fromIdx}
                          onChange={(e) => setFromIdx(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none bg-white"
                        >
                          {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">To PP</label>
                        <select
                          value={toIdx}
                          onChange={(e) => setToIdx(Number(e.target.value))}
                          className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none bg-white"
                        >
                          {PAY_PERIODS.map((pp, i) => <option key={i} value={i}>PP{pp.id}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-xl px-3 py-2 text-[10px] text-slate-500">
                      <strong className="text-slate-700">{students.length}</strong> students &times;{" "}
                      <strong className="text-slate-700">{allPeriodCount}</strong> periods ={" "}
                      <strong style={{ color: NAVY }}>{allCount} timesheets</strong>
                    </div>
                    <button
                      onClick={printAll}
                      disabled={isPrinting}
                      className="w-full bg-slate-700 hover:bg-slate-900 disabled:opacity-40 text-white font-black rounded-xl py-2.5 text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                      </svg>
                      Print All
                    </button>
                  </div>
                )}
              </div>

              <div className="h-px bg-slate-100" />

              {/* ── Section 4: Download ZIP ── */}
              <div>
                <SectionLabel num="4" title="Download All as ZIP" />
                {students.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-2">Upload a roster first.</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Downloads HTML timesheet files for the selected PP range, zipped by student.
                    </p>
                    <button
                      onClick={handleZip}
                      disabled={!!zipProgress || students.length === 0}
                      className="w-full border border-slate-200 hover:border-blue-300 text-slate-600 hover:text-blue-600 disabled:opacity-40 rounded-xl py-2.5 text-[10px] uppercase tracking-widest font-black transition flex items-center justify-center gap-2"
                    >
                      {zipProgress ? (
                        <>
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {zipProgress.done} / {zipProgress.total} files…
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                          </svg>
                          Download ZIP ({allCount} files)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

            </div>
          </aside>

          {/* ── Preview pane ── */}
          <main className="flex-1 overflow-y-auto p-5">
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="w-16 h-16 text-slate-200 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-slate-400 font-semibold text-sm">Upload a student roster to get started</p>
                <p className="text-slate-300 text-xs mt-1">Use section 1 in the sidebar →</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: NAVY }}>
                      {selectedStudent.name}
                    </h2>
                    <p className="text-slate-400 text-xs mt-0.5">{selectedPeriod?.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-semibold">
                      Screen preview
                    </span>
                    <button
                      onClick={printSingle}
                      disabled={isPrinting}
                      className="font-black rounded-xl px-4 py-2 text-[10px] uppercase tracking-widest transition disabled:opacity-40 flex items-center gap-1.5 hover:opacity-90"
                      style={{ background: NAVY, color: "white" }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                      </svg>
                      Print
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200">
                  <div style={{ zoom: "0.71" }}>
                    {selectedPeriod && <Timesheet student={selectedStudent} period={selectedPeriod} />}
                  </div>
                </div>
              </div>
            )}
          </main>
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
