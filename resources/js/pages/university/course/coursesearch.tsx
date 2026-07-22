import { useState, useEffect, useMemo, useRef, useCallback } from "react";

// ── Design Tokens (Matching Homepage Aesthetic) ───────────────────────────
const P = "#008ce3";         // Bright Sky Blue (Primary)
const AMBER = "#fbbf24";     // Warm Gold
const BG = "#F8FAFB";        // Light Neutral Background
const SURFACE = "#ffffff";   // Pure White
const BORDER = "#ffffff";    // Light border
const TEXT_MAIN = "#111827"; // Dark Charcoal
const TEXT_MUTED = "#4b5563"; // Muted Slate
const TEXT_LIGHT = "#9ca3af"; // Light Gray

const INITIAL_PAGE_SIZE = 200;
const NEXT_PAGE_SIZE = 40;
const SEARCH_DEBOUNCE_MS = 300;

// ── Helper to dynamically map stream to actual homepage assets ─────────────
// Computed once via a static rule table rather than a chain of .includes() calls per row.
const STREAM_IMAGE_RULES: [RegExp, string][] = [
  [/it|tech|comput|engin|science/, "/images/event_classroom.png"],
  [/buddhist|philosophy|culture|art/, "/images/nepal_temple.png"],
  [/manage|business|mba|admin/, "/images/cafe_student.png"],
  [/social|ngo|communit/, "/images/event_walking.png"],
];
const FALLBACK_POOL = ["/images/event_grad.png", "/images/students_hero.jpg"];

const getStreamImage = (stream: string | null | undefined, id: number): string => {
  const s = stream?.toLowerCase() || "";
  for (const [pattern, image] of STREAM_IMAGE_RULES) {
    if (pattern.test(s)) return image;
  }
  return FALLBACK_POOL[id % FALLBACK_POOL.length];
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
  n = n.replace(/[\uFFFD\u2013\u2014]/g, '-');
  n = n.replace(/\s*-\s*/g, ' - ');
  n = n.replace(/,\s*U\.?S\.?A\.?/gi, ' (USA)');
  n = n.replace(/,\s*U\.?K\.?/gi, ' (UK)');
  n = n.replace(/,\s*Australia/gi, ' (Australia)');
  n = n.replace(/\b([a-z])([A-Za-z]*)\b/g, (match, p1, p2) => p1.toUpperCase() + p2);
  return n.replace(/\s+/g, ' ').trim();
};

const standardizeCourse = (course: string | null | undefined): string => {
  if (!course) return "";
  let c = course.trim();
  c = c.replace(/[\uFFFD\u2013\u2014]/g, '-');
  c = c.replace(/\s*-\s*/g, ' - ');
  return c.replace(/\s+/g, ' ').trim();
};

// ── Icons ──────────────────────────────────────────────────────────────────
const SearchLargeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 24, top: "50%", transform: "translateY(-50%)" }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
    <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
    <line x1="7" y1="2" x2="7" y2="22" />
    <line x1="17" y1="2" x2="17" y2="22" />
    <line x1="2" y1="12" x2="22" y2="12" />
  </svg>
);

const FilterIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="spin-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round">
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

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
  course_detail_uuid?: string;
}

interface FilterOptions {
  levels: string[];
  streams: string[];
  courses: string[];
  universities: string[];
  colleges: string[];
  locations: string[];
}

const EMPTY_FILTER_OPTIONS: FilterOptions = {
  levels: [], streams: [], courses: [], universities: [], colleges: [], locations: [],
};

const validUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  if (trimmed === "") return null;
  return trimmed;
};

