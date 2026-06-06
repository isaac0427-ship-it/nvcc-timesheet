import { useState, useEffect, useRef, useCallback } from "react";
import { Timesheet } from "../components/Timesheet";
import { getStudents, saveStudents, clearStudents, parseStudentCSV } from "../lib/students";
import type { Student } from "../lib/students";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";

interface PrintItem {
  student: Student;
  period: PayPeriod;
}

interface Props {
  onLogout: () => void;
}

function CTStateLogo() {
  return (
    <svg width="164" height="40" viewBox="0 0 164 40" xmlns="http://www.w3.org/2000/svg">
      <path d="M3,3 L35,3 L35,24 L19,37 L3,24 Z" fill="#003087" />
      <rect x="3" y="15" width="32" height="2.4" fill="white" />
      <text x="19" y="14" textAnchor="middle" fill="white" fontSize="9" fontWeight="900" fontFamily="Arial, sans-serif">CT</text>
      <text x="19" y="25" textAnchor="middle" fill="#EEC900" fontSize="5.5" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="1.2">STATE</text>
      <text x="43" y="16" fill="#003087" fontSize="13" fontWeight="900" fontFamily="Arial, sans-serif">CT STATE</text>
      <text x="43" y="29" fill="#003087" fontSize="9" fontWeight="500" fontFamily="Arial, sans-serif">Naugatuck Valley</text>
    </svg>
  );
}

