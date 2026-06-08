import type { Student } from "../lib/students";
import type { PayPeriod } from "../data/payPeriods";
import { getPayPeriodDays, formatRangeFull } from "../data/payPeriods";

const NAVY = "#1B3A6B";

interface Props {
  student: Student;
  period: PayPeriod;
}

function CTStateLogo() {
  return (
    <svg width="42" height="44" viewBox="0 0 42 44" xmlns="http://www.w3.org/2000/svg">
      <path d="M2,2 L40,2 L40,28 L21,42 L2,28 Z" fill={NAVY} />
      <rect x="2" y="17" width="38" height="2.5" fill="white" />
      <text x="21" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial,sans-serif">CT</text>
      <text x="21" y="29" textAnchor="middle" fill="#C5A028" fontSize="6.5" fontWeight="700" fontFamily="Arial,sans-serif" letterSpacing="1.5">STATE</text>
    </svg>
  );
}

const ic: React.CSSProperties = { border: "1px solid #000", padding: "2px 4px", verticalAlign: "middle" };
const lbl: React.CSSProperties = { fontSize: "6pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#666", lineHeight: 1.1 };
const val: React.CSSProperties = { fontSize: "8.5pt", fontWeight: "bold", lineHeight: 1.2, marginTop: "1px" };
const blankLine: React.CSSProperties = { ...val, borderBottom: "1px solid #000", minWidth: "80px", display: "block" };
const subCell: React.CSSProperties = { border: "1px solid #000", padding: "2px 4px", verticalAlign: "middle", background: "#e0e8f4", WebkitPrintColorAdjust: "exact", printColorAdjust: "exact" };

function Val({ v }: { v: string }) {
  return v ? <div style={val}>{v}</div> : <div style={blankLine}>&nbsp;</div>;
}

