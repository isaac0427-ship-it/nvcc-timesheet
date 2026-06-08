import { useState } from "react";

const NAVY = "#1B3A6B";
const GOLD = "#C5A028";

interface Props {
  supervisorPassword: string;
  onLogin: () => void;
}

function Shield({ size = 72 }: { size?: number }) {
  const s = size / 72;
  return (
    <svg width={size} height={Math.round(88 * s)} viewBox="0 0 72 88" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,4 L68,4 L68,54 L36,84 L4,54 Z" fill={NAVY} />
      <path d="M4,34 L68,34" stroke="white" strokeWidth="3" />
      <text x="36" y="30" textAnchor="middle" fill="white" fontSize="19" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
      <text x="36" y="52" textAnchor="middle" fill={GOLD} fontSize="10" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="2">STATE</text>
    </svg>
  );
}

export default function LoginPage({ supervisorPassword, onLogin }: Props) {
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === supervisorPassword) {
      onLogin();
    } else {
      setError(true);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ background: `linear-gradient(150deg, #0f2040 0%, ${NAVY} 55%, #264d8f 100%)` }}
    >
      <div className="mb-8 text-center select-none">
        <div className="flex justify-center mb-4">
          <Shield size={72} />
        </div>
        <p className="text-white font-black text-xl tracking-widest uppercase leading-none">CT State</p>
        <p className="text-white/70 text-xs font-semibold tracking-[0.22em] uppercase mt-1">Naugatuck Valley</p>
        <div className="mt-4 h-px w-40 mx-auto" style={{ background: GOLD, opacity: 0.4 }} />
        <p className="text-white/50 text-[11px] tracking-[0.18em] uppercase mt-3">
          Timesheet Manager &bull; FY&nbsp;2027
        </p>
      </div>

      <div className="w-full max-w-[360px]">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-5 py-3" style={{ background: NAVY }}>
            <p className="text-white font-black text-[10px] uppercase tracking-widest">Sign In</p>
            <p className="text-white/50 text-[9px] mt-0.5">CT State Naugatuck Valley · WAVE Program</p>
          </div>
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(false); }}
                  placeholder="••••••••"
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none pr-11 transition"
                  style={{ borderColor: error ? "#ef4444" : undefined }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = NAVY; e.currentTarget.style.boxShadow = `0 0 0 3px ${NAVY}18`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#e2e8f0"; e.currentTarget.style.boxShadow = ""; }}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition"
                >
                  {showPw ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
                <p className="text-xs text-red-600 font-medium">Incorrect password. Please try again.</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full font-black rounded-xl py-3 text-xs uppercase tracking-[0.18em] text-white transition-opacity hover:opacity-90"
              style={{ background: NAVY }}
            >
              Sign In →
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
