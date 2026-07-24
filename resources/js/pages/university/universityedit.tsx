import { useState, useEffect } from "react";
import type { CSSProperties, ReactNode } from "react";

// ── Light / White-Blue Theme Colors ──────────────────────────────────────────
const P = "#0066cc";           // Primary Blue
const AMBER = "#d97706";       // Darkened Amber for contrast
const BG = "#f0f4f8";          // Very light blue-gray background
const SURFACE = "#ffffff";     // White cards
const SURFACE2 = "#f8fafc";    // Off-white panel backgrounds
const SURFACE3 = "#f1f5f9";    // Inner form blocks
const BORDER = "rgba(0, 15, 30, 0.12)";
const TEXT = "#0f172a";        // Dark slate text
const TEXT2 = "#334155";       // Medium slate text
const TEXT3 = "#64748b";       // Light slate text (labels/hints)
const SUCCESS = "#16a34a";     // Success green

const LEVELS = ["Undergraduate", "Postgraduate", "Both UG & PG", "Doctoral / PhD"];
const STD_DOCS = [
  "Passport Copy","Academic Transcripts","Statement of Purpose","CV / Resume",
  "Reference Letters","English Test Certificate","Financial Statements",
  "Birth Certificate","Work Experience Letter","Police Clearance","Medical Certificate","Portfolio",
];

interface CourseTemplate {
  id: string;
  courseName: string;
  stream: string;
  docs: string[];
  customDocs: string;
}

interface CollegeCourseMapping {
  courseTemplateId: string;
  annualFee: string;
  scholarship: string;
}

interface CollegeEntry {
  id: string;
  name: string;
  location: string;
  collegeLogoUrl: string; // Added field
  collegeCourses: CollegeCourseMapping[];
}

interface FormState {
  universityName: string;
  universityLogoUrl: string; // Added field
  level: string;
  intake: string;
  courses: CourseTemplate[];
  colleges: CollegeEntry[];
}

const makeCourseTemplate = (id?: string): CourseTemplate => ({
  id: id ?? Math.random().toString(36).slice(2),
  courseName: "", stream: "",
  docs: ["Passport Copy", "Academic Transcripts"],
  customDocs: "",
});

const makeCollegeEntry = (firstCourseTemplateId = "", id?: string): CollegeEntry => ({
  id: id ?? Math.random().toString(36).slice(2),
  name: "", location: "", collegeLogoUrl: "",
  collegeCourses: [{
    courseTemplateId: firstCourseTemplateId,
    annualFee: "", scholarship: "",
  }],
});

const defaultCourse = makeCourseTemplate();
const defaultCollege = makeCollegeEntry(defaultCourse.id);
const initial: FormState = {
  universityName: "",
  universityLogoUrl: "",
  level: "",
  intake: "",
  courses: [defaultCourse],
  colleges: [defaultCollege],
};

// ── base styles ──────────────────────────────────────────────────────────────

const inputBase = (focused: boolean): CSSProperties => ({
  width: "100%", boxSizing: "border-box",
  background: focused ? "#ffffff" : SURFACE2,
  border: `1px solid ${focused ? P : BORDER}`,
  borderRadius: 6, padding: "11px 14px",
  fontSize: 13, color: TEXT, fontFamily: "'Manrope', sans-serif",
  outline: "none", transition: "border-color .15s, background .15s, box-shadow .15s",
  boxShadow: focused ? `0 0 0 3px ${P}22` : "none",
  letterSpacing: "0.02em", colorScheme: "light",
});

const selectBase = (focused: boolean): CSSProperties => ({
  ...inputBase(focused),
  appearance: "none", WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='6' viewBox='0 0 11 6'%3E%3Cpath d='M1 1l4.5 4L10 1' stroke='%23475569' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  paddingRight: 32, cursor: "pointer",
});

// ── small UI components ──────────────────────────────────────────────────────

function InputF({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string; }) {
  const [f, setF] = useState(false);
  return <input type={type} value={value} placeholder={placeholder} style={inputBase(f)}
    onChange={e => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} />;
}

function SelectF({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; }) {
  const [f, setF] = useState(false);
  return (
    <select value={value} style={selectBase(f)} onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}>
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o} style={{ background: "#ffffff", color: TEXT }}>{o}</option>)}
    </select>
  );
}