function SigBlock({ title }: { title: string }) {
  const line: React.CSSProperties = { borderBottom: "1px solid #000", marginBottom: "2px" };
  const lineLabel: React.CSSProperties = { fontSize: "5.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.04em", color: "#666", marginBottom: "8px", marginTop: "4px" };
  return (
    <div style={{ padding: "5px 6px 5px 6px", borderTop: "1px solid #ccc" }}>
      <div style={{ fontSize: "6.5pt", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.06em", color: NAVY, marginBottom: "5px" }}>{title}</div>
      <div style={lineLabel}>Name</div>
      <div style={line} />
      <div style={lineLabel}>Signature</div>
      <div style={line} />
      <div style={lineLabel}>Date</div>
      <div style={line} />
    </div>
  );
}

export function Timesheet({ student, period }: Props) {
  const { week1, week2 } = getPayPeriodDays(period);

  return (
    <div className="ts-page">
      <div className="ts-content">

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: `3px solid ${NAVY}`, paddingBottom: "5px", marginBottom: "4px" }}>
          <CTStateLogo />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "11pt", fontWeight: "900", letterSpacing: "0.04em", color: NAVY }}>
              NAUGATUCK VALLEY COMMUNITY COLLEGE
            </div>
            <div style={{ fontSize: "7pt", fontWeight: "700", letterSpacing: "0.07em", marginTop: "2px" }}>
              FOR EMPLOYEES PAID WITH FUNDS FROM FEDERAL GRANTS
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7pt", minWidth: "64px" }}>
            <div style={{ fontWeight: "bold", fontSize: "9pt", color: NAVY }}>FY 2027</div>
            <div>PP {period.id} / 26</div>
          </div>
        </div>

        {/* ── Employee info ── */}
        <table className="ts-table" style={{ marginBottom: "3px" }}>
          <tbody>
            <tr>
              <td style={{ ...ic, width: "36%" }}><div style={lbl}>Employee Name</div><Val v={student.name} /></td>
              <td style={{ ...ic, width: "36%" }}><div style={lbl}>Department / Program</div><Val v={student.department} /></td>
              <td style={{ ...ic, width: "28%" }}><div style={lbl}>Work Location / School</div><Val v={student.workLocation} /></td>
            </tr>
            <tr>
              <td style={ic} colSpan={3}><div style={lbl}>Pay Period</div><div style={val}>{formatRangeFull(period)}</div></td>
            </tr>
            <tr>
              <td style={ic} colSpan={3}>
                <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "8px", fontSize: "6.5pt" }}>Type of Employee:</span>
                <span style={{ marginRight: "3px", fontSize: "10pt" }}>☑</span><span style={{ fontWeight: "bold", marginRight: "12px", fontSize: "8pt" }}>Student</span>
                <span style={{ marginRight: "3px", fontSize: "10pt" }}>☐</span><span style={{ marginRight: "12px", fontSize: "8pt" }}>Educational Assistant</span>
                <span style={{ marginRight: "3px", fontSize: "10pt" }}>☐</span><span style={{ marginRight: "12px", fontSize: "8pt" }}>Full Time</span>
                <span style={{ marginRight: "3px", fontSize: "10pt" }}>☐</span><span style={{ fontSize: "8pt" }}>Part Time</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Time table ── */}
        <table className="ts-table" style={{ marginBottom: "3px" }}>
          <thead>
            <tr>
              <th style={{ width: "7%" }}>Date</th>
              <th style={{ width: "7%" }}>Day</th>
              <th style={{ width: "8%" }}>In</th>
              <th style={{ width: "8%" }}>Out</th>
              <th style={{ width: "7%" }}>Meal</th>
              <th style={{ width: "8%" }}>In</th>
              <th style={{ width: "8%" }}>Out</th>
              <th style={{ width: "10%" }}>Total Hours</th>
              <th style={{ width: "37%" }}>Comments</th>
            </tr>
          </thead>
          <tbody>
            {week1.map((day, i) => (
              <tr key={`w1-${i}`} className="ts-row">
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "7.5pt" }}>{day.formatted}</td>
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "7.5pt" }}>{day.dayName}</td>
                <td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} />
              </tr>
            ))}
            <tr className="ts-subtotal">
              <td colSpan={7} style={{ ...subCell, textAlign: "right", paddingRight: "6px", fontSize: "6.5pt", letterSpacing: "0.05em" }}>SUB TOTAL:</td>
              <td style={subCell} /><td style={subCell} />
            </tr>
            {week2.map((day, i) => (
              <tr key={`w2-${i}`} className="ts-row ts-week2">
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "7.5pt" }}>{day.formatted}</td>
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "7.5pt" }}>{day.dayName}</td>
                <td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} /><td style={ic} />
              </tr>
            ))}
            <tr className="ts-subtotal">
              <td colSpan={7} style={{ ...subCell, textAlign: "right", paddingRight: "6px", fontSize: "6.5pt", letterSpacing: "0.05em" }}>SUB TOTAL:</td>
              <td style={subCell} /><td style={subCell} />
            </tr>
          </tbody>
        </table>

        {/* ── Activities ── */}
        <div style={{ border: "1px solid #000", padding: "3px 6px", marginBottom: "3px", fontSize: "7.5pt" }}>
          <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "6pt", marginRight: "10px" }}>Activities:</span>
          <span style={{ marginRight: "14px" }}><span style={{ fontSize: "6pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Account No.:</span> <strong>HB 3500</strong></span>
          <span style={{ marginRight: "14px" }}><span style={{ fontSize: "6pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Grant Title:</span> <strong>WIOA Out Of School</strong></span>
          <span><span style={{ fontSize: "6pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Percentage:</span> <strong>100%</strong></span>
        </div>

        {/* ── Total Hours box ── */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "3px" }}>
          <div style={{ border: `2px solid ${NAVY}`, padding: "4px 10px", display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "7.5pt", fontWeight: "900", textTransform: "uppercase", letterSpacing: "0.07em", color: NAVY }}>
              Total Hours For Pay Period:
            </span>
            <div style={{ borderBottom: "1.5px solid #000", width: "64px" }}>&nbsp;</div>
          </div>
        </div>

        {/* ── Certification + Signatures ── */}
        <div style={{ border: "1px solid #000", padding: "5px 6px 4px" }}>
          <p style={{ fontSize: "6.5pt", fontStyle: "italic", marginBottom: "5px", lineHeight: 1.35 }}>
            I certify that the above time record is correct and that I worked the hours stated herein in the
            performance of my official duties. I further certify that I did not receive payment from any other source for these hours.
          </p>
          <div>
            <SigBlock title="Employee" />
            <SigBlock title="Supervisor" />
            <SigBlock title="Educational Assistant" />
            <SigBlock title="WAVE Coordinator" />
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: "right", fontSize: "5pt", color: "#bbb", marginTop: "2px" }}>Nova Systems</div>

      </div>
    </div>
  );
}
