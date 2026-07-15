import { useState, CSSProperties } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// ── design tokens (kept consistent with studyinnepal.iettechnology.com) ──
const PRIMARY = "#0ea5e9";
const AMBER = "#fbbf24";
const DARK = "#0a0a0a";
const SURFACE = "#F8FAFB";

// ── option constants (kept identical to backend validation rules in
//    StoreAgencySurveyRequest — if you change an option here, change it
//    there too, or submissions will fail validation) ──
const PROVINCES = ["Koshi", "Madhesh", "Bagmati", "Gandaki", "Lumbini", "Karnali", "Sudurpashchim"];
const YEARS_OPTIONS = ["Less than 1 year", "1–3 years", "4–7 years", "8–10 years", "More than 10 years"];
const RECRUITMENT_TYPES = ["Local (Domestic Students)", "International Students", "Both Local and International Students", "No"];
const YES_NO_NOTSURE = ["Yes", "No", "Not Sure"];
const YES_NO_MAYBE = ["Yes", "No", "Maybe"];
const YES_NO = ["Yes", "No"];
const LIKERT = ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"];
const READINESS_STATEMENTS = [
  "Nepal has strong potential as an international study destination.",
  "My agency's existing network could recruit students for Nepal.",
  "Promoting Nepal would not conflict with our existing business.",
  "My agency is willing to promote Study Nepal alongside our current destinations.",
];
const CHALLENGES_OPTIONS = ["Limited international awareness", "Visa and immigration procedures", "Lack of institutional marketing", "Other"];
const ACADEMIC_PROGRAMS = [
  "Medical Education (MBBS, BDS, Nursing, Public Health, Allied Health Sciences)",
  "Tourism & Hospitality",
  "Buddhist & Himalayan Studies",
  "Mountaineering Studies",
  "Agriculture & Natural Sciences",
  "Volunteering with Studies",
  "Short-term / Exchange Programs",
  "Other",
];
const ENCOURAGING_FACTORS = [
  "MoU/Direct Partnership with Nepalese Higher Education Institutions",
  "Access to the Study Nepal B2B Portal",
  "Attractive Commission Structure",
  "Faster Admission and Visa Support",
  "Joint Education Fairs & B2B Meetings",
  "Other",
];
// Q19 source doc had a stray "Europe" / "Amrican" line outside the checkbox list — folded
// in here as proper options (typo corrected to "North America").
const PRIORITY_MARKETS = [
  "India", "Bangladesh", "Sri Lanka", "Pakistan", "Bhutan", "Maldives",
  "Myanmar", "Thailand", "Vietnam", "Indonesia", "African Countries",
  "Central Asia", "Middle East", "Europe", "North America", "Other",
];
const COMMISSION_BANDS = ["Less than NPR 50,000", "NPR 50,000 – 75,000", "NPR 75,000 – 100,000", "More than NPR 100,000", "Depends on the institution/program"];
const CAPACITY_BANDS = ["1–10", "11–25", "26–50", "51–100", "More than 100"];
const LIKELIHOOD_OPTIONS = ["Very Unlikely", "Unlikely", "Neutral", "Likely", "Very Likely"];

// ── interfaces ──

interface SectionHeaderProps { number: string | number; title: string }
interface RadioGroupProps { name: string; options: string[]; value: string; onChange: (val: string) => void; columns?: number }
interface CheckboxGroupProps { name: string; options: string[]; value: string[]; onChange: (val: string[]) => void; columns?: number; maxSelect?: number }
interface TextInputProps { placeholder?: string; value: string; onChange: (val: string) => void; type?: string; min?: number }
interface TextAreaProps { placeholder?: string; value: string; onChange: (val: string) => void; rows?: number }
interface QuestionLabelProps { number: number; text: string; required?: boolean; hint?: string }
interface LikertTableProps { rows: string[]; value: Record<string, string>; onChange: (row: string, col: string) => void }

