import { useState, useEffect, useCallback } from "react";

// ── Design tokens ──
const PRIMARY = "#0ea5e9";
const AMBER   = "#fbbf24";
const DARK    = "#0a0a0a";
const SURFACE = "#F8FAFB";

// ── Google Fonts ──
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

// ── Types ──
interface RatingMap { [key: string]: string }

interface SurveyRow {
  id: number;
  name: string;
  country: string;
  age_group: string;
  gender: string;
  study_level: string;
  faculty_program: string;
  financing: string[] | string;
  scholarship_sources: string[] | string;
  scholarship_other_text: string;
  scholarship_percentage: string;
  scholarship_percentage_other_text: string;
  financing_remarks: string;
  duration_with_ku: string;
  duration_before_ku: string;
  how_knew_nepal: string;
  reasons_selecting_nepal: string[] | string;
  perception_before: string;
  why_kathmandu_university: string;
  ease_of_finding_info: string;
  admission_process_start: string;
  admission_process_rating: string;
  admission_duration: string;
  university_ratings: RatingMap;
  accommodation_arrangement: string;
  accommodation_other_text: string;
  living_ratings: RatingMap;
  other_ratings: RatingMap;
  inclusion_ratings: RatingMap;
  visa_status: string;
  visa_status_other_text: string;
  visa_overall_rating: string;
  visa_detailed_ratings: RatingMap;
  visa_challenge_ratings: RatingMap;
  visa_change_suggestion: string;
  overall_satisfaction: string;
  recommend_nepal: string;
  positive_aspects: string;
  biggest_challenges: string;
  improvements: string;
  additional_comments: string;
  consent_acknowledged: boolean | number | string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  total?: number;
  by_satisfaction?: Array<Record<string, unknown>>;
  recommend_breakdown?: Array<Record<string, unknown>>;
  by_study_level?: Array<Record<string, unknown>>;
  by_country?: Array<Record<string, unknown>>;
  by_accommodation?: Array<Record<string, unknown>>;
}

interface StatItem { label: string; count: number }

// ── Strip duplicate "1." prefixed keys Laravel sometimes injects, and
//    JSON-decode any rating/array columns that arrive as raw strings ──
function sanitizeRow(raw: Record<string, unknown>): SurveyRow {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^\d+\./.test(k)) continue;
    clean[k] = v;
  }
  const ratingKeys: (keyof SurveyRow)[] = [
    "university_ratings", "living_ratings", "other_ratings", "inclusion_ratings",
    "visa_detailed_ratings", "visa_challenge_ratings",
  ];
  for (const key of ratingKeys) {
    if (typeof clean[key] === "string") {
      try { clean[key] = JSON.parse(clean[key] as string); } catch { /* leave as-is */ }
    }
  }
  const arrayKeys: (keyof SurveyRow)[] = ["reasons_selecting_nepal", "financing", "scholarship_sources"];
  for (const key of arrayKeys) {
    if (typeof clean[key] === "string") {
      try { clean[key] = JSON.parse(clean[key] as string); } catch { /* leave as-is */ }
    }
  }
  return clean as unknown as SurveyRow;
}

// ── Rating colour map ──
const RATING_COLORS: Record<string, string> = {
  Excellent: "#10b981", "Very Easy": "#10b981", "Very Smooth": "#10b981",
  "Excellent / Very Easy / Very Smooth": "#10b981",
  Good: PRIMARY, Easy: PRIMARY, Smooth: PRIMARY,
  "Good / Easy / Smooth": PRIMARY,
  Average: AMBER, Difficult: "#f97316",
  "Average / Difficult": AMBER,
  Poor: "#ef4444", "Very Difficult": "#ef4444",
  "Poor / Very Difficult": "#ef4444",
  "No Challenge": "#10b981", "Minor Challenge": PRIMARY,
  "Moderate Challenge": AMBER, "Major Challenge": "#ef4444",
};
const ratingColor = (r: string): string => RATING_COLORS[r] ?? "#94a3b8";

const SAT_COLORS: Record<string, string> = {
  "Very Satisfied": "#10b981", Satisfied: PRIMARY,
  Neutral: AMBER, Dissatisfied: "#f97316", "Very Dissatisfied": "#ef4444",
};
const satisfactionColor = (s: string): string => SAT_COLORS[s] ?? "#94a3b8";

// ── helper: turn array/string into a comma-joined display string ──
const joinList = (v: string[] | string | undefined | null): string => {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
};

// ── helper: normalize a boolean-ish DB value into Yes/No ──
const yesNo = (v: boolean | number | string | undefined | null): string => {
  if (v === true || v === 1 || v === "1" || v === "true") return "Yes";
  if (v === false || v === 0 || v === "0" || v === "false" || v == null) return "No";
  return String(v);
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
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#94a3b8", minWidth: 200, flexShrink: 0, paddingTop: "0.1rem" }}>{label}</span>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: DARK, flex: 1 }}>
      {value || <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>—</span>}
    </span>
  </div>
);

