import { useState, CSSProperties } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

// ── design tokens ──
const PRIMARY = "#0ea5e9";
const AMBER = "#fbbf24";
const DARK = "#0a0a0a";
const SURFACE = "#F8FAFB";

// ── option constants ──
const INTL_OFFICE_STATUS = ["Yes", "No", "Under Development"];
const YES_NO = ["Yes", "No"];
const STRATEGY_STATUS = ["Yes", "Under Development", "No"];
const READINESS_LEVELS = ["Highly Ready", "Moderately Ready", "Needs Improvement", "Not Ready"];
const FACULTY_READINESS = ["Yes", "Somewhat", "No"];
const INFRASTRUCTURE_LEVELS = ["Fully Adequate", "Partially Adequate", "Inadequate", "Not Available"];
const BARRIERS_OPTIONS = [
  "Government Policies and Regulations",
  "Visa and Immigration Procedures",
  "Limited International Partnerships",
  "Institutional Infrastructure",
  "Financial Resources",
  "International Marketing and Promotion",
  "Faculty Capacity",
  "Student Support Services",
  "Lack of Global Recognition",
  "Other",
];
const POLICY_SUPPORT_LEVELS = ["Adequately Supportive", "Partially Supportive", "Not Supportive"];
const SUPPORT_TYPES = [
  "International Marketing and Branding",
  "International Student Recruitment",
  "International Academic Partnerships",
  "Capacity Building and Staff Training",
  "Policy Advocacy",
  "Research and Data Support",
  "International Conferences and Networking Events",
  "Digital Student Recruitment Platform",
  "Other",
];
const ACADEMIC_DISCIPLINES = [
  "Medicine and Health Sciences",
  "Engineering and Technology",
  "Business and Management",
  "Information Technology",
  "Agriculture and Veterinary Sciences",
  "Tourism and Hospitality",
  "Buddhist Studies",
  "Sanskrit, Nepali Language and Cultural Studies",
  "Development Studies",
  "Environmental Studies",
  "Other",
];
const YES_MAYBE_NO = ["Yes", "Maybe", "No"];

// ── interfaces ──

interface SectionHeaderProps { number: string | number; title: string }
interface RadioGroupProps { name: string; options: string[]; value: string; onChange: (val: string) => void; columns?: number }
interface CheckboxGroupProps { name: string; options: string[]; value: string[]; onChange: (val: string[]) => void; columns?: number; maxSelect?: number }
interface TextInputProps { placeholder?: string; value: string; onChange: (val: string) => void; type?: string; min?: number }
interface TextAreaProps { placeholder?: string; value: string; onChange: (val: string) => void; rows?: number }
interface QuestionLabelProps { number: number; text: string; required?: boolean; hint?: string }

interface SurveyFormState {
  institution_name: string;
  university_affiliation: string;
  institution_email: string;
  institution_phone: string;
  has_international_office: string;
  currently_enrolling_international: string;
  international_students_enrolled: string;
  has_internationalization_strategy: string;
  has_active_partnerships: string;
  overall_readiness: string;
  faculty_prepared: string;
  infrastructure_adequacy: string;
  barriers: string[];
  barriers_other_text: string;
  policy_support_level: string;
  support_types: string[];
  support_types_other_text: string;
  academic_disciplines: string[];
  academic_disciplines_other_text: string;
  interested_in_study_nepal: string;
  policy_reform_recommendation: string;
  accepted_confidentiality: boolean;
}

// ── UI Components (shared styling language) ──

function SectionHeader({ number, title }: SectionHeaderProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", margin: "2.5rem 0 2rem" }}>
      <span style={{
        fontFamily: "'Castoro Titling', serif",
        color: PRIMARY,
        fontSize: "2.25rem",
        fontWeight: "700",
        lineHeight: 1,
        minWidth: 40
      }}>
        {String(number).padStart(2, "0")}
      </span>
      <div style={{ flex: 1, height: 1.5, background: `${PRIMARY}20` }} />
      <h2 style={{
        fontFamily: "'Castoro Titling', serif",
        fontSize: "0.8rem",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: DARK,
        fontWeight: "700",
        whiteSpace: "nowrap"
      }}>{title}</h2>
      <div style={{ flex: 1, height: 1.5, background: `${PRIMARY}20` }} />
    </div>
  );
}

