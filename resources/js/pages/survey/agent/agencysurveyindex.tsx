import { useState, useEffect, useCallback } from "react";

// ── Design tokens (kept consistent with the survey form) ──
const PRIMARY = "#0ea5e9";
const AMBER   = "#fbbf24";
const DARK    = "#0a0a0a";
const SURFACE = "#F8FAFB";

// ── Option lists (mirrors AgencyReadinessSurveyForm.tsx — used for filter dropdowns) ──
const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
const RECRUITMENT_TYPES = ["Local (Domestic Students)", "International Students", "Both Local and International Students", "No"];
const LIKELIHOOD_OPTIONS = ["Very Unlikely", "Unlikely", "Neutral", "Likely", "Very Likely"];

// ── Types ──
interface RatingMap { [key: string]: string }

interface AgencySurveyRow {
  id: number;
  agency_name: string;
  province: string;
  years_in_operation: string;
  recruitment_type: string;
  local_students_recruited: number | null;
  international_students_recruited: number | null;
  aware_of_commissions: string;
  interested_in_partnering: string;
  currently_represents_institution: string;
  represented_institutions: string | null;
  readiness_ratings: RatingMap;
  challenges: string[];
  challenges_other_text: string | null;
  interested_in_training: string;
  academic_programs: string[];
  academic_programs_other_text: string | null;
  b2b_portal_useful: string;
  encouraging_factors: string[];
  encouraging_factors_other_text: string | null;
  interested_in_events: string;
  priority_markets: string[];
  priority_markets_other_text: string | null;
  minimum_commission: string;
  annual_recruitment_capacity: string;
  likelihood_official_partner: string;
  top_recommendations: string | null;
  willing_future_participation: string;
  contact_details: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
  updated_at: string;
}

interface StatItem { label: string; count: number }
interface ReadinessAverage { statement: string; average: number }

interface StatsData {
  total?: number;
  provinces_represented?: number;
  partnering_yes_pct?: number;
  likely_partner_pct?: number;
  avg_readiness_score?: number | null;
  by_province?: StatItem[];
  by_years_in_operation?: StatItem[];
  by_recruitment_type?: StatItem[];
  interested_in_partnering?: StatItem[];
  likelihood_official_partner?: StatItem[];
  b2b_portal_useful?: StatItem[];
  interested_in_training?: StatItem[];
  interested_in_events?: StatItem[];
  top_challenges?: StatItem[];
  top_academic_programs?: StatItem[];
  top_encouraging_factors?: StatItem[];
  top_priority_markets?: StatItem[];
  readiness_statement_averages?: ReadinessAverage[];
}

// ── Strip any stray numeric-prefixed keys, and JSON-decode any
//    array/object columns that might arrive as raw strings ──
function sanitizeRow(raw: Record<string, unknown>): AgencySurveyRow {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^\d+\./.test(k)) continue;
    clean[k] = v;
  }
  const jsonKeys = ["readiness_ratings", "challenges", "academic_programs", "encouraging_factors", "priority_markets"];
  for (const key of jsonKeys) {
    if (typeof clean[key] === "string") {
      try { clean[key] = JSON.parse(clean[key] as string); } catch { /* leave as-is */ }
    }
  }
  if (!Array.isArray(clean.challenges)) clean.challenges = clean.challenges ? [clean.challenges] : [];
  if (!Array.isArray(clean.academic_programs)) clean.academic_programs = clean.academic_programs ? [clean.academic_programs] : [];
  if (!Array.isArray(clean.encouraging_factors)) clean.encouraging_factors = clean.encouraging_factors ? [clean.encouraging_factors] : [];
  if (!Array.isArray(clean.priority_markets)) clean.priority_markets = clean.priority_markets ? [clean.priority_markets] : [];
  if (!clean.readiness_ratings || typeof clean.readiness_ratings !== "object") clean.readiness_ratings = {};
  return clean as unknown as AgencySurveyRow;
}

// ── Colour maps ──
const LIKERT_COLORS: Record<string, string> = {
  "Strongly Disagree": "#ef4444",
  "Disagree": "#f97316",
  "Neutral": AMBER,
  "Agree": PRIMARY,
  "Strongly Agree": "#10b981",
};
const likertColor = (v: string): string => LIKERT_COLORS[v] ?? "#94a3b8";