function TextareaF({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string; }) {
  const [f, setF] = useState(false);
  return <textarea value={value} placeholder={placeholder}
    style={{ ...inputBase(f), minHeight: 70, resize: "vertical", lineHeight: 1.6 }}
    onChange={e => onChange(e.target.value)} onFocus={() => setF(true)} onBlur={() => setF(false)} />;
}

function Label({ children, required }: { children: ReactNode; required?: boolean; }) {
  return (
    <label style={{ fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: TEXT3, display: "block", marginBottom: 7 }}>
      {children}{required && <span style={{ color: P, marginLeft: 3 }}>*</span>}
    </label>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode; }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <span style={{ fontSize: 11, color: TEXT3, marginTop: 5, fontFamily: "'Manrope', sans-serif" }}>{hint}</span>}
    </div>
  );
}

function ErrMsg({ msg }: { msg?: string; }) {
  return msg ? <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontFamily: "'Manrope', sans-serif", fontWeight: 500 }}>{msg}</span> : null;
}

function SectionCard({ number, title, subtitle, children }: { number: number; title: string; subtitle: string; children: ReactNode; }) {
  return (
    <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "20px 28px", display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "'Castoro Titling', 'Georgia', serif", fontSize: 28, fontWeight: 400, color: AMBER, lineHeight: 1 }}>
          {String(number).padStart(2, "0")}
        </span>
        <div>
          <h2 style={{ fontFamily: "'Castoro Titling', 'Georgia', serif", fontSize: 16, fontWeight: 400, color: TEXT, textTransform: "uppercase", letterSpacing: "0.12em", margin: 0 }}>{title}</h2>
          <p style={{ fontFamily: "'Manrope', sans-serif", fontSize: 12, color: TEXT3, margin: "3px 0 0", letterSpacing: "0.04em" }}>{subtitle}</p>
        </div>
      </div>
      <div style={{ padding: "24px 28px" }}>{children}</div>
    </div>
  );
}

function SubPanel({ title, children, accent }: { title: string; children: ReactNode; accent?: string; }) {
  return (
    <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: "18px 20px", marginBottom: 16 }}>
      <div style={{ fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: accent ?? P, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ display: "block", width: 14, height: 1, background: accent ?? P }} />
        {title}
      </div>
      {children}
    </div>
  );
}

function DocPill({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void; }) {
  return (
    <button onClick={onToggle} style={{
      padding: "5px 12px", borderRadius: 999, cursor: "pointer",
      border: `1px solid ${selected ? P : BORDER}`,
      background: selected ? `${P}11` : SURFACE,
      color: selected ? P : TEXT3,
      fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
      letterSpacing: "0.12em", textTransform: "uppercase", transition: "all .15s",
    }}>
      {selected && "✓ "}{label}
    </button>
  );
}

function CircleArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9l3 3-3 3M9 12h6" />
    </svg>
  );
}

const g2: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };

// ── Client-Side Reconstructive Parser ────────────────────────────────────────

interface FlatDatabaseRow {
  id: number;
  University: string;
  university_logo_url: string | null;
  level: string;
  Intake: string;
  College: string;
  college_logo_url: string | null;
  Location: string;
  Course: string;
  stream: string;
  Amount: string | null;
  Scholarship: string | null;
  requireddocuments: string | null;
}

function reconstructFormState(rows: FlatDatabaseRow[]): FormState {
  if (!rows || rows.length === 0) return initial;

  const firstRow = rows[0];

  // 1. Group shared course templates
  const templatesMap = new Map<string, CourseTemplate>();
  
  rows.forEach(row => {
    const courseKey = `${row.Course.trim().toLowerCase()}_${row.stream.trim().toLowerCase()}`;
    if (!templatesMap.has(courseKey)) {
      const rawDocs = row.requireddocuments ? row.requireddocuments.split(",").map(d => d.trim()).filter(Boolean) : [];
      const docs = rawDocs.filter(d => STD_DOCS.includes(d));
      const customDocs = rawDocs.filter(d => !STD_DOCS.includes(d)).join(", ");

      templatesMap.set(courseKey, {
        id: Math.random().toString(36).slice(2),
        courseName: row.Course,
        stream: row.stream,
        docs,
        customDocs
      });
    }
  });

  const courses = Array.from(templatesMap.values());

  // 2. Map pricing setups back inside each college
  const collegesMap = new Map<string, CollegeEntry>();

  rows.forEach(row => {
    const collegeKey = `${row.College.trim().toLowerCase()}_${row.Location.trim().toLowerCase()}`;
    const courseKey = `${row.Course.trim().toLowerCase()}_${row.stream.trim().toLowerCase()}`;
    const template = templatesMap.get(courseKey);
    const courseTemplateId = template ? template.id : "";

    const mapping: CollegeCourseMapping = {
      courseTemplateId,
      annualFee: row.Amount || "",
      scholarship: row.Scholarship || ""
    };

    if (collegesMap.has(collegeKey)) {
      const col = collegesMap.get(collegeKey)!;
      if (!col.collegeCourses.some(cc => cc.courseTemplateId === courseTemplateId)) {
        col.collegeCourses.push(mapping);
      }
    } else {
      collegesMap.set(collegeKey, {
        id: Math.random().toString(36).slice(2),
        name: row.College,
        location: row.Location,
        collegeLogoUrl: row.college_logo_url || "",
        collegeCourses: [mapping]
      });
    }
  });

  return {
    universityName: firstRow.University,
    universityLogoUrl: firstRow.university_logo_url || "",
    level: firstRow.level,
    intake: firstRow.Intake,
    courses,
    colleges: Array.from(collegesMap.values())
  };
}

