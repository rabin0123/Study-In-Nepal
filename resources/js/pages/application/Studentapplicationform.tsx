import { useState, useEffect, useMemo, useRef } from "react";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { getNames } from "country-list";
import { notify } from "@/lib/toast";

// ── interfaces ──
interface ComboboxInputProps { placeholder?: string; value: string; onChange: (val: string) => void; options: string[] }

interface ApplicationFormState {
  student_name: string;
  phone_number: string;
  email: string;
  country: string;

  university_name: string;
  college_name: string;
  course_name: string;

  passport_number: string;
  date_of_birth: string;

  address_line_1: string;
  address_line_2: string;
  city: string;
  state_province_region: string;
  postal_code: string;

  agency_reference_notes: string;
}

interface UniversityItem {
  id: number;
  University: string;
  College: string;
  Course: string;
  [key: string]: any;
}

interface CommissionData {
  university: string;
  college: string;
  commission_percentage: string | number;
}

function getAddressConfig(country: string) {
  const c = country ? country.toLowerCase() : "";

  let template = "DEFAULT";
  let cityLabel = "City";
  let stateLabel = "State / Province / Region";
  let postalLabel = "Postal Code";
  let postalHint = "ZIP or Postal code";
  let isPostalRequired = false;

  if (c.includes("united states") || c === "us" || c.includes("america")) {
    template = "US";
    cityLabel = "City";
    stateLabel = "State";
    postalLabel = "ZIP Code";
    postalHint = "5-digit ZIP";
    isPostalRequired = true;
  } else if (c.includes("canada") || c === "ca") {
    template = "CA";
    cityLabel = "City";
    stateLabel = "Province";
    postalLabel = "Postal Code";
    postalHint = "e.g. K1A 0B1";
    isPostalRequired = true;
  } else if (c.includes("united kingdom") || c === "uk" || c === "gb" || c.includes("britain")) {
    template = "UK";
    cityLabel = "Town / City";
    stateLabel = "County";
    postalLabel = "Postcode";
    postalHint = "e.g. SW1A 1AA";
    isPostalRequired = true;
  } else if (c.includes("australia") || c === "au") {
    template = "AU";
    cityLabel = "Suburb / City";
    stateLabel = "State";
    postalLabel = "Postcode";
    postalHint = "4-digit Postcode";
    isPostalRequired = true;
  } else if (c.includes("india") || c === "in") {
    template = "IN";
    cityLabel = "City";
    stateLabel = "State / UT";
    postalLabel = "PIN Code";
    postalHint = "6-digit PIN";
    isPostalRequired = true;
  } else if (c.includes("japan") || c === "jp" || c.includes("china") || c === "cn" || c.includes("korea") || c === "kr") {
    template = "EAST_ASIA";
    cityLabel = "City / District";
    stateLabel = "Prefecture / Province";
    postalLabel = "Postal Code";
    postalHint = "ZIP or Postal";
    isPostalRequired = true;
  } else if (c.includes("germany") || c.includes("france") || c.includes("italy") || c.includes("spain") || c.includes("europe") || c.includes("netherlands")) {
    template = "EUROPE";
    cityLabel = "City";
    stateLabel = "State / Province";
    postalLabel = "Postal Code";
    postalHint = "ZIP/Postal";
    isPostalRequired = true;
  } else if (c.includes("nepal") || c === "np") {
    template = "DEFAULT";
    cityLabel = "City";
    stateLabel = "Province / District";
    postalLabel = "Postal Code";
    postalHint = "Optional";
    isPostalRequired = false;
  }

  return { template, cityLabel, stateLabel, postalLabel, postalHint, isPostalRequired };
}

