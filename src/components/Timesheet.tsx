import type { Student } from "../lib/students";
import type { PayPeriod } from "../data/payPeriods";
import { getPayPeriodDays, formatRangeFull } from "../data/payPeriods";

interface Props {
  student: Student;
  period: PayPeriod;
}

function CTStateLogo() {
  return (
    <svg width="196" height="48" viewBox="0 0 196 48" xmlns="http://www.w3.org/2000/svg">
      <path d="M4,4 L42,4 L42,28 L23,44 L4,28 Z" fill="#003087" />
      <rect x="4" y="18" width="38" height="2.8" fill="white" />
      <text x="23" y="17" textAnchor="middle" fill="white" fontSize="10" fontWeight="900" fontFamily="Arial, sans-serif">CT</text>
      <text x="23" y="30" textAnchor="middle" fill="#EEC900" fontSize="6.5" fontWeight="700" fontFamily="Arial, sans-serif" letterSpacing="1.5">STATE</text>
      <text x="50" y="19" fill="#003087" fontSize="15" fontWeight="900" fontFamily="Arial, sans-serif">CT STATE</text>
      <text x="50" y="34" fill="#003087" fontSize="10" fontWeight="500" fontFamily="Arial, sans-serif">Naugatuck Valley</text>
    </svg>
  );
}

const cell: React.CSSProperties = {
  border: "1px solid #000",
  padding: "2px 4px",
  verticalAlign: "middle",
};

const labelStyle: React.CSSProperties = {
  fontSize: "6.5pt",
  fontWeight: "bold",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#555",
  lineHeight: 1.1,
};

const valueStyle: React.CSSProperties = {
  fontSize: "9pt",
  fontWeight: "bold",
  lineHeight: 1.2,
  marginTop: "1px",
};