// ── Shared Course Form Card ──────────────────────────────────────────────────

function SharedCourseCard({
  course, index, total, isOpen,
  onChange, onRemove, onOpen,
}: {
  course: CourseTemplate; index: number; total: number; isOpen: boolean;
  onChange: (field: keyof CourseTemplate, value: string | string[]) => void;
  onRemove: () => void;
  onOpen: () => void;
}) {
  const toggleDoc = (doc: string) => {
    const next = course.docs.includes(doc)
      ? course.docs.filter(d => d !== doc)
      : [...course.docs, doc];
    onChange("docs", next);
  };

  const headerLabel = course.courseName.trim() || `Course Template ${index + 1}`;

  return (
    <div style={{
      background: SURFACE3,
      border: `1px solid ${isOpen ? `${P}55` : BORDER}`,
      borderRadius: 10, overflow: "hidden", marginBottom: 10,
      transition: "border-color .2s",
    }}>
      <div
        onClick={onOpen}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", cursor: "pointer",
          background: isOpen ? `${P}08` : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
            color: isOpen ? P : TEXT3, background: isOpen ? `${P}18` : "rgba(0,0,0,0.06)",
            padding: "3px 10px", borderRadius: 999,
          }}>
            Prog {index + 1}
          </span>
          <span style={{ fontSize: 13, color: course.courseName ? TEXT : TEXT3, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
            {headerLabel}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {total > 1 && (
            <button
              onClick={e => { e.stopPropagation(); onRemove(); }}
              style={{
                padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                border: "1px solid rgba(239, 68, 68, 0.25)", background: "transparent",
                color: "#ef4444", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              }}
            >
              Remove
            </button>
          )}
          <span style={{ color: isOpen ? P : TEXT3, fontSize: 14 }}>▾</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ padding: "20px", borderTop: `1px solid ${BORDER}` }}>
          <div style={{ ...g2, marginBottom: 16 }}>
            <Field label="Program / Course Name" required>
              <InputF value={course.courseName} onChange={v => onChange("courseName", v)} placeholder="e.g. Bachelor of Business Administration" />
            </Field>
            <Field label="Faculty / Stream" required>
              <InputF value={course.stream} onChange={v => onChange("stream", v)} placeholder="e.g. Management, Science & Tech" />
            </Field>
          </div>

          <SubPanel title="Shared Course Requirements" accent="#6366f1">
            <Label>Required Documents</Label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 14, marginTop: 4 }}>
              {STD_DOCS.map(doc => (
                <DocPill key={doc} label={doc} selected={course.docs.includes(doc)} onToggle={() => toggleDoc(doc)} />
              ))}
            </div>
            <Field label="Additional custom documents" hint="Comma-separated list">
              <TextareaF value={course.customDocs} onChange={v => onChange("customDocs", v)} placeholder="e.g. CV Reference Letter, Experience Letter..." />
            </Field>
          </SubPanel>
        </div>
      )}
    </div>
  );
}

// ── main edit component ──────────────────────────────────────────────────────