const LIKELIHOOD_COLORS: Record<string, string> = {
  "Very Unlikely": "#ef4444",
  "Unlikely": "#f97316",
  "Neutral": AMBER,
  "Likely": PRIMARY,
  "Very Likely": "#10b981",
};
const likelihoodColor = (v: string): string => LIKELIHOOD_COLORS[v] ?? "#94a3b8";

// Generic Yes / No / Maybe-ish answer colouring (covers aware_of_commissions,
// interested_in_partnering, b2b_portal_useful, interested_in_training, etc.)
const yesNoMaybeColor = (v: string): string => {
  if (v === "Yes") return "#10b981";
  if (v === "No") return "#ef4444";
  if (v === "Maybe" || v === "Not Sure") return AMBER;
  return "#94a3b8";
};

const scoreToLikertLabel = (score: number): string => {
  const order = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
  const idx = Math.min(Math.max(Math.round(score) - 1, 0), 4);
  return order[idx];
};

// ── helpers ──
const joinList = (v: string[] | string | undefined | null): string => {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
};

// ── Components ──
interface BadgeProps { text: string; color: string }
const Badge = ({ text, color }: BadgeProps) => (
  <span style={{
    display: "inline-flex", alignItems: "center",
    padding: "0.2rem 0.7rem", borderRadius: "999px",
    background: `${color}18`, color,
    fontFamily: "Rajdhani, sans-serif", fontSize: "0.7rem", fontWeight: "700",
    letterSpacing: "0.1em", textTransform: "uppercase" as const,
    border: `1px solid ${color}40`, whiteSpace: "nowrap" as const,
  }}>{text}</span>
);

interface SectionHeaderProps { number: string | number; title: string }
const SectionHeader = ({ number, title }: SectionHeaderProps) => (
  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.75rem 0 1rem" }}>
    <span style={{ fontFamily: "'Castoro Titling', serif", color: PRIMARY, fontSize: "1.4rem", fontWeight: "700", lineHeight: 1, minWidth: 28 }}>
      {String(number).padStart(2, "0")}
    </span>
    <div style={{ flex: 1, height: 1, background: `${PRIMARY}25` }} />
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "#555", fontWeight: "700", whiteSpace: "nowrap" as const }}>{title}</span>
    <div style={{ flex: 1, height: 1, background: `${PRIMARY}25` }} />
  </div>
);

interface FieldRowProps { label: string; value?: string | null }
const FieldRow = ({ label, value }: FieldRowProps) => (
  <div style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#94a3b8", minWidth: 220, flexShrink: 0, paddingTop: "0.1rem" }}>{label}</span>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: DARK, flex: 1 }}>
      {value || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>—</span>}
    </span>
  </div>
);

interface RatingGridProps { title: string; data?: RatingMap | null; colorFn: (v: string) => string }
const RatingGrid = ({ title, data, colorFn }: RatingGridProps) => {
  if (!data || typeof data !== "object" || !Object.keys(data).length) return null;
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.45rem" }}>
        {Object.entries(data).map(([statement, rating]) => (
          <div key={statement} style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "600", color: "#374151", flex: 1 }}>{statement}</span>
            <Badge text={String(rating)} color={colorFn(String(rating))} />
          </div>
        ))}
      </div>
    </div>
  );
};

interface StatCardProps { label: string; value: string | number; sub?: string; color?: string }
const StatCard = ({ label, value, sub, color = PRIMARY }: StatCardProps) => (
  <div style={{ background: "white", borderRadius: "1rem", padding: "1.25rem 1.5rem", border: `1px solid ${color}20`, boxShadow: `0 2px 12px ${color}08`, display: "flex", flexDirection: "column" as const, gap: "0.3rem" }}>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase" as const, color: "#94a3b8" }}>{label}</span>
    <span style={{ fontFamily: "'Castoro Titling', serif", fontSize: "2rem", color, lineHeight: 1 }}>{value}</span>
    {sub && <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", color: "#94a3b8", fontWeight: "600" }}>{sub}</span>}
  </div>
);

interface MiniBarProps { label: string; count: number; total: number; color?: string }
const MiniBar = ({ label, count, total, color = PRIMARY }: MiniBarProps) => {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.45rem" }}>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "600", color: "#374151", minWidth: 150, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.7s ease" }} />
      </div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.7rem", fontWeight: "700", color: "#94a3b8", minWidth: 52, textAlign: "right" as const }}>
        {count} <span style={{ color: "#cbd5e1" }}>({pct}%)</span>
      </span>
    </div>
  );
};

