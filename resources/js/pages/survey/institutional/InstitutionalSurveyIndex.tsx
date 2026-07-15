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

// ── Types Matching Your Form Fields ──
interface AgencySurveyRow {
  id: number;
  agency_name: string;
  agency_email: string;
  agency_phone: string;
  province: string;
  years_in_operation: string;
  recruitment_type: string;
  local_students_recruited: string | number | null;
  international_students_recruited: string | number | null;
  aware_of_commissions: string;
  interested_in_partnering: string;
  currently_represents_institution: string;
  represented_institutions: string;
  readiness_ratings: Record<string, string> | string;
  challenges: string[] | string;
  challenges_other_text: string;
  interested_in_training: string;
  academic_programs: string[] | string;
  academic_programs_other_text: string;
  b2b_portal_useful: string;
  encouraging_factors: string[] | string;
  encouraging_factors_other_text: string;
  interested_in_events: string;
  priority_markets: string[] | string;
  priority_markets_other_text: string;
  minimum_commission: string;
  annual_recruitment_capacity: string;
  likelihood_official_partner: string;
  top_recommendations: string;
  willing_future_participation: string;
  contact_details: string;
  accepted_confidentiality: boolean | number | string;
  created_at: string;
  updated_at: string;
}

interface StatsData {
  total?: number;
  by_likelihood?: Array<Record<string, unknown>>;
  by_partnering?: Array<Record<string, unknown>>;
  by_province?: Array<Record<string, unknown>>;
  by_years?: Array<Record<string, unknown>>;
}

interface StatItem { label: string; count: number }

// ── Sanitize DB Values (Decodes JSON strings returned by Laravel) ──
function sanitizeRow(raw: Record<string, unknown>): AgencySurveyRow {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (/^\d+\./.test(k)) continue;
    clean[k] = v;
  }
  
  // JSON Decode fields if serialized on the database backend
  const arrayKeys: (keyof AgencySurveyRow)[] = ["challenges", "academic_programs", "encouraging_factors", "priority_markets"];
  for (const key of arrayKeys) {
    if (typeof clean[key] === "string") {
      try { clean[key] = JSON.parse(clean[key] as string); } catch { /* fallback to string */ }
    }
  }

  if (typeof clean.readiness_ratings === "string") {
    try { clean.readiness_ratings = JSON.parse(clean.readiness_ratings as string); } catch { /* fallback to string/object */ }
  }

  return clean as unknown as AgencySurveyRow;
}

// ── Dynamic Badges & Layout Colors ──
const LIKELIHOOD_COLORS: Record<string, string> = {
  "Very Likely": "#10b981",
  "Likely": PRIMARY,
  "Neutral": AMBER,
  "Unlikely": "#f97316",
  "Very Unlikely": "#ef4444",
};
const likelihoodColor = (l: string): string => LIKELIHOOD_COLORS[l] ?? "#94a3b8";

const INTEREST_COLORS: Record<string, string> = {
  "Yes": "#10b981",
  "Maybe": AMBER,
  "No": "#ef4444",
};
const interestColor = (i: string): string => INTEREST_COLORS[i] ?? "#94a3b8";

const joinList = (v: string[] | string | undefined | null): string => {
  if (!v) return "";
  return Array.isArray(v) ? v.join(", ") : v;
};

const yesNo = (v: boolean | number | string | undefined | null): string => {
  if (v === true || v === 1 || v === "1" || v === "true") return "Yes";
  if (v === false || v === 0 || v === "0" || v === "false" || v == null) return "No";
  return String(v);
};

// ── Mini UI Components ──
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

interface FieldRowProps { label: string; value?: string | number | null }
const FieldRow = ({ label, value }: FieldRowProps) => (
  <div style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0", borderBottom: "1px solid #f1f5f9", alignItems: "flex-start" }}>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase" as const, color: "#94a3b8", minWidth: 220, flexShrink: 0, paddingTop: "0.1rem" }}>{label}</span>
    <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: DARK, flex: 1 }}>
      {value !== undefined && value !== null && value !== "" ? String(value) : <span style={{ color: "#cbd5e1", fontStyle: "italic" }}>—</span>}
    </span>
  </div>
);

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
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "600", color: "#374151", minWidth: 160, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 7, borderRadius: 999, background: "#f1f5f9", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 999, transition: "width 0.7s ease" }} />
      </div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.7rem", fontWeight: "700", color: "#94a3b8", minWidth: 52, textAlign: "right" as const }}>
        {count} <span style={{ color: "#cbd5e1" }}>({pct}%)</span>
      </span>
    </div>
  );
};