function RadioGroup({ name, options, value, onChange, columns = 2 }: RadioGroupProps) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: "0.75rem 1.25rem",
      marginTop: "0.75rem"
    }}>
      {options.map((opt) => (
        <label key={opt} style={{
          display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer",
          padding: "0.85rem 1.25rem", borderRadius: "0.75rem",
          border: `1.5px solid ${value === opt ? PRIMARY : "#e2e8f0"}`,
          background: value === opt ? `${PRIMARY}08` : "white",
          boxShadow: value === opt ? `0 4px 12px ${PRIMARY}08` : "none",
          transition: "all 0.2s ease", fontFamily: "Rajdhani, sans-serif",
          fontSize: "0.88rem", fontWeight: "600", letterSpacing: "0.03em",
          color: value === opt ? PRIMARY : "#475569", userSelect: "none",
        }}>
          <input type="radio" name={name} value={opt} checked={value === opt} onChange={() => onChange(opt)}
            style={{ accentColor: PRIMARY, width: 17, height: 17, flexShrink: 0 }} />
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
    <div style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: "0.75rem 1.25rem",
      marginTop: "0.75rem"
    }}>
      {options.map((opt) => {
        const disabled = !value.includes(opt) && !!maxSelect && value.length >= maxSelect;
        const isChecked = value.includes(opt);
        return (
          <label key={opt} style={{
            display: "flex", alignItems: "center", gap: "0.75rem",
            cursor: disabled ? "not-allowed" : "pointer",
            padding: "0.85rem 1.25rem", borderRadius: "0.75rem",
            border: `1.5px solid ${isChecked ? AMBER : "#e2e8f0"}`,
            background: isChecked ? `${AMBER}08` : disabled ? "#f8fafc" : "white",
            boxShadow: isChecked ? `0 4px 12px ${AMBER}08` : "none",
            opacity: disabled ? 0.5 : 1,
            transition: "all 0.2s ease", fontFamily: "Rajdhani, sans-serif",
            fontSize: "0.88rem", fontWeight: "600", letterSpacing: "0.03em",
            color: isChecked ? "#b45309" : "#475569", userSelect: "none",
          }}>
            <input type="checkbox" checked={isChecked} disabled={disabled} onChange={() => toggle(opt)}
              style={{ accentColor: AMBER, width: 17, height: 17, flexShrink: 0 }} />
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
        width: "100%", border: `1.5px solid #e2e8f0`, borderRadius: "0.75rem",
        padding: "0.85rem 1.25rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.95rem",
        fontWeight: "600", color: DARK, background: "white", outline: "none", boxSizing: "border-box",
        transition: "all 0.2s ease",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = PRIMARY;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY}15`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function TextArea({ placeholder, value, onChange, rows = 4 }: TextAreaProps) {
  return (
    <textarea
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%", border: `1.5px solid #e2e8f0`, borderRadius: "0.75rem",
        padding: "0.95rem 1.25rem", fontFamily: "Rajdhani, sans-serif", fontSize: "0.95rem",
        fontWeight: "600", color: DARK, background: "white", outline: "none", resize: "vertical",
        boxSizing: "border-box", transition: "all 0.2s ease",
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = PRIMARY;
        e.currentTarget.style.boxShadow = `0 0 0 3px ${PRIMARY}15`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "#e2e8f0";
        e.currentTarget.style.boxShadow = "none";
      }}
    />
  );
}