// ---------------------------------------------------------------------------
// SectionHeader — MaterialM card-header style divider between form
// sections, replacing the old numbered "01 / 02 / 03" custom-font header.
// ---------------------------------------------------------------------------
function SectionHeader({ number, title }: { number: string | number; title: string }) {
  return (
    <div className="d-flex align-items-center gap-3 mb-6">
      <span className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-circle fw-bold round-32 fs-4">
        {number}
      </span>
      <h5 className="mb-0 fw-semibold">{title}</h5>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QuestionLabel — Bootstrap form-label with required asterisk + optional
// muted hint text, matching MaterialM's form field labeling.
// ---------------------------------------------------------------------------
function QuestionLabel({ text, required, hint }: { text: string; required?: boolean; hint?: string }) {
  return (
    <label className="form-label fw-semibold">
      {text}
      {required && <span className="text-danger ms-1">*</span>}
      {hint && <span className="text-body-secondary fw-normal fs-2 ms-2">({hint})</span>}
    </label>
  );
}

// ---------------------------------------------------------------------------
// ComboboxInput — searchable dropdown (university/college/course pickers).
// Kept as a custom component since Bootstrap has no native combobox, but
// restyled with form-control + dropdown-menu classes so it matches the
// rest of the MaterialM form chrome exactly.
// ---------------------------------------------------------------------------
function ComboboxInput({ placeholder, value, onChange, options }: ComboboxInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filteredOptions = useMemo(() => {
    return options.filter(opt =>
      opt.toLowerCase().includes((query || "").toLowerCase())
    );
  }, [options, query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery(value);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value]);

  return (
    <div ref={wrapperRef} className="position-relative">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className="form-control"
      />

      {isOpen && filteredOptions.length > 0 && (
        <ul
          className="dropdown-menu show w-100 p-2 mt-1"
          style={{ maxHeight: 240, overflowY: "auto" }}
        >
          {filteredOptions.map((opt, idx) => (
            <li key={idx}>
              <a
                href="javascript:void(0)"
                // use onMouseDown so the click completes before the input's blur event fires
                onMouseDown={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                className="dropdown-item rounded"
              >
                {opt}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function StudentApplicationForm() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [apiData, setApiData] = useState<UniversityItem[]>([]);
  const [commissions, setCommissions] = useState<CommissionData[]>([]);

  const countriesList = useMemo(() => getNames(), []);

  const initialFormState: ApplicationFormState = {
    student_name: "", phone_number: "", email: "", country: "",
    university_name: "", college_name: "", course_name: "",
    passport_number: "", date_of_birth: "",
    address_line_1: "", address_line_2: "", city: "", state_province_region: "", postal_code: "",
    agency_reference_notes: "",
  };

  const [form, setForm] = useState<ApplicationFormState>(initialFormState);

  const set = <K extends keyof ApplicationFormState>(key: K, val: ApplicationFormState[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const resetForm = () => setForm(initialFormState);

  useEffect(() => {
    const fetchUniversity = fetch("https://www.admin.studyinnepal.com/api/university")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setApiData(data);
      })
      .catch((err) => console.error("Failed to fetch university data", err));

    const fetchCommissions = fetch("/api/commissions", { headers: { "Accept": "application/json" } })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCommissions(data);
      })
      .catch((err) => console.error("Failed to fetch commission data", err));

    // Wait for both API requests to complete or fail before hiding the loading indicator
    Promise.allSettled([fetchUniversity, fetchCommissions]).finally(() => {
      setIsInitialLoading(false);
    });
  }, []);

  const uniqueUniversities = useMemo(() => {
    return Array.from(new Set(apiData.map((d) => d.University).filter(Boolean)));
  }, [apiData]);

  const uniqueColleges = useMemo(() => {
    if (!form.university_name) return [];
    const matches = apiData.filter((d) => d.University && d.University.toLowerCase() === form.university_name.toLowerCase());
    return Array.from(new Set(matches.map((d) => d.College).filter(Boolean)));
  }, [apiData, form.university_name]);

  const uniqueCourses = useMemo(() => {
    if (!form.university_name || !form.college_name) return [];
    const matches = apiData.filter((d) =>
      d.University && d.University.toLowerCase() === form.university_name.toLowerCase() &&
      d.College && d.College.toLowerCase() === form.college_name.toLowerCase()
    );
    return Array.from(new Set(matches.map((d) => d.Course).filter(Boolean)));
  }, [apiData, form.university_name, form.college_name]);

  const currentCommission = useMemo(() => {
    if (!form.university_name || !form.college_name) return null;
    const match = commissions.find(c =>
      c.university.toLowerCase() === form.university_name.toLowerCase() &&
      c.college.toLowerCase() === form.college_name.toLowerCase()
    );
    return match ? match.commission_percentage : null;
  }, [commissions, form.university_name, form.college_name]);

  const handleUniversityChange = (val: string) => {
    setForm((prev) => ({ ...prev, university_name: val, college_name: "", course_name: "" }));
  };

  const handleCollegeChange = (val: string) => {
    setForm((prev) => ({ ...prev, college_name: val, course_name: "" }));
  };

  const addressConfig = useMemo(() => {
    return getAddressConfig(form.country);
  }, [form.country]);

  const handleSubmit = async () => {
    if (!form.student_name.trim()) return notify.error("Missing required field", "Please enter the student's full name.");
    if (!form.country) return notify.error("Missing required field", "Please select the student's country.");

    if (!form.address_line_1.trim()) return notify.error("Missing required field", "Please enter Address Line 1.");
    if (!form.city.trim()) return notify.error("Missing required field", "Please enter the city.");
    if (!form.state_province_region.trim()) return notify.error("Missing required field", `Please enter the ${addressConfig.stateLabel}.`);
    if (addressConfig.isPostalRequired && !form.postal_code.trim()) {
      return notify.error("Missing required field", `Please enter the ${addressConfig.postalLabel}.`);
    }

    if (!form.university_name.trim()) return notify.error("Missing required field", "Please select a university name from the dropdown.");
    if (!form.college_name.trim()) return notify.error("Missing required field", "Please select a college name from the dropdown.");
    if (!form.course_name.trim()) return notify.error("Missing required field", "Please select a course name from the dropdown.");

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        student_name: form.student_name.trim(),
        email: form.email.trim(),
        university_name: form.university_name.trim(),
        college_name: form.college_name.trim(),
        course_name: form.course_name.trim(),
        passport_number: form.passport_number.trim().toUpperCase(),
        address_line_1: form.address_line_1.trim(),
        address_line_2: form.address_line_2.trim(),
        city: form.city.trim(),
        state_province_region: form.state_province_region.trim(),
        postal_code: form.postal_code.trim(),
      };
      const response = await fetch("/api/agent/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const firstError = body?.errors ? Object.values(body.errors)[0] : null;
        throw new Error(Array.isArray(firstError) ? firstError[0] : body?.message || "Server error");
      }

      notify.success("Application submitted", "Our team will review it shortly.");
      resetForm();
    } catch (e) {
      notify.error("Submission failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderAddressFields = () => {
    const { template, cityLabel, stateLabel, postalLabel, postalHint, isPostalRequired } = addressConfig;

    const fieldLine1 = (
      <div>
        <QuestionLabel text="Address Line 1" required hint="Street address, PO box, company name" />
        <input type="text" className="form-control" placeholder="e.g. 123 Main St" value={form.address_line_1} onChange={(e) => set("address_line_1", e.target.value)} />
      </div>
    );

    const fieldLine2 = (
      <div>
        <QuestionLabel text="Address Line 2" hint="Apt, unit, suite, floor - optional" />
        <input type="text" className="form-control" placeholder="e.g. Apt 4B" value={form.address_line_2} onChange={(e) => set("address_line_2", e.target.value)} />
      </div>
    );

    const fieldCity = (
      <div>
        <QuestionLabel text={cityLabel} required />
        <input type="text" className="form-control" placeholder={cityLabel} value={form.city} onChange={(e) => set("city", e.target.value)} />
      </div>
    );

    const fieldState = (
      <div>
        <QuestionLabel text={stateLabel} required />
        <input type="text" className="form-control" placeholder={stateLabel} value={form.state_province_region} onChange={(e) => set("state_province_region", e.target.value)} />
      </div>
    );

    const fieldPostal = (
      <div>
        <QuestionLabel text={postalLabel} required={isPostalRequired} hint={postalHint} />
        <input type="text" className="form-control" placeholder={postalLabel} value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
      </div>
    );

    switch (template) {
      case "US":
      case "CA":
      case "AU":
      case "IN":
        return (
          <div className="d-flex flex-column gap-3">
            {fieldLine1}
            {fieldLine2}
            <div className="row g-3">
              <div className="col-md-4">{fieldCity}</div>
              <div className="col-md-4">{fieldState}</div>
              <div className="col-md-4">{fieldPostal}</div>
            </div>
          </div>
        );

      case "UK":
        return (
          <div className="d-flex flex-column gap-3">
            {fieldLine1}
            {fieldLine2}
            {fieldCity}
            <div className="row g-3">
              <div className="col-md-5">{fieldState}</div>
              <div className="col-md-7">{fieldPostal}</div>
            </div>
          </div>
        );

      case "EUROPE":
        return (
          <div className="d-flex flex-column gap-3">
            {fieldLine1}
            {fieldLine2}
            <div className="row g-3">
              <div className="col-md-4">{fieldPostal}</div>
              <div className="col-md-8">{fieldCity}</div>
            </div>
            <div>
              <QuestionLabel text={stateLabel} hint="Optional" />
              <input type="text" className="form-control" placeholder={stateLabel} value={form.state_province_region} onChange={(e) => set("state_province_region", e.target.value)} />
            </div>
          </div>
        );

      case "EAST_ASIA":
        return (
          <div className="d-flex flex-column gap-3">
            <div className="row g-3">
              <div className="col-md-5">{fieldPostal}</div>
              <div className="col-md-7">{fieldState}</div>
            </div>
            {fieldCity}
            {fieldLine1}
            {fieldLine2}
          </div>
        );

      case "DEFAULT":
      default:
        return (
          <div className="d-flex flex-column gap-3">
            {fieldLine1}
            {fieldLine2}
            <div className="row g-3">
              <div className="col-md-6">{fieldCity}</div>
              <div className="col-md-6">{fieldState}</div>
            </div>
            <div>
              <QuestionLabel text={postalLabel} hint={postalHint} required={isPostalRequired} />
              <input type="text" className="form-control" placeholder={postalLabel} value={form.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
            </div>
          </div>
        );
    }
  };

  // If the initial APIs are still fetching, render a centered Bootstrap loading spinner
  if (isInitialLoading) {
    return (
      <div 
        className="d-flex flex-column align-items-center justify-content-center w-100" 
        style={{ minHeight: "400px", padding: "3rem 0" }}
      >
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="text-body-secondary fs-4 fw-medium">Loading Application form...</span>
      </div>
    );
  }

  return (
    <>
      {/* MaterialM's phone-input field styling is Bootstrap's own
          .form-control chrome; react-phone-number-input ships unstyled
          divs, so this maps its internal class names onto Bootstrap
          tokens (border, radius, focus color) instead of custom pill CSS. */}
      <style>{`
        .PhoneInput {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .PhoneInput .PhoneInputInput {
          border: 1px solid var(--bs-border-color, #dee2e6);
          border-radius: var(--bs-border-radius, 0.375rem);
          padding: 0.5rem 0.9rem;
          font-size: 1rem;
          background: var(--bs-body-bg, #fff);
          color: var(--bs-body-color, #212529);
          outline: none;
          margin-left: 0.5rem;
          width: 100%;
        }
        .PhoneInput .PhoneInputInput:focus {
          border-color: #0ea5e9;
          box-shadow: 0 0 0 0.2rem rgba(14, 165, 233, 0.15);
        }
        .PhoneInputCountry {
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 32px !important;
        }
        .PhoneInputCountryIcon {
          width: 24px !important;
          height: 16px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          border-radius: 2px;
        }
      `}</style>

      {/* Center container for the entire form section */}
      <div className="mx-auto w-100 px-3 px-md-0 animate-fade-in" style={{ maxWidth: 960 }}>
        
        {/* ── Page header ── */}
        <div className="d-flex align-items-center gap-3 mb-6">
          <span className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48">
            <iconify-icon icon="solar:document-add-line-duotone" className="fs-6"></iconify-icon>
          </span>
          <div>
            <h3 className="mb-0 fw-semibold">Student Application Submission Form</h3>
            <span className="text-body-secondary fs-3">Fill in the details below to submit a new student application</span>
          </div>
        </div>

        {/* ── Section A: Student Details ── */}
        <div className="card mb-6">
          <div className="card-body">
            <SectionHeader number="A" title="Student Details" />

            <QuestionLabel text="Full Name" required />
            <input
              type="text"
              className="form-control"
              placeholder="Student's full legal name"
              value={form.student_name}
              onChange={(e) => set("student_name", e.target.value)}
            />

            {/* <div className="row g-3 mt-1">
              <div className="col-md-6">
                <QuestionLabel text="Phone Number" hint="Include country code" />
                <PhoneInput
                  international
                  value={form.phone_number}
                  onChange={(val) => set("phone_number", val || "")}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="col-md-6">
                <QuestionLabel text="Email Address" hint="Optional" />
                <input
                  type="email"
                  className="form-control"
                  placeholder="student@example.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </div>
            </div> */}

            <div className="row g-3 mt-1">
              <div className="col-md-6">
                <QuestionLabel text="Country" required hint="Student's country of residence" />
                <select
                  className="form-select"
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                >
                  <option value="" disabled>Select country</option>
                  {countriesList.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {/* <div className="col-md-6">
                <QuestionLabel text="Passport Number" hint="Optional" />
                <input
                  type="text"
                  className="form-control text-uppercase"
                  placeholder="e.g. A1234567"
                  value={form.passport_number}
                  onChange={(e) => set("passport_number", e.target.value)}
                />
              </div> */}
            </div>

            {/* <div className="row g-3 mt-1">
              <div className="col-md-6">
                <QuestionLabel text="Date of Birth" hint="Optional" />
                <input
                  type="date"
                  className="form-control"
                  value={form.date_of_birth}
                  onChange={(e) => set("date_of_birth", e.target.value)}
                />
              </div>
            </div> */}

            <div className="mt-4">
              <QuestionLabel text="Address" required />
              {renderAddressFields()}
            </div>
          </div>
        </div>

        {/* ── Section B: Study Plan ── */}
        <div className="card mb-6">
          <div className="card-body">
            <SectionHeader number="B" title="Study Plan" />

            <div>
              <QuestionLabel text="University Name" required hint="Select from list or type to search" />
              <ComomboxWrapper>
                <ComboboxInput
                  placeholder="e.g. Glasgow Caledonian University"
                  value={form.university_name}
                  onChange={handleUniversityChange}
                  options={uniqueUniversities}
                />
              </ComomboxWrapper>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-start justify-content-between gap-2">
                <div className="flex-grow-1">
                  <QuestionLabel text="College Name" required hint="Select from list or type to search" />
                </div>

                {currentCommission !== null && (
                  <span className="badge bg-success-subtle text-success fw-semibold fs-2 d-inline-flex align-items-center gap-1 mt-1">
                    <iconify-icon icon="solar:dollar-line-duotone" className="fs-4"></iconify-icon>
                    {Number(currentCommission).toFixed(2)}% Commission
                  </span>
                )}
              </div>

              <ComboboxInput
                placeholder="e.g. Ace International Business School"
                value={form.college_name}
                onChange={handleCollegeChange}
                options={uniqueColleges}
              />
            </div>

            <div className="mt-4">
              <QuestionLabel text="Course Name" required hint="Select from list or type to search" />
              <ComboboxInput
                placeholder="e.g. Bachelor of Business Administration (BBA)"
                value={form.course_name}
                onChange={(v) => set("course_name", v)}
                options={uniqueCourses}
              />
            </div>
          </div>
        </div>

        {/* ── Section C: Agency Details ── */}
        <div className="card mb-6">
          <div className="card-body">
            <SectionHeader number="C" title="Agency Details" />

            <QuestionLabel text="Additional Notes" hint="Optional notes for our team" />
            <textarea
              className="form-control"
              rows={3}
              placeholder="Optional notes for our team..."
              value={form.agency_reference_notes}
              onChange={(e) => set("agency_reference_notes", e.target.value)}
            />
          </div>
        </div>

        {/* ── Submit ── */}
        <div className="d-flex justify-content-end mb-6">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn btn-primary d-inline-flex align-items-center gap-2 px-6"
          >
            {submitting && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
            <span>{submitting ? "Submitting..." : "Submit Application"}</span>
            {!submitting && <iconify-icon icon="solar:arrow-right-line-duotone" className="fs-5"></iconify-icon>}
          </button>
        </div>

      </div>
    </>
  );
}

function ComomboxWrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}