// ── Card Image with two-stage fallback (college logo → stream image → none) ─
// Tracks failure state locally so onError never loops and, once both the
// primary and fallback sources have failed, renders nothing (null) instead
// of a broken-image icon — the card's gray placeholder background shows through.
function CardImage({
  collegeLogo,
  fallbackImage,
  alt,
}: {
  collegeLogo: string | null;
  fallbackImage: string | null;
  alt: string;
}) {
  const [stage, setStage] = useState<"primary" | "fallback" | "none">(
    collegeLogo ? "primary" : fallbackImage ? "fallback" : "none"
  );

  // Reset stage if the underlying row data changes (e.g. after a re-fetch/filter change
  // reusing the same component instance via list virtualization edge cases)
  useEffect(() => {
    setStage(collegeLogo ? "primary" : fallbackImage ? "fallback" : "none");
  }, [collegeLogo, fallbackImage]);

  if (stage === "none") return null;

  const src = stage === "primary" ? collegeLogo! : fallbackImage!;
  const isPrimary = stage === "primary";

  return (
    <img
      src={src}
      alt={alt}
      style={{
        width: "100%",
        height: "100%",
        objectFit: isPrimary ? "contain" : "cover",
        padding: isPrimary ? "24px" : "0",
        transition: "transform 0.5s ease",
        boxSizing: "border-box",
      }}
      onMouseEnter={(e) => {
        if (!isPrimary) e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1.0)";
      }}
      onError={() => {
        if (stage === "primary" && fallbackImage) {
          setStage("fallback");
        } else {
          setStage("none"); // both primary and fallback failed — leave it null
        }
      }}
    />
  );
}

