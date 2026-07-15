import { useState, useEffect, useMemo, useRef } from "react";

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

// ── Data Standardization & Sanitization Helpers ────────────────────────────
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
  n = n.replace(/[\uFFFD\u2013\u2014]/g, '-'); // Fix missing/corrupted symbol character
  n = n.replace(/\s*-\s*/g, ' - '); // Clean spacing around hyphen
  n = n.replace(/,\s*U\.?S\.?A\.?/gi, ' (USA)');
  n = n.replace(/,\s*U\.?K\.?/gi, ' (UK)');
  n = n.replace(/,\s*Australia/gi, ' (Australia)');
  n = n.replace(/\b([a-z])([A-Za-z]*)\b/g, (match, p1, p2) => p1.toUpperCase() + p2);
  return n.replace(/\s+/g, ' ').trim();
};

// Cleans common typos and standardizes stream names for the UI and filtering
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
  c = c.replace(/[\uFFFD\u2013\u2014]/g, '-'); // Fix missing/corrupted character
  c = c.replace(/\s*-\s*/g, ' - '); // Spacing around hyphen
  return c.replace(/\s+/g, ' ').trim();
};

// ── Shared Types ───────────────────────────────────────────────────────────
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

const validUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  return trimmed;
};

// ── Reusable Dropdown Filter (Bootstrap, theme-aware) ───────────────────────
function DropdownFilter({ label, icon, options, selected, toggleOption }: { label: string, icon: string, options: string[], selected: string[], toggleOption: (val: string) => void }) {
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
    <div ref={containerRef} className="dropdown position-relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-sm rounded-pill d-flex align-items-center gap-2 px-3 py-2 fw-semibold ${hasSelected ? "btn-primary" : "btn-outline-light"}`}
      >
        <iconify-icon icon={icon} className="fs-6" />
        {label} {hasSelected && `(${selected.length})`}
        <iconify-icon
          icon="solar:alt-arrow-down-line-duotone"
          className="fs-6"
          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
        />
      </button>

      {isOpen && (
        <div
          className="dropdown-menu show shadow-lg p-2 mt-2 sidebar-nav-scroll"
          style={{ minWidth: 280, maxHeight: 300, overflowY: "auto" }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-body-secondary fs-3">No options available</div>
          ) : (
            options.map(opt => (
              <label key={opt} className="dropdown-item d-flex align-items-center gap-2 rounded py-2" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  className="form-check-input mt-0 flex-shrink-0"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                />
                <span className="lh-sm">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────
export default function CourseSearch() {
  const [data, setData] = useState<UniversityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter states
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchUniversities();
  }, []);

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

  // ── DYNAMIC FILTERING LOGIC ──
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
    <div className="course-search-scope bg-body text-body">
      {/* ── VISUAL HERO BANNER (With embedded filters) ─────────────────────── */}
      <div className="position-relative text-center px-3" style={{ padding: "110px 24px 80px" }}>
        {/* Background Layer */}
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
          <div className="position-absolute top-0 start-0 end-0 bottom-0" style={{ background: "linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.5))" }} />
        </div>

        {/* Hero Content Layer */}
        <div className="position-relative mx-auto" style={{ maxWidth: 1040, zIndex: 5 }}>
          <p className="text-warning fw-bold text-uppercase mb-2" style={{ fontSize: 11, letterSpacing: "0.28em" }}>
            Explore Academic Fields
          </p>
          <h1 className="text-white fw-normal text-uppercase mb-4" style={{ fontSize: "calc(26px + 2.2vw)", letterSpacing: "0.06em", lineHeight: 1.15 }}>
            Discover <span className="text-primary">Your Pathway</span> in Nepal
          </h1>
          <p className="text-white-50 mx-auto mb-4" style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>
            Search registered universities, streams, specialized colleges, and find the perfect program that meets your academic goals.
          </p>

          {/* Search Bar */}
          <div className="position-relative mx-auto mb-4" style={{ maxWidth: 640 }}>
            <iconify-icon
              icon="solar:magnifer-line-duotone"
              className="position-absolute top-50 translate-middle-y text-primary fs-5"
              style={{ left: 24 }}
            />
            <input
              type="text"
              placeholder="Search by course, stream, college, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control form-control-lg rounded-pill shadow"
              style={{ paddingLeft: 54 }}
            />
          </div>

          {/* Horizontal Filters Section */}
          <div className="d-flex flex-wrap align-items-center justify-content-center gap-2 pt-2">
            <div className="d-flex align-items-center fw-bold text-uppercase text-white-50 me-1" style={{ fontSize: 13, letterSpacing: "0.1em" }}>
              <iconify-icon icon="solar:filter-line-duotone" className="fs-6 me-1" />
              Filters
            </div>

            <DropdownFilter label="Academic Level" icon="solar:diploma-verified-line-duotone" options={filterOptions.levels} selected={selectedLevels} toggleOption={(v) => toggleFilter(selectedLevels, setSelectedLevels, v)} />
            <DropdownFilter label="Stream / Field" icon="solar:widget-4-line-duotone" options={filterOptions.streams} selected={selectedStreams} toggleOption={(v) => toggleFilter(selectedStreams, setSelectedStreams, v)} />
            <DropdownFilter label="Course" icon="solar:book-line-duotone" options={filterOptions.courses} selected={selectedCourses} toggleOption={(v) => toggleFilter(selectedCourses, setSelectedCourses, v)} />
            <DropdownFilter label="Universities" icon="solar:library-line-duotone" options={filterOptions.universities} selected={selectedUniversities} toggleOption={(v) => toggleFilter(selectedUniversities, setSelectedUniversities, v)} />
            <DropdownFilter label="Colleges" icon="solar:buildings-2-line-duotone" options={filterOptions.colleges} selected={selectedColleges} toggleOption={(v) => toggleFilter(selectedColleges, setSelectedColleges, v)} />
            <DropdownFilter label="Location" icon="solar:map-point-line-duotone" options={filterOptions.locations} selected={selectedLocations} toggleOption={(v) => toggleFilter(selectedLocations, setSelectedLocations, v)} />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn btn-sm btn-outline-danger rounded-pill fw-bold text-uppercase px-3 py-2"
                style={{ fontSize: 12, letterSpacing: "0.05em" }}
              >
                <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="fs-6 me-1" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="mx-auto" style={{ maxWidth: 1040, padding: "40px 24px 96px" }}>

        {/* Results Info Bar */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div className="text-body-secondary" style={{ fontSize: 15 }}>
            Showing <strong className="text-body">{filteredData.length}</strong> programs available
          </div>
        </div>

        {/* ── COURSE CARDS (SINGLE COLUMN) ── */}
        {loading ? (
          <div className="bg-body-tertiary border rounded-4 text-center text-body-secondary py-5">
            <iconify-icon icon="solar:refresh-line-duotone" className="fs-3 mb-2 d-block" />
            Searching directory listings...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-body-tertiary border rounded-4 text-center text-body-secondary py-5">
            <iconify-icon icon="solar:file-remove-line-duotone" className="fs-3 mb-2 d-block" />
            No matches found. Try adjusting your filter terms or keywords.
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
                <div key={item.id} className="course-card-element card flex-row overflow-hidden shadow-sm">
                  {/* Left Column: Image */}
                  <div
                    className={`card-image-col position-relative flex-shrink-0 d-flex align-items-center justify-content-center border-end ${collegeLogo ? "bg-white" : "bg-body-tertiary"}`}
                    style={{ width: 240 }}
                  >
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
                    <span
                      className="position-absolute bg-dark bg-opacity-75 text-white fw-bold text-uppercase rounded px-2 py-1"
                      style={{ bottom: 12, left: 12, fontSize: 10, letterSpacing: "0.08em" }}
                    >
                      {stdStream}
                    </span>
                  </div>

                  {/* Right Column: Content */}
                  <div className="card-body d-flex flex-column justify-content-between px-4 py-4" style={{ minWidth: 0 }}>
                    <div className="d-flex flex-column gap-2">
                      {/* Tags */}
                      <div className="d-flex gap-2 flex-wrap">
                        <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill text-uppercase fw-bold" style={{ fontSize: 9, letterSpacing: "0.12em" }}>
                          {stdLevel}
                        </span>
                        {item.Intake && (
                          <span className="badge bg-body-secondary text-body-secondary border rounded-pill text-uppercase fw-bold" style={{ fontSize: 9, letterSpacing: "0.12em" }}>
                            Intake: {item.Intake}
                          </span>
                        )}
                      </div>

                      {/* Title & Meta */}
                      <div>
                        <h2 className="fs-5 fw-bold mb-1">{stdCourse}</h2>
                        <div className="d-flex flex-wrap align-items-center gap-3 text-body-secondary" style={{ fontSize: 13 }}>
                          <span className="d-flex align-items-center gap-1">
                            <iconify-icon icon="solar:buildings-2-line-duotone" />
                            {stdCol}
                          </span>
                          <span className="d-flex align-items-center gap-1">
                            <iconify-icon icon="solar:map-point-line-duotone" />
                            {stdLoc}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Uni & Button */}
                    <div className="d-flex align-items-center justify-content-between gap-2 border-top pt-3 mt-3">
                      <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                        {universityLogo ? (
                          <img
                            src={universityLogo}
                            alt={stdUni}
                            className="rounded border bg-white flex-shrink-0 shadow-sm"
                            style={{ width: 32, height: 32, objectFit: "contain", padding: 3 }}
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div
                            className="rounded border bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold flex-shrink-0"
                            style={{ width: 32, height: 32, fontSize: 11 }}
                          >
                            {stdUni.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="d-flex flex-column" style={{ minWidth: 0 }}>
                          <span className="text-body-secondary text-uppercase fw-semibold" style={{ fontSize: 10, letterSpacing: "0.06em" }}>
                            Affiliated University
                          </span>
                          <span className="fw-bold text-truncate" style={{ fontSize: 13 }} title={stdUni}>
                            {stdUni}
                          </span>
                        </div>
                      </div>

                      <a href="/student-inquiry" className="text-decoration-none flex-shrink-0">
                        <button type="button" className="btn btn-primary btn-sm d-flex align-items-center gap-1 text-uppercase fw-bold" style={{ fontSize: 12, letterSpacing: "0.05em" }}>
                          Inquire Now
                          <iconify-icon icon="solar:arrow-right-line-duotone" />
                        </button>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Scoped layout-only CSS (colors/theme all come from Bootstrap) */}
      <style>{`
        .course-search-scope .sidebar-nav-scroll {
          scrollbar-width: thin;
        }
        .course-search-scope .sidebar-nav-scroll::-webkit-scrollbar {
          width: 5px;
        }
        .course-search-scope .sidebar-nav-scroll::-webkit-scrollbar-thumb {
          background: var(--bs-border-color);
          border-radius: 10px;
        }

        .course-search-scope .course-card-element {
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .course-search-scope .course-card-element:hover {
          transform: translateY(-2px);
          border-color: var(--bs-primary) !important;
          box-shadow: 0 14px 30px rgba(0,0,0,0.12) !important;
        }

        @media (max-width: 768px) {
          .course-search-scope .course-card-element {
            flex-direction: column !important;
          }
          .course-search-scope .card-image-col {
            width: 100% !important;
            height: 200px !important;
            border-right: none !important;
            border-bottom: 1px solid var(--bs-border-color);
          }
        }
      `}</style>
    </div>
  );
}