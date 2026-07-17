import { useState, CSSProperties } from "react";

// ── design tokens matching studyinnepal.iettechnology.com ──
// Primary: sky blue (#0ea5e9 / bg-primary)
// Accent: amber (#fbbf24)
// Dark bg: neutral-950 (#0a0a0a)
// Fonts: Castoro Titling (serif headers), Rajdhani (body)

const PRIMARY = "#0ea5e9";
const AMBER = "#fbbf24";
const DARK = "#0a0a0a";
const SURFACE = "#F8FAFB";

// ── interfaces ──

interface SectionHeaderProps {
  number: string | number;
  title: string;
}

interface RadioGroupProps {
  name: string;
  options: string[];
  value: string;
  onChange: (val: string) => void;
  columns?: number;
}

interface CheckboxGroupProps {
  name: string;
  options: string[];
  value: string[];
  onChange: (val: string[]) => void;
  columns?: number;
}

interface TextInputProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  type?: string;
}

interface TextAreaProps {
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  rows?: number;
}

interface QuestionLabelProps {
  number: number;
  text: string;
  required?: boolean;
}

interface RatingTableProps {
  rows: string[];
  columns: string[];
  value: Record<string, string>;
  onChange: (row: string, col: string) => void;
}

interface ChallengeTableProps {
  rows: string[];
  value: Record<string, string>;
  onChange: (row: string, col: string) => void;
}

interface VisaRow {
  sn: number;
  label: string;
}

interface VisaRatingTableProps {
  rows: VisaRow[];
  value: Record<string, string>;
  onChange: (label: string, col: string) => void;
}

interface SurveyFormState {
  name: string;
  country: string;
  age_group: string;
  gender: string;
  study_level: string;
  faculty_program: string;
  financing: string[];
  scholarship_sources: string[];
  scholarship_other_text: string;
  scholarship_percentage: string;
  scholarship_percentage_other_text: string;
  financing_remarks: string;
  duration_with_ku: string;
  duration_before_ku: string;
  how_knew_nepal: string;
  reasons_selecting_nepal: string[];
  perception_before: string;
  why_kathmandu_university: string;
  ease_of_finding_info: string;
  admission_process_start: string;
  admission_process_rating: string;
  admission_duration: string;
  university_ratings: Record<string, string>;
  accommodation_arrangement: string;
  accommodation_other_text: string;
  living_ratings: Record<string, string>;
  other_ratings: Record<string, string>;
  inclusion_ratings: Record<string, string>;
  visa_status: string;
  visa_status_other_text: string;
  visa_overall_rating: string;
  visa_detailed_ratings: Record<string, string>;
  visa_challenge_ratings: Record<string, string>;
  visa_change_suggestion: string;
  overall_satisfaction: string;
  recommend_nepal: string;
  positive_aspects: string;
  biggest_challenges: string;
  improvements: string;
  additional_comments: string;
  consent_acknowledged: boolean;
}

// ── helpers ──

function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "2.5rem 0 1.5rem" }}>
      <span style={{
        fontFamily: "'Castoro Titling', serif",
        color: PRIMARY,
        fontSize: "2rem",
        fontWeight: "700",
        lineHeight: 1,
        minWidth: 36,
      }}>{String(number).padStart(2, "0")}</span>
      <div style={{ flex: 1, height: 1, background: `${PRIMARY}30` }} />
      <h2 style={{
        fontFamily: "'Castoro Titling', serif",
        fontSize: "0.75rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: DARK,
        fontWeight: "600",
        whiteSpace: "nowrap",
      }}>{title}</h2>
      <div style={{ flex: 1, height: 1, background: `${PRIMARY}30` }} />
    </div>
  );
}

function RadioGroup({ name, options, value, onChange, columns = 2 }: RadioGroupProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: "0.5rem 1.5rem",
      marginTop: "0.5rem",
    }}>
      {options.map((opt) => (
        <label key={opt} style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          cursor: "pointer",
          padding: "0.55rem 0.75rem",
          borderRadius: "0.5rem",
          border: `1.5px solid ${value === opt ? PRIMARY : "#e5e7eb"}`,
          background: value === opt ? `${PRIMARY}10` : "white",
          transition: "all 0.2s",
          fontFamily: "Rajdhani, sans-serif",
          fontSize: "0.82rem",
          fontWeight: "600",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: value === opt ? PRIMARY : "#555",
          userSelect: "none",
        }}>
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: PRIMARY, width: 15, height: 15, flexShrink: 0 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({ name, options, value, onChange, columns = 2 }: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
    onChange(next);
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: "0.5rem 1.5rem", marginTop: "0.5rem" }}>
      {options.map((opt) => (
        <label key={opt} style={{
          display: "flex", alignItems: "center", gap: "0.6rem",
          cursor: "pointer",
          padding: "0.55rem 0.75rem",
          borderRadius: "0.5rem",
          border: `1.5px solid ${value.includes(opt) ? AMBER : "#e5e7eb"}`,
          background: value.includes(opt) ? `${AMBER}15` : "white",
          transition: "all 0.2s",
          fontFamily: "Rajdhani, sans-serif",
          fontSize: "0.82rem",
          fontWeight: "600",
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: value.includes(opt) ? "#92400e" : "#555",
          userSelect: "none",
        }}>
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
            style={{ accentColor: AMBER, width: 15, height: 15, flexShrink: 0 }}
          />
          {opt}
        </label>
      ))}
    </div>
  );
}