export function Timesheet({ student, period }: Props) {
  const { week1, week2 } = getPayPeriodDays(period);
  const allDays = [...week1, ...week2];

  return (
    <div className="ts-page">
      {/* Watermark */}
      <div className="ts-watermark">
        VALID ONLY WITH SUPERVISOR SIGNATURE<br />— Nova Systems —
      </div>

      <div className="ts-content">
        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", borderBottom: "2px solid #000", paddingBottom: "5px", marginBottom: "5px" }}>
          <CTStateLogo />
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "13pt", fontWeight: "900", letterSpacing: "0.04em" }}>STUDENT TIMESHEET</div>
            <div style={{ fontSize: "8pt", fontWeight: "600" }}>For Employees Paid with Funds from Federal Grants</div>
            <div style={{ fontSize: "7.5pt", color: "#444" }}>CT State Naugatuck Valley Community College</div>
          </div>
          <div style={{ textAlign: "right", fontSize: "7.5pt", minWidth: "72px" }}>
            <div style={{ fontWeight: "bold", fontSize: "9pt" }}>FY 2027</div>
            <div>PP {period.id} / 26</div>
          </div>
        </div>

        {/* ── Student info ── */}
        <table className="ts-table" style={{ marginBottom: "4px" }}>
          <tbody>
            <tr>
              <td style={{ ...cell, width: "34%" }}>
                <div style={labelStyle}>Employee Name</div>
                <div style={valueStyle}>{student.name}</div>
              </td>
              <td style={{ ...cell, width: "34%" }}>
                <div style={labelStyle}>Department / Program</div>
                <div style={valueStyle}>{student.department}</div>
              </td>
              <td style={{ ...cell, width: "32%" }}>
                <div style={labelStyle}>Student ID</div>
                <div style={valueStyle}>{student.studentId || "—"}</div>
              </td>
            </tr>
            <tr>
              <td style={{ ...cell }} colSpan={2}>
                <div style={labelStyle}>Pay Period</div>
                <div style={valueStyle}>{formatRangeFull(period)}</div>
              </td>
              <td style={cell}>
                <div style={labelStyle}>Pay Period #</div>
                <div style={valueStyle}>{period.id} of 26</div>
              </td>
            </tr>
            <tr>
              <td style={cell}>
                <div style={labelStyle}>Account No.</div>
                <div style={valueStyle}>HB 3500</div>
              </td>
              <td style={cell}>
                <div style={labelStyle}>Grant Title</div>
                <div style={valueStyle}>WIOA Out Of School</div>
              </td>
              <td style={cell}>
                <div style={labelStyle}>Percentage</div>
                <div style={valueStyle}>100%</div>
              </td>
            </tr>
            <tr>
              <td style={{ ...cell, fontSize: "8pt" }} colSpan={3}>
                <span style={{ fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginRight: "10px", fontSize: "7pt" }}>
                  Type of Employee:
                </span>
                <span style={{ marginRight: "4px", fontSize: "11pt" }}>☑</span>
                <span style={{ fontWeight: "bold", marginRight: "16px", fontSize: "8.5pt" }}>Student</span>
                <span style={{ marginRight: "4px", fontSize: "11pt" }}>☐</span>
                <span style={{ fontSize: "8.5pt" }}>Part-Time</span>
                <span style={{ marginLeft: "16px", marginRight: "4px", fontSize: "11pt" }}>☐</span>
                <span style={{ fontSize: "8.5pt" }}>Full-Time</span>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Time table ── */}
        <table className="ts-table" style={{ marginBottom: "4px" }}>
          <thead>
            <tr>
              <th style={{ width: "7%" }}>Date</th>
              <th style={{ width: "7%" }}>Day</th>
              <th style={{ width: "8%" }}>Time In</th>
              <th style={{ width: "8%" }}>Time Out</th>
              <th style={{ width: "8%" }}>Time In</th>
              <th style={{ width: "8%" }}>Time Out</th>
              <th style={{ width: "10%" }}>Total Hrs</th>
              <th style={{ width: "44%" }}>Comments / Activity Description</th>
            </tr>
          </thead>
          <tbody>
            {allDays.map((day, i) => (
              <>
                {i === 7 && (
                  <tr key="sep" className="ts-week-sep">
                    <td colSpan={8} style={{ height: "10pt" }}>— Week 2 —</td>
                  </tr>
                )}
                <tr key={i} className="ts-row" style={i < 7 ? {} : { backgroundColor: "rgba(0,0,48,0.015)" }}>
                  <td style={{ ...cell, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.formatted}</td>
                  <td style={{ ...cell, textAlign: "center", fontWeight: "bold", fontSize: "8pt" }}>{day.dayName}</td>
                  <td style={cell}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                  <td style={cell}>&nbsp;</td>
                </tr>
              </>
            ))}
            <tr>
              <td colSpan={6} style={{ ...cell, textAlign: "right", fontWeight: "bold", fontSize: "8pt", paddingRight: "6px" }}>
                TOTAL HOURS FOR PAY PERIOD:
              </td>
              <td style={{ ...cell, fontWeight: "bold" }}>&nbsp;</td>
              <td style={cell}>&nbsp;</td>
            </tr>
          </tbody>
        </table>

        {/* ── Certification & Signatures ── */}
        <div style={{ border: "1px solid #000", padding: "5px 7px", marginBottom: "4px" }}>
          <p style={{ fontSize: "7.5pt", fontStyle: "italic", marginBottom: "7px", lineHeight: 1.3 }}>
            I certify that the above time record is correct and that I worked the hours stated herein in the
            performance of my official duties. I further certify that I did not receive payment from any
            other source for these hours.
          </p>

          {/* Sig row 1 + 2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "8px" }}>
            {/* Employee */}
            <div>
              <div style={{ ...labelStyle, marginBottom: "14px" }}>Employee Signature</div>
              <div style={{ borderBottom: "1px solid #000" }} />
              <div style={{ marginTop: "7px", ...labelStyle, marginBottom: "14px" }}>Date</div>
              <div style={{ borderBottom: "1px solid #000" }} />
            </div>
            {/* Supervisor */}
            <div>
              <div style={{ ...labelStyle, marginBottom: "14px" }}>Supervisor Signature &amp; Total Hours Verified</div>
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
                <div style={{ flex: 1, borderBottom: "1px solid #000" }} />
                <div style={{ width: "60px", textAlign: "center" }}>
                  <div style={{ ...labelStyle, fontSize: "5.5pt", marginBottom: "14px" }}>Total Hrs</div>
                  <div style={{ borderBottom: "1px solid #000" }} />
                </div>
              </div>
              <div style={{ marginTop: "7px", ...labelStyle, marginBottom: "14px" }}>Date</div>
              <div style={{ borderBottom: "1px solid #000" }} />
            </div>
          </div>

          {/* Sig row 3: Director */}
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
            <div>
              <div style={{ ...labelStyle, marginBottom: "14px" }}>Director / Dean Signature</div>
              <div style={{ borderBottom: "1px solid #000" }} />
            </div>
            <div>
              <div style={{ ...labelStyle, marginBottom: "14px" }}>Date</div>
              <div style={{ borderBottom: "1px solid #000" }} />
            </div>
          </div>
        </div>

        {/* ── Footer row: attribution + payroll box ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "10px" }}>
          <div style={{ fontSize: "6.5pt", color: "#777" }}>
            Powered by <strong>Nova Systems</strong> · nova-systems.app
          </div>
          <div style={{
            border: "2px solid #000",
            padding: "5px 9px",
            fontSize: "8pt",
            minWidth: "220px",
          }}>
            <div style={{
              fontWeight: "bold",
              textAlign: "center",
              borderBottom: "1px solid #000",
              paddingBottom: "3px",
              marginBottom: "5px",
              fontSize: "7pt",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}>
              For Payroll Office Only
            </div>
            <div style={{ marginBottom: "5px" }}>
              ________ Hrs &nbsp;@&nbsp; $________ = $_________
            </div>
            <div style={{ borderTop: "1px solid #000", paddingTop: "5px", fontSize: "7.5pt" }}>
              Checked by: _____________ &nbsp; Date: __________
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
