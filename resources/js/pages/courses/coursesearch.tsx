import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ── Helper to dynamically map stream to actual homepage assets ─────────────
const getStreamImage = (stream: string, id: number): string => {
  const s = stream?.toLowerCase() || "";
  if (s.includes("it") || s.includes("tech") || s.includes("comput") || s.includes("engin") || s.includes("science")) {
    return "/images/event_classroom.png";
  }
  if (s.includes("buddhist") || s.includes("philosophy") || s.includes("culture") || s.includes("art")) {
    return "/images/nepal_temple.png";
  }
  if (s.includes("manage") || s.includes("business") || s.includes("mba") || s.includes("admin")) {
    return "/images/cafe_student.png";
  }
  if (s.includes("social") || s.includes("ngo") || s.includes("communit")) {
    return "/images/event_walking.png";
  }
  const fallbackPool = [
    "/images/event_grad.png",
    "/images/students_hero.jpg"
  ];
  return fallbackPool[id % fallbackPool.length];
};

// ── Data Standardization Helpers ───────────────────────────────────────────
const standardizeLevel = (level: string | null | undefined): string => {
  if (!level) return "";
  let l = level.trim();
  l = l.replace(/[\uFFFD\u2013\u2014]/g, '-');
  l = l.replace(/\s*\/\s*/g, ' / ');
  l = l.replace(/\b[Bb]achelor['’]?s?\b/g, "Bachelor's");
  l = l.replace(/\b[Mm]aster['’]?s?\b/g, "Master's");
  l = l.replace(/\b[Mm]\.?\s*[Pp]hil\.?\b/gi, "M.Phil.");
  l = l.replace(/\b[Pp]h\.?[Dd]\.?\b/gi, "Ph.D.");
  l = l.charAt(0).toUpperCase() + l.slice(1);
  return l.replace(/\s+/g, ' ').trim();
};

const standardizeName = (name: string | null | undefined): string => {
  if (!name) return "";
  let n = name.trim();
  n = n.replace(/[\uFFFD\u2013\u2014]/g, '-');
  n = n.replace(/\s*-\s*/g, ' - ');
  n = n.replace(/,\s*U\.?S\.?A\.?/gi, ' (USA)');
  n = n.replace(/,\s*U\.?K\.?/gi, ' (UK)');
  n = n.replace(/,\s*Australia/gi, ' (Australia)');
  n = n.replace(/\b([a-z])([A-Za-z]*)\b/g, (match, p1, p2) => p1.toUpperCase() + p2);
  return n.replace(/\s+/g, ' ').trim();
};

const standardizeStream = (stream: string | null | undefined): string => {
  if (!stream) return "";
  let s = stream.trim();
  s = s.replace(/[\uFFFD\u2013\u2014]/g, '-');

  const corrections: Record<string, string> = {
    "Fashion Desinging": "Fashion Designing",
    "Artificial Intellgance": "Artificial Intelligence",
    "Mass Communciation": "Mass Communication",
    "Interior Desinging": "Interior Designing",
    "Pharmecy": "Pharmacy",
    "Comuter Engineering": "Computer Engineering",
    "Information Systerm Engineering": "Information System Engineering",
    "Nurition": "Nutrition",
    "Veternariy Science": "Veterinary Science",
    "Electical Engineering": "Electrical Engineering",
    "Electronics and Commucation Engineering": "Electronics & Communication Engineering",
    "Physiotheraphy": "Physiotherapy",
    "Geomtics Engineering": "Geomatics Engineering",
    "Transporation Engineering": "Transportation Engineering",
    "Chinease Language": "Chinese Language",
    "Carpentory": "Carpentry",
    "Reserch": "Research",
    "Toursim Management": "Tourism Management",
    "Toursim": "Tourism",
    "Envrironment Science": "Environmental Science",
    "Budhism": "Buddhism",
    "Rular Development": "Rural Development",
    "Medcine": "Medicine",
    "Labotary Technology": "Laboratory Technology",
    "Travel and Toursim": "Travel & Tourism"
  };

  if (corrections[s]) {
    return corrections[s];
  }

  s = s.replace(/\b([a-z])([A-Za-z]*)\b/g, (match, p1, p2) => p1.toUpperCase() + p2);
  return s.replace(/\s+/g, ' ').trim();
};

const standardizeCourse = (course: string | null | undefined): string => {
  if (!course) return "";
  let c = course.trim();
  c = c.replace(/[\uFFFD\u2013\u2014]/g, '-');
  c = c.replace(/\s*-\s*/g, ' - ');
  return c.replace(/\s+/g, ' ').trim();
};

interface UniversityEntry {
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

// Shape returned by GET /api/agent/applications/search-students
interface StudentResult {
  id: string;
  app_id: string;
  original_app_id: string | null;
  student_name: string;
  email: string | null;
  phone_number: string | null;
  country: string | null;
  avatar_url: string | null;
  university_name: string | null;
  college_name: string | null;
  course_name: string | null;
  status: string;
}

const validUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  return trimmed;
};

// ── Dropdown Filter Component ──────────────────────────────────────────────
interface DropdownProps {
  label: string;
  options: string[];
  selected: string[];
  toggleOption: (val: string) => void;
}

function DropdownFilter({ label, options, selected, toggleOption }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasSelected = selected.length > 0;

  return (
    <div ref={containerRef} className="position-relative text-start">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn d-flex align-items-center gap-2 px-3 py-2 rounded-pill shadow-sm"
        style={{
          background: hasSelected ? "#008ce3" : "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${hasSelected ? "#008ce3" : "rgba(255, 255, 255, 0.25)"}`,
          fontSize: "13px",
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "'Manrope', sans-serif",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap"
        }}
      >
        <span>{label} {hasSelected && `(${selected.length})`}</span>
        <iconify-icon 
          icon="solar:alt-arrow-down-line-duotone" 
          style={{ 
            transform: isOpen ? "rotate(180deg)" : "none", 
            transition: "transform 0.2s",
            fontSize: "14px"
          }} 
        />
      </button>

      {isOpen && (
        <div 
          className="dropdown-menu show p-2 shadow-lg border mt-2 custom-scroll"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            width: "280px",
            maxHeight: "300px",
            overflowY: "auto",
            zIndex: 1050,
          }}
        >
          {options.length === 0 ? (
            <div className="p-2 text-muted small">No options available</div>
          ) : (
            options.map(opt => (
              <label 
                key={opt} 
                className="dropdown-item d-flex align-items-center gap-2 rounded-2 cursor-pointer py-2 px-3 m-0"
                style={{ cursor: "pointer", whiteSpace: "normal" }}
              >
                <input
                  type="checkbox"
                  className="form-check-input mt-0"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span className="small text-wrap" style={{ lineHeight: 1.4 }}>{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Apply Now Modal ─────────────────────────────────────────────────────────
// Two-step flow inside a single modal:
//   1. Search step  – live (debounced) search of existing students by name or app_id
//   2. Confirm step – "Apply <student> to <course> at <college>?" yes/no
interface ApplyModalProps {
  courseTarget: {
    university: string;
    college: string;
    course: string;
  };
  // Prefetched recent students (~50-100), shown instantly with no query.
  recentStudents: StudentResult[];
  recentStudentsLoading: boolean;
  // Called when the modal opens so the parent can silently refresh the
  // recent-students list in the background.
  onRequestRefreshRecent: () => void;
  onClose: () => void;
}

type ModalStep = "search" | "confirm" | "submitting" | "success" | "error";

// Below this length, filter the prefetched "recent students" list locally
// (instant, no network). At or above it, hit the indexed DB search so we
// can reach the full 1000+ record set, not just the recent-students slice.
const LOCAL_FILTER_MAX_LENGTH = 2;

function ApplyNowModal({ courseTarget, recentStudents, recentStudentsLoading, onRequestRefreshRecent, onClose }: ApplyModalProps) {
  const [step, setStep] = useState<ModalStep>("search");
  const [query, setQuery] = useState("");
  const [remoteResults, setRemoteResults] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    // Refresh the recent-students cache in the background every time the
    // modal opens, without blocking the (already cached) instant display.
    onRequestRefreshRecent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const runRemoteSearch = useCallback(async (q: string) => {
    setSearching(true);
    setSearchError(null);
    try {
      const res = await fetch(`/api/agent/applications/search-students?q=${encodeURIComponent(q)}`, {
        headers: { "Accept": "application/json" },
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setSearchError(json.message || "Unable to search students right now.");
        setRemoteResults([]);
      } else {
        setRemoteResults(json.data || []);
      }
    } catch (err) {
      setSearchError("Network error while searching. Please try again.");
      setRemoteResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  // Instant local filter of the prefetched recent-students list — used for
  // empty query and very short queries where a DB round-trip would only
  // add latency without adding much value.
  const localMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return recentStudents;
    return recentStudents.filter(
      (s) =>
        s.student_name?.toLowerCase().includes(q) ||
        s.app_id?.toLowerCase().includes(q)
    );
  }, [query, recentStudents]);

  // Debounced live search against the DB once the query is long enough to
  // be worth a round trip (covers students outside the recent-50/100 slice).
  useEffect(() => {
    const q = query.trim();
    if (q.length <= LOCAL_FILTER_MAX_LENGTH) {
      setRemoteResults([]);
      setSearching(false);
      setSearchError(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runRemoteSearch(q);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runRemoteSearch]);

  const isRemoteMode = query.trim().length > LOCAL_FILTER_MAX_LENGTH;

  // Merge remote results in front (they're the authoritative full-DB match),
  // then any local matches not already present, so results don't flicker
  // away while the debounced remote call is still in flight.
  const displayedResults = isRemoteMode
    ? [
        ...remoteResults,
        ...localMatches.filter((s) => !remoteResults.some((r) => r.id === s.id)),
      ]
    : localMatches;

  const handlePickStudent = (student: StudentResult) => {
    setSelectedStudent(student);
    setStep("confirm");
  };

  const handleBackToSearch = () => {
    setSelectedStudent(null);
    setStep("search");
  };

  const handleConfirmApply = async () => {
    if (!selectedStudent) return;
    setStep("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/agent/applications/${selectedStudent.id}/apply-to-course`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            university_name: courseTarget.university,
            college_name: courseTarget.college,
            course_name: courseTarget.course,
          }),
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMessage(json.message || "Could not submit this application. Please try again.");
        setStep("error");
        return;
      }
      setStep("success");
    } catch (err) {
      setErrorMessage("Network error while submitting. Please try again.");
      setStep("error");
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(4px)", zIndex: 2000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-4 shadow-lg d-flex flex-column"
        style={{
          width: "min(520px, 92vw)",
          maxHeight: "82vh",
          fontFamily: "'Manrope', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <div>
            <h2 className="h6 fw-bold mb-0 text-body">
              {step === "search" && "Find a Student"}
              {step === "confirm" && "Confirm Application"}
              {step === "submitting" && "Submitting..."}
              {step === "success" && "Application Submitted"}
              {step === "error" && "Something Went Wrong"}
            </h2>
            <p className="small text-muted mb-0" style={{ fontSize: "12px" }}>
              {courseTarget.course} &middot; {courseTarget.college}
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-sm btn-light rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: "32px", height: "32px" }}
            aria-label="Close"
          >
            <iconify-icon icon="solar:close-circle-line-duotone" style={{ fontSize: "18px" }} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-auto" style={{ flex: 1 }}>
          {step === "search" && (
            <>
              <div className="position-relative mb-3">
                <span className="position-absolute top-50 translate-middle-y start-0 ps-3 d-flex align-items-center">
                  <iconify-icon icon="solar:magnifer-line-duotone" style={{ fontSize: "18px", color: "#008ce3" }} />
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by student name or App ID..."
                  className="form-control rounded-pill ps-5 py-2 border"
                  style={{ fontSize: "14px" }}
                />
              </div>

              {!query.trim() && (
                <div className="small text-muted mb-2" style={{ fontSize: "11px" }}>
                  Recently active students
                </div>
              )}

              {recentStudentsLoading && !query.trim() && recentStudents.length === 0 && (
                <div className="text-center text-muted small py-4">Loading recent students...</div>
              )}

              {isRemoteMode && searching && (
                <div className="text-center text-muted small py-2" style={{ fontSize: "12px" }}>
                  Searching full student list...
                </div>
              )}

              {isRemoteMode && !searching && searchError && (
                <div className="text-center text-danger small py-4">{searchError}</div>
              )}

              {!recentStudentsLoading && displayedResults.length === 0 && query.trim() && !searching && !searchError && (
                <div className="text-center text-muted small py-4">
                  No students found matching &ldquo;{query}&rdquo;.
                </div>
              )}

              {!recentStudentsLoading && displayedResults.length === 0 && !query.trim() && (
                <div className="text-center text-muted small py-4">
                  No students yet. Start typing a name or App ID to search.
                </div>
              )}

              {displayedResults.length > 0 && (
                <div className="d-flex flex-column gap-2">
                  {displayedResults.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handlePickStudent(student)}
                      className="btn text-start d-flex align-items-center gap-3 p-2 rounded-3 border"
                      style={{ background: "white" }}
                    >
                      <img
                        src={student.avatar_url || "/images/default-avatar.png"}
                        alt={student.student_name}
                        className="rounded-circle"
                        style={{ width: "40px", height: "40px", objectFit: "cover" }}
                        onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold small text-body">{student.student_name}</div>
                        <div className="text-muted" style={{ fontSize: "12px" }}>
                          App ID: {student.app_id}
                          {student.email ? ` · ${student.email}` : ""}
                        </div>
                      </div>
                      <iconify-icon icon="solar:arrow-right-linear" style={{ fontSize: "16px", color: "#008ce3" }} />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {step === "confirm" && selectedStudent && (
            <div>
              <div className="d-flex align-items-center gap-3 p-3 rounded-3 mb-3" style={{ background: "rgba(0, 140, 227, 0.06)" }}>
                <img
                  src={selectedStudent.avatar_url || "/images/default-avatar.png"}
                  alt={selectedStudent.student_name}
                  className="rounded-circle"
                  style={{ width: "48px", height: "48px", objectFit: "cover" }}
                />
                <div>
                  <div className="fw-bold text-body">{selectedStudent.student_name}</div>
                  <div className="text-muted small">App ID: {selectedStudent.app_id}</div>
                </div>
              </div>

              <p className="small text-body mb-3">
                Do you want to apply <strong>{selectedStudent.student_name}</strong> to this program?
              </p>

              <div className="rounded-3 border p-3 mb-3 small">
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Course</span>
                  <span className="fw-bold text-body text-end">{courseTarget.course}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">College</span>
                  <span className="fw-bold text-body text-end">{courseTarget.college}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">University</span>
                  <span className="fw-bold text-body text-end">{courseTarget.university}</span>
                </div>
              </div>
            </div>
          )}

          {step === "submitting" && (
            <div className="text-center text-muted small py-5">Submitting application...</div>
          )}

          {step === "success" && selectedStudent && (
            <div className="text-center py-4">
              <iconify-icon icon="solar:check-circle-bold-duotone" style={{ fontSize: "48px", color: "#22c55e" }} />
              <p className="small text-body mt-3 mb-0">
                <strong>{selectedStudent.student_name}</strong> has been applied to {courseTarget.course} at {courseTarget.college}.
              </p>
            </div>
          )}

          {step === "error" && (
            <div className="text-center py-4">
              <iconify-icon icon="solar:danger-triangle-bold-duotone" style={{ fontSize: "40px", color: "#ef4444" }} />
              <p className="small text-body mt-3 mb-0">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {step === "confirm" && (
          <div className="d-flex gap-2 px-4 py-3 border-top">
            <button onClick={handleBackToSearch} className="btn btn-light flex-fill fw-bold rounded-pill" style={{ fontSize: "13px" }}>
              Back
            </button>
            <button
              onClick={handleConfirmApply}
              className="btn flex-fill fw-bold rounded-pill text-white"
              style={{ background: "#008ce3", fontSize: "13px" }}
            >
              Yes, Apply
            </button>
          </div>
        )}

        {step === "error" && (
          <div className="d-flex gap-2 px-4 py-3 border-top">
            <button onClick={handleBackToSearch} className="btn btn-light flex-fill fw-bold rounded-pill" style={{ fontSize: "13px" }}>
              Back to Search
            </button>
            <button onClick={onClose} className="btn btn-outline-secondary flex-fill fw-bold rounded-pill" style={{ fontSize: "13px" }}>
              Close
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="d-flex px-4 py-3 border-top">
            <button
              onClick={onClose}
              className="btn flex-fill fw-bold rounded-pill text-white"
              style={{ background: "#008ce3", fontSize: "13px" }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────
export default function CourseSearch() {
  const [data, setData] = useState<UniversityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Filter states
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // Apply Now modal state — tracks which course card triggered it
  const [applyTarget, setApplyTarget] = useState<{ university: string; college: string; course: string } | null>(null);

  // Prefetched "recent students" cache — loaded on page mount so the Apply
  // Now modal's search list appears instantly instead of waiting on a
  // network call the first time it's opened.
  const [recentStudents, setRecentStudents] = useState<StudentResult[]>([]);
  const [recentStudentsLoading, setRecentStudentsLoading] = useState(true);

  const fetchRecentStudents = useCallback(async () => {
    setRecentStudentsLoading(true);
    try {
      const res = await fetch("/api/agent/applications/recent-students?limit=75", {
        headers: { "Accept": "application/json" },
        credentials: "include",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setRecentStudents(json.data || []);
      }
    } catch (error) {
      console.error("Failed to prefetch recent students", error);
    } finally {
      setRecentStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniversities();
    // Prefetch student list as soon as the course search page loads, so
    // it's already warm by the time someone clicks "Apply Now".
    fetchRecentStudents();
  }, [fetchRecentStudents]);

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await fetch("https://admin.studyinnepal.com/api/university", {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
      }
    } catch (error) {
      console.error("Failed to load records from api", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedLevels([]);
    setSelectedStreams([]);
    setSelectedCourses([]);
    setSelectedUniversities([]);
    setSelectedColleges([]);
    setSelectedLocations([]);
    setSearch("");
  };

  // ── Dynamic Filtering Logic ──
  const { filteredData, filterOptions } = useMemo(() => {
    const q = search.toLowerCase();

    const levelsSet = new Set<string>(selectedLevels);
    const streamsSet = new Set<string>(selectedStreams);
    const coursesSet = new Set<string>(selectedCourses);
    const universitiesSet = new Set<string>(selectedUniversities);
    const collegesSet = new Set<string>(selectedColleges);
    const locationsSet = new Set<string>(selectedLocations);
    
    const resultData: UniversityEntry[] = [];

    data.forEach(item => {
      const stdLevel = standardizeLevel(item.level);
      const stdStream = standardizeStream(item.stream);
      const stdCourse = standardizeCourse(item.Course);
      const stdUni = standardizeName(item.University);
      const stdCol = standardizeName(item.College);
      const stdLoc = standardizeName(item.Location);

      const matchesSearch = !q || (
        stdUni.toLowerCase().includes(q) ||
        stdCourse.toLowerCase().includes(q) ||
        stdLoc.toLowerCase().includes(q) ||
        stdCol.toLowerCase().includes(q) ||
        stdStream.toLowerCase().includes(q)
      );

      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(stdLevel);
      const matchesStream = selectedStreams.length === 0 || selectedStreams.includes(stdStream);
      const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(stdCourse);
      const matchesUni = selectedUniversities.length === 0 || selectedUniversities.includes(stdUni);
      const matchesCol = selectedColleges.length === 0 || selectedColleges.includes(stdCol);
      const matchesLoc = selectedLocations.length === 0 || selectedLocations.includes(stdLoc);

      if (matchesSearch && matchesLevel && matchesStream && matchesCourse && matchesUni && matchesCol && matchesLoc) {
        resultData.push(item);
      }

      if (matchesSearch && matchesStream && matchesCourse && matchesUni && matchesCol && matchesLoc) {
        if (stdLevel) levelsSet.add(stdLevel);
      }
      if (matchesSearch && matchesLevel && matchesCourse && matchesUni && matchesCol && matchesLoc) {
        if (stdStream) streamsSet.add(stdStream);
      }
      if (matchesSearch && matchesLevel && matchesStream && matchesUni && matchesCol && matchesLoc) {
        if (stdCourse) coursesSet.add(stdCourse);
      }
      if (matchesSearch && matchesLevel && matchesStream && matchesCourse && matchesCol && matchesLoc) {
        if (stdUni) universitiesSet.add(stdUni);
      }
      if (matchesSearch && matchesLevel && matchesStream && matchesCourse && matchesUni && matchesLoc) {
        if (stdCol) collegesSet.add(stdCol);
      }
      if (matchesSearch && matchesLevel && matchesStream && matchesCourse && matchesUni && matchesCol) {
        if (stdLoc) locationsSet.add(stdLoc);
      }
    });

    return {
      filteredData: resultData,
      filterOptions: {
        levels: Array.from(levelsSet).sort(),
        streams: Array.from(streamsSet).sort(),
        courses: Array.from(coursesSet).sort(),
        universities: Array.from(universitiesSet).sort(),
        colleges: Array.from(collegesSet).sort(),
        locations: Array.from(locationsSet).sort(),
      }
    };
  }, [data, search, selectedLevels, selectedStreams, selectedCourses, selectedUniversities, selectedColleges, selectedLocations]);

  const toggleFilter = (list: string[], setList: (next: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedStreams.length > 0 || selectedCourses.length > 0 || selectedUniversities.length > 0 || selectedColleges.length > 0 || selectedLocations.length > 0;

  return (
    <div className="course-search-scope" style={{ fontFamily: "'Manrope', sans-serif" }}>
      {/* External CSS Fonts */}
      <link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── VISUAL HERO BANNER (Fixed overflow & added relative layout z-index) ────────────────── */}
      <div className="position-relative text-center" style={{ padding: "110px 24px 80px", zIndex: 10 }}>
        
        {/* Background Video (Self-contained boundaries block video bleedout) */}
        <div className="position-absolute top-0 start-0 end-0 bottom-0 overflow-hidden" style={{ zIndex: 0 }}>
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/students_hero.jpg"
            className="position-absolute top-0 start-0 w-100 h-100"
            style={{ objectFit: "cover" }}
          >
            <source src="https://admin.studyinnepal.com/storage/videos/d47e6ef1-9380-4968-b9b3-5b0b3a9a6e81.mp4" type="video/mp4" />
          </video>
          <div className="position-absolute inset-0 bg-dark opacity-75" style={{ mixBlendMode: "multiply", top: 0, left: 0, right: 0, bottom: 0 }} />
          <div className="position-absolute inset-0" style={{ background: "linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))", top: 0, left: 0, right: 0, bottom: 0 }} />
        </div>

        {/* Hero Content Layer */}
        <div className="container position-relative" style={{ zIndex: 5, maxWidth: "1040px" }}>
          <p className="text-uppercase fw-bold text-warning mb-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "11px", letterSpacing: "0.28em" }}>
            Explore Academic Fields
          </p>
          <h1 className="text-white text-uppercase mb-3" style={{ fontFamily: "'Castoro Titling', serif", fontSize: "calc(24px + 1.8vw)", letterSpacing: "0.06em", lineHeight: 1.15 }}>
            Discover <span style={{ color: "#008ce3" }}>Your Pathway</span> in Nepal
          </h1>
          <p className="text-white-50 mx-auto mb-4" style={{ fontSize: "14px", lineHeight: 1.7, maxWidth: "620px" }}>
            Search registered universities, streams, specialized colleges, and find the perfect program that meets your academic goals.
          </p>

          {/* Search Input Box */}
          <div className="position-relative mx-auto mb-4" style={{ maxWidth: "640px" }}>
            <span className="position-absolute top-50 translate-middle-y start-0 ps-4 z-3 d-flex align-items-center">
              <iconify-icon icon="solar:magnifer-line-duotone" style={{ fontSize: "22px", color: "#008ce3" }} />
            </span>
            <input
              type="text"
              placeholder="Search by course, stream, college, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="form-control rounded-pill ps-5 py-3 border-0 bg-white shadow"
              style={{
                fontSize: "15px",
                color: "#111827",
                outline: "none",
                boxShadow: searchFocused ? "0 12px 30px rgba(0, 140, 227, 0.25)" : "0 8px 30px rgba(0,0,0,0.15)",
                transition: "all 0.3s ease"
              }}
            />
          </div>

          {/* Horizontal Filters Section */}
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 pt-2">
            <div className="d-flex align-items-center text-uppercase fw-bold text-white-50 me-2" style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "13px", letterSpacing: "0.1em" }}>
              <iconify-icon icon="solar:filter-line-duotone" style={{ fontSize: "20px", marginRight: "4px" }} /> Filters
            </div>

            <DropdownFilter label="Academic Level" options={filterOptions.levels} selected={selectedLevels} toggleOption={(v) => toggleFilter(selectedLevels, setSelectedLevels, v)} />
            <DropdownFilter label="Stream / Field" options={filterOptions.streams} selected={selectedStreams} toggleOption={(v) => toggleFilter(selectedStreams, setSelectedStreams, v)} />
            <DropdownFilter label="Course" options={filterOptions.courses} selected={selectedCourses} toggleOption={(v) => toggleFilter(selectedCourses, setSelectedCourses, v)} />
            <DropdownFilter label="Universities" options={filterOptions.universities} selected={selectedUniversities} toggleOption={(v) => toggleFilter(selectedUniversities, setSelectedUniversities, v)} />
            <DropdownFilter label="Colleges" options={filterOptions.colleges} selected={selectedColleges} toggleOption={(v) => toggleFilter(selectedColleges, setSelectedColleges, v)} />
            <DropdownFilter label="Location" options={filterOptions.locations} selected={selectedLocations} toggleOption={(v) => toggleFilter(selectedLocations, setSelectedLocations, v)} />

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="btn btn-outline-danger btn-sm text-uppercase fw-bold px-3 py-2 rounded-pill shadow-sm"
                style={{ fontFamily: "'Rajdhani', sans-serif", fontSize: "12px", letterSpacing: "0.05em" }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="container py-5" style={{ maxWidth: "1040px", position: "relative", zIndex: 1 }}>

        {/* Results Status Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="small text-muted">
            Showing <strong className="text-body">{filteredData.length}</strong> programs available
          </div>
        </div>

        {/* Dynamic Responsive Layout */}
        {loading ? (
          <div className="card text-center p-5 border shadow-sm rounded-4">
            <div className="card-body">
              <span className="text-muted">Searching directory listings...</span>
            </div>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="card text-center p-5 border shadow-sm rounded-4">
            <div className="card-body">
              <span className="text-muted">No matches found. Try adjusting your filter terms or keywords.</span>
            </div>
          </div>
        ) : (
          <div className="d-flex flex-column gap-4">
            {filteredData.map(item => {
              const stdLevel = standardizeLevel(item.level);
              const stdUni = standardizeName(item.University);
              const stdCol = standardizeName(item.College);
              const stdLoc = standardizeName(item.Location);
              const stdStream = standardizeStream(item.stream);
              const stdCourse = standardizeCourse(item.Course);

              const collegeLogo = validUrl(item.college_logo_url);
              const universityLogo = validUrl(item.university_logo_url);
              const fallbackImage = getStreamImage(item.stream, item.id);

              return (
                <div
                  key={item.id}
                  className="card card-hover border shadow-sm rounded-4 overflow-hidden"
                  style={{
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
                  }}
                >
                  <div className="row g-0 h-100">
                    
                    {/* Left Column: Cover / Logo Column */}
                    <div className="col-12 col-md-4 col-lg-3 d-flex align-items-center justify-content-center position-relative border-end" 
                         style={{ 
                           minHeight: "200px", 
                           background: collegeLogo ? "var(--bs-card-bg)" : "rgba(100,100,100,0.08)"
                         }}>
                      <img
                        src={collegeLogo ?? fallbackImage}
                        alt={stdCol}
                        className="w-100 h-100"
                        style={{
                          objectFit: collegeLogo ? "contain" : "cover",
                          padding: collegeLogo ? "24px" : "0",
                          boxSizing: "border-box",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = fallbackImage;
                          e.currentTarget.style.objectFit = "cover";
                          e.currentTarget.style.padding = "0";
                        }}
                      />
                      <div 
                        className="position-absolute bottom-0 start-0 m-3 px-2 py-1 rounded text-white text-uppercase fw-bold"
                        style={{ 
                          background: "rgba(0,0,0,0.65)", 
                          backdropFilter: "blur(4px)",
                          fontSize: "10px", 
                          fontFamily: "'Rajdhani', sans-serif",
                          letterSpacing: "0.08em" 
                        }}
                      >
                        {stdStream}
                      </div>
                    </div>

                    {/* Right Column: Card Details Column */}
                    <div className="col-12 col-md-8 col-lg-9 p-4 d-flex flex-column justify-content-between">
                      <div>
                        
                        {/* Level & Intake Badges */}
                        <div className="d-flex gap-2 flex-wrap mb-3">
                          <span 
                            className="text-uppercase fw-bold px-2 py-1 rounded-pill"
                            style={{
                              background: "rgba(251, 191, 36, 0.12)",
                              color: "#fbbf24",
                              fontSize: "9px",
                              fontFamily: "'Rajdhani', sans-serif",
                              letterSpacing: "0.12em"
                            }}
                          >
                            {stdLevel}
                          </span>
                          {item.Intake && (
                            <span 
                              className="text-uppercase fw-bold px-2 py-1 rounded-pill bg-secondary bg-opacity-10 text-secondary"
                              style={{
                                fontSize: "9px",
                                fontFamily: "'Rajdhani', sans-serif",
                                letterSpacing: "0.12em"
                              }}
                            >
                              Intake: {item.Intake}
                            </span>
                          )}
                        </div>

                        {/* Title & Organization Details */}
                        <h3 className="h5 fw-bold mb-2 text-body">{stdCourse}</h3>
                        
                        <div className="d-flex flex-wrap align-items-center gap-3 text-secondary mb-3">
                          <span className="d-flex align-items-center gap-1 small text-muted">
                            <iconify-icon icon="solar:home-angle-line-duotone" style={{ fontSize: "16px" }} />
                            {stdCol}
                          </span>
                          <span className="d-flex align-items-center gap-1 small text-muted">
                            <iconify-icon icon="solar:map-point-line-duotone" style={{ fontSize: "16px" }} />
                            {stdLoc}
                          </span>
                        </div>
                      </div>

                      {/* Card Footer row: Logo + Action */}
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-top pt-3 mt-3">
                        
                        {/* University Affiliation section */}
                        <div className="d-flex align-items-center gap-2">
                          {universityLogo ? (
                            <img
                              src={universityLogo}
                              alt={stdUni}
                              className="img-fluid rounded border p-1"
                              style={{ width: "32px", height: "32px", objectFit: "contain", background: "white" }}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <div 
                              className="rounded d-flex align-items-center justify-content-center fw-bold"
                              style={{ 
                                width: "32px", 
                                height: "32px", 
                                border: "1px solid var(--bs-border-color)",
                                background: "rgba(0, 140, 227, 0.1)", 
                                color: "#008ce3",
                                fontSize: "11px",
                                fontFamily: "'Rajdhani', sans-serif"
                              }}
                            >
                              {stdUni.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="lh-1">
                            <small className="text-uppercase text-muted d-block" style={{ fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em" }}>
                              Affiliated University
                            </small>
                            <span className="fw-bold small text-body">{stdUni}</span>
                          </div>
                        </div>

                        {/* CTA Button — opens the Apply Now modal instead of navigating away */}
                        <button
                          onClick={() => setApplyTarget({ university: stdUni, college: stdCol, course: stdCourse })}
                          className="btn btn-primary btn-sm d-flex align-items-center gap-2 px-3 py-2 text-uppercase fw-bold"
                          style={{
                            background: "#008ce3",
                            borderColor: "#008ce3",
                            fontFamily: "'Rajdhani', sans-serif",
                            fontSize: "12px",
                            letterSpacing: "0.05em",
                            transition: "all 0.2s"
                          }}
                        >
                          <span>Apply Now</span>
                          <iconify-icon icon="solar:arrow-right-linear" style={{ fontSize: "14px" }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Apply Now Modal — shown when a course card's Apply Now button is clicked */}
      {applyTarget && (
        <ApplyNowModal
          courseTarget={applyTarget}
          recentStudents={recentStudents}
          recentStudentsLoading={recentStudentsLoading}
          onRequestRefreshRecent={fetchRecentStudents}
          onClose={() => setApplyTarget(null)}
        />
      )}

      {/* CSS Rules */}
      <style>{`
        .card-hover:hover {
          border-color: #008ce3 !important;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.08) !important;
        }

        .custom-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}