export default function Dashboard({ onLogout }: Props) {
  const [students, setStudents] = useState<Student[]>(() => getStudents());
  const [selectedStudentIdx, setSelectedStudentIdx] = useState<number>(0);
  const [selectedPeriodIdx, setSelectedPeriodIdx] = useState<number>(() => {
    const cur = findCurrentPayPeriod();
    return cur ? cur.id - 1 : 0;
  });

  const [fromPeriodIdx, setFromPeriodIdx] = useState<number>(0);
  const [toPeriodIdx, setToPeriodIdx] = useState<number>(PAY_PERIODS.length - 1);

  const [csvError, setCsvError] = useState<string[]>([]);
  const [csvSuccess, setCsvSuccess] = useState(false);

  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Print queue trigger ── */
  useEffect(() => {
    if (printQueue.length === 0) return;
    setIsPrinting(true);
    const tid = setTimeout(() => {
      window.print();
    }, 120);
    const onAfterPrint = () => {
      setPrintQueue([]);
      setIsPrinting(false);
    };
    window.addEventListener("afterprint", onAfterPrint, { once: true });
    return () => {
      clearTimeout(tid);
      window.removeEventListener("afterprint", onAfterPrint);
    };
  }, [printQueue]);

  /* ── CSV upload ── */
  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { students: parsed, errors } = parseStudentCSV(text);
      if (errors.length && !parsed.length) {
        setCsvError(errors);
        setCsvSuccess(false);
        return;
      }
      saveStudents(parsed);
      setStudents(parsed);
      setSelectedStudentIdx(0);
      setCsvError(errors.length ? errors : []);
      setCsvSuccess(true);
    };
    reader.readAsText(file);
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    }
  };

  const handleClearStudents = () => {
    clearStudents();
    setStudents([]);
    setSelectedStudentIdx(0);
    setCsvSuccess(false);
    setCsvError([]);
  };

  /* ── Print actions ── */
  const printSingle = () => {
    if (!students.length) return;
    const student = students[selectedStudentIdx];
    const period = PAY_PERIODS[selectedPeriodIdx];
    if (!student || !period) return;
    setPrintQueue([{ student, period }]);
  };

  const printAll = () => {
    if (!students.length) return;
    const from = fromPeriodIdx;
    const to = toPeriodIdx;
    const [lo, hi] = from <= to ? [from, to] : [to, from];
    const items: PrintItem[] = [];
    for (let pi = lo; pi <= hi; pi++) {
      const period = PAY_PERIODS[pi];
      if (!period) continue;
      for (const student of students) {
        items.push({ student, period });
      }
    }
    if (items.length) setPrintQueue(items);
  };

  const selectedStudent = students[selectedStudentIdx];
  const selectedPeriod = PAY_PERIODS[selectedPeriodIdx];

  const allCount =
    students.length * (Math.abs(toPeriodIdx - fromPeriodIdx) + 1);

  return (
    <>
      {/* ── App shell (hidden in print) ── */}
      <div className="no-print min-h-screen flex flex-col" style={{ background: "#f0f4f9" }}>
        {/* Top nav */}
        <header
          className="flex items-center justify-between px-5 py-3 shadow-md"
          style={{ background: "#003087" }}
        >
          <div className="flex items-center gap-4">
            <CTStateLogo />
            <div className="hidden sm:block h-8 w-px bg-white/20" />
            <div className="hidden sm:block">
              <p className="text-white text-xs font-bold uppercase tracking-widest leading-none">
                Timesheet Manager
              </p>
              <p className="text-white/50 text-[10px] mt-0.5">FY 2027 · WIOA Out Of School</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
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

        {/* Main content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* ── Left sidebar ── */}
          <aside
            className="flex flex-col gap-4 p-4 overflow-y-auto"
            style={{ width: "340px", minWidth: "340px", borderRight: "1px solid #d1dae6", background: "white" }}
          >
            {/* CSV Upload */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-[#003087] px-4 py-2.5">
                <p className="text-white font-bold text-xs uppercase tracking-widest">1 · Student Roster</p>
              </div>
              <div className="p-4">
                {/* Drop zone */}
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-[#003087] rounded-xl p-5 text-center cursor-pointer transition group"
                >
                  <svg className="w-8 h-8 mx-auto text-slate-300 group-hover:text-[#003087] transition mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                  <p className="text-xs font-semibold text-slate-500 group-hover:text-[#003087]">
                    Drop CSV or click to upload
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Columns: Name, Department, Student ID</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={onFileChange}
                  className="hidden"
                />

                {csvSuccess && students.length > 0 && (
                  <div className="mt-3 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                    <p className="text-xs text-green-700 font-semibold">
                      ✓ {students.length} student{students.length !== 1 ? "s" : ""} loaded
                    </p>
                    <button onClick={handleClearStudents} className="text-[10px] text-red-500 hover:text-red-700 font-bold">
                      Clear
                    </button>
                  </div>
                )}

                {csvError.length > 0 && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2">
                    <p className="text-[10px] font-bold text-yellow-700 mb-1">Parse warnings:</p>
                    {csvError.slice(0, 3).map((e, i) => (
                      <p key={i} className="text-[10px] text-yellow-600">{e}</p>
                    ))}
                  </div>
                )}

                {students.length === 0 && !csvSuccess && (
                  <p className="text-[10px] text-slate-400 mt-2 text-center">
                    No students loaded. Upload a CSV to begin.
                  </p>
                )}
              </div>
            </div>

            {/* Generate Single */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-[#003087] px-4 py-2.5">
                <p className="text-white font-bold text-xs uppercase tracking-widest">2 · Generate Timesheet</p>
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Student
                  </label>
                  <select
                    value={selectedStudentIdx}
                    onChange={(e) => setSelectedStudentIdx(Number(e.target.value))}
                    disabled={students.length === 0}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087] disabled:opacity-40 bg-white"
                  >
                    {students.length === 0 ? (
                      <option>— Upload CSV first —</option>
                    ) : (
                      students.map((s, i) => (
                        <option key={i} value={i}>
                          {s.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    Pay Period
                  </label>
                  <select
                    value={selectedPeriodIdx}
                    onChange={(e) => setSelectedPeriodIdx(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#003087] bg-white"
                  >
                    {PAY_PERIODS.map((pp, i) => (
                      <option key={i} value={i}>
                        {pp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={printSingle}
                  disabled={students.length === 0 || isPrinting}
                  className="w-full bg-[#003087] hover:bg-[#002060] disabled:opacity-40 text-white font-bold rounded-xl py-2.5 text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Print This Timesheet
                </button>
              </div>
            </div>

            {/* Generate All */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-700 px-4 py-2.5">
                <p className="text-white font-bold text-xs uppercase tracking-widest">3 · Generate All</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-[10px] text-slate-500">
                  Print timesheets for <strong>all students</strong> across a pay period range.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      From PP
                    </label>
                    <select
                      value={fromPeriodIdx}
                      onChange={(e) => setFromPeriodIdx(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[#003087] bg-white"
                    >
                      {PAY_PERIODS.map((pp, i) => (
                        <option key={i} value={i}>PP{pp.id}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      To PP
                    </label>
                    <select
                      value={toPeriodIdx}
                      onChange={(e) => setToPeriodIdx(Number(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl px-2 py-2 text-xs focus:outline-none focus:border-[#003087] bg-white"
                    >
                      {PAY_PERIODS.map((pp, i) => (
                        <option key={i} value={i}>PP{pp.id}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl px-3 py-2 text-[10px] text-slate-500">
                  {students.length === 0 ? (
                    "Upload students first."
                  ) : (
                    <>
                      <strong className="text-slate-700">{students.length}</strong> students ×{" "}
                      <strong className="text-slate-700">
                        {Math.abs(toPeriodIdx - fromPeriodIdx) + 1}
                      </strong>{" "}
                      pay periods ={" "}
                      <strong className="text-[#003087]">{allCount} timesheets</strong>
                    </>
                  )}
                </div>

                <button
                  onClick={printAll}
                  disabled={students.length === 0 || isPrinting}
                  className="w-full bg-slate-700 hover:bg-slate-900 disabled:opacity-40 text-white font-bold rounded-xl py-2.5 text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5zm-3 0h.008v.008H15V10.5z" />
                  </svg>
                  Generate All &amp; Print
                </button>
              </div>
            </div>

            {/* CSV format hint */}
            <div className="rounded-2xl border border-dashed border-slate-200 p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">CSV Format</p>
              <pre className="text-[9px] text-slate-500 font-mono leading-relaxed bg-slate-50 rounded-lg p-2">
{`Name,Department,StudentID
Jane Smith,Workforce Dev,WD-2024-01
John Doe,Adult Ed,AE-2024-02`}
              </pre>
              <p className="text-[9px] text-slate-400 mt-2">Header row is optional. Student ID is optional.</p>
            </div>
          </aside>

          {/* ── Preview pane ── */}
          <main className="flex-1 overflow-y-auto p-6">
            {!selectedStudent ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <svg className="w-20 h-20 text-slate-200 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-slate-400 font-semibold text-sm">Upload a CSV to preview timesheets</p>
                <p className="text-slate-300 text-xs mt-1">Timesheets appear here before printing</p>
              </div>
            ) : (
              <div>
                {/* Preview header */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-slate-700 font-bold text-sm">{selectedStudent.name}</h2>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {selectedPeriod?.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">
                      Preview (screen only)
                    </span>
                    <button
                      onClick={printSingle}
                      disabled={isPrinting}
                      className="bg-[#003087] hover:bg-[#002060] disabled:opacity-40 text-white font-bold rounded-xl px-4 py-2 text-xs uppercase tracking-widest transition flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.056 48.056 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659" />
                      </svg>
                      Print
                    </button>
                  </div>
                </div>

                {/* Scaled preview — mimics letter paper */}
                <div
                  className="bg-white rounded-2xl shadow-xl overflow-hidden"
                  style={{ border: "1px solid #d1dae6" }}
                >
                  <div style={{ zoom: "0.72" }}>
                    {selectedPeriod && (
                      <Timesheet student={selectedStudent} period={selectedPeriod} />
                    )}
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
              <div className="w-8 h-8 border-3 border-[#003087] border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderWidth: "3px" }} />
              <p className="text-[#003087] font-bold text-sm uppercase tracking-widest">Preparing print…</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Print portal (hidden on screen, shown when printing) ── */}
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