interface RatingGridProps { title: string; data?: RatingMap | null }
const RatingGrid = ({ title, data }: RatingGridProps) => {
  if (!data || typeof data !== "object" || !Object.keys(data).length) return null;
  return (
    <div style={{ marginTop: "0.5rem" }}>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#94a3b8", marginBottom: "0.5rem" }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: "0.35rem" }}>
        {Object.entries(data).map(([area, rating]) => (
          <div key={area} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "600", color: "#374151", flex: 1 }}>{area}</span>
            <Badge text={String(rating)} color={ratingColor(String(rating))} />
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

// ── CSV export ──
function toCSV(rows: SurveyRow[]): string {
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

function downloadCSV(rows: SurveyRow[], filename: string): void {
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

const API_BASE = "/api/survey";

// ── Detail Modal ──
interface ResponseModalProps { response: SurveyRow; onClose: () => void }
function ResponseModal({ response: r, onClose }: ResponseModalProps) {
  const reasons      = joinList(r.reasons_selecting_nepal);
  const financing    = joinList(r.financing);
  const scholarships = joinList(r.scholarship_sources);

  const hasScholarship =
    (Array.isArray(r.financing) ? r.financing : [r.financing]).some((f) =>
      String(f || "").toLowerCase().includes("scholarship")
    );

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: "1.5rem", width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(10,10,10,0.22)", border: `1px solid ${PRIMARY}20`, padding: "2rem", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${PRIMARY}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.3rem", color: DARK, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.name}</h2>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <Badge text={r.country} color={PRIMARY} />
              {r.study_level && <Badge text={r.study_level} color={AMBER} />}
              {r.overall_satisfaction && <Badge text={r.overall_satisfaction} color={satisfactionColor(r.overall_satisfaction)} />}
              {r.created_at && <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", alignSelf: "center" }}>{new Date(r.created_at).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        <SectionHeader number="A" title="Personal Information" />
        <FieldRow label="Age Group" value={r.age_group} />
        <FieldRow label="Gender" value={r.gender} />
        <FieldRow label="Study Level" value={r.study_level} />
        <FieldRow label="Faculty / Program" value={r.faculty_program} />
        <FieldRow label="Financing" value={financing} />
        {hasScholarship && (
          <>
            <FieldRow label="Scholarship Source(s)" value={scholarships} />
            <FieldRow label="Other Financial Assistance" value={r.scholarship_other_text} />
            <FieldRow label="Tuition % Covered" value={r.scholarship_percentage} />
            <FieldRow label="% Covered (Other)" value={r.scholarship_percentage_other_text} />
          </>
        )}
        <FieldRow label="Financing Remarks" value={r.financing_remarks} />
        <FieldRow label="Duration with KU" value={r.duration_with_ku} />
        <FieldRow label="Duration before KU" value={r.duration_before_ku} />

        <SectionHeader number="B" title="Choosing Nepal & University" />
        <FieldRow label="How Knew Nepal" value={r.how_knew_nepal} />
        <FieldRow label="Reasons for Nepal" value={reasons} />
        <FieldRow label="Perception Before" value={r.perception_before} />
        <FieldRow label="Why KU" value={r.why_kathmandu_university} />
        <FieldRow label="Ease of Finding Info" value={r.ease_of_finding_info} />

        <SectionHeader number="C" title="Admission Experience" />
        <FieldRow label="Admission Start" value={r.admission_process_start} />
        <FieldRow label="Admission Rating" value={r.admission_process_rating} />
        <FieldRow label="Admission Duration" value={r.admission_duration} />

        <SectionHeader number="D" title="Experience with KU" />
        <RatingGrid title="University Ratings" data={r.university_ratings} />
        <FieldRow label="Accommodation Arrangement" value={r.accommodation_arrangement} />
        {r.accommodation_arrangement === "Other" && (
          <FieldRow label="Accommodation (Other)" value={r.accommodation_other_text} />
        )}
        <RatingGrid title="Living Ratings" data={r.living_ratings} />
        <RatingGrid title="Other Ratings" data={r.other_ratings} />
        <RatingGrid title="Inclusion, Dignity & Respect Ratings" data={r.inclusion_ratings} />

        <SectionHeader number="E" title="Visa & Immigration" />
        <FieldRow label="Visa Status" value={r.visa_status} />
        {r.visa_status === "Other (Please specify)" && (
          <FieldRow label="Visa Status (Other)" value={r.visa_status_other_text} />
        )}
        <FieldRow label="Visa Overall Rating" value={r.visa_overall_rating} />
        <RatingGrid title="Visa Detailed Ratings" data={r.visa_detailed_ratings} />
        <RatingGrid title="Visa Challenge Ratings" data={r.visa_challenge_ratings} />
        {r.visa_change_suggestion && (
          <div style={{ marginTop: "0.75rem", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.4rem" }}>Visa Change Suggestion</div>
            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: "#374151", margin: 0, lineHeight: 1.7 }}>{r.visa_change_suggestion}</p>
          </div>
        )}

        <SectionHeader number="F" title="Final Feedback" />
        <FieldRow label="Overall Satisfaction" value={r.overall_satisfaction} />
        <FieldRow label="Recommend Nepal" value={r.recommend_nepal} />
        {([["Positive Aspects", r.positive_aspects], ["Biggest Challenges", r.biggest_challenges], ["Improvements", r.improvements], ["Additional Comments", r.additional_comments]] as [string, string][])
          .filter(([, v]) => v)
          .map(([lbl, val]) => (
            <div key={lbl} style={{ marginTop: "0.75rem", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.4rem" }}>{lbl}</div>
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: "#374151", margin: 0, lineHeight: 1.7 }}>{val}</p>
            </div>
          ))}

        <SectionHeader number="G" title="Declaration" />
        <FieldRow label="Consent Acknowledged" value={yesNo(r.consent_acknowledged)} />

        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => downloadCSV([r], `response-${r.id}.csv`)} style={primaryBtn}>↓ Export This Row CSV</button>
        </div>
      </div>
    </div>
  );
}

// ── Row with hover-reveal actions ──
interface ResponseRowProps {
  r: SurveyRow;
  index: number;
  onView: (r: SurveyRow) => void;
  onDelete: (id: number) => void;
}
function ResponseRow({ r, index, onView, onDelete }: ResponseRowProps) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr 72px", padding: "0.85rem 1.25rem", background: hovered ? `${PRIMARY}07` : index % 2 === 0 ? "white" : "#fafcfe", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(r)}
    >
      <div>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "700", color: DARK }}>{r.name}</div>
        {r.created_at && <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600" }}>{new Date(r.created_at).toLocaleDateString()}</div>}
      </div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>{r.country || "—"}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "600", color: "#64748b" }}>{r.faculty_program ? r.faculty_program.slice(0, 18) + (r.faculty_program.length > 18 ? "…" : "") : "—"}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", color: PRIMARY }}>{r.study_level || "—"}</span>
      <div>{r.overall_satisfaction ? <Badge text={r.overall_satisfaction} color={satisfactionColor(r.overall_satisfaction)} /> : <span style={{ color: "#cbd5e1" }}>—</span>}</div>
      <div>{r.recommend_nepal ? <Badge text={r.recommend_nepal} color={r.recommend_nepal === "Yes" ? "#10b981" : r.recommend_nepal === "Maybe" ? AMBER : "#ef4444"} /> : <span style={{ color: "#cbd5e1" }}>—</span>}</div>
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
export default function SurveyResponsesDashboard() {
  const [responses, setResponses] = useState<SurveyRow[]>([]);
  const [stats, setStats]         = useState<StatsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<SurveyRow | null>(null);
  const [search, setSearch]       = useState("");
  const [filterLevel, setFilterLevel] = useState("");
  const [filterSat, setFilterSat] = useState("");
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState<"responses" | "stats">("responses");
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const PER_PAGE = 15;

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
    const matchQ   = !q || r.name?.toLowerCase().includes(q) || r.country?.toLowerCase().includes(q) || r.faculty_program?.toLowerCase().includes(q);
    const matchLvl = !filterLevel || r.study_level === filterLevel;
    const matchSat = !filterSat   || r.overall_satisfaction === filterSat;
    return matchQ && matchLvl && matchSat;
  });

  const isFiltered = !!(search || filterLevel || filterSat);
  const pages      = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Smart export: what's currently shown ──
  // If filters active → export filtered. Otherwise → export all.
  const exportLabel  = isFiltered ? `Export Filtered (${filtered.length})` : `Export All (${responses.length})`;
  const exportTarget = isFiltered ? filtered : responses;
  const exportFile   = isFiltered ? "filtered-responses.csv" : "all-survey-responses.csv";

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setResponses((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch { setError("Delete failed."); }
  };

  const total = responses.length;

  // ── Stats helpers ──
  const freqMap = (key: keyof SurveyRow): Record<string, number> =>
    responses.reduce<Record<string, number>>((acc, r) => {
      const v = r[key] as string;
      if (v) acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});

  // for multi-select columns (arrays), count each selected option separately
  const freqMapMulti = (key: keyof SurveyRow): Record<string, number> =>
    responses.reduce<Record<string, number>>((acc, r) => {
      const v = r[key] as string[] | string | undefined;
      const arr = Array.isArray(v) ? v : v ? [v] : [];
      for (const item of arr) {
        if (item) acc[item] = (acc[item] || 0) + 1;
      }
      return acc;
    }, {});

  const toStatArr = (obj: Record<string, number>): StatItem[] =>
    Object.entries(obj).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);

  const resolveArr = (
    apiArr: Array<Record<string, unknown>> | undefined,
    labelKey: string,
    fallbackKey: keyof SurveyRow
  ): StatItem[] => {
    if (apiArr?.length) {
      return apiArr
        .map((i) => ({ label: String(i[labelKey] ?? Object.values(i)[0] ?? ""), count: Number(i.count ?? 0) }))
        .sort((a, b) => b.count - a.count);
    }
    return toStatArr(freqMap(fallbackKey));
  };

  const satisfactionArr   = resolveArr(stats?.by_satisfaction,    "overall_satisfaction",      "overall_satisfaction");
  const recommendArr      = resolveArr(stats?.recommend_breakdown, "recommend_nepal",           "recommend_nepal");
  const levelArr          = resolveArr(stats?.by_study_level,      "study_level",               "study_level");
  const countryArr        = resolveArr(stats?.by_country,          "country",                   "country").slice(0, 8);
  const accommodationArr  = resolveArr(stats?.by_accommodation,    "accommodation_arrangement",  "accommodation_arrangement");
  const financingArr      = toStatArr(freqMapMulti("financing"));
  const visaStatusArr     = toStatArr(freqMap("visa_status"));

  const SAT_SCORE: Record<string, number> = { "Very Satisfied": 5, Satisfied: 4, Neutral: 3, Dissatisfied: 2, "Very Dissatisfied": 1 };
  const avgSat = (() => {
    const vals = responses.map((r) => SAT_SCORE[r.overall_satisfaction]).filter(Boolean);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : "—";
  })();

  return (
    <div style={{ minHeight: "100vh", background: SURFACE, fontFamily: "Rajdhani, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`, padding: "1.75rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${PRIMARY}12`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(50px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER }}>KU & Study In Nepal — Admin</span>
            <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "clamp(1.2rem, 3vw, 1.9rem)", color: "white", margin: "0.25rem 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Survey{" "}
              <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Responses</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            {/* Smart export — label and data change based on active filter */}
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
              <StatCard label="Total Responses" value={total} sub="Survey submissions" color={PRIMARY} />
              <StatCard label="Countries" value={new Set(responses.map((r) => r.country).filter(Boolean)).size} sub="Represented" color={AMBER} />
              <StatCard label="Would Recommend" value={`${total ? Math.round((responses.filter((r) => r.recommend_nepal === "Yes").length / total) * 100) : 0}%`} sub="Answered Yes" color="#10b981" />
              <StatCard label="Avg Satisfaction" value={avgSat} sub="Out of 5.0" color="#8b5cf6" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {([
                { title: "Overall Satisfaction",    arr: satisfactionArr,  colorFn: (l: string) => satisfactionColor(l) },
                { title: "Would Recommend Nepal?",  arr: recommendArr,     colorFn: (l: string) => l === "Yes" ? "#10b981" : l === "Maybe" ? AMBER : "#ef4444" },
                { title: "Study Level Breakdown",   arr: levelArr,         colorFn: (_l: string) => PRIMARY },
                { title: "Top Countries",           arr: countryArr,       colorFn: (_l: string) => AMBER },
                { title: "Financing Sources",       arr: financingArr,     colorFn: (_l: string) => "#8b5cf6" },
                { title: "Accommodation Type",      arr: accommodationArr, colorFn: (_l: string) => "#0ea5e9" },
                { title: "Visa Status",             arr: visaStatusArr,    colorFn: (_l: string) => "#f97316" },
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
                <input placeholder="Search name, country, program…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem 0.6rem 2.4rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.82rem", fontWeight: "600", color: DARK, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              <select value={filterLevel} onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterLevel ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Levels</option>
                {["Undergraduate","Postgraduate","PhD","Exchange/Short Course"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <select value={filterSat} onChange={(e) => { setFilterSat(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterSat ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Satisfaction</option>
                {["Very Satisfied","Satisfied","Neutral","Dissatisfied","Very Dissatisfied"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>

              {/* Clear filters pill */}
              {isFiltered && (
                <button onClick={() => { setSearch(""); setFilterLevel(""); setFilterSat(""); setPage(1); }}
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
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1.2fr 1fr 1fr 1fr 0.8fr 72px", padding: "0.75rem 1.25rem", background: `linear-gradient(90deg, ${DARK}, #0f172a)` }}>
                {["Name", "Country", "Program", "Study Level", "Satisfaction", "Rec.", ""].map((h, hi) => (
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