interface SurveyFormState {
  // Section A
  agency_name: string;
  agency_email: string;
  agency_phone: string;
  province: string;
  years_in_operation: string;
  // Section B
  recruitment_type: string;
  local_students_recruited: string;
  international_students_recruited: string;
  aware_of_commissions: string;
  interested_in_partnering: string;
  currently_represents_institution: string;
  represented_institutions: string;
  // Section C
  readiness_ratings: Record<string, string>;
  // Section D
  challenges: string[];
  challenges_other_text: string;
  interested_in_training: string;
  // Section E
  academic_programs: string[];
  academic_programs_other_text: string;
  // Section F
  b2b_portal_useful: string;
  encouraging_factors: string[];
  encouraging_factors_other_text: string;
  interested_in_events: string;
  // Section G
  priority_markets: string[];
  priority_markets_other_text: string;
  // Section H
  minimum_commission: string;
  annual_recruitment_capacity: string;
  likelihood_official_partner: string;
  // Section I
  top_recommendations: string;
  willing_future_participation: string;
  contact_details: string;
}

// ── helpers ──

function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2.5rem 0 1.5rem" }}>
      <span style={{ fontFamily: "'Castoro Titling', serif", color: PRIMARY, fontSize: "2rem", fontWeight: "700", lineHeight: 1, minWidth: 36 }}>
        {String(number).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, height: 1, background: `${PRIMARY}30` }} />
      <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: DARK, fontWeight: "600", whiteSpace: "nowrap" }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: `${PRIMARY}30` }} />
    </div>
  );
}

function RadioGroup({ name, options, value, onChange, columns = 2 }: RadioGroupProps) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0.5rem 1.5rem", marginTop: "0.5rem" }}>
      {options.map((opt) => (
        <label key={opt} style={{
          display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer",
          padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
          border: `1.5px solid ${value === opt ? PRIMARY : "#e5e7eb"}`,
          background: value === opt ? `${PRIMARY}10` : "white",
          transition: "all 0.2s", fontFamily: "Rajdhani, sans-serif",
          fontSize: "0.82rem", fontWeight: "600", letterSpacing: "0.05em",
          color: value === opt ? PRIMARY : "#555", userSelect: "none",
        }}>
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)}
            style={{ accentColor: PRIMARY, width: 15, height: 15, flexShrink: 0 }} />
          {opt}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, value, onChange, columns = 2, maxSelect }: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    const isSelected = value.includes(opt);
    if (!isSelected && maxSelect && value.length >= maxSelect) return;
    const next = isSelected ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0.5rem 1.5rem", marginTop: "0.5rem" }}>
      {options.map((opt) => {
        const disabled = !value.includes(opt) && !!maxSelect && value.length >= maxSelect;
        return (
          <label key={opt} style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            cursor: disabled ? "not-allowed" : "pointer",
            padding: "0.55rem 0.75rem", borderRadius: "0.5rem",
            border: `1.5px solid ${value.includes(opt) ? AMBER : "#e5e7eb"}`,
            background: value.includes(opt) ? `${AMBER}15` : disabled ? "#fafafa" : "white",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s", fontFamily: "Rajdhani, sans-serif",
            fontSize: "0.82rem", fontWeight: "600", letterSpacing: "0.05em",
            color: value.includes(opt) ? "#92400e" : "#555", userSelect: "none",
          }}>
            <input type="checkbox" checked={value.includes(opt)} disabled={disabled} onChange={() => toggle(opt)}
              style={{ accentColor: AMBER, width: 15, height: 15, flexShrink: 0 }} />
            {opt}
          </label>
        );
      })}
    </div>
  );
}