// ── Reusable Dropdown Component ────────────────────────────────────────────
function DropdownFilter({ label, options, selected, toggleOption }: { label: string, options: string[], selected: string[], toggleOption: (val: string) => void }) {
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
    <div ref={containerRef} style={{ position: "relative", textAlign: "left" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 18px",
          background: hasSelected ? P : "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(8px)",
          border: `1px solid ${hasSelected ? P : "rgba(255, 255, 255, 0.25)"}`,
          borderRadius: 999,
          fontSize: 13,
          fontWeight: 600,
          color: "#ffffff",
          fontFamily: "'Manrope', sans-serif",
          cursor: "pointer",
          transition: "all 0.2s ease",
          whiteSpace: "nowrap"
        }}
        onMouseEnter={(e) => {
          if (!hasSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.4)";
          }
        }}
        onMouseLeave={(e) => {
          if (!hasSelected) {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.25)";
          }
        }}
      >
        {label} {hasSelected && `(${selected.length})`}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          left: 0,
          width: 280,
          maxHeight: 300,
          overflowY: "auto",
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 12,
          boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
          zIndex: 50,
          padding: "8px"
        }} className="custom-scroll">
          {options.length === 0 ? (
            <div style={{ padding: "12px", fontSize: 13, color: TEXT_MUTED }}>No options available</div>
          ) : (
            options.map(opt => (
              <label key={opt} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 12px",
                cursor: "pointer",
                fontSize: 13,
                color: TEXT_MAIN,
                borderRadius: 8,
                transition: "background 0.2s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#F3F4F6"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  style={{ accentColor: P, width: 16, height: 16, cursor: "pointer", flexShrink: 0 }}
                />
                <span style={{ display: "block", lineHeight: 1.4 }}>{opt}</span>
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
  const [loading, setLoading] = useState(true);       // initial 200-row load
  const [loadingMore, setLoadingMore] = useState(false); // subsequent pages
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [rawSearch, setRawSearch] = useState("");   // what's in the input box
  const [search, setSearch] = useState("");          // debounced value actually sent to the API
  const [searchFocused, setSearchFocused] = useState(false);

  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // Debounce the search box → `search`
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // Fetch the dropdown facets once (cheap, cached server-side; independent of loaded rows)
  useEffect(() => {
    fetch("/api/university/filter-options", { headers: { Accept: "application/json" } })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!json) return;
        setFilterOptions({
          levels: (json.levels || []).map(standardizeLevel).filter(Boolean).sort(),
          streams: (json.streams || []).map(standardizeName).filter(Boolean).sort(),
          courses: (json.courses || []).map(standardizeCourse).filter(Boolean).sort(),
          universities: (json.universities || []).map(standardizeName).filter(Boolean).sort(),
          colleges: (json.colleges || []).map(standardizeName).filter(Boolean).sort(),
          locations: (json.locations || []).map(standardizeName).filter(Boolean).sort(),
        });
      })
      .catch(err => console.error("Failed to load filter options", err));
  }, []);

  const buildQueryParams = useCallback((limit: number, cursor?: string | null) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (cursor) params.set("cursor", cursor);
    if (search) params.set("search", search);
    selectedLevels.forEach(v => params.append("level[]", v));
    selectedStreams.forEach(v => params.append("stream[]", v));
    selectedCourses.forEach(v => params.append("course[]", v));
    selectedUniversities.forEach(v => params.append("university[]", v));
    selectedColleges.forEach(v => params.append("college[]", v));
    selectedLocations.forEach(v => params.append("location[]", v));
    return params;
  }, [search, selectedLevels, selectedStreams, selectedCourses, selectedUniversities, selectedColleges, selectedLocations]);

  // Initial load (200 rows) — reruns whenever search or any filter changes
  useEffect(() => {
    const myRequestId = ++requestIdRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setHasMore(true);
    setNextCursor(null);

    const params = buildQueryParams(INITIAL_PAGE_SIZE);

    fetch(`/api/university?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(json => {
        if (myRequestId !== requestIdRef.current) return; // stale response, a newer filter/search superseded it
        setData(json.data || []);
        setNextCursor(json.next_cursor ?? null);
        setHasMore(Boolean(json.has_more));
      })
      .catch(err => {
        if (err.name !== "AbortError") console.error("Failed to load records", err);
      })
      .finally(() => {
        if (myRequestId === requestIdRef.current) setLoading(false);
      });

    return () => controller.abort();
  }, [buildQueryParams]);

  // Load the next page (triggered by scrolling near the bottom)
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !nextCursor) return;

    const myRequestId = requestIdRef.current; // must match — bail if a filter/search change happened mid-flight
    setLoadingMore(true);

    const params = buildQueryParams(NEXT_PAGE_SIZE, nextCursor);

    fetch(`/api/university?${params.toString()}`, { headers: { Accept: "application/json" } })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(json => {
        if (myRequestId !== requestIdRef.current) return; // filters changed while this was in flight — discard
        setData(prev => [...prev, ...(json.data || [])]);
        setNextCursor(json.next_cursor ?? null);
        setHasMore(Boolean(json.has_more));
      })
      .catch(err => console.error("Failed to load more records", err))
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasMore, nextCursor, buildQueryParams]);

  // IntersectionObserver on a sentinel div at the bottom of the list
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" } // start fetching before the user hits the very bottom
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleClearFilters = () => {
    setSelectedLevels([]);
    setSelectedStreams([]);
    setSelectedCourses([]);
    setSelectedUniversities([]);
    setSelectedColleges([]);
    setSelectedLocations([]);
    setRawSearch("");
    setSearch("");
  };

  const toggleFilter = (list: string[], setList: (next: string[]) => void, value: string) => {
    if (list.includes(value)) {
      setList(list.filter(v => v !== value));
    } else {
      setList([...list, value]);
    }
  };

  const hasActiveFilters = selectedLevels.length > 0 || selectedStreams.length > 0 || selectedCourses.length > 0 || selectedUniversities.length > 0 || selectedColleges.length > 0 || selectedLocations.length > 0;

  // Standardize once per row for display — data already arrives pre-filtered from the server.
  // Logo validation and the stream-image fallback are also resolved here, once per row per
  // data change, instead of being recomputed inline during every render/hover.
  const displayRows = useMemo(() => data.map(item => {
    const collegeLogo = validUrl(item.college_logo_url);
    const universityLogo = validUrl(item.university_logo_url);
    return {
      item,
      stdLevel: standardizeLevel(item.level),
      stdUni: standardizeName(item.University),
      stdCol: standardizeName(item.College),
      stdLoc: standardizeName(item.Location),
      stdStream: standardizeName(item.stream),
      stdCourse: standardizeCourse(item.Course),
      collegeLogo,
      universityLogo,
      // Only relevant as a fallback when there's no college logo to try first.
      fallbackImage: collegeLogo ? null : getStreamImage(item.stream, item.id),
    };
  }), [data]);

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT_MAIN, fontFamily: "'Manrope', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── VISUAL HERO BANNER ─────────────────────────────────────────────── */}
      <div style={{
        padding: "110px 24px 80px",
        textAlign: "center",
        position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", zIndex: 0 }}>
          <video autoPlay muted loop playsInline poster="/students_hero.jpg" style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover" }}>
            <source src="https://admin.studyinnepal.com/storage/videos/d47e6ef1-9380-4968-b9b3-5b0b3a9a6e81.mp4" type="video/mp4" />
          </video>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0,0,0,0.5))" }} />
        </div>

        <div style={{ maxWidth: 1040, margin: "0 auto", position: "relative", zIndex: 5 }}>
          <p style={{ fontFamily: "'Rajdhani', sans-serif", color: AMBER, fontSize: 11, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", margin: "0 0 16px", textShadow: "0 2px 4px rgba(0,0,0,0.4)" }}>
            Explore Academic Fields
          </p>
          <h1 style={{ fontFamily: "'Castoro Titling', serif", color: SURFACE, fontSize: "calc(26px + 2.2vw)", fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 24px", lineHeight: 1.15, textShadow: "0 4px 12px rgba(0,0,0,0.5)" }}>
            Discover <span style={{ color: P }}>Your Pathway</span> in Nepal
          </h1>

          <div style={{ position: "relative", maxWidth: 640, margin: "0 auto 24px" }}>
            <SearchLargeIcon />
            <input
              type="text"
              placeholder="Search by course, stream, college, or keyword..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{ width: "100%", boxSizing: "border-box", background: SURFACE, border: `1.5px solid ${searchFocused ? P : "transparent"}`, borderRadius: 999, padding: "16px 24px 16px 54px", fontSize: 15, color: TEXT_MAIN, outline: "none", boxShadow: searchFocused ? `0 12px 30px rgba(0, 140, 227, 0.2)` : "0 8px 30px rgba(0,0,0,0.2)", transition: "all 0.3s ease" }}
            />
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.85)", fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.1em", marginRight: 4, textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
              <FilterIcon /> Filters
            </div>
            <DropdownFilter label="Academic Level" options={filterOptions.levels} selected={selectedLevels} toggleOption={(v) => toggleFilter(selectedLevels, setSelectedLevels, v)} />
            <DropdownFilter label="Stream / Field" options={filterOptions.streams} selected={selectedStreams} toggleOption={(v) => toggleFilter(selectedStreams, setSelectedStreams, v)} />
            <DropdownFilter label="Course" options={filterOptions.courses} selected={selectedCourses} toggleOption={(v) => toggleFilter(selectedCourses, setSelectedCourses, v)} />
            <DropdownFilter label="Universities" options={filterOptions.universities} selected={selectedUniversities} toggleOption={(v) => toggleFilter(selectedUniversities, setSelectedUniversities, v)} />
            <DropdownFilter label="Colleges" options={filterOptions.colleges} selected={selectedColleges} toggleOption={(v) => toggleFilter(selectedColleges, setSelectedColleges, v)} />
            <DropdownFilter label="Location" options={filterOptions.locations} selected={selectedLocations} toggleOption={(v) => toggleFilter(selectedLocations, setSelectedLocations, v)} />

            {hasActiveFilters && (
              <button onClick={handleClearFilters} style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#fca5a5", backdropFilter: "blur(4px)", fontSize: 12, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em", padding: "10px 18px", borderRadius: 999, transition: "all 0.2s" }}>
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 24px 96px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 15, color: TEXT_MUTED }}>
            {loading ? "Loading programs…" : (
              <>Showing <strong style={{ color: TEXT_MAIN }}>{data.length}</strong>{hasMore ? "+" : ""} programs available</>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 64, textAlign: "center", color: TEXT_MUTED, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <SpinnerIcon />
            Loading programs…
          </div>
        ) : displayRows.length === 0 ? (
          <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: 64, textAlign: "center", color: TEXT_MUTED }}>
            No matches found. Try adjusting your filter terms or keywords.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {displayRows.map(({ item, stdLevel, stdUni, stdCol, stdLoc, stdStream, stdCourse, collegeLogo, universityLogo, fallbackImage }) => {
                const uuid = item.course_detail_uuid;
                const uniRoute = uuid ? `/courses/${uuid}` : "#";

                return (
                  <div
                    key={item.id}
                    className="course-card-element"
                    style={{
                      background: SURFACE,
                      border: `1.5px solid ${BORDER}`,
                      borderRadius: 16,
                      display: "flex",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.02)"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = P;
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 14px 30px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = BORDER;
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.02)";
                    }}
                  >
                    {/* Left Column: Image (Now Clickable) */}
                    <a href={uniRoute} className="card-image-col" style={{
                      textDecoration: "none",
                      color: "inherit",
                      width: 240,
                      position: "relative",
                      overflow: "hidden",
                      flexShrink: 0,
                      background: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRight: `1px solid ${BORDER}`
                    }}>
                      <CardImage collegeLogo={collegeLogo} fallbackImage={fallbackImage} alt={stdCol} />
                      <div style={{ position: "absolute", bottom: 12, left: 12, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(4px)", color: "#ffffff", fontSize: 10, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", padding: "4px 8px", borderRadius: 4, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                        {stdStream}
                      </div>
                    </a>

                    {/* Right Column: Content */}
                    <div style={{ padding: "28px 24px", flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

                      {/* Top Content (Now Clickable and takes up available space) */}
                      <a href={uniRoute} style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
                        {/* Tags */}
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          <span style={{ background: `${AMBER}12`, color: AMBER, border: `1px solid ${AMBER}33`, fontSize: 9, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase" }}>
                            {stdLevel}
                          </span>
                          {item.Intake && (
                            <span style={{ background: "#F3F4F6", color: TEXT_MUTED, border: `1px solid #E5E7EB`, fontSize: 9, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 999, textTransform: "uppercase" }}>
                              Intake: {item.Intake}
                            </span>
                          )}
                        </div>

                        {/* Title & Meta */}
                        <div>
                          <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT_MAIN, margin: "0 0 6px", fontFamily: "'Manrope', sans-serif" }}>
                            {stdCourse}
                          </h2>
                          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16, fontSize: 13, color: TEXT_MUTED }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <BuildingIcon />
                              {stdCol}
                            </span>
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <LocationIcon />
                              {stdLoc}
                            </span>
                          </div>
                        </div>
                      </a>

                      {/* Footer Row: Uni & Button */}
                      <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, marginTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>

                        {/* Uni info (Now Clickable) */}
                        <a href={uniRoute} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                          {universityLogo ? (
                            <img
                              src={universityLogo}
                              alt={stdUni}
                              style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 6, border: `1px solid ${BORDER}`, background: "#ffffff", padding: 3, flexShrink: 0, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
                              onError={(e) => { e.currentTarget.style.display = "none"; }}
                            />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${BORDER}`, background: `${P}12`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: P, fontFamily: "'Rajdhani', sans-serif" }}>
                              {stdUni.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: TEXT_LIGHT, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                              Affiliated University
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: TEXT_MAIN, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={stdUni}>
                              {stdUni}
                            </span>
                          </div>
                        </a>

                        {/* Inquire Button (Independent Link) */}
                        <a href={`/student-inquiry`} style={{ textDecoration: 'none' }}>
                          <button
                            style={{ background: P, color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", transition: "all 0.2s ease", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#0072b8";
                              e.currentTarget.style.transform = "scale(1.02)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = P;
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                          >
                            Inquire Now
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="5" y1="12" x2="19" y2="12"></line>
                              <polyline points="12 5 19 12 12 19"></polyline>
                            </svg>
                          </button>
                        </a>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sentinel for infinite scroll + spinner while fetching the next batch */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "32px 0", color: TEXT_MUTED, fontSize: 14 }}>
                <SpinnerIcon />
                Loading more programs…
              </div>
            )}
            {!hasMore && data.length > 0 && (
              <div style={{ textAlign: "center", padding: "32px 0", color: TEXT_LIGHT, fontSize: 13 }}>
                You've reached the end — {data.length} programs shown.
              </div>
            )}
          </>
        )}
      </div>

      <style>{`
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

        .spin-icon {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .course-card-element {
            flex-direction: column !important;
          }
          .card-image-col {
            width: 100% !important;
            height: 200px !important;
            border-right: none !important;
            border-bottom: 1px solid #e5e7eb;
          }
        }
      `}</style>
    </div>
  );
}