// ── Smart Flat CSV export ──
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

const API_BASE = "/api/institutional-surveys";

// ── Individual Record Detail Modal ──
interface ResponseModalProps { response: AgencySurveyRow; onClose: () => void }
function ResponseModal({ response: r, onClose }: ResponseModalProps) {
  const challenges = joinList(r.challenges);
  const programs   = joinList(r.academic_programs);
  const factors    = joinList(r.encouraging_factors);
  const markets    = joinList(r.priority_markets);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "white", borderRadius: "1.5rem", width: "100%", maxWidth: 720, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(10,10,10,0.22)", border: `1px solid ${PRIMARY}20`, padding: "2rem", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: 4 }}>
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${PRIMARY}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="20" height="20" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <div>
            <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.3rem", color: DARK, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.agency_name}</h2>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <Badge text={r.province} color={PRIMARY} />
              <Badge text={r.years_in_operation} color="#8b5cf6" />
              {r.likelihood_official_partner && <Badge text={`Partner Intent: ${r.likelihood_official_partner}`} color={likelihoodColor(r.likelihood_official_partner)} />}
              {r.created_at && <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600", alignSelf: "center" }}>{new Date(r.created_at).toLocaleString()}</span>}
            </div>
          </div>
        </div>

        <SectionHeader number="1" title="Agency Profile" />
        <FieldRow label="Official Agency Name" value={r.agency_name} />
        <FieldRow label="Official Contact Email" value={r.agency_email} />
        <FieldRow label="Contact Number" value={r.agency_phone} />
        <FieldRow label="Province Location" value={r.province} />
        <FieldRow label="Years in Operation" value={r.years_in_operation} />

        <SectionHeader number="2" title="Recruitment Experience" />
        <FieldRow label="Recruits Students for Nepal?" value={r.recruitment_type} />
        <FieldRow label="Past 3 Years Local Recruits" value={r.local_students_recruited} />
        <FieldRow label="Past 3 Years Intl. Recruits" value={r.international_students_recruited} />
        <FieldRow label="Aware of Institution Commission?" value={r.aware_of_commissions} />
        <FieldRow label="Wants to Partner with HEIs?" value={r.interested_in_partnering} />
        <FieldRow label="Currently Represents Nepalese HEIs?" value={r.currently_represents_institution} />
        {r.currently_represents_institution === "Yes" && (
          <FieldRow label="Institutions Represented" value={r.represented_institutions} />
        )}

        <SectionHeader number="3" title="Agency Readiness Ratings" />
        {r.readiness_ratings && typeof r.readiness_ratings === "object" ? (
          Object.entries(r.readiness_ratings).map(([statement, rating]) => (
            <div key={statement} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", padding: "0.5rem 0", borderBottom: "1px solid #f8fafc" }}>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}>{statement}</span>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "700", color: PRIMARY }}>{rating}</span>
            </div>
          ))
        ) : (
          <FieldRow label="Ratings Provided" value={typeof r.readiness_ratings === "string" ? r.readiness_ratings : "—"} />
        )}

        <SectionHeader number="4" title="Challenges & Training" />
        <FieldRow label="Promotion Challenges" value={challenges} />
        {r.challenges_other_text && (
          <FieldRow label="Other Challenges Specified" value={r.challenges_other_text} />
        )}
        <FieldRow label="Interested in Product Training?" value={r.interested_in_training} />

        <SectionHeader number="5" title="Academic Programs Potential" />
        <FieldRow label="Programs with Highest Potential" value={programs} />
        {r.academic_programs_other_text && (
          <FieldRow label="Other Programs Specified" value={r.academic_programs_other_text} />
        )}

        <SectionHeader number="6" title="Promotion & Support" />
        <FieldRow label="Centralized B2B Portal Useful?" value={r.b2b_portal_useful} />
        <FieldRow label="Encouraging Factors to Promote" value={factors} />
        {r.encouraging_factors_other_text && (
          <FieldRow label="Other Factors Specified" value={r.encouraging_factors_other_text} />
        )}
        <FieldRow label="Wants to Attend B2B Events?" value={r.interested_in_events} />

        <SectionHeader number="7" title="Market Focus Focus" />
        <FieldRow label="Priority Recruitment Markets" value={markets} />
        {r.priority_markets_other_text && (
          <FieldRow label="Other Priority Markets" value={r.priority_markets_other_text} />
        )}

        <SectionHeader number="8" title="Commission & Partnerships" />
        <FieldRow label="Minimum Commission Target" value={r.minimum_commission} />
        <FieldRow label="Annual Student Target Potential" value={r.annual_recruitment_capacity} />
        <FieldRow label="Partner Likelihood Tier" value={r.likelihood_official_partner} />

        <SectionHeader number="9" title="Recommendations & Compliance" />
        {r.top_recommendations && (
          <div style={{ marginBottom: "1rem", padding: "0.85rem 1rem", background: "#f8fafc", borderRadius: "0.75rem", border: "1px solid #e2e8f0" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "0.4rem" }}>Top Three Actions Recommended</div>
            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: "#374151", margin: 0, lineHeight: 1.7 }}>{r.top_recommendations}</p>
          </div>
        )}
        <FieldRow label="Willing Future Consultations?" value={r.willing_future_participation} />
        {r.willing_future_participation === "Yes" && (
          <FieldRow label="Provided Contact Details" value={r.contact_details} />
        )}
        <FieldRow label="Confidentiality Notice Accepted?" value={yesNo(r.accepted_confidentiality)} />

        <div style={{ marginTop: "1.5rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => downloadCSV([r], `agency-${r.id}.csv`)} style={primaryBtn}>↓ Export Agency CSV</button>
        </div>
      </div>
    </div>
  );
}