function QuestionLabel({ number, text, required, hint }: QuestionLabelProps) {
  return (
    <label style={{ display: "block", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.95rem", letterSpacing: "0.04em", color: "#1e293b", marginBottom: "0.6rem" }}>
      <span style={{ color: PRIMARY, marginRight: "0.5rem" }}>{number}.</span>
      {text}
      {required && <span style={{ color: "#ef4444", marginLeft: 4 }}>*</span>}
      {hint && (
        <span style={{ display: "block", fontWeight: "600", fontSize: "0.75rem", color: "#94a3b8", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: "0.35rem" }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function PhoneNumberField({ value, onChange }: { value: string; onChange: (val: string) => void }) {
  return (
    <div className="survey-phone-field">
      <style>{`
        .survey-phone-field .PhoneInput {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1.5px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 0.7rem 1.25rem;
          background: white;
          transition: all 0.2s ease;
        }
        .survey-phone-field .PhoneInput:focus-within {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px ${PRIMARY}15;
        }
        .survey-phone-field .PhoneInputInput {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: 'Rajdhani', sans-serif;
          font-size: 0.95rem;
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Main Component ──
export default function InstitutionalReadinessSurveyForm() {
  const [step, setStep] = useState<"form" | "success">("form");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const initialFormState: SurveyFormState = {
    institution_name: "", university_affiliation: "", institution_email: "", institution_phone: "",
    has_international_office: "", currently_enrolling_international: "", international_students_enrolled: "",
    has_internationalization_strategy: "", has_active_partnerships: "", overall_readiness: "",
    faculty_prepared: "", infrastructure_adequacy: "",
    barriers: [], barriers_other_text: "",
    policy_support_level: "",
    support_types: [], support_types_other_text: "",
    academic_disciplines: [], academic_disciplines_other_text: "",
    interested_in_study_nepal: "", policy_reform_recommendation: "",
    accepted_confidentiality: false,
  };

  const [form, setForm] = useState<SurveyFormState>(initialFormState);

  const set = <K extends keyof SurveyFormState>(key: K, val: SurveyFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const resetForm = () => { setForm(initialFormState); setStep("form"); };

  const showBarriersOther = form.barriers.includes("Other");
  const showSupportTypesOther = form.support_types.includes("Other");
  const showDisciplinesOther = form.academic_disciplines.includes("Other");
  const showEnrolledCount = form.currently_enrolling_international === "Yes";

  const fail = (message: string) => {
    setError(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!form.institution_name.trim() || !form.university_affiliation.trim() || !form.institution_email.trim() || !form.institution_phone) {
      fail("Please fill in all required fields in Institutional Information (Name, University Affiliation, Email, Contact No.).");
      return;
    }
    if (!EMAIL_PATTERN.test(form.institution_email.trim())) {
      fail("Please enter a valid email address for the institution.");
      return;
    }
    if (!form.has_international_office || !form.currently_enrolling_international) {
      fail("Please complete all required questions in the Institutional Readiness section.");
      return;
    }
    if (!form.has_internationalization_strategy || !form.has_active_partnerships || !form.overall_readiness || !form.faculty_prepared || !form.infrastructure_adequacy) {
      fail("Please complete all required questions in the Institutional Readiness section.");
      return;
    }
    if (showBarriersOther && !form.barriers_other_text.trim()) {
      fail('Please specify your "Other" barrier in the Challenges & Policy Environment section.');
      return;
    }
    if (!form.policy_support_level) {
      fail("Please answer the government policy support question.");
      return;
    }
    if (showSupportTypesOther && !form.support_types_other_text.trim()) {
      fail('Please specify your "Other" support type in the Future Priorities section.');
      return;
    }
    if (showDisciplinesOther && !form.academic_disciplines_other_text.trim()) {
      fail('Please specify your "Other" academic discipline in the Future Priorities section.');
      return;
    }
    if (!form.interested_in_study_nepal) {
      fail("Please answer whether your institution would be interested in associating with the Study in Nepal initiative.");
      return;
    }
    if (!form.accepted_confidentiality) {
      fail("You must accept the confidentiality terms and declaration before submitting.");
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        institution_name: form.institution_name.trim(),
        university_affiliation: form.university_affiliation.trim(),
        institution_email: form.institution_email.trim(),
        international_students_enrolled: form.international_students_enrolled ? parseInt(form.international_students_enrolled, 10) : null,
        accepted_confidentiality: form.accepted_confidentiality ? 1 : 0
      };

      const response = await fetch("/api/institutional-surveys", {
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
        padding: "5rem 2.5rem 4.5rem", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${PRIMARY}15`, filter: "blur(80px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 240, height: 240, borderRadius: "50%", background: `${AMBER}10`, filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 840, margin: "0 auto", position: "relative", zIndex: 1, textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem", marginBottom: "1.75rem" }}>
            <div style={{ background: "white", borderRadius: "50%", width: 52, height: 52, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
              <img
                src="/SIN-logo.png"
                alt="Study Nepal Campaign"
                style={{ height: "100%", width: "100%", objectFit: "cover", transform: "scale(1.79)", display: "block" }}
                onError={(e) => { (e.currentTarget.closest("div") as HTMLDivElement).style.display = "none"; }}
              />
            </div>
          </div>

          <span style={{ display: "inline-block", fontFamily: "Rajdhani, sans-serif", fontSize: "0.75rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER, marginBottom: "1.5rem" }}>
            Study Nepal Campaign
          </span>

          <h1 style={{
            fontFamily: "'Castoro Titling', serif", fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            color: "white", fontWeight: "400", lineHeight: 1.3, letterSpacing: "0.06em",
            textTransform: "uppercase", marginBottom: "1.5rem",
          }}>
            Internationalization Readiness<br />
            <span style={{ background: `linear-gradient(90deg, ${PRIMARY}, ${AMBER})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Survey of Nepalese HEIs
            </span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.68)", fontSize: "0.95rem", fontWeight: "500", lineHeight: 1.9, letterSpacing: "0.04em", maxWidth: 640, margin: "0 auto 2rem" }}>
            This survey assesses the readiness, capacity, and policy environment of Nepalese higher
            education institutions to attract, enroll, and support international students. Findings will
            support evidence-based policies, capacity building, and strategic priorities for Nepal's
            international education ecosystem.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "2rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="15" height="15" fill="none" stroke={AMBER} strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>
              Estimated Time: 8–10 Minutes
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "rgba(255,255,255,0.5)", fontSize: "0.78rem", fontWeight: "700", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              <svg width="15" height="15" fill="none" stroke={PRIMARY} strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
              Confidential — Policy & Research Scope
            </span>
          </div>
        </div>
      </div>

      {/* ── Form Container ── */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "3rem 1.5rem 5rem" }}>
        {error && (
          <div style={{ background: "#fef2f2", border: "1.5px solid #fca5a5", color: "#dc2626", padding: "0.95rem 1.5rem", borderRadius: "0.75rem", marginBottom: "2rem", fontFamily: "Rajdhani, sans-serif", fontWeight: "700", fontSize: "0.9rem", letterSpacing: "0.05em" }}>
            ⚠ {error}
          </div>
        )}

        {[
          /* ─────────────────────── SECTION A: Institutional Information ─────────────────────── */
          <div key="A">
            <SectionHeader number="A" title="Institutional Information" />

            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              <div>
                <QuestionLabel number={1} text="Name of Institution" required />
                <TextInput placeholder="Your institution's name" value={form.institution_name} onChange={(v) => set("institution_name", v)} />
              </div>

              <div>
                <QuestionLabel number={2} text="University Affiliation" required />
                <TextInput placeholder="Affiliating university" value={form.university_affiliation} onChange={(v) => set("university_affiliation", v)} />
              </div>

              <div>
                <QuestionLabel number={3} text="Email" required />
                <TextInput type="email" placeholder="institution@example.com" value={form.institution_email} onChange={(v) => set("institution_email", v)} />
              </div>

              <div>
                <QuestionLabel number={4} text="Contact No." required hint="Include country code" />
                <PhoneNumberField value={form.institution_phone} onChange={(v) => set("institution_phone", v)} />
              </div>
            </div>
          </div>,

          /* ─────────────────────── SECTION B: Institutional Readiness ─────────────────────── */
          <div key="B">
            <SectionHeader number="B" title="Institutional Readiness" />

            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              <div>
                <QuestionLabel number={5} text="Does your institution have a dedicated International Relations or International Office responsible for international activities?" required />
                <RadioGroup name="has_international_office" options={INTL_OFFICE_STATUS} value={form.has_international_office} onChange={(v) => set("has_international_office", v)} columns={3} />
              </div>

              <div>
                <QuestionLabel number={6} text="Is your institution currently enrolling international students?" required />
                <RadioGroup name="currently_enrolling_international" options={YES_NO} value={form.currently_enrolling_international} onChange={(v) => set("currently_enrolling_international", v)} columns={2} />
              </div>

              {showEnrolledCount && (
                <div style={{ animation: "fadeIn 0.2s ease" }}>
                  <QuestionLabel number={7} text="Approximately how many international students are currently enrolled?" />
                  <TextInput type="number" min={0} placeholder="0" value={form.international_students_enrolled} onChange={(v) => set("international_students_enrolled", v)} />
                </div>
              )}

              <div>
                <QuestionLabel number={8} text="Does your institution have a formal internationalization strategy, policy, or strategic plan?" required />
                <RadioGroup name="has_internationalization_strategy" options={STRATEGY_STATUS} value={form.has_internationalization_strategy} onChange={(v) => set("has_internationalization_strategy", v)} columns={3} />
              </div>

              <div>
                <QuestionLabel number={9} text="Does your institution maintain active international academic partnerships or Memoranda of Understanding (MoUs) with foreign universities or organizations?" required />
                <RadioGroup name="has_active_partnerships" options={YES_NO} value={form.has_active_partnerships} onChange={(v) => set("has_active_partnerships", v)} columns={2} />
              </div>

              <div>
                <QuestionLabel number={10} text="How would you assess your institution's overall readiness to attract, enroll, and support international students?" required />
                <RadioGroup name="overall_readiness" options={READINESS_LEVELS} value={form.overall_readiness} onChange={(v) => set("overall_readiness", v)} columns={2} />
              </div>

              <div>
                <QuestionLabel number={11} text="Are your faculty members prepared to teach culturally diverse international classrooms?" required />
                <RadioGroup name="faculty_prepared" options={FACULTY_READINESS} value={form.faculty_prepared} onChange={(v) => set("faculty_prepared", v)} columns={3} />
              </div>

              <div>
                <QuestionLabel number={12} text="Does your institution have adequate infrastructure and student support services for international students (e.g., accommodation, orientation, counseling, visa support, and English-language support)?" required />
                <RadioGroup name="infrastructure_adequacy" options={INFRASTRUCTURE_LEVELS} value={form.infrastructure_adequacy} onChange={(v) => set("infrastructure_adequacy", v)} columns={2} />
              </div>
            </div>
          </div>,

          /* ─────────────────────── SECTION C: Challenges & Policy Environment ─────────────────────── */
          <div key="C">
            <SectionHeader number="C" title="Challenges & Policy Environment" />

            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              <div>
                <QuestionLabel number={13} text="What are the three most significant barriers preventing your institution from expanding international student enrollment?" hint="Select up to three" />
                <CheckboxGroup name="barriers" options={BARRIERS_OPTIONS} value={form.barriers} onChange={(v) => set("barriers", v)} columns={2} maxSelect={3} />
                {showBarriersOther && (
                  <div style={{ marginTop: "1rem", animation: "fadeIn 0.2s ease" }}>
                    <TextInput placeholder="Please specify..." value={form.barriers_other_text} onChange={(v) => set("barriers_other_text", v)} />
                  </div>
                )}
              </div>

              <div>
                <QuestionLabel number={14} text="To what extent do you believe current government policies support the internationalization of higher education in Nepal?" required />
                <RadioGroup name="policy_support_level" options={POLICY_SUPPORT_LEVELS} value={form.policy_support_level} onChange={(v) => set("policy_support_level", v)} columns={1} />
              </div>
            </div>
          </div>,

          /* ─────────────────────── SECTION D: Future Priorities ─────────────────────── */
          <div key="D">
            <SectionHeader number="D" title="Future Priorities" />

            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              <div>
                <QuestionLabel number={15} text="What types of support would your institution expect from the Study in Nepal initiative?" hint="Select all that apply" />
                <CheckboxGroup name="support_types" options={SUPPORT_TYPES} value={form.support_types} onChange={(v) => set("support_types", v)} columns={1} />
                {showSupportTypesOther && (
                  <div style={{ marginTop: "1rem", animation: "fadeIn 0.2s ease" }}>
                    <TextInput placeholder="Please specify..." value={form.support_types_other_text} onChange={(v) => set("support_types_other_text", v)} />
                  </div>
                )}
              </div>

              <div>
                <QuestionLabel number={16} text="Which academic disciplines at your institution have the greatest potential to attract international students?" hint="Select all that apply" />
                <CheckboxGroup name="academic_disciplines" options={ACADEMIC_DISCIPLINES} value={form.academic_disciplines} onChange={(v) => set("academic_disciplines", v)} columns={1} />
                {showDisciplinesOther && (
                  <div style={{ marginTop: "1rem", animation: "fadeIn 0.2s ease" }}>
                    <TextInput placeholder="Please specify..." value={form.academic_disciplines_other_text} onChange={(v) => set("academic_disciplines_other_text", v)} />
                  </div>
                )}
              </div>

              <div>
                <QuestionLabel number={17} text="Would your institution be interested in associating with the Study in Nepal initiative to promote the internationalization of higher education in Nepal?" required />
                <RadioGroup name="interested_in_study_nepal" options={YES_MAYBE_NO} value={form.interested_in_study_nepal} onChange={(v) => set("interested_in_study_nepal", v)} columns={3} />
              </div>

              <div>
                <QuestionLabel number={18} text="In your opinion, what is the single most important policy reform needed to make Nepal a more attractive destination for international students?" />
                <TextArea placeholder="Share your recommendation..." value={form.policy_reform_recommendation} onChange={(v) => set("policy_reform_recommendation", v)} rows={4} />
              </div>
            </div>
          </div>,
        ].map((section, i) => (
          <div key={i} style={{
            background: "white", borderRadius: "1rem", padding: "2.5rem", marginBottom: "2rem",
            boxShadow: "0 10px 30px rgba(15,23,42,0.03)", border: "1px solid #f1f5f9",
          }}>
            {section}
          </div>
        ))}

        {/* ── Confidentiality Notice and Tick Box ── */}
        <div style={{
          background: "white", borderRadius: "1rem", padding: "2.5rem", marginBottom: "2rem",
          boxShadow: "0 10px 30px rgba(15,23,42,0.03)", border: `1px solid ${PRIMARY}15`,
        }}>
          <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "0.8rem", letterSpacing: "0.22em", textTransform: "uppercase", color: DARK, fontWeight: "700", textAlign: "center", margin: "0 0 1.25rem" }}>
            Confidentiality Notice & Declaration
          </h2>
          <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.95rem", fontWeight: "600", color: "#64748b", lineHeight: 1.8, textAlign: "center", margin: "0 0 1.5rem" }}>
            All responses will remain strictly confidential and will be used solely for macro research and aggregated policy development purposes.
          </p>
          <div style={{ display: "flex", justifyContent: "center", borderTop: "1.5px dashed #e2e8f0", paddingTop: "1.5rem" }}>
            <label style={{
              display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer",
              fontFamily: "Rajdhani, sans-serif", fontSize: "0.95rem", fontWeight: "700",
              color: form.accepted_confidentiality ? PRIMARY : "#475569", userSelect: "none",
              transition: "color 0.2s ease"
            }}>
              <input
                type="checkbox"
                checked={form.accepted_confidentiality}
                onChange={(e) => set("accepted_confidentiality", e.target.checked)}
                style={{ accentColor: PRIMARY, width: 20, height: 20, cursor: "pointer", flexShrink: 0 }}
              />
              <span>I agree to the confidentiality terms and declare the provided information is accurate. *</span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div style={{ display: "flex", justifyContent: "center", marginTop: "2.5rem" }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              display: "inline-flex", alignItems: "center", gap: "1rem",
              background: submitting ? "#94a3b8" : PRIMARY, color: "white",
              border: "none", cursor: submitting ? "not-allowed" : "pointer",
              borderRadius: "999px", paddingLeft: "2.25rem", paddingRight: "0.45rem", height: "3.5rem",
              fontFamily: "Rajdhani, sans-serif", fontSize: "0.88rem", fontWeight: "700",
              letterSpacing: "0.18em", textTransform: "uppercase",
              boxShadow: submitting ? "none" : `0 8px 32px ${PRIMARY}30`, transition: "all 0.3s ease",
            }}
          >
            <span>{submitting ? "Submitting..." : "Submit Survey"}</span>
            <div style={{ width: 44, height: 44, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
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
          background: "rgba(10, 10, 10, 0.65)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1.5rem",
        }}>
          <div style={{
            maxWidth: 520, width: "100%", background: "white", borderRadius: "1.5rem",
            padding: "3.5rem 2.5rem", textAlign: "center", boxShadow: "0 24px 70px rgba(10, 10, 10, 0.25)",
            border: `1px solid ${PRIMARY}20`, position: "relative",
          }}>
            <button onClick={resetForm} style={{ position: "absolute", top: "1.5rem", right: "1.5rem", background: "transparent", border: "none", cursor: "pointer", color: "#94a3b8", padding: "4px", outline: "none" }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${PRIMARY}15`, margin: "0 auto 1.75rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="36" height="36" fill="none" stroke={PRIMARY} strokeWidth="3" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <h2 style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.6rem", color: DARK, marginBottom: "0.75rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Thank You!
            </h2>

            <p style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "1rem", fontWeight: "600", color: "#475569", lineHeight: 1.8 }}>
              Thank you for completing the Internationalization Readiness Survey of Nepalese Higher
              Education Institutions. Your responses will help shape policy reform, capacity building,
              and strategic priorities for Nepal's international education ecosystem.
            </p>

            <button
              onClick={resetForm}
              style={{
                marginTop: "2.25rem", background: PRIMARY, color: "white", border: "none",
                borderRadius: "999px", padding: "0.85rem 3rem", fontFamily: "Rajdhani, sans-serif",
                fontSize: "0.85rem", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase",
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