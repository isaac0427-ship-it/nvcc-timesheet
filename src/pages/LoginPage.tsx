import { useState } from "react";

interface Props {
  tracyEmail: string;
  tracyPassword: string;
  onLoginTracy: () => void;
}

type Mode = "choose" | "supervisor" | "student";

function CTStateShield() {
  return (
    <svg width="64" height="78" viewBox="0 0 64 78" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,4 L60,4 L60,48 L32,74 L4,48 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.5" />
      <path d="M4,30 L60,30" stroke="white" strokeWidth="2.5" />
      <text x="32" y="27" textAnchor="middle" fill="white" fontSize="17" fontWeight="900" fontFamily="Arial, sans-serif">CT</text>
      <text x="32" y="47" textAnchor="middle" fill="#EEC900" fontSize="10" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="2">STATE</text>
    </svg>
  );
}

export default function LoginPage({ tracyEmail, tracyPassword, onLoginTracy }: Props) {
  const [mode, setMode] = useState<Mode>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      email.trim().toLowerCase() === tracyEmail.toLowerCase() &&
      password === tracyPassword
    ) {
      onLoginTracy();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ background: "linear-gradient(160deg, #002060 0%, #003087 55%, #004aad 100%)" }}
    >
      {/* Branding */}
      <div className="mb-10 text-center">
        <div className="flex justify-center mb-4">
          <CTStateShield />
        </div>
        <h1 className="text-white text-2xl font-black tracking-wide uppercase">CT State</h1>
        <p className="text-white/80 font-semibold tracking-widest text-xs uppercase mt-0.5">Naugatuck Valley</p>
        <div className="mt-3 text-white/60 text-xs tracking-widest uppercase">
          Timesheet Management System · FY 2027
        </div>
      </div>

      <div className="w-full max-w-[360px]">
        {/* ── Choose mode ── */}
        {mode === "choose" && (
          <div className="space-y-3">
            <button
              onClick={() => setMode("supervisor")}
              className="w-full bg-white rounded-2xl p-5 text-left shadow-xl hover:shadow-2xl transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#003087] font-black text-sm uppercase tracking-widest">Supervisor</p>
                  <p className="text-slate-500 text-xs mt-1">Access dashboard & generate timesheets</p>
                </div>
                <svg className="w-5 h-5 text-[#003087] group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button
              onClick={() => setMode("student")}
              className="w-full border border-white/25 rounded-2xl p-5 text-left hover:bg-white/10 transition group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold text-sm uppercase tracking-widest">Student</p>
                  <p className="text-white/50 text-xs mt-1">View your timesheet submissions</p>
                </div>
                <svg className="w-5 h-5 text-white/50 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        )}

        {/* ── Supervisor login ── */}
        {mode === "supervisor" && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#003087] px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => { setMode("choose"); setError(false); setEmail(""); setPassword(""); }}
                className="text-white/60 hover:text-white transition text-lg leading-none"
                aria-label="Back"
              >
                ←
              </button>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Supervisor Sign In</h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(false); }}
                  placeholder="supervisor@ctstate.edu"
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/15"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(false); }}
                    placeholder="••••••••"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:border-[#003087] focus:ring-2 focus:ring-[#003087]/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}
                  >
                    {showPw ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-xs text-red-700 font-medium">
                  Invalid email or password. Please try again.
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#003087] hover:bg-[#002060] text-white font-bold rounded-xl py-3 text-xs uppercase tracking-widest transition"
              >
                Sign In
              </button>
            </form>
          </div>
        )}

        {/* ── Student portal ── */}
        {mode === "student" && (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-[#003087] px-6 py-4 flex items-center gap-3">
              <button
                onClick={() => setMode("choose")}
                className="text-white/60 hover:text-white transition text-lg leading-none"
                aria-label="Back"
              >
                ←
              </button>
              <h2 className="text-white font-bold text-sm uppercase tracking-wider">Student Portal</h2>
            </div>
            <div className="p-8 text-center">
              <div className="text-5xl mb-4">🚧</div>
              <p className="text-[#003087] font-black text-lg">Coming Soon</p>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                The student self-service portal is currently under development.
              </p>
              <p className="text-slate-400 text-xs mt-3">
                Please contact your supervisor for timesheet assistance.
              </p>
              <button
                onClick={() => setMode("choose")}
                className="mt-6 text-[#003087] text-sm font-bold hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="mt-10 text-white/30 text-xs text-center">
        Powered by{" "}
        <a
          href="https://nova-systems.app"
          target="_blank"
          rel="noreferrer"
          className="hover:text-white/70 transition underline"
        >
          Nova Systems
        </a>
      </footer>
    </div>
  );
}
