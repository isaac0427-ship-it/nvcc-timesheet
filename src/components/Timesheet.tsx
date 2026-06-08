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

const ic: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 4px",
  verticalAlign: "middle",
};

const lbl: React.CSSProperties = {
  fontSize: "6.5pt",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#555",
  lineHeight: 1.1,
};

const val: React.CSSProperties = {
  fontSize: "9pt",
  fontWeight: "bold",
  lineHeight: 1.2,
  marginTop: "1px",
};

const blankLine: React.CSSProperties = {
  ...val,
  borderBottom: "1px solid #000",
  minWidth: "100px",
  display: "block",
};

const subCell: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 4px",
  verticalAlign: "middle",
  background: "#e0e8f4",
  WebkitPrintColorAdjust: "exact",
  printColorAdjust: "exact",
};

const sigLabel: React.CSSProperties = {
  fontSize: "6.5pt",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#444",
  marginBottom: "18px",
};

const sigLine: React.CSSProperties = {
  borderBottom: "1px solid #000",
  marginBottom: "4px",
};

const dateLine: React.CSSProperties = {
  fontSize: "6pt",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#555",
  marginTop: "6px",
  marginBottom: "12px",
};

function Val({ v }: { v: string }) {
  if (v) return <div style={val}>{v}</div>;
  return <div style={blankLine}>&nbsp;</div>;
}

export function Timesheet({ student, period }: Props) {
  const { week1, week2 } = getPayPeriodDays(period);

  return (
    <div className="ts-page">
      <div className="ts-content">

        {/* ── Header ── */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          borderBottom: `3px solid ${NAVY}`,
          paddingBottom: "5px",
          marginBottom: "4px",
        }}>
          <CTStateLogo />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "11pt", fontWeight: "900", letterSpacing: "0.04em", color: NAVY }}>
              NAUGATUCK VALLEY COMMUNITY COLLEGE
            </div>
            <div style={{ fontSize: "7.5pt", fontWeight: "700", letterSpacing: "0.07em", marginTop: "2px" }}>
              FOR EMPLOYEES PAID WITH FUNDS FROM FEDERAL GRANTS
            </div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", minWidth: "68px" }}>
            <div style={{ fontWeight: "bold", fontSize: "9pt", color: NAVY }}>FY 2027</div>
            <div>PP {period.id} / 26</div>
          </div>
        </div>

        {/* ── Employee info ── */}
        <table className="ts-table" style={{ marginBottom: "3px" }}>
          <tbody>
            <tr>
              <td style={{ ...ic, width: "36%" }}>
                <div style={lbl}>Employee Name</div>
                <Val v={student.name} />
              </td>
              <td style={{ ...ic, width: "36%" }}>
                <div style={lbl}>Department / Program</div>
                <Val v={student.department} />
              </td>
              <td style={{ ...ic, width: "28%" }}>
                <div style={lbl}>Work Location / School</div>
                <Val v={student.studentId} />
              </td>
            </tr>
            <tr>
              <td style={ic} colSpan={3}>
                <div style={lbl}>Pay Period</div>
                <div style={val}>{formatRangeFull(period)}</div>
              </td>
            </tr>
            <tr>
              <td style={ic} colSpan={3}>
                <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "10px", fontSize: "7pt" }}>
                  Type of Employee:
                </span>
                <span style={{ marginRight: "3px", fontSize: "11pt" }}>☑</span>
                <span style={{ fontWeight: "bold", marginRight: "14px", fontSize: "8.5pt" }}>Student</span>
                <span style={{ marginRight: "3px", fontSize: "11pt" }}>☐</span>
                <span style={{ marginRight: "14px", fontSize: "8.5pt" }}>Educational Assistant</span>
                <span style={{ marginRight: "3px", fontSize: "11pt" }}>☐</span>
                <span style={{ marginRight: "14px", fontSize: "8.5pt" }}>Full Time</span>
                <span style={{ marginRight: "3px", fontSize: "11pt" }}>☐</span>
                <span style={{ fontSize: "8.5pt" }}>Part Time</span>
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
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.formatted}</td>
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.dayName}</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
              </tr>
            ))}
            <tr className="ts-subtotal">
              <td colSpan={7} style={{ ...subCell, textAlign: "right", paddingRight: "6px", fontSize: "7pt", letterSpacing: "0.05em" }}>
                SUB TOTAL:
              </td>
              <td style={subCell}>&nbsp;</td>
              <td style={subCell}>&nbsp;</td>
            </tr>

            {week2.map((day, i) => (
              <tr key={`w2-${i}`} className="ts-row ts-week2">
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.formatted}</td>
                <td style={{ ...ic, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.dayName}</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
                <td style={ic}>&nbsp;</td>
              </tr>
            ))}
            <tr className="ts-subtotal">
              <td colSpan={7} style={{ ...subCell, textAlign: "right", paddingRight: "6px", fontSize: "7pt", letterSpacing: "0.05em" }}>
                SUB TOTAL:
              </td>
              <td style={subCell}>&nbsp;</td>
              <td style={subCell}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* ── Activities ── */}
        <div style={{ border: "1px solid #000", padding: "3px 6px", marginBottom: "3px", fontSize: "8pt" }}>
          <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.08em", fontSize: "6.5pt", marginRight: "12px" }}>Activities:</span>
          <span style={{ marginRight: "16px" }}>
            <span style={{ fontSize: "6.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Account No.:</span>
            {" "}<strong>HB 3500</strong>
          </span>
          <span style={{ marginRight: "16px" }}>
            <span style={{ fontSize: "6.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Grant Title:</span>
            {" "}<strong>WIOA Out Of School</strong>
          </span>
          <span>
            <span style={{ fontSize: "6.5pt", fontWeight: "bold", textTransform: "uppercase", color: "#555" }}>Percentage:</span>
            {" "}<strong>100%</strong>
          </span>
        </div>

        {/* ── Certification ── */}
        <div style={{ border: "1px solid #000", padding: "5px 7px", marginBottom: "3px" }}>
          <p style={{ fontSize: "7pt", fontStyle: "italic", marginBottom: "8px", lineHeight: 1.35 }}>
            I certify that the above time record is correct and that I worked the hours stated herein in the
            performance of my official duties. I further certify that I did not receive payment from any
            other source for these hours.
          </p>

          {/* Row 1: Employee + Supervisor */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "6px" }}>
            <div>
              <div style={sigLabel}>Employee Signature</div>
              <div style={sigLine} />
              <div style={dateLine}>Date</div>
              <div style={sigLine} />
            </div>
            <div>
              <div style={sigLabel}>Supervisor Signature</div>
              <div style={sigLine} />
              <div style={dateLine}>Date</div>
              <div style={sigLine} />
            </div>
          </div>

          {/* Row 2: Educational Assistant + WAVE Coordinator */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <div style={sigLabel}>Educational Assistant Signature</div>
              <div style={sigLine} />
              <div style={dateLine}>Date</div>
              <div style={sigLine} />
            </div>
            <div>
              <div style={sigLabel}>WAVE Coordinator Signature</div>
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-end", marginBottom: "4px" }}>
                <div style={{ flex: 1, ...sigLine }} />
                <div style={{ width: "64px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "5.5pt", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", color: "#444", marginBottom: "14px" }}>
                    Sub Total Hrs
                  </div>
                  <div style={sigLine} />
                </div>
              </div>
              <div style={dateLine}>Date</div>
              <div style={sigLine} />
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ textAlign: "right", fontSize: "5.5pt", color: "#aaa", marginTop: "2px" }}>
          Nova Systems
        </div>

      </div>
    </div>
  );
}