export default function UniversityEditForm() {
  const [form, setForm] = useState<FormState>(initial);
  const [openCourseId, setOpenCourseId] = useState<string>("");
  const [openCollegeId, setOpenCollegeId] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Styling Helpers inside main component scope
  const btnPrimary = (extra: CSSProperties = {}): CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "11px 26px", borderRadius: 999,
    background: submitting ? "#94a3b8" : P, border: "none", color: "#ffffff",
    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
    fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
    cursor: submitting ? "default" : "pointer", ...extra,
  });

  const btnGhost: CSSProperties = {
    padding: "11px 22px", borderRadius: 999, background: "transparent",
    border: `1px solid ${BORDER}`, color: TEXT2,
    fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
    fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer",
  };

  const getRecordId = () => {
    const pathParts = window.location.pathname.split("/");
    const editIdx = pathParts.indexOf("edit");
    if (editIdx > 0) return pathParts[editIdx - 1];
    return pathParts[pathParts.length - 1];
  };

  const id = getRecordId();

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    fetch(`/api/universities/${id}`)
      .then(res => {
        if (!res.ok) throw new Error("Could not find record");
        return res.json();
      })
      .then(payload => {
        let structuredState: FormState;
        if (payload && payload.universityName && Array.isArray(payload.colleges)) {
          structuredState = payload;
        } else if (Array.isArray(payload)) {
          structuredState = reconstructFormState(payload);
        } else if (payload && typeof payload === "object") {
          structuredState = reconstructFormState([payload]);
        } else {
          throw new Error("Invalid payload format");
        }

        setForm(structuredState);
        if (structuredState.courses[0]) setOpenCourseId(structuredState.courses[0].id);
        if (structuredState.colleges[0]) setOpenCollegeId(structuredState.colleges[0].id);
      })
      .catch(err => {
        setErrors({ general: err.message || "Failed to load dataset." });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const openCourse = (id: string) => setOpenCourseId(prev => prev === id ? "" : id);
  const openCollege = (id: string) => setOpenCollegeId(prev => prev === id ? "" : id);

  const clearError = (...keys: string[]) => {
    setErrors(e => {
      const n = { ...e };
      keys.forEach(k => delete n[k]);
      return n;
    });
  };

  const addCourseTemplate = () => {
    const nextId = Math.random().toString(36).slice(2);
    setForm(f => {
      const next = makeCourseTemplate(nextId);
      return { ...f, courses: [...f.courses, next] };
    });
    setOpenCourseId(nextId);
  };

  const removeCourseTemplate = (id: string) => {
    setForm(f => {
      const nextCourses = f.courses.filter(c => c.id !== id);
      const nextColleges = f.colleges.map(col => ({
        ...col,
        collegeCourses: col.collegeCourses.filter(cc => cc.courseTemplateId !== id),
      }));
      return { ...f, courses: nextCourses, colleges: nextColleges };
    });
    if (openCourseId === id) {
      const remaining = form.courses.filter(c => c.id !== id);
      setOpenCourseId(remaining[0]?.id ?? "");
    }
  };

  const updateCourseTemplate = (id: string, field: keyof CourseTemplate, value: string | string[]) => {
    setForm(f => ({
      ...f,
      courses: f.courses.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  };

  const addCollege = () => {
    const nextId = Math.random().toString(36).slice(2);
    setForm(f => {
      const next = makeCollegeEntry(f.courses[0]?.id ?? "", nextId);
      return { ...f, colleges: [...f.colleges, next] };
    });
    setOpenCollegeId(nextId);
  };

  const removeCollege = (colIdx: number) => {
    const colId = form.colleges[colIdx].id;
    setForm(f => ({ ...f, colleges: f.colleges.filter((_, i) => i !== colIdx) }));
    if (openCollegeId === colId) {
      const remaining = form.colleges.filter((_, i) => i !== colIdx);
      setOpenCollegeId(remaining[0]?.id ?? "");
    }
  };

  const updateCollege = (colIdx: number, field: "name" | "location" | "collegeLogoUrl", value: string) => {
    setForm(f => {
      const nextColleges = f.colleges.map((col, idx) => {
        if (idx !== colIdx) return col;
        return { ...col, [field]: value };
      });
      return { ...f, colleges: nextColleges };
    });
  };

  const addCollegeCoursePrice = (colIdx: number) => {
    setForm(f => {
      const nextColleges = f.colleges.map((col, idx) => {
        if (idx !== colIdx) return col;
        return {
          ...col,
          collegeCourses: [
            ...col.collegeCourses,
            {
              courseTemplateId: f.courses[0]?.id ?? "",
              annualFee: "",
              scholarship: "",
            }
          ]
        };
      });
      return { ...f, colleges: nextColleges };
    });
  };

  const removeCollegeCoursePrice = (colIdx: number, itemIdx: number) => {
    setForm(f => {
      const nextColleges = f.colleges.map((col, idx) => {
        if (idx !== colIdx) return col;
        return {
          ...col,
          collegeCourses: col.collegeCourses.filter((_, i) => i !== itemIdx)
        };
      });
      return { ...f, colleges: nextColleges };
    });
  };

  const updateCollegeCourseMapping = (colIdx: number, itemIdx: number, field: keyof CollegeCourseMapping, value: string) => {
    setForm(f => {
      const nextColleges = f.colleges.map((col, idx) => {
        if (idx !== colIdx) return col;
        const nextCourses = col.collegeCourses.map((cc, i) => {
          if (i !== itemIdx) return cc;
          return { ...cc, [field]: value };
        });
        return { ...col, collegeCourses: nextCourses };
      });
      return { ...f, colleges: nextColleges };
    });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.universityName.trim()) e.universityName = "University name is required";
    if (!form.level) e.level = "Study level is required";
    if (!form.intake.trim()) e.intake = "Intake period is required";

    form.courses.forEach((c, idx) => {
      if (!c.courseName.trim()) e[`course_tpl_${idx}_name`] = `Program ${idx + 1}: Name is required`;
      if (!c.stream.trim()) e[`course_tpl_${idx}_stream`] = `Program ${idx + 1}: Stream/Faculty is required`;
    });

    form.colleges.forEach((col, colIdx) => {
      if (!col.name.trim()) e[`col_${colIdx}_name`] = `College ${colIdx + 1}: Name is required`;
      if (!col.location.trim()) e[`col_${colIdx}_loc`] = `College ${colIdx + 1}: Location is required`;
      
      if (col.collegeCourses.length === 0) {
        e[`col_${colIdx}_empty`] = `College ${colIdx + 1} (${col.name || "unnamed"}) must have at least one course fee record assigned`;
      }

      col.collegeCourses.forEach((cc, ccIdx) => {
        if (!cc.courseTemplateId) {
          e[`col_${colIdx}_cc_${ccIdx}_id`] = `College ${colIdx + 1}: Course selection required on line ${ccIdx + 1}`;
        }
      });
    });
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      const firstBadIdx = form.courses.findIndex((_, i) => e[`course_tpl_${i}_name`] || e[`course_tpl_${i}_stream`]);
      if (firstBadIdx >= 0) setOpenCourseId(form.courses[firstBadIdx].id);

      const firstBadColIdx = form.colleges.findIndex((col, colIdx) => {
        if (e[`col_${colIdx}_name`] || e[`col_${colIdx}_loc`] || e[`col_${colIdx}_empty`]) return true;
        return col.collegeCourses.some((_, ccIdx) => e[`col_${colIdx}_cc_${ccIdx}_id`]);
      });
      if (firstBadColIdx >= 0) setOpenCollegeId(form.colleges[firstBadColIdx].id);
      return;
    }
    setSubmitting(true);

    const payload = {
      universityName: form.universityName,
      university_logo_url: form.universityLogoUrl,
      level: form.level,
      intake: form.intake,
      colleges: form.colleges.map(col => ({
        name: col.name,
        location: col.location,
        college_logo_url: col.collegeLogoUrl,
        courses: col.collegeCourses.map(cc => {
          const matchingTemplate = form.courses.find(t => t.id === cc.courseTemplateId);
          return {
            courseName: matchingTemplate?.courseName ?? "Unknown Course",
            stream: matchingTemplate?.stream ?? "",
            annualFee: cc.annualFee,
            scholarship: cc.scholarship,
            allDocs: matchingTemplate ? [
              ...matchingTemplate.docs,
              ...matchingTemplate.customDocs.split(",").map(s => s.trim()).filter(Boolean),
            ] : [],
          };
        }),
      })),
    };

    try {
      const res = await fetch(`/api/universities/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const d = await res.json() as { message?: string };
        alert(d.message ?? "Failed to save edits.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasErrors = Object.keys(errors).length > 0;

  if (loading) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT3 }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", fontFamily: "'Manrope', sans-serif", fontSize: 13 }}>
          Loading university record...
        </div>
      </div>
    );
  }

  if (errors.general) {
    return (
      <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: TEXT }}>
        <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center", fontFamily: "'Manrope', sans-serif" }}>
          <p style={{ color: "#ef4444", fontSize: 14, marginBottom: 16 }}>{errors.general}</p>
          <button onClick={() => window.location.href = "/universities"} style={btnPrimary()}>Back to Directory</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Manrope', sans-serif", position: "relative" }}>
      <link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@600;700&family=Manrope:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORDER}`, padding: "48px 48px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${P}08`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 960, margin: "0 auto", position: "relative" }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: AMBER, margin: "0 0 14px" }}>
            Edit Mode — Active Record Update
          </p>
          <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: 40, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT, margin: "0 0 12px", lineHeight: 1.15 }}>
            Modify <span style={{ color: P }}>University</span>
          </h1>
          <p style={{ fontSize: 13, color: TEXT2, maxWidth: 580, lineHeight: 1.7, margin: 0 }}>
            Adjust the shared program templates and assign updated fees and scholarships for affiliated colleges.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "36px 48px 64px" }}>

        {/* Validation summary */}
        {hasErrors && (
          <div style={{ background: "#fef2f2", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: 8, padding: "14px 20px", marginBottom: 20 }}>
            <p style={{ fontSize: 12, color: "#b91c1c", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Please correct the validation errors below
            </p>
            {Object.values(errors).map((msg, i) => (
              <p key={i} style={{ fontSize: 12, color: "#ef4444", fontFamily: "'Manrope', sans-serif", margin: "2px 0" }}>• {msg}</p>
            ))}
          </div>
        )}

        {/* 01 Institution & Global Courses */}
        <SectionCard number={1} title="Central University Registrations" subtitle="Primary settings and shared course configurations">
          <div style={{ ...g2, marginBottom: 20 }}>
            <Field label="University Name" required>
              <InputF
                value={form.universityName}
                onChange={v => { setForm(f => ({ ...f, universityName: v })); clearError("universityName"); }}
                placeholder="e.g. Tribhuvan University"
              />
              <ErrMsg msg={errors.universityName} />
            </Field>
            <Field label="University Logo URL">
              <InputF
                value={form.universityLogoUrl}
                onChange={v => setForm(f => ({ ...f, universityLogoUrl: v }))}
                placeholder="https://example.com/logo.png"
              />
            </Field>
          </div>

          <div style={{ ...g2, marginBottom: 28, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
            <Field label="Study Level" required>
              <SelectF
                value={form.level}
                onChange={v => { setForm(f => ({ ...f, level: v })); clearError("level"); }}
                options={LEVELS}
                placeholder="Select level"
              />
              <ErrMsg msg={errors.level} />
            </Field>
            <Field label="Intake Period" required hint="Applies globally to all courses">
              <InputF
                type="month"
                value={form.intake}
                onChange={v => { setForm(f => ({ ...f, intake: v })); clearError("intake"); }}
              />
              <ErrMsg msg={errors.intake} />
            </Field>
          </div>

          {/* SHARED COURSES DEFINITION */}
          <SubPanel title="Shared Course Registry (Define templates here first)" accent="#6366f1">
            <p style={{ fontSize: 11, color: TEXT3, margin: "0 0 14px", lineHeight: 1.5 }}>
              Modify templates here. Updates apply automatically across colleges mapping to these programs.
            </p>
            
            {form.courses.map((course, idx) => (
              <SharedCourseCard
                key={course.id}
                course={course}
                index={idx}
                total={form.courses.length}
                isOpen={openCourseId === course.id}
                onChange={(field, value) => {
                  updateCourseTemplate(course.id, field, value);
                  clearError(`course_tpl_${idx}_name`, `course_tpl_${idx}_stream`);
                }}
                onRemove={() => removeCourseTemplate(course.id)}
                onOpen={() => openCourse(course.id)}
              />
            ))}

            <button onClick={addCourseTemplate} style={{
              width: "100%", padding: "11px", borderRadius: 8, cursor: "pointer",
              border: `1px dashed ${P}44`, background: `${P}0A`,
              color: P, fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
              fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
              marginTop: 6, transition: "background .2s"
            }}>
              + Define Another Shared Course
            </button>
          </SubPanel>
        </SectionCard>

        {/* 02 Colleges Setup & Pricing */}
        <SectionCard number={2} title="Affiliated Colleges & Pricing Configuration" subtitle="Assign prices and scholarship programs to central courses inside each college">
          
          {form.colleges.map((college, colIdx) => {
            const isColOpen = openCollegeId === college.id;
            const colHeaderLabel = college.name.trim() || `College ${colIdx + 1}`;
            const coursesCount = college.collegeCourses.length;

            return (
              <div key={college.id} style={{
                background: SURFACE,
                border: `1px solid ${isColOpen ? `${AMBER}88` : BORDER}`,
                borderRadius: 10,
                overflow: "hidden",
                marginBottom: 16,
                transition: "border-color .2s",
              }}>
                <div
                  onClick={() => openCollege(college.id)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "16px 24px", cursor: "pointer",
                    background: isColOpen ? `${AMBER}11` : "transparent",
                    borderBottom: isColOpen ? `1px solid ${BORDER}` : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{
                      fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                      color: isColOpen ? AMBER : TEXT3,
                      background: isColOpen ? `${AMBER}22` : "rgba(0,0,0,0.06)",
                      padding: "3px 10px", borderRadius: 999,
                    }}>
                      College {colIdx + 1}
                    </span>
                    <span style={{ fontSize: 13, color: college.name ? TEXT : TEXT3, fontFamily: "'Manrope', sans-serif", fontWeight: 600 }}>
                      {colHeaderLabel} {college.location ? `· ${college.location}` : ""}
                    </span>
                    {!isColOpen && (
                      <span style={{ fontSize: 11, color: TEXT3, fontFamily: "'Manrope', sans-serif" }}>
                        ({coursesCount} course{coursesCount !== 1 ? "s" : ""} configured)
                      </span>
                    )}
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    {form.colleges.length > 1 && (
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          removeCollege(colIdx);
                        }}
                        style={{
                          padding: "3px 10px", borderRadius: 6, cursor: "pointer",
                          border: "1px solid rgba(239, 68, 68, 0.25)", background: "transparent",
                          color: "#ef4444", fontSize: 11, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                        }}
                      >
                        Remove
                      </button>
                    )}
                    <span style={{
                      color: isColOpen ? AMBER : TEXT3, fontSize: 14,
                      transform: isColOpen ? "rotate(0deg)" : "rotate(-90deg)",
                      transition: "transform .2s", display: "inline-block"
                    }}>▾</span>
                  </div>
                </div>

                {isColOpen && (
                  <div style={{ padding: "24px" }}>
                    <div style={{ ...g2, marginBottom: 20 }}>
                      <Field label="College Name" required>
                        <InputF
                          value={college.name}
                          onChange={v => { updateCollege(colIdx, "name", v); clearError(`col_${colIdx}_name`); }}
                          placeholder="e.g. Patan Multiple Campus"
                        />
                        <ErrMsg msg={errors[`col_${colIdx}_name`]} />
                      </Field>
                      <Field label="Location / City" required>
                        <InputF
                          value={college.location}
                          onChange={v => { updateCollege(colIdx, "location", v); clearError(`col_${colIdx}_loc`); }}
                          placeholder="e.g. Lalitpur"
                        />
                        <ErrMsg msg={errors[`col_${colIdx}_loc`]} />
                      </Field>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <Field label="College Logo URL">
                        <InputF
                          value={college.collegeLogoUrl}
                          onChange={v => updateCollege(colIdx, "collegeLogoUrl", v)}
                          placeholder="https://example.com/college-logo.png"
                        />
                      </Field>
                    </div>

                    <div style={{ marginTop: 24, borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
                      <div style={{ fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: TEXT3, marginBottom: 12 }}>
                        Offered Courses & Fees Mapping
                      </div>

                      {errors[`col_${colIdx}_empty`] && <div style={{ color: "#ef4444", fontSize: 12, marginBottom: 10, fontWeight: 500 }}>{errors[`col_${colIdx}_empty`]}</div>}

                      {college.collegeCourses.map((cc, ccIdx) => (
                        <div key={ccIdx} style={{
                          display: "grid",
                          gridTemplateColumns: "1.5fr 1fr 1fr auto",
                          gap: 12,
                          alignItems: "flex-start",
                          marginBottom: 12,
                          background: SURFACE3,
                          padding: "12px",
                          borderRadius: 8,
                          border: `1px solid ${BORDER}`
                        }}>
                          <div>
                            <Label required>Course</Label>
                            <select
                              value={cc.courseTemplateId}
                              style={selectBase(false)}
                              onChange={e => {
                                updateCollegeCourseMapping(colIdx, ccIdx, "courseTemplateId", e.target.value);
                                clearError(`col_${colIdx}_cc_${ccIdx}_id`);
                              }}
                            >
                              <option value="">-- Choose Course --</option>
                              {form.courses.map((t, tIdx) => (
                                <option key={t.id} value={t.id} style={{ background: "#ffffff", color: TEXT }}>
                                  {t.courseName.trim() || `Program Template ${tIdx + 1}`}
                                </option>
                              ))}
                            </select>
                            <ErrMsg msg={errors[`col_${colIdx}_cc_${ccIdx}_id`]} />
                          </div>

                          <div>
                            <Label>Annual Fee</Label>
                            <InputF
                              value={cc.annualFee}
                              onChange={v => updateCollegeCourseMapping(colIdx, ccIdx, "annualFee", v)}
                              placeholder="e.g. $1,200"
                            />
                          </div>

                          <div>
                            <Label>Scholarship</Label>
                            <InputF
                              value={cc.scholarship}
                              onChange={v => updateCollegeCourseMapping(colIdx, ccIdx, "scholarship", v)}
                              placeholder="e.g. 10% Merit"
                            />
                          </div>

                          {college.collegeCourses.length > 1 ? (
                            <button
                              onClick={() => removeCollegeCoursePrice(colIdx, ccIdx)}
                              style={{
                                height: 41, padding: "0 14px", borderRadius: 6, cursor: "pointer",
                                border: "1px solid rgba(239, 68, 68, 0.25)", background: "transparent",
                                color: "#ef4444", fontSize: 14, marginTop: 22
                              }}
                            >
                              ✕
                            </button>
                          ) : (
                            <div style={{ width: 42, height: 41 }} />
                          )}
                        </div>
                      ))}

                      <button onClick={() => addCollegeCoursePrice(colIdx)} style={{
                        width: "100%", padding: "11px", borderRadius: 8, cursor: "pointer",
                        border: `1px dashed ${P}44`, background: `${P}0A`,
                        color: P, fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
                        fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                        marginTop: 6, transition: "all .15s"
                      }}>
                        + Map Course Fee to College
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <button onClick={addCollege} style={{
            width: "100%", padding: "14px", borderRadius: 8, cursor: "pointer",
            border: `1px dashed ${AMBER}66`, background: `${AMBER}0A`,
            color: AMBER, fontSize: 12, fontFamily: "'Rajdhani', sans-serif",
            fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase",
            marginTop: 10, transition: "background .2s"
          }}>
            + Add Another Affiliated College
          </button>
        </SectionCard>

        {/* Action Panel */}
        <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          <div>
            <p style={{ fontSize: 11, color: TEXT3, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0 }}>
              <span style={{ color: P }}>*</span> Required fields must be completed
            </p>
            <p style={{ fontSize: 11, color: TEXT3, fontFamily: "'Manrope', sans-serif", margin: "4px 0 0" }}>
              {form.colleges.length} college{form.colleges.length !== 1 ? "s" : ""} registered
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => window.location.href = "/university"} style={btnGhost}>Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} style={btnPrimary({ padding: "11px 28px", fontSize: 13 })}>
              {submitting ? "Updating..." : <><span>Apply Changes</span><CircleArrow /></>}
            </button>
          </div>
        </div>
      </div>

      {/* ── SUCCESS MODAL POPUP ────────────────────────────────────────────── */}
      {submitted && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16,
            padding: "40px", maxWidth: 480, width: "90%", textAlign: "center",
            boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)", position: "relative"
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", border: `1.5px solid ${SUCCESS}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 24px", fontSize: 24, color: SUCCESS
            }}>
              ✓
            </div>
            
            <h2 style={{
              fontFamily: "'Castoro Titling', serif", fontSize: 24, fontWeight: 400,
              textTransform: "uppercase", letterSpacing: "0.1em", color: TEXT, margin: "0 0 12px"
            }}>
              Update Complete
            </h2>
            
            <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.6, marginBottom: 28, fontFamily: "'Manrope', sans-serif" }}>
              Changes to <strong style={{ color: TEXT }}>{form.universityName}</strong> have been successfully updated on the server.
            </p>
            
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setSubmitted(false)} style={btnGhost}>
                Keep Editing
              </button>
              <button onClick={() => window.location.href = "/university"} style={btnPrimary()}>
                Return to Directory <CircleArrow />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}