interface ReadinessBarProps { statement: string; average: number }
const ReadinessBar = ({ statement, average }: ReadinessBarProps) => {
  const pct = Math.max(0, Math.min(100, ((average - 1) / 4) * 100));
  const label = scoreToLikertLabel(average);
  const color = likertColor(label);
  return (
    <div style={{ marginBottom: "0.85rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.35rem" }}>
        <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "600", color: "#374151", flex: 1 }}>{statement}</span>
        <Badge text={`${average.toFixed(2)} · ${label}`} color={color} />
      </div>
      <div style={{ height: 7, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.7s ease" }} />
      </div>
    </div>
  );
};

// ── CSV export (generic — flattens arrays/objects so it works for any row shape) ──
function toCSV(rows: AgencySurveyRow[]): string {
  if (!rows.length) return "";
  const flattenObj = (obj: Record<string, unknown>, prefix = ""): Record<string, string> =>
    Object.entries(obj).reduce<Record<string, string>>((acc, [k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v !== null && typeof v === "object" && !Array.isArray(v)) {
        Object.assign(acc, flattenObj(v as Record<string, unknown>, key));
      } else {
        acc[key] = Array.isArray(v) ? v.join("; ") : String(v ?? "");
      }
      return acc;
    }, {});

  const flat = rows.map((r) => flattenObj(r as unknown as Record<string, unknown>));
  const headers = [...new Set(flat.flatMap(Object.keys))];
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers.map(esc).join(","), ...flat.map((r) => headers.map((h) => esc(r[h] ?? "")).join(","))].join("\n");
}

