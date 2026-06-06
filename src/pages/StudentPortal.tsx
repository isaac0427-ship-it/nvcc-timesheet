import { useState, useEffect } from "react";
import { Timesheet } from "../components/Timesheet";
import { PAY_PERIODS, findCurrentPayPeriod } from "../data/payPeriods";
import type { PayPeriod } from "../data/payPeriods";

const NAVY = "#1B3A6B";
const GOLD = "#C5A028";

const DEMO_STUDENT = {
  name: "Demo Student",
  department: "WIOA Out Of School",
  studentId: "DEMO-001",
};

interface Props {
  onBack: () => void;
}

export default function StudentPortal({ onBack }: Props) {
  const currentPP = findCurrentPayPeriod();
  const startIdx = currentPP ? Math.max(0, currentPP.id - 2) : 0;
  const demoPeriodsToShow = PAY_PERIODS.slice(startIdx, startIdx + 6);

  const [printPeriod, setPrintPeriod] = useState<PayPeriod | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!printPeriod) return;
    setIsPrinting(true);
    const tid = setTimeout(() => window.print(), 120);
    const after = () => { setPrintPeriod(null); setIsPrinting(false); };
    window.addEventListener("afterprint", after, { once: true });
    return () => { clearTimeout(tid); window.removeEventListener("afterprint", after); };
  }, [printPeriod]);

  return (
    <>
      <div className="no-print min-h-screen" style={{ background: "#f0f4f9" }}>
        {/* Header */}
        <header
          className="flex items-center justify-between px-5 shadow-md"
          style={{ background: NAVY, borderBottom: `3px solid ${GOLD}`, minHeight: "56px" }}
        >
          <div className="flex items-center gap-3">
            <svg width="120" height="32" viewBox="0 0 120 32" xmlns="http://www.w3.org/2000/svg">
              <path d="M2,2 L22,2 L22,18 L12,28 L2,18 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="white" strokeWidth="1.8" />
              <text x="12" y="11" textAnchor="middle" fill="white" fontSize="6" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
              <text x="12" y="20" textAnchor="middle" fill={GOLD} fontSize="4" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1">STATE</text>
              <text x="30" y="13" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif">CT STATE</text>
              <text x="30" y="23" fill="white" fontSize="7.5" fontWeight="400" fontFamily="Arial,sans-serif" opacity="0.75">Naugatuck Valley</text>
            </svg>
            <div className="hidden sm:block h-5 w-px bg-white/20" />
            <div className="hidden sm:block">
              <p className="text-white text-xs font-black uppercase tracking-widest">Student Portal</p>
              <p className="text-white/40 text-[10px] mt-0.5">FY 2027 · Demo Mode</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="text-white/70 hover:text-white border border-white/20 hover:border-white/50 rounded-lg px-3 py-1.5 text-xs font-semibold transition"
          >
            ← Back to Login
          </button>
        </header>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 py-10">
          <div className="mb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              CT State Naugatuck Valley · WIOA Program
            </p>
            <h1 className="text-2xl font-black mt-1.5" style={{ color: NAVY }}>Your Timesheets</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-semibold text-slate-500">Demo Student</span>
              <span className="text-slate-200">·</span>
              <span
                className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: "#FFF3CD", color: "#856404" }}
              >
                Demo Mode
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-slate-100" style={{ background: NAVY }}>
              <p className="text-white font-black text-[10px] uppercase tracking-widest">Pay Periods</p>
            </div>
            <ul className="divide-y divide-slate-100">
              {demoPeriodsToShow.map((pp) => {
                const isCurrent = currentPP?.id === pp.id;
                const isPast = pp.id < (currentPP?.id ?? 0);
                const dateRange = pp.label.split("—")[0].replace(`PP${pp.id}: `, "").trim();
                return (
                  <li key={pp.id} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold" style={{ color: NAVY }}>Pay Period {pp.id}</p>
                        {isCurrent && (
                          <span
                            className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ background: GOLD, color: "#000" }}
                          >
                            Current
                          </span>
                        )}
                        {isPast && (
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                            Complete
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{dateRange}</p>
                    </div>
                    <button
                      onClick={() => setPrintPeriod(pp)}
                      className="text-xs font-black uppercase tracking-wider px-4 py-2 rounded-xl text-white transition hover:opacity-85"
                      style={{ background: NAVY }}
                    >
                      View &amp; Print
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo mode — full student login coming soon.
          </p>
        </div>
      </div>

      {/* Print portal */}
      <div className="print-portal">
        {printPeriod && <Timesheet student={DEMO_STUDENT} period={printPeriod} />}
      </div>

      {isPrinting && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50 no-print">
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
    </>
  );
}