// ── Hover-Reveal Action Row ──
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
      style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1.2fr 72px", padding: "0.85rem 1.25rem", background: hovered ? `${PRIMARY}07` : index % 2 === 0 ? "white" : "#fafcfe", borderBottom: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.15s", alignItems: "center" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onView(r)}
    >
      <div>
        <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "700", color: DARK }}>{r.agency_name}</div>
        {r.created_at && <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", color: "#94a3b8", fontWeight: "600" }}>{new Date(r.created_at).toLocaleDateString()}</div>}
      </div>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "600", color: "#374151" }}>{r.province || "—"}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", fontWeight: "600", color: "#64748b" }}>{r.years_in_operation}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "600", color: "#64748b" }}>{r.agency_email}</span>
      <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", color: PRIMARY }}>{r.recruitment_type}</span>
      <div>{r.likelihood_official_partner ? <Badge text={r.likelihood_official_partner} color={likelihoodColor(r.likelihood_official_partner)} /> : <span style={{ color: "#cbd5e1" }}>—</span>}</div>
      <div style={{ display: "flex", gap: "0.35rem", opacity: hovered ? 1 : 0, transition: "opacity 0.18s" }} onClick={(e) => e.stopPropagation()}>
        <button title="View Details" onClick={() => onView(r)} style={{ background: `${PRIMARY}12`, border: "none", borderRadius: "0.45rem", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="13" height="13" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
        </button>
        <button title="Delete Record" onClick={() => onDelete(r.id)} style={{ background: "#fef2f2", border: "none", borderRadius: "0.45rem", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="13" height="13" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Main Dashboard Panel ──
export default function InstitutionalSurveyDashboard() {
  const [responses, setResponses] = useState<AgencySurveyRow[]>([]);
  const [stats, setStats]         = useState<StatsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [selected, setSelected]   = useState<AgencySurveyRow | null>(null);
  const [search, setSearch]       = useState("");
  const [filterProvince, setFilterProvince] = useState("");
  const [filterLikelihood, setFilterLikelihood] = useState("");
  const [page, setPage]           = useState(1);
  const [activeTab, setActiveTab] = useState<"responses" | "stats">("responses");
  const [deleteId, setDeleteId]   = useState<number | null>(null);

  const PER_PAGE = 15;

  // ── Resilient Data Fetching Process ──
  const fetchAll = useCallback(async () => {
    setLoading(true); 
    setError("");
    
    // 1. Fetch main submission records
    try {
      const rRes = await fetch(`${API_BASE}?per_page=500`);
      if (rRes.ok) {
        const rData = await rRes.json();
        const raw: Record<string, unknown>[] = rData?.data?.data ?? rData?.data ?? [];
        setResponses(raw.map(sanitizeRow));
      } else {
        setError(`Failed to retrieve records (HTTP status ${rRes.status}).`);
      }
    } catch (err) {
      setError("Could not retrieve survey model records. Verify API connection.");
      console.error("Submissions load error:", err);
    }

    // 2. Fetch stats independently so routing issues don't crash the table
    try {
      const sRes = await fetch(`${API_BASE}/stats`);
      if (sRes.ok) {
        const sData = await sRes.json();
        setStats((sData?.data as StatsData) || null);
      } else {
        console.warn("The stats route returned a non-200 state, returning clientside fallback metrics.");
      }
    } catch (err) {
      console.warn("Stats API was unavailable, fallback stats logic used instead.", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Dynamic Frontend Query Filtering ──
  const filtered = responses.filter((r) => {
    const q = search.toLowerCase();
    const matchQ   = !q || r.agency_name?.toLowerCase().includes(q) || r.province?.toLowerCase().includes(q) || r.agency_email?.toLowerCase().includes(q);
    const matchProvince = !filterProvince || r.province === filterProvince;
    const matchLikelihood = !filterLikelihood || r.likelihood_official_partner === filterLikelihood;
    return matchQ && matchProvince && matchLikelihood;
  });

  const isFiltered = !!(search || filterProvince || filterLikelihood);
  const pages      = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportLabel  = isFiltered ? `Export Filtered (${filtered.length})` : `Export All (${responses.length})`;
  const exportTarget = isFiltered ? filtered : responses;
  const exportFile   = isFiltered ? "filtered-agencies.csv" : "all-agencies.csv";

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
      setResponses((prev) => prev.filter((r) => r.id !== id));
      setDeleteId(null);
      if (selected?.id === id) setSelected(null);
    } catch { setError("Deletion protocol failed."); }
  };

  const total = responses.length;

  // ── Clientside Aggregators for Analytics Fallbacks ──
  const freqMap = (key: keyof AgencySurveyRow): Record<string, number> =>
    responses.reduce<Record<string, number>>((acc, r) => {
      const v = r[key] as string;
      if (v) acc[v] = (acc[v] || 0) + 1;
      return acc;
    }, {});

  const freqMapMulti = (key: keyof AgencySurveyRow): Record<string, number> =>
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
    fallbackKey: keyof AgencySurveyRow
  ): StatItem[] => {
    if (apiArr?.length) {
      return apiArr
        .map((i) => ({ label: String(i[labelKey] ?? Object.values(i)[0] ?? ""), count: Number(i.count ?? 0) }))
        .sort((a, b) => b.count - a.count);
    }
    return toStatArr(freqMap(fallbackKey));
  };

  const likelihoodArr  = resolveArr(stats?.by_likelihood, "likelihood_official_partner", "likelihood_official_partner");
  const provinceArr    = resolveArr(stats?.by_province, "province", "province");
  const yearsArr       = resolveArr(stats?.by_years, "years_in_operation", "years_in_operation");
  const partnerArr     = resolveArr(stats?.by_partnering, "interested_in_partnering", "interested_in_partnering");

  const recruitmentTypeArr = toStatArr(freqMap("recruitment_type"));
  const minimumCommArr     = toStatArr(freqMap("minimum_commission"));
  const challengesArr      = toStatArr(freqMapMulti("challenges")).slice(0, 8);
  const programArr         = toStatArr(freqMapMulti("academic_programs")).slice(0, 8);
  const supportArr         = toStatArr(freqMapMulti("encouraging_factors")).slice(0, 8);
  const marketsArr         = toStatArr(freqMapMulti("priority_markets")).slice(0, 8);

  return (
    <div style={{ minHeight: "100vh", background: SURFACE, fontFamily: "Rajdhani, sans-serif" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ── Header ── */}
      <div style={{ background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`, padding: "1.75rem 2rem", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${PRIMARY}12`, filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -40, left: -40, width: 180, height: 180, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(50px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER }}>Study In Nepal — Campaign Executive</span>
            <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "clamp(1.2rem, 3vw, 1.9rem)", color: "white", margin: "0.25rem 0 0", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Agency Partner{" "}
              <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Readiness</span>
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center" }}>
            <button
              onClick={() => downloadCSV(exportTarget, exportFile)}
              style={primaryBtn}
              title={isFiltered ? "Export filtered rows" : "Export all rows"}
            >
              ↓ {exportLabel}
            </button>
            <button onClick={fetchAll} style={{ ...outlineBtn, borderColor: "rgba(255,255,255,0.22)", color: "rgba(255,255,255,0.7)" }}>↻ Refresh</button>
          </div>
        </div>

        {/* Dynamic Tabs */}
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
            }}>{t === "responses" ? `Consultancy Agencies (${total})` : "Aggregated Insights"}</button>
          ))}
        </div>
      </div>

      {/* ── Main Container ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem 1.5rem 5rem" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#dc2626", padding: "0.85rem 1.25rem", borderRadius: "0.75rem", marginBottom: "1.25rem", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.82rem" }}>
            ⚠ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: "center", padding: "5rem 0", color: "#94a3b8", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", letterSpacing: "0.15em", fontSize: "0.85rem", textTransform: "uppercase" }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${PRIMARY}25`, borderTopColor: PRIMARY, borderRadius: "50%", margin: "0 auto 1rem", animation: "spin 0.8s linear infinite" }} />
            Assembling Records…
          </div>
        ) : activeTab === "stats" ? (

          /* ── ANALYTICS VIEW ── */
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
              <StatCard label="Surveyed Consultancies" value={total} sub="Total partner agencies" color={PRIMARY} />
              <StatCard label="Highly Likely Partners" value={responses.filter((r) => r.likelihood_official_partner === "Very Likely").length} sub="Official partnership goals" color="#10b981" />
              <StatCard label="Domestic & Intl" value={responses.filter((r) => r.recruitment_type === "Both Local and International Students").length} sub="Broad scope consultancies" color={AMBER} />
              <StatCard label="Willing to Associate" value={`${total ? Math.round((responses.filter((r) => r.interested_in_partnering === "Yes").length / total) * 100) : 0}%`} sub="Target partner percentage" color="#8b5cf6" />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {[
                { title: "Likelihood to Become Official Partner", arr: likelihoodArr,  colorFn: (l: string) => likelihoodColor(l) },
                { title: "Willingness to Partner with HEIs",       arr: partnerArr,     colorFn: (l: string) => interestColor(l) },
                { title: "Years in Operation Spectrum",             arr: yearsArr,       colorFn: (_l: string) => "#8b5cf6" },
                { title: "Consultancy Geographic Region",          arr: provinceArr,    colorFn: (_l: string) => PRIMARY },
                { title: "Recruitment Student Focus Type",         arr: recruitmentTypeArr, colorFn: (_l: string) => AMBER },
                { title: "Minimum Commission Expectations",        arr: minimumCommArr, colorFn: (_l: string) => "#059669" },
                { title: "Primary Hurdle Obstacles in Promotion",   arr: challengesArr,  colorFn: (_l: string) => "#f97316" },
                { title: "Academic Programs with Best Scope",      arr: programArr,     colorFn: (_l: string) => "#10b981" },
                { title: "Encouraging Promoting Incentive Elements", arr: supportArr,     colorFn: (_l: string) => "#8b5cf6" },
                { title: "Targeted Priority Source Markets",       arr: marketsArr,     colorFn: (_l: string) => "#0ea5e9" },
              ].map(({ title, arr, colorFn }) => (
                <div key={title} style={{ background: "white", borderRadius: "1rem", padding: "1.5rem", border: `1px solid ${PRIMARY}12`, boxShadow: `0 2px 12px ${PRIMARY}05` }}>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.2em", textTransform: "uppercase", color: "#94a3b8", marginBottom: "1rem" }}>{title}</div>
                  {arr.length ? arr.map(({ label, count }) => (
                    <MiniBar key={label} label={label} count={count} total={total} color={colorFn(label)} />
                  )) : <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.8rem", color: "#cbd5e1", fontWeight: "600" }}>Awaiting sync.</p>}
                </div>
              ))}
            </div>
          </div>

        ) : (

          /* ── LIST VIEW ── */
          <div>
            {/* Filtering Controls */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <svg width="14" height="14" fill="none" stroke="#94a3b8" strokeWidth="2" viewBox="0 0 24 24" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  <circle cx="11" cy="11" r="8" /><path strokeLinecap="round" d="m21 21-4.35-4.35" />
                </svg>
                <input placeholder="Search agency, province, email…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem 0.6rem 2.4rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.82rem", fontWeight: "600", color: DARK, background: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              
              <select value={filterProvince} onChange={(e) => { setFilterProvince(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterProvince ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">All Provinces</option>
                {["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"].map((p) => <option key={p} value={p}>{p}</option>)}
              </select>

              <select value={filterLikelihood} onChange={(e) => { setFilterLikelihood(e.target.value); setPage(1); }} style={{ border: "1.5px solid #e5e7eb", borderRadius: "999px", padding: "0.6rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.78rem", fontWeight: "700", color: filterLikelihood ? PRIMARY : "#94a3b8", background: "white", outline: "none", cursor: "pointer" }}>
                <option value="">Partner Likelihood</option>
                {["Very Likely", "Likely", "Neutral", "Unlikely", "Very Unlikely"].map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>

              {isFiltered && (
                <button onClick={() => { setSearch(""); setFilterProvince(""); setFilterLikelihood(""); setPage(1); }}
                  style={{ border: "1.5px solid #fca5a5", background: "#fef2f2", color: "#dc2626", borderRadius: "999px", padding: "0.5rem 1rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
                  ✕ Clear Filters
                </button>
              )}

              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: isFiltered ? PRIMARY : "#94a3b8", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginLeft: "auto" }}>
                {isFiltered ? `${filtered.length} of ${total}` : `${total} total`}
              </span>
            </div>

            {/* Grid Table */}
            <div style={{ background: "white", borderRadius: "1rem 1rem 0 0", border: `1px solid ${PRIMARY}15`, boxShadow: `0 2px 12px ${PRIMARY}05`, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr 1.2fr 72px", padding: "0.75rem 1.25rem", background: `linear-gradient(90deg, ${DARK}, #0f172a)` }}>
                {["Agency Name", "Province", "Operation Length", "Contact Email", "Recruitment Focus", "Official Partner Intent", ""].map((h, hi) => (
                  <span key={hi} style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.65rem", fontWeight: "700", letterSpacing: "0.18em", textTransform: "uppercase", color: h ? "rgba(255,255,255,0.55)" : "transparent" }}>{h || "."}</span>
                ))}
              </div>
              {paginated.length === 0 ? (
                <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "0.1em", textTransform: "uppercase" }}>No records registered.</div>
              ) : paginated.map((r, i) => (
                <ResponseRow key={r.id} r={r} index={i} onView={setSelected} onDelete={setDeleteId} />
              ))}
            </div>

            {/* Pagination Controls */}
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

      {/* Detail Inspector Modal */}
      {selected && <ResponseModal response={selected} onClose={() => setSelected(null)} />}

      {/* Delete Confirmation Box */}
      {deleteId !== null && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(10,10,10,0.55)", backdropFilter: "blur(4px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
          <div style={{ background: "white", borderRadius: "1.25rem", padding: "2rem", maxWidth: 400, width: "100%", textAlign: "center", boxShadow: "0 20px 60px rgba(10,10,10,0.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "#fef2f2", margin: "0 auto 1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="24" height="24" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h3 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.1rem", color: DARK, margin: "0 0 0.5rem", textTransform: "uppercase" }}>Delete Record?</h3>
            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.85rem", fontWeight: "600", color: "#64748b", margin: "0 0 1.5rem", lineHeight: 1.6 }}>This record will be permanently deleted from the database.</p>
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