function TextInput({ placeholder, value, onChange, type = "text" }: TextInputProps) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        border: `1.5px solid #e5e7eb`,
        borderRadius: "999px",
        padding: "0.75rem 1.5rem",
        fontFamily: "Rajdhani, sans-serif",
        fontSize: "0.9rem",
        fontWeight: "600",
        color: DARK,
        background: "white",
        outline: "none",
        boxSizing: "border-box",
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
        width: "100%",
        border: `1.5px solid #e5e7eb`,
        borderRadius: "1rem",
        padding: "0.85rem 1.25rem",
        fontFamily: "Rajdhani, sans-serif",
        fontSize: "0.9rem",
        fontWeight: "600",
        color: DARK,
        background: "white",
        outline: "none",
        resize: "vertical",
        boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = PRIMARY)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e7eb")}
    />
  );
}

function QuestionLabel({ number, text, required }: QuestionLabelProps) {
  return (
    <label style={{
      display: "block",
      fontFamily: "Rajdhani, sans-serif",
      fontWeight: "700",
      fontSize: "0.88rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "#1a1a1a",
      marginBottom: "0.6rem",
    }}>
      <span style={{ color: PRIMARY, marginRight: "0.4rem" }}>{number}.</span>
      {text}
      {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
    </label>
  );
}

function RatingTable({ rows, columns, value, onChange }: RatingTableProps) {
  return (
    <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left", width: "38%" }}>Area</th>
            {columns.map((col) => (
              <th key={col} style={{ ...thStyle, textAlign: "center" }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, fontWeight: "600", color: "#374151" }}>{row}</td>
              {columns.map((col) => (
                <td key={col} style={{ ...tdStyle, textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`${row}-rating`}
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

const thStyle: CSSProperties = {
  fontFamily: "Rajdhani, sans-serif",
  fontSize: "0.72rem",
  fontWeight: "700",
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "white",
  background: PRIMARY,
  padding: "0.65rem 0.75rem",
  borderBottom: `2px solid ${PRIMARY}`,
};

const tdStyle: CSSProperties = {
  fontFamily: "Rajdhani, sans-serif",
  fontSize: "0.82rem",
  padding: "0.6rem 0.75rem",
  borderBottom: "1px solid #e5e7eb",
  color: "#374151",
};

function ChallengeTable({ rows, value, onChange }: ChallengeTableProps) {
  const cols = ["No Challenge", "Minor Challenge", "Moderate Challenge", "Major Challenge"];
  return (
    <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 520 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "left", width: "32%" }}>Area</th>
            {cols.map((c) => (
              <th key={c} style={{ ...thStyle, textAlign: "center", background: "#374151" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={row} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, fontWeight: "600", color: "#374151" }}>{row}</td>
              {cols.map((col) => (
                <td key={col} style={{ ...tdStyle, textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`challenge-${row}`}
                    checked={value[row] === col}
                    onChange={() => onChange(row, col)}
                    style={{ accentColor: "#374151", width: 17, height: 17, cursor: "pointer" }}
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

function VisaRatingTable({ rows, value, onChange }: VisaRatingTableProps) {
  const cols = ["Excellent / Very Easy / Very Smooth", "Good / Easy / Smooth", "Average / Difficult", "Poor / Very Difficult"];
  const shortCols = ["Excellent / Very Easy", "Good / Easy", "Average / Difficult", "Poor / Very Difficult"];
  return (
    <div style={{ overflowX: "auto", marginTop: "0.5rem" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 600 }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, textAlign: "center", width: "5%" }}>S.N.</th>
            <th style={{ ...thStyle, textAlign: "left", width: "35%" }}>Area</th>
            {shortCols.map((c) => (
              <th key={c} style={{ ...thStyle, textAlign: "center", fontSize: "0.65rem" }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ sn, label }, ri) => (
            <tr key={label} style={{ background: ri % 2 === 0 ? "white" : "#f9fafb" }}>
              <td style={{ ...tdStyle, textAlign: "center", fontWeight: "700", color: PRIMARY }}>{sn}</td>
              <td style={{ ...tdStyle, fontWeight: "600", color: "#374151" }}>{label}</td>
              {cols.map((col) => (
                <td key={col} style={{ ...tdStyle, textAlign: "center" }}>
                  <input
                    type="radio"
                    name={`visa-${label}`}
                    checked={value[label] === col}
                    onChange={() => onChange(label, col)}
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

// ── Main Component ──
export default function SurveyForm() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialFormState: SurveyFormState = {
    name: "", country: "", age_group: "", gender: "",
    study_level: "", faculty_program: "",
    financing: [],
    scholarship_sources: [],
    scholarship_other_text: "",
    scholarship_percentage: "",
    scholarship_percentage_other_text: "",
    financing_remarks: "",
    duration_with_ku: "",
    duration_before_ku: "",
    how_knew_nepal: "", reasons_selecting_nepal: [],
    perception_before: "", why_kathmandu_university: "",
    ease_of_finding_info: "",
    admission_process_start: "", admission_process_rating: "",
    admission_duration: "",
    university_ratings: {},
    accommodation_arrangement: "",
    accommodation_other_text: "",
    living_ratings: {},
    other_ratings: {},
    inclusion_ratings: {},
    visa_status: "",
    visa_status_other_text: "",
    visa_overall_rating: "",
    visa_detailed_ratings: {},
    visa_challenge_ratings: {},
    visa_change_suggestion: "",
    overall_satisfaction: "", recommend_nepal: "",
    positive_aspects: "", biggest_challenges: "",
    improvements: "", additional_comments: "",
    consent_acknowledged: false,
  };

  const [form, setForm] = useState<SurveyFormState>(initialFormState);

  const set = <K extends keyof SurveyFormState>(key: K, val: SurveyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const setNestedRating = (
    key: "university_ratings" | "living_ratings" | "other_ratings" | "inclusion_ratings" | "visa_detailed_ratings" | "visa_challenge_ratings",
    area: string,
    val: string
  ) => {
    setForm((f) => ({
      ...f,
      [key]: {
        ...f[key],
        [area]: val,
      },
    }));
  };

  const resetForm = () => {
    setForm(initialFormState);
    setStep("form");
  };

  // ── financing toggle: clears dependent fields when "Scholarship/Financial Assistance" is unchecked ──
  const SCHOLARSHIP_OPTION = "Scholarship/Financial Assistance";
  const toggleFinancing = (opt: string) => {
    setForm((f) => {
      const isSelected = f.financing.includes(opt);
      const nextFinancing = isSelected ? f.financing.filter((v) => v !== opt) : [...f.financing, opt];

      // if the scholarship option is being unchecked, clear everything nested under it
      if (opt === SCHOLARSHIP_OPTION && isSelected) {
        return {
          ...f,
          financing: nextFinancing,
          scholarship_sources: [],
          scholarship_other_text: "",
          scholarship_percentage: "",
          scholarship_percentage_other_text: "",
        };
      }
      return { ...f, financing: nextFinancing };
    });
  };

  const toggleScholarshipSource = (opt: string) => {
    setForm((f) => {
      const next = f.scholarship_sources.includes(opt)
        ? f.scholarship_sources.filter((v) => v !== opt)
        : [...f.scholarship_sources, opt];
      return { ...f, scholarship_sources: next };
    });
  };

  const showScholarshipDetails = form.financing.includes(SCHOLARSHIP_OPTION);
  const showAccommodationOther = form.accommodation_arrangement === "Other";
  const showVisaOther = form.visa_status === "Other (Please specify)";

  const handleSubmit = async () => {
    if (!form.name || !form.country || !form.age_group) {
      setError("Please fill in all required fields (Name, Country, Age Group).");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!form.consent_acknowledged) {
      setError("Please read and accept the Confidentiality & Ethical Declaration before submitting.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const response = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error("Server error");
      setStep("success");
    } catch (e) {
      setError("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: SURFACE, fontFamily: "Rajdhani, sans-serif", position: "relative" }}>
      {/* ── Hero Banner (logos + headline live in one continuous panel) ── */}
      <div style={{
        background: `linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%)`,
        padding: "4rem 2rem 3.5rem",
        position: "relative", overflow: "hidden",
      }}>
        {/* decorative blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${PRIMARY}15`, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>

          {/* ── Co-Branding Lockup — logo x logo, no border/label ── */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}>
            <div style={{
              background: "white",
              borderRadius: "50%",
              width: 46, height: 46,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <img
                src="https://upload.wikimedia.org/wikipedia/en/thumb/c/cb/Kathmandu_University_Logo.svg/250px-Kathmandu_University_Logo.svg.png"
                alt="Kathmandu University"
                style={{ height: 36, width: 36, objectFit: "contain", display: "block" }}
                onError={(e) => { (e.currentTarget.closest("div") as HTMLDivElement).style.display = "none"; }}
              />
            </div>
            <span style={{ color: "rgba(255, 255, 255, 0.62)", fontSize: "0.85rem", fontWeight: "700" }}>x</span>
            <div style={{
              background: "white",
              borderRadius: "50%",
              width: 46, height: 46,
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
              flexShrink: 0,
            }}>
              <img
                src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png"
                alt="Study in Nepal"
                style={{
                  height: "100%", width: "100%",
                  objectFit: "cover",
                  transform: "scale(1.79)",
                  display: "block",
                }}
                onError={(e) => { (e.currentTarget.closest("div") as HTMLDivElement).style.display = "none"; }}
              />
            </div>
          </div>
          <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER, marginBottom: "1.25rem" }}>
            Visa Policy Gap Dialogue Research In Association With Kathmandu University
          </span>

          <h1 style={{
            fontFamily: "'Castoro Titling', serif",
            fontSize: "clamp(1.6rem, 4vw, 2.0rem)",
            color: "white", fontWeight: "400",
            lineHeight: 1.25, letterSpacing: "0.05em",
            textTransform: "uppercase", marginBottom: "1.25rem",
          }}>
            International Students<br />
            <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Research Questionnaire
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.88rem", fontWeight: "600", lineHeight: 1.9, letterSpacing: "0.08em", maxWidth: 560, margin: "0 auto 1.5rem" }}>
            This survey is conducted by Study In Nepal in Collaboration with Kathmandu University to
understand the experiences, challenges, and expectations of international students studying in
Nepal. The findings will be discussed in a policy dialogue involving the Ministry of Education,
Department of Immigration, MOHA, universities, and related stakeholders to improve Nepal’s
international student ecosystem.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="14" height="14" fill="none" stroke={AMBER} strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
              Estimated Time: 5–7 Minutes
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="14" height="14" fill="none" stroke={PRIMARY} strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Confidential & Anonymous
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
          /* ─────────────────────── SECTION A ─────────────────────── */
          <div key="A">
            <SectionHeader number="A" title="Personal Information" />
            <div style={grid2}>
              <div>
                <QuestionLabel number={1} text="Full Name" required />
                <TextInput placeholder="Your full name" value={form.name} onChange={(v) => set("name", v)} />
              </div>
              <div>
                <QuestionLabel number={2} text="Country of Origin" required />
                <TextInput placeholder="Your country" value={form.country} onChange={(v) => set("country", v)} />
              </div>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={3} text="Age Group" required />
              <RadioGroup name="age_group" options={["18–22", "23–27", "28+"]} value={form.age_group} onChange={(v) => set("age_group", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={4} text="Gender" />
              <RadioGroup name="gender" options={["Male", "Female", "Prefer not to say"]} value={form.gender} onChange={(v) => set("gender", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={5} text="Current Level of Study" />
              <RadioGroup name="study_level" options={["Undergraduate", "Postgraduate", "PhD", "Exchange/Short Course"]} value={form.study_level} onChange={(v) => set("study_level", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={6} text="Faculty / Program" />
              <TextInput placeholder="e.g. Computer Science, Management..." value={form.faculty_program} onChange={(v) => set("faculty_program", v)} />
            </div>

            {/* ── Q7: Financing — progressive disclosure ── */}
            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={7} text="How are you financing your studies in Nepal?" />
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888", fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>SELECT ALL THAT APPLY</p>
              <CheckboxGroup
                name="financing"
                options={["Self-funded", "Family-sponsored", SCHOLARSHIP_OPTION, "Other"]}
                value={form.financing}
                onChange={(next) => {
                  const added = next.find((x) => !form.financing.includes(x));
                  const removed = form.financing.find((x) => !next.includes(x));
                  if (added) toggleFinancing(added);
                  else if (removed) toggleFinancing(removed);
                }}
                columns={2}
              />

              {/* ── nested: scholarship sources, only when the scholarship checkbox is on ── */}
              {showScholarshipDetails && (
                <div style={{
                  marginTop: "0.85rem",
                  marginLeft: "0.25rem",
                  paddingLeft: "1.1rem",
                  borderLeft: `2.5px solid ${AMBER}50`,
                  animation: "fadeIn 0.25s ease",
                }}>
                  <p style={{
                    fontFamily: "Rajdhani, sans-serif",
                    fontSize: "0.72rem",
                    fontWeight: "700",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "#92400e",
                    marginBottom: "0.6rem",
                  }}>
                    Please specify the source(s):
                  </p>
                  <CheckboxGroup
                    name="scholarship_sources"
                    options={[
                      "Government scholarship (Home Country)",
                      "Scholarship from a home-country institution/foundation",
                      "International/Global scholarship",
                      "Kathmandu University scholarship",
                      "Scholarship from another university",
                      "Other financial assistance",
                    ]}
                    value={form.scholarship_sources}
                    onChange={(next) => {
                      const added = next.find((x) => !form.scholarship_sources.includes(x));
                      const removed = form.scholarship_sources.find((x) => !next.includes(x));
                      if (added) toggleScholarshipSource(added);
                      else if (removed) toggleScholarshipSource(removed);
                    }}
                    columns={2}
                  />

                  {form.scholarship_sources.includes("Other financial assistance") && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <TextInput
                        placeholder="Please specify the other financial assistance..."
                        value={form.scholarship_other_text}
                        onChange={(v) => set("scholarship_other_text", v)}
                      />
                    </div>
                  )}

                  {/* ── nested: percentage covered, shown once at least one source is picked ── */}
                  {form.scholarship_sources.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <p style={{
                        fontFamily: "Rajdhani, sans-serif",
                        fontSize: "0.72rem",
                        fontWeight: "700",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "#92400e",
                        marginBottom: "0.6rem",
                      }}>
                        What percentage of your tuition is covered?
                      </p>
                      <RadioGroup
                        name="scholarship_percentage"
                        options={["25%", "50%", "75%", "100%", "Other"]}
                        value={form.scholarship_percentage}
                        onChange={(v) => set("scholarship_percentage", v)}
                        columns={3}
                      />
                      {form.scholarship_percentage === "Other" && (
                        <div style={{ marginTop: "0.75rem", maxWidth: 220 }}>
                          <TextInput
                            placeholder="Specify %"
                            value={form.scholarship_percentage_other_text}
                            onChange={(v) => set("scholarship_percentage_other_text", v)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "1rem" }}>
                <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888", fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>REMARKS (IF ANY)</p>
                <TextInput
                  placeholder="Any additional remarks about your financing..."
                  value={form.financing_remarks}
                  onChange={(v) => set("financing_remarks", v)}
                />
              </div>
            </div>

            {/* ── Q8: Duration in Nepal / KU ── */}
            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={8} text="How many months/years have you spent in Nepal / Kathmandu University?" />
              <div style={grid2}>
                <div>
                  <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888", fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>WITH KATHMANDU UNIVERSITY</p>
                  <TextInput placeholder="e.g. 1 year 6 months" value={form.duration_with_ku} onChange={(v) => set("duration_with_ku", v)} />
                </div>
                <div>
                  <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888", fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>BEFORE JOINING KU (IF APPLICABLE)</p>
                  <TextInput placeholder="e.g. 3 months" value={form.duration_before_ku} onChange={(v) => set("duration_before_ku", v)} />
                </div>
              </div>
            </div>
          </div>,

          /* ─────────────────────── SECTION B ─────────────────────── */
          <div key="B">
            <SectionHeader number="B" title="Choosing Nepal & University" />

            <div>
              <QuestionLabel number={9} text="How did you first come to know about Nepal as a study destination?" />
              <RadioGroup name="how_knew_nepal" options={["Social Media / Internet", "University Promotion", "Friends / Family", "Education Consultant", "Events / Seminars", "Other"]} value={form.how_knew_nepal} onChange={(v) => set("how_knew_nepal", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={10} text="What were the main reasons for selecting Nepal?" />
              <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.72rem", color: "#888", fontWeight: "600", marginBottom: "0.5rem", letterSpacing: "0.1em" }}>MULTIPLE CHOICE</p>
              <CheckboxGroup name="reasons" options={["Affordable Education", "Quality Education", "Unique Courses", "Cultural Experience", "Practical Learning", "Safe Environment", "Scholarship Opportunities", "Recommendation from Others", "Other"]} value={form.reasons_selecting_nepal} onChange={(v) => set("reasons_selecting_nepal", v)} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={11} text="What was your overall perception of Nepal before coming?" />
              <RadioGroup name="perception_before" options={["Very Positive", "Positive", "Neutral", "Negative"]} value={form.perception_before} onChange={(v) => set("perception_before", v)} columns={4} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={12} text="Why did you choose Kathmandu University?" />
              <RadioGroup name="why_ku" options={["Course Availability", "University Reputation", "Affordable Fees", "Location", "Faculty Recommendation", "Scholarship Opportunity", "Other"]} value={form.why_kathmandu_university} onChange={(v) => set("why_kathmandu_university", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={13} text="How easy was it to find information about the university and admission process?" />
              <RadioGroup name="ease_info" options={["Very Easy", "Easy", "Difficult", "Very Difficult"]} value={form.ease_of_finding_info} onChange={(v) => set("ease_of_finding_info", v)} columns={4} />
            </div>
          </div>,

          /* ─────────────────────── SECTION C ─────────────────────── */
          <div key="C">
            <SectionHeader number="C" title="Admission Experience" />

            <div>
              <QuestionLabel number={14} text="How did you begin your admission process?" />
              <RadioGroup name="admission_start" options={["Directly through University", "Through Education Consultant/Agent", "Through Friends/Family", "Online Research", "Others"]} value={form.admission_process_start} onChange={(v) => set("admission_process_start", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={15} text="How would you rate the overall admission process?" />
              <RadioGroup name="admission_rating" options={["Excellent", "Good", "Average", "Difficult"]} value={form.admission_process_rating} onChange={(v) => set("admission_process_rating", v)} columns={4} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={16} text="Approximately how long did the admission process take?" />
              <RadioGroup name="admission_duration" options={["Less than 1 Month", "1–3 Months", "3–6 Months", "More than 6 Months"]} value={form.admission_duration} onChange={(v) => set("admission_duration", v)} columns={2} />
            </div>
          </div>,

          /* ─────────────────────── SECTION D ─────────────────────── */
          <div key="D">
            <SectionHeader number="D" title="Experience with KU" />

            <div>
              <QuestionLabel number={17} text="How would you rate the following areas at the university?" />
              <RatingTable
                rows={["Faculty Experience", "Curriculum & Learning", "Educational Infrastructure", "Practical Learning", "Research Opportunities"]}
                columns={["Poor", "Average", "Good", "Excellent"]}
                value={form.university_ratings}
                onChange={(row, col) => setNestedRating("university_ratings", row, col)}
              />
            </div>

            {/* ── Q18: Accommodation arrangement ── */}
            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={18} text="What is your current accommodation arrangement?" />
              <RadioGroup
                name="accommodation_arrangement"
                options={["On-campus residence/hostel", "Off-campus rental accommodation", "Living with family/relatives", "Homestay", "Other"]}
                value={form.accommodation_arrangement}
                onChange={(v) => set("accommodation_arrangement", v)}
                columns={2}
              />
              {showAccommodationOther && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput
                    placeholder="Please specify..."
                    value={form.accommodation_other_text}
                    onChange={(v) => set("accommodation_other_text", v)}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={19} text="How would you rate the following living experiences?" />
              <RatingTable
                rows={["Accommodation Availability", "Accommodation Standards", "Food & Hygiene", "Safety & Security"]}
                columns={["Poor", "Average", "Good", "Excellent"]}
                value={form.living_ratings}
                onChange={(row, col) => setNestedRating("living_ratings", row, col)}
              />
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={20} text="How would you rate the following other experiences in Nepal?" />
              <RatingTable
                rows={[
                  "Transportation Facilities",
                  "Internet & Communication Services",
                  "Banking Services",
                  "Health/Medical Services",
                  "Insurance Support",
                  "Sports & Recreational Facilities",
                  "Cultural & Social Activities",
                  "Outdoor Learning/Field Visit Opportunities",
                  "Student Clubs & Extracurricular Activities",
                ]}
                columns={["Poor", "Average", "Good", "Excellent"]}
                value={form.other_ratings}
                onChange={(row, col) => setNestedRating("other_ratings", row, col)}
              />
            </div>

            {/* ── Q21: Inclusion, dignity & respect ── */}
            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={21} text="How would you rate your experience regarding inclusion, dignity, and respect while studying in Nepal?" />
              <RatingTable
                rows={[
                  "Equal Treatment and Respect",
                  "Freedom from Discrimination",
                  "Gender-Friendly and Inclusive Environment",
                  "Sense of Belonging within the University Community",
                  "Support from Fellow Students and Staff",
                ]}
                columns={["Poor", "Average", "Good", "Excellent"]}
                value={form.inclusion_ratings}
                onChange={(row, col) => setNestedRating("inclusion_ratings", row, col)}
              />
            </div>
          </div>,

          /* ─────────────────────── SECTION E ─────────────────────── */
          <div key="E">
            <SectionHeader number="E" title="Visa & Immigration Experience" />

            <div>
              <QuestionLabel number={22} text="What is your current visa status in Nepal?" />
              <RadioGroup
                name="visa_status"
                options={[
                  "Student Visa (Non-Tourist Category)",
                  "Tourist Visa (Application for Student Visa in Process)",
                  "In the Renewal Process",
                  "Visa Application/Approval Pending",
                  "Other (Please specify)",
                  "Prefer not to disclose",
                ]}
                value={form.visa_status}
                onChange={(v) => set("visa_status", v)}
                columns={1}
              />
              {showVisaOther && (
                <div style={{ marginTop: "0.75rem" }}>
                  <TextInput
                    placeholder="Please specify..."
                    value={form.visa_status_other_text}
                    onChange={(v) => set("visa_status_other_text", v)}
                  />
                </div>
              )}
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={23} text="How would you rate your overall immigration and visa obtaining/renewal experience in Nepal?" />
              <RadioGroup name="visa_overall" options={["Excellent", "Good", "Average", "Poor"]} value={form.visa_overall_rating} onChange={(v) => set("visa_overall_rating", v)} columns={4} />
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={24} text="Rate the following visa, immigration, financial, and documentation-related experiences in Nepal:" />
              <VisaRatingTable
                rows={[
                  { sn: 1, label: "Online Information regarding the documents required to obtain the visa" },
                  { sn: 2, label: "Online Information regarding Visa Obtaining Procedures" },
                  { sn: 3, label: "Services at the Department of Immigration (at the time of changing visa status/renewing visa)" },
                  { sn: 4, label: "Ministry of Education (MOE) Approval Process" },
                  { sn: 5, label: "Maintaining Required Bank Balance/Funds" },
                  { sn: 6, label: "The overall Visa Process" },
                ]}
                value={form.visa_detailed_ratings}
                onChange={(row, col) => setNestedRating("visa_detailed_ratings", row, col)}
              />
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              <QuestionLabel number={25} text="Rate the following challenges faced during visa or immigration procedures:" />
              <ChallengeTable
                rows={[
                  "Time taken in Processing Visa",
                  "Clarity in required Documentation",
                  "Office Visits Required",
                  "Language Access",
                  "Coordination Between Offices",
                  "Availability of Information",
                ]}
                value={form.visa_challenge_ratings}
                onChange={(row, col) => setNestedRating("visa_challenge_ratings", row, col)}
              />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={26} text="What one change in Nepal's visa process would help international students the most?" />
              <TextArea placeholder="Your suggestion..." value={form.visa_change_suggestion} onChange={(v) => set("visa_change_suggestion", v)} rows={3} />
            </div>
          </div>,

          /* ─────────────────────── SECTION F ─────────────────────── */
          <div key="F">
            <SectionHeader number="F" title="Final Feedback" />

            <div>
              <QuestionLabel number={27} text="Overall, how satisfied are you with your study experience in Nepal?" />
              <RadioGroup name="satisfaction" options={["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]} value={form.overall_satisfaction} onChange={(v) => set("overall_satisfaction", v)} columns={2} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={28} text="Would you recommend Nepal as a study destination to other international students?" />
              <RadioGroup name="recommend" options={["Yes", "Maybe", "No"]} value={form.recommend_nepal} onChange={(v) => set("recommend_nepal", v)} columns={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={29} text="What are the strongest positive aspects of studying in Nepal?" />
              <TextArea placeholder="Share the positives..." value={form.positive_aspects} onChange={(v) => set("positive_aspects", v)} rows={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={30} text="What are the biggest challenges international students face in Nepal?" />
              <TextArea placeholder="Describe the challenges..." value={form.biggest_challenges} onChange={(v) => set("biggest_challenges", v)} rows={3} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={31} text="What improvements would you suggest for Nepal's international student system?" />
              <TextArea placeholder="Admission, visa, accommodation, university support, etc." value={form.improvements} onChange={(v) => set("improvements", v)} rows={4} />
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <QuestionLabel number={32} text="Additional Comments or Suggestions" />
              <TextArea placeholder="Any other thoughts..." value={form.additional_comments} onChange={(v) => set("additional_comments", v)} rows={3} />
            </div>
          </div>,
        ].map((section, i) => (
          <div
            key={i}
            style={{
              background: "white",
              borderRadius: "1.25rem",
              padding: "2rem",
              marginBottom: "1.5rem",
              boxShadow: "0 4px 24px rgba(14,165,233,0.06)",
              border: "1px solid rgba(14,165,233,0.1)",
            }}
          >
            {section}
          </div>
        ))}

        {/* ── Declaration ── */}
        <div style={{
          background: "white",
          borderRadius: "1.25rem",
          padding: "2rem",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 24px rgba(14,165,233,0.06)",
          border: `1px solid ${PRIMARY}25`,
        }}>
          <h2 style={{
            fontFamily: "'Castoro Titling', serif",
            fontSize: "0.75rem",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: DARK,
            fontWeight: "600",
            textAlign: "center",
            margin: "0 0 1.5rem",
          }}>
            Declaration
          </h2>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.85rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: PRIMARY,
              marginBottom: "0.5rem",
            }}>
              Confidentiality Declaration
            </h3>
            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.88rem",
              fontWeight: "600",
              color: "#444",
              lineHeight: 1.8,
            }}>
              Your responses are confidential, anonymized, and used only for research and policy purposes. Results are reported in aggregate no personal information will be shared without your consent.
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.85rem",
              fontWeight: "700",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: PRIMARY,
              marginBottom: "0.5rem",
            }}>
              Ethical Declaration
            </h3>
            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.88rem",
              fontWeight: "600",
              color: "#444",
              lineHeight: 1.8,
            }}>
              Participation is voluntary. You may skip any question or withdraw at any time without consequence. Completing this survey means you consent to take part in this research, conducted solely to support better policies for international students in Nepal.
            </p>
          </div>

          <label style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "0.75rem",
            cursor: "pointer",
            padding: "1rem 1.25rem",
            borderRadius: "0.75rem",
            border: `1.5px solid ${form.consent_acknowledged ? PRIMARY : "#e5e7eb"}`,
            background: form.consent_acknowledged ? `${PRIMARY}08` : "#fafafa",
            transition: "all 0.2s",
          }}>
            <input
              type="checkbox"
              checked={form.consent_acknowledged}
              onChange={(e) => set("consent_acknowledged", e.target.checked)}
              style={{ accentColor: PRIMARY, width: 18, height: 18, flexShrink: 0, marginTop: 2, cursor: "pointer" }}
            />
            <span style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.85rem",
              fontWeight: "700",
              color: form.consent_acknowledged ? PRIMARY : "#374151",
              letterSpacing: "0.02em",
            }}>
              I have read and understood the Confidentiality and Ethical Declaration above, and I voluntarily consent to participate in this survey.
              <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2rem" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "inline-flex", alignItems: "center", gap: "1rem",
              background: submitting ? "#94a3b8" : PRIMARY,
              color: "white",
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: "999px",
              paddingLeft: "2rem", paddingRight: "0.35rem",
              height: "3.2rem",
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "0.85rem", fontWeight: "700",
              letterSpacing: "0.18em", textTransform: "uppercase",
              boxShadow: submitting ? "none" : `0 8px 32px ${PRIMARY}40`,
              transition: "all 0.3s",
            }}
          >
            <span>{submitting ? "Submitting..." : "Submit Survey"}</span>
            <div style={{
              width: 42, height: 42, borderRadius: "50%",
              border: "1.5px solid rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
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
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(10, 10, 10, 0.6)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "1.5rem",
        }}>
          <div style={{
            maxWidth: 520,
            width: "100%",
            background: "white",
            borderRadius: "1.5rem",
            padding: "3rem 2.5rem",
            textAlign: "center",
            boxShadow: "0 20px 60px rgba(10, 10, 10, 0.25)",
            border: `1px solid ${PRIMARY}20`,
            position: "relative",
          }}>
            {/* Close button at top right */}
            <button
              onClick={resetForm}
              style={{
                position: "absolute",
                top: "1.25rem",
                right: "1.25rem",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                padding: "4px",
                outline: "none",
              }}
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: `${PRIMARY}15`, margin: "0 auto 1.5rem",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="36" height="36" fill="none" stroke={PRIMARY} strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 style={{
              fontFamily: "'Castoro Titling', serif",
              fontSize: "1.6rem",
              color: DARK,
              marginBottom: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em"
            }}>
              Thank You!
            </h2>

            <p style={{
              fontFamily: "Rajdhani, sans-serif",
              fontSize: "1rem",
              fontWeight: "600",
              color: "#555",
              lineHeight: 1.8
            }}>
              Thank you for participating in this survey. Your feedback will help improve Nepal's international student policies and strengthen Nepal as an emerging global education destination.
            </p>

            <button
              onClick={resetForm}
              style={{
                marginTop: "2rem",
                background: PRIMARY,
                color: "white",
                border: "none",
                borderRadius: "999px",
                padding: "0.75rem 2.5rem",
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "0.85rem",
                fontWeight: "700",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
                boxShadow: `0 4px 14px ${PRIMARY}40`,
                outline: "none",
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

const grid2: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "1rem",
};