function TextInput({ placeholder, value, onChange, type = "text", min }: TextInputProps) {
  return (
    <input
      type={type}
      min={type === "number" ? min ?? 0 : undefined}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", border: `1.5px solid #e5e7eb`, borderRadius: "999px",
        padding: "0.75rem 1.5rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.9rem",
        fontWeight: "600", color: DARK, background: "white", outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = PRIMARY)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function TextArea({ placeholder, value, onChange, rows = 3 }: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", border: `1.5px solid #e5e7eb`, borderRadius: "1rem",
        padding: "0.85rem 1.25rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.9rem",
        fontWeight: "600", color: DARK, background: "white", outline: "none", resize: "vertical",
        boxSizing: "border-box", transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = PRIMARY)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function QuestionLabel({ number, text, required, hint }: QuestionLabelProps) {
  return (
    <label style={{ display: "block", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.88rem", letterSpacing: "0.06em", color: "#1a1a1a", marginBottom: "0.4rem" }}>
      <span style={{ color: PRIMARY, marginRight: "0.4rem" }}>{number}.</span>
      {text}
      {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      {hint && (
        <span style={{ display: "block", fontWeight: "600", fontSize: "0.72rem", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.3rem" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function LikertTable({ rows, value, onChange }: LikertTableProps) {
  return (
    <div style={{ overflowX: "auto", marginTop: "0.75rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left", width: "34%" }}>Statement</th>
            {LIKERT.map((col) => (
              <th key={col} style={{ ...thStyle, textAlign: "center", fontSize: "0.62rem" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, fontWeight: "600", color: "#374151" }}>{row}</td>
              {LIKERT.map((col) => (
                <td key={col} style={{ ...tdStyle, textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`likert-${row}`}
                    checked={value[row] === col}
                    onChange={() => onChange(row, col)}
                    style={{ accentColor: PRIMARY, width: 17, height: 17, cursor: "pointer" }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Wraps react-phone-number-input's <PhoneInput/> so it visually matches the
// pill-shaped TextInput style used everywhere else in this form. The library
// doesn't accept arbitrary inline style props for its internal <input/>, so
// it's themed via the CSS custom properties it exposes, scoped to this
// wrapper class only (won't leak into any other PhoneInput elsewhere).
function PhoneNumberField({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="survey-phone-field">
      <style>{`
        .survey-phone-field .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          border: 1.5px solid #e5e7eb;
          border-radius: 999px;
          padding: 0.55rem 1.25rem;
          background: white;
          transition: border-color 0.2s;
        }
        .survey-phone-field .PhoneInput:focus-within {
          border-color: ${PRIMARY};
        }
        .survey-phone-field .PhoneInputInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: ${DARK};
          min-width: 0;
        }
        .survey-phone-field .PhoneInputCountry {
          flex-shrink: 0;
        }
        .survey-phone-field .PhoneInputCountrySelectArrow {
          color: #94a3b8;
        }
      `}</style>
      <PhoneInput
        international
        defaultCountry="NP"
        placeholder="Enter contact number"
        value={value || undefined}
        onChange={(v) => onChange(v ?? "")}
      />
    </div>
  );
}

const thStyle: CSSProperties = {
  fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", fontWeight: "700",
  letterSpacing: "0.1em", textTransform: "uppercase", color: "white",
  background: PRIMARY, padding: "0.65rem 0.6rem", borderBottom: `2px solid ${PRIMARY}`,
};

const tdStyle: CSSProperties = {
  fontFamily: "Rajdhani, sans-serif", fontSize: "0.82rem", padding: "0.6rem 0.6rem",
  borderBottom: "1px solid #e5e7eb", color: "#374151",
};

const grid2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" };

const helperText: CSSProperties = {
  fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888",
  fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em",
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Main Component ──
export default function AgencyReadinessSurveyForm() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialFormState: SurveyFormState = {
    agency_name: "", agency_email: "", agency_phone: "", province: "", years_in_operation: "",
    recruitment_type: "", local_students_recruited: "", international_students_recruited: "",
    aware_of_commissions: "", interested_in_partnering: "",
    currently_represents_institution: "", represented_institutions: "",
    readiness_ratings: {},
    challenges: [], challenges_other_text: "", interested_in_training: "",
    academic_programs: [], academic_programs_other_text: "",
    b2b_portal_useful: "", encouraging_factors: [], encouraging_factors_other_text: "",
    interested_in_events: "",
    priority_markets: [], priority_markets_other_text: "",
    minimum_commission: "", annual_recruitment_capacity: "", likelihood_official_partner: "",
    top_recommendations: "", willing_future_participation: "", contact_details: "",
  };

  const [form, setForm] = useState<SurveyFormState>(initialFormState);

  const set = <K extends keyof SurveyFormState>(key: K, val: SurveyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setReadiness = (statement: string, val: string) =>
    setForm((f) => ({ ...f, readiness_ratings: { ...f.readiness_ratings, [statement]: val } }));

  const resetForm = () => { setForm(initialFormState); setStep("form"); };

  const showRepresentedInstitutions = form.currently_represents_institution === "Yes";
  const showChallengesOther = form.challenges.includes("Other");
  const showAcademicOther = form.academic_programs.includes("Other");
  const showEncouragingOther = form.encouraging_factors.includes("Other");
  const showMarketsOther = form.priority_markets.includes("Other");
  const showContactDetails = form.willing_future_participation === "Yes";
  const showRecruitmentCounts = form.recruitment_type !== "No" && form.recruitment_type !== "";

  const fail = (message: string) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.agency_name.trim() || !form.agency_email.trim() || !form.agency_phone || !form.province || !form.years_in_operation) {
      fail("Please fill in all required fields in Agency Profile (Name, Email, Phone, Province, Years in Operation).");
      return;
    }
    if (!EMAIL_PATTERN.test(form.agency_email.trim())) {
      fail("Please enter a valid email address for the agency.");
      return;
    }
    if (!form.recruitment_type || !form.aware_of_commissions || !form.interested_in_partnering || !form.currently_represents_institution) {
      fail("Please complete all required questions in the Recruitment Experience section.");
      return;
    }
    if (showRepresentedInstitutions && !form.represented_institutions.trim()) {
      fail("Please specify which institution(s) your agency represents.");
      return;
    }
    if (showChallengesOther && !form.challenges_other_text.trim()) {
      fail('Please specify your "Other" challenge in the Challenges & Training section.');
      return;
    }
    if (!form.interested_in_training) {
      fail("Please answer whether you'd be interested in Study Nepal Product Training.");
      return;
    }
    if (showAcademicOther && !form.academic_programs_other_text.trim()) {
      fail('Please specify your "Other" academic program in the Academic Programs section.');
      return;
    }
    if (!form.b2b_portal_useful || !form.interested_in_events) {
      fail("Please complete all required questions in the Promotion & Support section.");
      return;
    }
    if (showEncouragingOther && !form.encouraging_factors_other_text.trim()) {
      fail('Please specify your "Other" encouraging factor in the Promotion & Support section.');
      return;
    }
    if (showMarketsOther && !form.priority_markets_other_text.trim()) {
      fail('Please specify your "Other" market in the Market Focus section.');
      return;
    }
    if (!form.minimum_commission || !form.annual_recruitment_capacity || !form.likelihood_official_partner) {
      fail("Please complete all required questions in the Commission & Partnership section.");
      return;
    }
    if (!form.willing_future_participation) {
      fail("Please answer whether you'd be willing to participate in future Study Nepal activities.");
      return;
    }
    if (showContactDetails && !form.contact_details.trim()) {
      fail("Please provide your contact details so we can follow up.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        agency_name: form.agency_name.trim(),
        agency_email: form.agency_email.trim(),
        represented_institutions: form.represented_institutions.trim(),
        local_students_recruited: form.local_students_recruited ? parseInt(form.local_students_recruited, 10) : null,
        international_students_recruited: form.international_students_recruited ? parseInt(form.international_students_recruited, 10) : null,
      };
      const response = await fetch("/api/agency/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const firstError = body?.errors ? Object.values(body.errors)[0] : null;
        throw new Error(Array.isArray(firstError) ? firstError[0] : body?.message || "Server error");
      }
      setStep("success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed. Please try again.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: SURFACE, fontFamily: "Rajdhani, sans-serif", position: "relative" }}>
      {/* ── Hero Banner ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`,
        padding: "4rem 2rem 3.5rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${PRIMARY}15`, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ background: "white", borderRadius: "50%", width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              <img
                src="/SIN-logo.png"
                alt="Study Nepal Campaign"
                style={{ height: "100%", width: "100%", objectFit: "cover", transform: "scale(1.79)", display: "block" }}
                onError={(e) => { (e.currentTarget.closest("div") as HTMLDivElement).style.display = "none"; }}
              />
            </div>
          </div>

          <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.68rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER, marginBottom: "1.25rem" }}>
            Study Nepal Campaign
          </span>

          <h1 style={{
            fontFamily: "'Castoro Titling', serif", fontSize: "clamp(1.6rem, 4vw, 2.8rem)",
            color: "white", fontWeight: "400", lineHeight: 1.25, letterSpacing: "0.05em",
            textTransform: "uppercase", marginBottom: "1.25rem",
          }}>
            Education Agency<br />
            <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Partner Readiness Survey
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", fontWeight: "600", lineHeight: 1.9, letterSpacing: "0.04em", maxWidth: 600, margin: "0 auto 1.5rem" }}>
            This survey assesses the readiness, capacity, and willingness of education consultancy
            agencies to recruit students into Nepalese higher education institutions. Findings will
            support evidence-based policies, partnership models, product training, marketing
            strategies, and incentive mechanisms for Nepal's international education ecosystem.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="14" height="14" fill="none" stroke={AMBER} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
              Estimated Time: 8–10 Minutes
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="14" height="14" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Confidential — Research & Policy Use Only
            </span>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#dc2626", padding: "0.85rem 1.25rem", borderRadius: "0.75rem", marginBottom: "1.5rem", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.85rem", letterSpacing: "0.05em" }}>
            ⚠ {error}
          </div>
        )}

        {[
          /* ─────────────────────── SECTION A: Agency Profile ─────────────────────── */
          <div key="A">
            <SectionHeader number="A" title="Agency Profile" />
            <div>
              <QuestionLabel number={1} text="Name of Agency" required />
              <TextInput placeholder="Your agency's name" value={form.agency_name} onChange={(v) => set("agency_name", v)} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={2} text="Agency Email Address" required />
              <TextInput type="email" placeholder="agency@example.com" value={form.agency_email} onChange={(v) => set("agency_email", v)} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={3} text="Contact Number" required hint="Include country code" />
              <PhoneNumberField value={form.agency_phone} onChange={(v) => set("agency_phone", v)} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={4} text="Province" required />
              <RadioGroup name="province" options={PROVINCES} value={form.province} onChange={(v) => set("province", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={5} text="Number of Years in Operation" required />
              <RadioGroup name="years_in_operation" options={YEARS_OPTIONS} value={form.years_in_operation} onChange={(v) => set("years_in_operation", v)} columns={2} />
            </div>
          </div>,

          /* ─────────────────────── SECTION B: Recruitment Experience ─────────────────────── */
          <div key="B">
            <SectionHeader number="B" title="Recruitment Experience" />

            <div>
              <QuestionLabel number={6} text="Have you ever recruited students for Nepal?" required />
              <RadioGroup name="recruitment_type" options={RECRUITMENT_TYPES} value={form.recruitment_type} onChange={(v) => set("recruitment_type", v)} columns={2} />
            </div>

            {showRecruitmentCounts && (
              <div style={{ marginTop: "1.25rem" }}>
                <QuestionLabel number={7} text="Approximately how many students has your agency recruited during the past three years?" />
                <div style={grid2}>
                  <div>
                    <p style={helperText}>LOCAL STUDENTS</p>
                    <TextInput type="number" min={0} placeholder="0" value={form.local_students_recruited} onChange={(v) => set("local_students_recruited", v)} />
                  </div>
                  <div>
                    <p style={helperText}>INTERNATIONAL STUDENTS</p>
                    <TextInput type="number" min={0} placeholder="0" value={form.international_students_recruited} onChange={(v) => set("international_students_recruited", v)} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={8} text="Are you aware that Nepalese higher education institutions provide recruitment commissions and incentives?" required />
              <RadioGroup name="aware_of_commissions" options={YES_NO_NOTSURE} value={form.aware_of_commissions} onChange={(v) => set("aware_of_commissions", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={9} text="Would your agency be interested in partnering with Nepalese higher education institutions?" required />
              <RadioGroup name="interested_in_partnering" options={YES_NO_MAYBE} value={form.interested_in_partnering} onChange={(v) => set("interested_in_partnering", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={10} text="Do you currently represent any higher education institution of Nepal?" required />
              <RadioGroup name="currently_represents_institution" options={YES_NO} value={form.currently_represents_institution} onChange={(v) => set("currently_represents_institution", v)} columns={2} />
              {showRepresentedInstitutions && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput placeholder="Please specify the institution(s)..." value={form.represented_institutions} onChange={(v) => set("represented_institutions", v)} />
                </div>
              )}
            </div>
          </div>,

          /* ─────────────────────── SECTION C: Agency Readiness ─────────────────────── */
          <div key="C">
            <SectionHeader number="C" title="Agency Readiness" />
            <QuestionLabel number={11} text="Please indicate your level of agreement with the following statements." />
            <LikertTable rows={READINESS_STATEMENTS} value={form.readiness_ratings} onChange={setReadiness} />
          </div>,

          /* ─────────────────────── SECTION D: Challenges & Training ─────────────────────── */
          <div key="D">
            <SectionHeader number="D" title="Challenges & Training" />

            <div>
              <QuestionLabel number={12} text="What are the biggest challenges in promoting Nepal as a study destination?" hint="Select up to three" />
              <CheckboxGroup name="challenges" options={CHALLENGES_OPTIONS} value={form.challenges} onChange={(v) => set("challenges", v)} columns={2} maxSelect={3} />
              {showChallengesOther && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput placeholder="Please specify..." value={form.challenges_other_text} onChange={(v) => set("challenges_other_text", v)} />
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={13} text="Would you be interested in receiving official Study Nepal Product Training?" required />
              <RadioGroup name="interested_in_training" options={YES_NO_MAYBE} value={form.interested_in_training} onChange={(v) => set("interested_in_training", v)} columns={3} />
            </div>
          </div>,

          /* ─────────────────────── SECTION E: Academic Programs ─────────────────────── */
          <div key="E">
            <SectionHeader number="E" title="Academic Programs" />
            <QuestionLabel number={14} text="Which academic programs do you believe have the greatest potential to attract international students to Nepal?" hint="Select all that apply" />
            <CheckboxGroup name="academic_programs" options={ACADEMIC_PROGRAMS} value={form.academic_programs} onChange={(v) => set("academic_programs", v)} columns={1} />
            {showAcademicOther && (
              <div style={{ marginTop: "0.75rem" }}>
                <TextInput placeholder="Please specify..." value={form.academic_programs_other_text} onChange={(v) => set("academic_programs_other_text", v)} />
              </div>
            )}
          </div>,

          /* ─────────────────────── SECTION F: Promotion & Support ─────────────────────── */
          <div key="F">
            <SectionHeader number="F" title="Promotion & Support" />

            <div>
              <QuestionLabel number={15} text="Would a centralized Study Nepal B2B Portal (institutions, programs, scholarships, admissions, application tracking, and agent resources) be useful for your agency?" required />
              <RadioGroup name="b2b_portal_useful" options={YES_NO_NOTSURE} value={form.b2b_portal_useful} onChange={(v) => set("b2b_portal_useful", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={16} text="What factors would encourage your agency to actively promote Study Nepal?" hint="Select all that apply" />
              <CheckboxGroup name="encouraging_factors" options={ENCOURAGING_FACTORS} value={form.encouraging_factors} onChange={(v) => set("encouraging_factors", v)} columns={1} />
              {showEncouragingOther && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput placeholder="Please specify..." value={form.encouraging_factors_other_text} onChange={(v) => set("encouraging_factors_other_text", v)} />
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={17} text="Would your agency be interested in participating in upcoming Study Nepal events (B2B meetings, education fairs, roadshows, webinars, and networking programs)?" required />
              <RadioGroup name="interested_in_events" options={YES_NO_MAYBE} value={form.interested_in_events} onChange={(v) => set("interested_in_events", v)} columns={3} />
            </div>
          </div>,

          /* ─────────────────────── SECTION G: Market Focus ─────────────────────── */
          <div key="G">
            <SectionHeader number="G" title="Market Focus" />
            <QuestionLabel number={19} text="If your agency recruits international students, which markets would you prioritize for Study Nepal?" hint="Select all that apply" />
            <CheckboxGroup name="priority_markets" options={PRIORITY_MARKETS} value={form.priority_markets} onChange={(v) => set("priority_markets", v)} columns={2} />
            {showMarketsOther && (
              <div style={{ marginTop: "0.75rem" }}>
                <TextInput placeholder="Please specify..." value={form.priority_markets_other_text} onChange={(v) => set("priority_markets_other_text", v)} />
              </div>
            )}
          </div>,

          /* ─────────────────────── SECTION H: Commission & Partnership ─────────────────────── */
          <div key="H">
            <SectionHeader number="H" title="Commission & Partnership" />

            <div>
              <QuestionLabel number={20} text="What minimum commission per successfully enrolled student would motivate your agency to recruit students for Nepal?" required />
              <RadioGroup name="minimum_commission" options={COMMISSION_BANDS} value={form.minimum_commission} onChange={(v) => set("minimum_commission", v)} columns={1} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={21} text="How many international students could your agency realistically recruit to Nepal each year if adequate institutional support, training, and attractive incentives were available?" required />
              <RadioGroup name="annual_recruitment_capacity" options={CAPACITY_BANDS} value={form.annual_recruitment_capacity} onChange={(v) => set("annual_recruitment_capacity", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={22} text="How likely is your agency to become an Official Study Nepal Recruitment Partner?" required />
              <RadioGroup name="likelihood_official_partner" options={LIKELIHOOD_OPTIONS} value={form.likelihood_official_partner} onChange={(v) => set("likelihood_official_partner", v)} columns={3} />
            </div>
          </div>,

          /* ─────────────────────── SECTION I: Recommendations ─────────────────────── */
          <div key="I">
            <SectionHeader number="I" title="Recommendations" />

            <div>
              <QuestionLabel number={23} text="In your opinion, what are the top three actions needed to make Nepal a preferred destination for international students?" />
              <TextArea placeholder="Share your top three recommendations..." value={form.top_recommendations} onChange={(v) => set("top_recommendations", v)} rows={4} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={24} text="Would you be willing to participate in future Study Nepal consultations, pilot projects, training programs, or B2B networking activities?" required />
              <RadioGroup name="willing_future_participation" options={YES_NO} value={form.willing_future_participation} onChange={(v) => set("willing_future_participation", v)} columns={2} />
              {showContactDetails && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput placeholder="Your contact details (email or phone)..." value={form.contact_details} onChange={(v) => set("contact_details", v)} />
                </div>
              )}
            </div>
          </div>,
        ].map((section, i) => (
          <div key={i} style={{
            background: "white", borderRadius: "1.25rem", padding: "2rem", marginBottom: "1.5rem",
            boxShadow: "0 4px 24px rgba(14,165,233,0.06)", border: "1px solid rgba(14,165,233,0.1)",
          }}>
            {section}
          </div>
        ))}

        {/* ── Confidentiality Notice ── */}
        <div style={{
          background: "white", borderRadius: "1.25rem", padding: "2rem", marginBottom: "1.5rem",
          boxShadow: "0 4px 24px rgba(14,165,233,0.06)", border: `1px solid ${PRIMARY}25`,
        }}>
          <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: DARK, fontWeight: "600", textAlign: "center", margin: "0 0 1rem" }}>
            Confidentiality
          </h2>
          <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "600", color: "#444", lineHeight: 1.8, textAlign: "center" }}>
            All responses will remain confidential and will be used solely for research and policy development purposes.
          </p>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "inline-flex", alignItems: "center", gap: "1rem",
              background: submitting ? "#94a3b8" : PRIMARY, color: "white",
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: "999px", paddingLeft: "2rem", paddingRight: "0.35rem", height: "3.2rem",
              fontFamily: "Rajdhani, sans-serif", fontSize: "0.85rem", fontWeight: "700",
              letterSpacing: "0.18em", textTransform: "uppercase",
              boxShadow: submitting ? "none" : `0 8px 32px ${PRIMARY}40`, transition: "all 0.3s",
            }}
          >
            <span>{submitting ? "Submitting..." : "Submit Survey"}</span>
            <div style={{ width: 42, height: 42, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* ── Success Popup Modal ── */}
      {step === "success" && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(10, 10, 10, 0.6)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem",
        }}>
          <div style={{
            maxWidth: 520, width: "100%", background: "white", borderRadius: "1.5rem",
            padding: "3rem 2.5rem", textAlign: "center", boxShadow: "0 20px 60px rgba(10, 10, 10, 0.25)",
            border: `1px solid ${PRIMARY}20`, position: "relative",
          }}>
            <button onClick={resetForm} style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", outline: "none" }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${PRIMARY}15`, margin: "0 auto 1.5rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" fill="none" stroke={PRIMARY} strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.6rem", color: DARK, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Thank You!
            </h2>

            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1rem", fontWeight: "600", color: "#555", lineHeight: 1.8 }}>
              Thank you for completing the Study Nepal Campaign Agency Readiness Survey. Your responses
              will help shape partnership models, training programs, and incentive structures for
              Nepal's international education ecosystem.
            </p>

            <button
              onClick={resetForm}
              style={{
                marginTop: "2rem", background: PRIMARY, color: "white", border: "none",
                borderRadius: "999px", padding: "0.75rem 2.5rem", fontFamily: "Rajdhani, sans-serif",
                fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.1em", textTransform: "uppercase",
                cursor: "pointer", boxShadow: `0 4px 14px ${PRIMARY}40`, outline: "none",
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}