function downloadCSV(rows: AgencySurveyRow[], filename: string): void {
  const blob = new Blob([toCSV(rows)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Button styles ──
const outlineBtn: React.CSSProperties = {
  border: `1.5px solid ${PRIMARY}40`, background: "transparent", color: PRIMARY,
  borderRadius: "999px", padding: "0.5rem 1.25rem",
  fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700",
  letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
};
const primaryBtn: React.CSSProperties = {
  border: "none", background: PRIMARY, color: "white",
  borderRadius: "999px", padding: "0.55rem 1.5rem",
  fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700",
  letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
  boxShadow: `0 4px 14px ${PRIMARY}35`,
};

const API_BASE = "/api/agency/survey";

// ── Detail Modal ──
interface ResponseModalProps { response: AgencySurveyRow; onClose: () => void }
function ResponseModal({ response: r, onClose }: ResponseModalProps) {
  const challenges  = joinList(r.challenges);
  const programs    = joinList(r.academic_programs);
  const encouraging = joinList(r.encouraging_factors);
  const markets     = joinList(r.priority_markets);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: "1.5rem", width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(10,10,10,0.22)", border: `1px solid ${PRIMARY}20`, padding: "2rem", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${PRIMARY}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 21V7a2 2 0 012-2h6a2 2 0 012 2v14M13 7h6a2 2 0 012 2v12M9 21V11m0 0h.01M9 15h.01M9 7h.01" /></svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.3rem", color: DARK, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.agency_name}</h2>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <Badge text={r.province} color={PRIMARY} />
              {r.years_in_operation && <Badge text={r.years_in_operation} color={AMBER} />}
              {r.likelihood_official_partner && <Badge text={r.likelihood_official_partner} color={likelihoodColor(r.likelihood_official_partner)} />}
              {r.created_at && <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", alignSelf: "center" }}>{new Date(r.created_at).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        <SectionHeader number="A" title="Agency Profile" />
        <FieldRow label="Agency Name" value={r.agency_name} />
        <FieldRow label="Province" value={r.province} />
        <FieldRow label="Years in Operation" value={r.years_in_operation} />

        <SectionHeader number="B" title="Recruitment Experience" />
        <FieldRow label="Recruited Students for Nepal?" value={r.recruitment_type} />
        <FieldRow label="Local Students Recruited (3yr)" value={r.local_students_recruited != null ? String(r.local_students_recruited) : null} />
        <FieldRow label="Int'l Students Recruited (3yr)" value={r.international_students_recruited != null ? String(r.international_students_recruited) : null} />
        <FieldRow label="Aware of Commissions?" value={r.aware_of_commissions} />
        <FieldRow label="Interested in Partnering?" value={r.interested_in_partnering} />
        <FieldRow label="Represents an Institution?" value={r.currently_represents_institution} />
        {r.currently_represents_institution === "Yes" && (
          <FieldRow label="Institution(s) Represented" value={r.represented_institutions} />
        )}

        <SectionHeader number="C" title="Agency Readiness" />
        <RatingGrid title="Level of Agreement" data={r.readiness_ratings} colorFn={likertColor} />

        <SectionHeader number="D" title="Challenges & Training" />
        <FieldRow label="Biggest Challenges" value={challenges} />
        {r.challenges?.includes("Other") && <FieldRow label="Other Challenge" value={r.challenges_other_text} />}
        <FieldRow label="Interested in Product Training?" value={r.interested_in_training} />

        <SectionHeader number="E" title="Academic Programs" />
        <FieldRow label="High-Potential Programs" value={programs} />
        {r.academic_programs?.includes("Other") && <FieldRow label="Other Program" value={r.academic_programs_other_text} />}

        <SectionHeader number="F" title="Promotion & Support" />
        <FieldRow label="B2B Portal Useful?" value={r.b2b_portal_useful} />
        <FieldRow label="Encouraging Factors" value={encouraging} />
        {r.encouraging_factors?.includes("Other") && <FieldRow label="Other Encouraging Factor" value={r.encouraging_factors_other_text} />}
        <FieldRow label="Interested in Events?" value={r.interested_in_events} />

        <SectionHeader number="G" title="Market Focus" />
        <FieldRow label="Priority Markets" value={markets} />
        {r.priority_markets?.includes("Other") && <FieldRow label="Other Market" value={r.priority_markets_other_text} />}

        <SectionHeader number="H" title="Commission & Partnership" />
        <FieldRow label="Minimum Commission" value={r.minimum_commission} />
        <FieldRow label="Annual Recruitment Capacity" value={r.annual_recruitment_capacity} />
        <FieldRow label="Likelihood of Becoming Partner" value={r.likelihood_official_partner} />

        <SectionHeader number="I" title="Recommendations" />
        {r.top_recommendations && (
          <div style={{ marginTop: "0.25rem", marginBottom: "0.75rem", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.4rem" }}>Top Recommendations</div>
            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: "#374151", margin: 0, lineHeight: 1.7 }}>{r.top_recommendations}</p>
          </div>
        )}
        <FieldRow label="Willing — Future Participation?" value={r.willing_future_participation} />
        {r.willing_future_participation === "Yes" && (
          <FieldRow label="Contact Details" value={r.contact_details} />
        )}

        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
          {(r.ip_address || r.user_agent) && (
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#cbd5e1", fontWeight: "600" }}>
              Submitted from {r.ip_address || "—"}{r.user_agent ? ` · ${r.user_agent.slice(0, 40)}${r.user_agent.length > 40 ? "…" : ""}` : ""}
            </span>
          )}
          <button onClick={() => downloadCSV([r], `agency-survey-${r.id}.csv`)} style={primaryBtn}>↓ Export This Row CSV</button>
        </div>
      </div>
    </div>
  );
}

// ── Row with hover-reveal actions ──
interface ResponseRowProps {
  r: AgencySurveyRow;
  index: number;
  onView: (r: AgencySurveyRow) => void;
  onDelete: (id: number) => void;
}
function ResponseRow({ r, index, onView, onDelete }: ResponseRowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 1fr 1fr 0.9fr 72px", padding: "0.85rem 1.25rem", background: hovered ? `${PRIMARY}07` : index % 2 === 0 ? "white" : "#fafcfe", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(r)}
    >
      <div>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "700", color: DARK }}>{r.agency_name}</div>
        {r.created_at && <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600" }}>{new Date(r.created_at).toLocaleDateString()}</div>}
      </div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>{r.province || "—"}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "600", color: "#64748b" }}>{r.recruitment_type || "—"}</span>
      <div>{r.likelihood_official_partner ? <Badge text={r.likelihood_official_partner} color={likelihoodColor(r.likelihood_official_partner)} /> : <span style={{ color: "#cbd5e1" }}>—</span>}</div>
      <div>{r.interested_in_partnering ? <Badge text={r.interested_in_partnering} color={yesNoMaybeColor(r.interested_in_partnering)} /> : <span style={{ color: "#cbd5e1" }}>—</span>}</div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "600", color: "#94a3b8" }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</span>
      <div style={{ display: "flex", gap: "0.35rem", opacity: hovered ? 1 : 0, transition: "opacity 0.18s" }} onClick={(e) => e.stopPropagation()}>
        <button title="View" onClick={() => onView(r)} style={{ background: `${PRIMARY}12`, border: "none", borderRadius: "0.45rem", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="13" height="13" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <button title="Delete" onClick={() => onDelete(r.id)} style={{ background: "#fef2f2", border: "none", borderRadius: "0.45rem", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard ──
export default function AgencySurveyResponsesDashboard() {
  const [responses, setResponses] = useState<AgencySurveyRow[]>([]);
  const [stats, setStats]         = useState<StatsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<AgencySurveyRow | null>(null);
  const [search, setSearch]       = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterRecruitment, setFilterRecruitment] = useState("");
  const [filterLikelihood, setFilterLikelihood] = useState("");
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState<"responses" | "stats">("responses");
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const PER_PAGE = 15;

  // Load fonts once, defensively (in case this widget is mounted standalone)
  useEffect(() => {
    if (!document.querySelector('link[data-agency-survey-fonts]')) {
      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap";
      fontLink.setAttribute("data-agency-survey-fonts", "true");
      document.head.appendChild(fontLink);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [rRes, sRes] = await Promise.all([
        fetch(`${API_BASE}?per_page=500`),
        fetch(`${API_BASE}/stats`),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      const raw: Record<string, unknown>[] = rData?.data?.data ?? rData?.data ?? [];
      setResponses(raw.map(sanitizeRow));
      setStats((sData?.data as StatsData) || null);
    } catch {
      setError("Could not load responses. Check your API connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Filtering ──
  const filtered = responses.filter((r) => {
    const q = search.toLowerCase();
    const matchQ = !q
      || r.agency_name?.toLowerCase().includes(q)
      || r.province?.toLowerCase().includes(q)
      || (r.represented_institutions || "").toLowerCase().includes(q);
    const matchProvince = !filterProvince || r.province === filterProvince;
    const matchRecruitment = !filterRecruitment || r.recruitment_type === filterRecruitment;
    const matchLikelihood = !filterLikelihood || r.likelihood_official_partner === filterLikelihood;
    return matchQ && matchProvince && matchRecruitment && matchLikelihood;
  });

  const isFiltered = !!(search || filterProvince || filterRecruitment || filterLikelihood);
  const pages      = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Smart export: what's currently shown ──
  const exportLabel  = isFiltered ? `Export Filtered (${filtered.length})` : `Export All (${responses.length})`;
  const exportTarget = isFiltered ? filtered : responses;
  const exportFile   = isFiltered ? "filtered-agency-survey-responses.csv" : "all-agency-survey-responses.csv";

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setResponses((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch { setError("Delete failed."); }
  };

  const total = responses.length;

  // ── Client-side fallback stats (used only if /stats hasn't loaded yet) ──
  const freqMap = (key: keyof AgencySurveyRow): Record<string, number> =>
    responses.reduce<Record<string, number>>((acc, r) => {
      const v = r[key] as string;
      if (v) acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});
  const toStatArr = (obj: Record<string, number>): StatItem[] =>
    Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const resolveArr = (apiArr: StatItem[] | undefined, fallbackKey: keyof AgencySurveyRow): StatItem[] =>
    apiArr?.length ? apiArr : toStatArr(freqMap(fallbackKey));

  const provinceArr      = resolveArr(stats?.by_province, "province");
  const yearsArr         = resolveArr(stats?.by_years_in_operation, "years_in_operation");
  const recruitmentArr   = resolveArr(stats?.by_recruitment_type, "recruitment_type");
  const likelihoodArr    = resolveArr(stats?.likelihood_official_partner, "likelihood_official_partner");
  const partneringArr    = resolveArr(stats?.interested_in_partnering, "interested_in_partnering");
  const trainingArr      = resolveArr(stats?.interested_in_training, "interested_in_training");
  const portalArr        = resolveArr(stats?.b2b_portal_useful, "b2b_portal_useful");
  const eventsArr        = resolveArr(stats?.interested_in_events, "interested_in_events");
  const challengesArr    = stats?.top_challenges ?? [];
  const programsArr      = stats?.top_academic_programs ?? [];
  const encouragingArr   = stats?.top_encouraging_factors ?? [];
  const marketsArr       = stats?.top_priority_markets ?? [];
  const readinessAvgsArr = stats?.readiness_statement_averages ?? [];

  const provincesRepresented = stats?.provinces_represented ?? new Set(responses.map((r) => r.province).filter(Boolean)).size;
  const partneringYesPct = stats?.partnering_yes_pct ?? (total ? Math.round((responses.filter((r) => r.interested_in_partnering === "Yes").length / total) * 100) : 0);
  const likelyPartnerPct = stats?.likely_partner_pct ?? (total ? Math.round((responses.filter((r) => ["Likely", "Very Likely"].includes(r.likelihood_official_partner)).length / total) * 100) : 0);
  const avgReadiness = stats?.avg_readiness_score ?? null;

  return (
    <div style={{ minHeight: "100vh", background: SURFACE, fontFamily: "Rajdhani, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`, padding: "1.75rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${PRIMARY}12`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(50px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER }}>Study Nepal Campaign — Admin</span>
            <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "clamp(1.2rem, 3vw, 1.9rem)", color: "white", margin: "0.25rem 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Agency Readiness{" "}
              <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Responses</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => downloadCSV(exportTarget, exportFile)}
              style={primaryBtn}
              title={isFiltered ? "Export currently filtered rows" : "Export all rows"}
            >
              ↓ {exportLabel}
            </button>
            <button onClick={fetchAll} style={{ ...outlineBtn, borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.7)" }}>↻ Refresh</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1200, margin: "1.25rem auto 0", position: "relative", zIndex: 1, display: "flex", gap: "0.4rem" }}>
          {(["responses", "stats"] as const).map((t) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              background: activeTab === t ? PRIMARY : "transparent",
              border: activeTab === t ? "none" : "1.5px solid rgba(255,255,255,0.18)",
              color: activeTab === t ? "white" : "rgba(255,255,255,0.55)",
              borderRadius: "999px", padding: "0.45rem 1.25rem",
              fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700",
              letterSpacing: "0.15em", textTransform: "uppercase", cursor: "pointer",
              boxShadow: activeTab === t ? `0 4px 14px ${PRIMARY}40` : "none", transition: "all 0.2s",
            }}>{t === "responses" ? `Responses (${total})` : "Stats & Analytics"}</button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#dc2626", padding: "0.85rem 1.25rem", borderRadius: "0.75rem", marginBottom: "1.25rem", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.82rem" }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#94a3b8", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", letterSpacing: "0.15em", fontSize: "0.85rem", textTransform: "uppercase" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${PRIMARY}25`, borderTopColor: PRIMARY, borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
            Loading Responses…
          </div>
        ) : activeTab === "stats" ? (

          /* ── STATS TAB ── */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <StatCard label="Total Responses" value={total} sub="Agencies surveyed" color={PRIMARY} />
              <StatCard label="Provinces" value={provincesRepresented} sub="Represented" color={AMBER} />
              <StatCard label="Interested in Partnering" value={`${partneringYesPct}%`} sub="Answered Yes" color="#10b981" />
              <StatCard label="Likely to Become Partner" value={`${likelyPartnerPct}%`} sub="Likely + Very Likely" color="#8b5cf6" />
              {avgReadiness != null && (
                <StatCard label="Avg Readiness Score" value={avgReadiness.toFixed(2)} sub="Out of 5.0" color="#0ea5e9" />
              )}
            </div>

            {readinessAvgsArr.length > 0 && (
              <div style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: `1px solid ${PRIMARY}12`, boxShadow: `0 2px 12px ${PRIMARY}05`, marginBottom: "1.25rem" }}>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>
                  Agency Readiness — Average Agreement (Q9)
                </div>
                {readinessAvgsArr.map(({ statement, average }) => (
                  <ReadinessBar key={statement} statement={statement} average={average} />
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {([
                { title: "By Province",                arr: provinceArr,    colorFn: (_l: string) => PRIMARY },
                { title: "By Years in Operation",       arr: yearsArr,       colorFn: (_l: string) => AMBER },
                { title: "Recruitment Type",            arr: recruitmentArr, colorFn: (_l: string) => "#8b5cf6" },
                { title: "Likelihood of Becoming Partner", arr: likelihoodArr, colorFn: (l: string) => likelihoodColor(l) },
                { title: "Interested in Partnering?",   arr: partneringArr,  colorFn: (l: string) => yesNoMaybeColor(l) },
                { title: "Interested in Product Training?", arr: trainingArr, colorFn: (l: string) => yesNoMaybeColor(l) },
                { title: "B2B Portal Useful?",          arr: portalArr,      colorFn: (l: string) => yesNoMaybeColor(l) },
                { title: "Interested in Events?",       arr: eventsArr,      colorFn: (l: string) => yesNoMaybeColor(l) },
                { title: "Top Challenges",              arr: challengesArr,  colorFn: (_l: string) => "#f97316" },
                { title: "Top Academic Programs",       arr: programsArr,    colorFn: (_l: string) => "#0ea5e9" },
                { title: "Top Encouraging Factors",     arr: encouragingArr, colorFn: (_l: string) => "#10b981" },
                { title: "Top Priority Markets",        arr: marketsArr,     colorFn: (_l: string) => "#fbbf24" },
              ] as { title: string; arr: StatItem[]; colorFn: (l: string) => string }[]).map(({ title, arr, colorFn }) => (
                <div key={title} style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: `1px solid ${PRIMARY}12`, boxShadow: `0 2px 12px ${PRIMARY}05` }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>{title}</div>
                  {arr.length ? arr.map(({ label, count }) => (
                    <MiniBar key={label} label={label} count={count} total={total} color={colorFn(label)} />
                  )) : <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", color: "#cbd5e1", fontWeight: "600" }}>No data yet.</p>}
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ── RESPONSES TAB ── */
          <div>
            {/* Filter bar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input placeholder="Search agency name, province, institution…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem 0.6rem 2.4rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.82rem", fontWeight: "600", color: DARK, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterProvince ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Provinces</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <select value={filterRecruitment} onChange={(e) => { setFilterRecruitment(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterRecruitment ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Recruitment Types</option>
                {RECRUITMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterLikelihood} onChange={(e) => { setFilterLikelihood(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterLikelihood ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Likelihoods</option>
                {LIKELIHOOD_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>

              {isFiltered && (
                <button onClick={() => { setSearch(""); setFilterProvince(""); setFilterRecruitment(""); setFilterLikelihood(""); setPage(1); }}
                  style={{ border: "1.5px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: "999px", padding: "0.5rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                  ✕ Clear Filters
                </button>
              )}

              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: isFiltered ? PRIMARY : "#94a3b8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "auto" }}>
                {isFiltered ? `${filtered.length} of ${total}` : `${total} total`}
              </span>
            </div>

            {/* Table */}
            <div style={{ background: "white", borderRadius: "1rem 1rem 0 0", border: `1px solid ${PRIMARY}15`, boxShadow: `0 2px 12px ${PRIMARY}05`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1.3fr 1fr 1fr 0.9fr 72px", padding: "0.75rem 1.25rem", background: `linear-gradient(90deg, ${DARK}, #0f172a)` }}>
                {["Agency", "Province", "Recruitment Type", "Likelihood", "Partnering?", "Submitted", ""].map((h, hi) => (
                  <span key={hi} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: h ? "rgba(255,255,255,0.55)" : "transparent" }}>{h || "."}</span>
                ))}
              </div>
              {paginated.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>No responses found.</div>
              ) : paginated.map((r, i) => (
                <ResponseRow key={r.id} r={r} index={i} onView={setSelected} onDelete={setDeleteId} />
              ))}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "0.5rem", marginTop: "1.25rem" }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} style={{ ...outlineBtn, padding: "0.4rem 1rem", opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
                {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                  const pg = pages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= pages - 3 ? pages - 6 + i : page - 3 + i;
                  return (
                    <button key={pg} onClick={() => setPage(pg)} style={{ border: page === pg ? "none" : "1.5px solid #e5e7eb", background: page === pg ? PRIMARY : "white", color: page === pg ? "white" : "#374151", borderRadius: "0.5rem", width: 36, height: 36, fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", cursor: "pointer" }}>{pg}</button>
                  );
                })}
                <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} style={{ ...outlineBtn, padding: "0.4rem 1rem", opacity: page === pages ? 0.4 : 1 }}>Next →</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selected && <ResponseModal response={selected} onClose={() => setSelected(null)} />}

      {/* ── Delete Confirm ── */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "2rem", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(10,10,10,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.1rem", color: DARK, margin: "0 0 0.5rem", textTransform: "uppercase" }}>Delete Response?</h3>
            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", margin: "0 0 1.5rem", lineHeight: 1.6 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
              <button onClick={() => setDeleteId(null)} style={outlineBtn}>Cancel</button>
              <button onClick={() => handleDelete(deleteId)} style={{ ...primaryBtn, background: "#ef4444", boxShadow: "0 4px 14px #ef444435" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}