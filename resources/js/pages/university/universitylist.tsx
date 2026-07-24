import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import type { CSSProperties } from "react";

// ── Shared Theme Constants (Updated for Light Mode) ─────────────────────────
const P = "#008ce3";         // Primary Blue
const AMBER = "#d97706";     // Darker amber for light mode contrast
const BG = "#f8fafc";        // Light slate background
const SURFACE = "#ffffff";   // White cards/panels
const SURFACE2 = "#f1f5f9";  // Light grey for inputs/secondary areas
const SURFACE3 = "#ffffff";  // White for popovers
const BORDER = "#e2e8f0";    // Light grey border
const TEXT = "#0f172a";      // Dark slate text
const TEXT2 = "#475569";     // Muted slate text
const TEXT3 = "#94a3b8";     // Lightest text (placeholders, icons)
const DANGER = "#ef4444";    // Red
const SUCCESS = "#16a34a";   // Green

const INITIAL_PAGE_SIZE = 100;
const NEXT_PAGE_SIZE = 40;
const SEARCH_DEBOUNCE_MS = 300;

// ── Database Schema Mapping ──────────────────────────────────────────────────
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
  created_at: string;
  updated_at: string;
}

// A grouped "university" card — one per distinct University name, aggregating
// every row (across colleges/courses/levels) that shares that name.
interface UniversityGroup {
  name: string;
  logoUrl: string | null;
  levels: string[];       // distinct level values under this university, in first-seen order
  collegeCount: number;
  courseCount: number;
  sampleId: number;       // an id belonging to this group, used as a fallback route target
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

// ── Base Styles ──────────────────────────────────────────────────────────────
const inputBase = (focused: boolean): CSSProperties => ({
  width: "100%", boxSizing: "border-box",
  background: focused ? "#ffffff" : SURFACE2,
  border: `1px solid ${focused ? P : BORDER}`,
  borderRadius: 8, padding: "12px 14px 12px 38px",
  fontSize: 13, color: TEXT, fontFamily: "'Manrope', sans-serif",
  outline: "none", transition: "border-color .15s, background .15s",
  letterSpacing: "0.02em", colorScheme: "light",
});

const btnPrimary = (extra: CSSProperties = {}): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 26px", borderRadius: 999,
  background: P, border: "none", color: "#ffffff", 
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
  fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
  cursor: "pointer", transition: "opacity 0.2s", ...extra,
});

const btnDanger = (extra: CSSProperties = {}): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 26px", borderRadius: 999,
  background: DANGER, border: "none", color: "#ffffff", 
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
  fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
  cursor: "pointer", transition: "opacity 0.2s", ...extra,
});

const btnGhost: CSSProperties = {
  padding: "11px 22px", borderRadius: 999, background: "transparent",
  border: `1px solid ${BORDER}`, color: TEXT2,
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
  fontSize: 12, letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer",
};

// ── Shared Layout Utilities ──────────────────────────────────────────────────
const headerTextStyle: CSSProperties = {
  fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
  letterSpacing: "0.18em", textTransform: "uppercase", color: TEXT3,
};

const truncateStyle: CSSProperties = {
  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%",
};

// ── Icons ────────────────────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

const ExportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const ImportIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const SpinnerIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={P} strokeWidth="2.5" strokeLinecap="round" style={{ animation: "spin 0.8s linear infinite" }}>
    <path d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform .2s" }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={TEXT3} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" />
    <path d="M5 21V7l7-4 7 4v14" />
    <path d="M9 9h1M14 9h1M9 13h1M14 13h1M9 17h1M14 17h1" />
  </svg>
);

// ── Dropdown Popover Component (Multi-Select) ──────────────────────────────
interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

function MultiSelectDropdown({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  return (
    <div style={{ position: "relative", flex: 1, minWidth: "160px" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: SURFACE2,
          border: `1px solid ${selected.length > 0 ? P : BORDER}`,
          borderRadius: 6, padding: "10px 14px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          fontSize: 12, color: selected.length > 0 ? TEXT : TEXT2,
          fontFamily: "'Manrope', sans-serif", cursor: "pointer", outline: "none"
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
          {selected.length === 0 ? `All ${label}` : `${selected.length} ${label}`}
        </span>
        <span style={{ fontSize: 10, color: selected.length > 0 ? P : TEXT3 }}>▾</span>
      </button>

      {open && (
        <>
          <div 
            onClick={() => setOpen(false)} 
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
          />
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
            background: SURFACE3, border: `1px solid ${BORDER}`, borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.08)", padding: 12, zIndex: 999,
            maxHeight: 220, overflowY: "auto"
          }}>
            {options.length === 0 ? (
              <div style={{ fontSize: 11, color: TEXT3, textAlign: "center", padding: "8px 0" }}>No options available</div>
            ) : (
              options.map(option => {
                const isChecked = selected.includes(option);
                return (
                  <label key={option} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
                    borderRadius: 4, cursor: "pointer", transition: "background 0.15s",
                    fontSize: 12, color: isChecked ? TEXT : TEXT2, fontFamily: "'Manrope', sans-serif",
                    userSelect: "none"
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f1f5f9"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(option)}
                      style={{ accentColor: P, width: 14, height: 14, cursor: "pointer" }}
                    />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{option}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ── Small UI Elements ────────────────────────────────────────────────────────
function StatusPill({ label, color = P, onClick }: { label: string; color?: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
        background: `${color}18`, border: `1px solid ${color}33`,
        color: color, fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
        fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
        cursor: onClick ? "pointer" : "default", transition: "background .15s, transform .1s",
      }}
      onMouseEnter={onClick ? (e) => { e.currentTarget.style.background = `${color}2a`; } : undefined}
      onMouseLeave={onClick ? (e) => { e.currentTarget.style.background = `${color}18`; } : undefined}
    >
      {label}
      {onClick && <span style={{ fontSize: 12 }}>→</span>}
    </span>
  );
}

function UniversityLogo({ url, size = 48 }: { url: string | null; size?: number }) {
  const [errored, setErrored] = useState(false);
  const showFallback = !url || errored;

  return (
    <div style={{
      width: size, height: size, borderRadius: 10, flexShrink: 0,
      background: showFallback ? SURFACE2 : "#ffffff",
      border: `1px solid ${BORDER}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden",
    }}>
      {showFallback ? (
        <BuildingIcon />
      ) : (
        <img
          src={url}
          alt=""
          onError={() => setErrored(true)}
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 4, boxSizing: "border-box" }}
        />
      )}
    </div>
  );
}

// ── Main Index Page ──────────────────────────────────────────────────────────
export default function UniversityIndex() {
  // Pagination & Data states
  const [data, setData] = useState<UniversityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Used to force refresh after imports

  // Search states
  const [rawSearch, setRawSearch] = useState("");
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Filters state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTER_OPTIONS);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Which university group (by name) is currently expanded to show its level pills
  const [expandedUniversity, setExpandedUniversity] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  // 1. Debounce the search input
  useEffect(() => {
    const t = setTimeout(() => setSearch(rawSearch), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [rawSearch]);

  // 2. Fetch Base Filter Options once on mount
  useEffect(() => {
    fetch("/api/university/filter-options", { headers: { Accept: "application/json" } })
      .then(res => (res.ok ? res.json() : null))
      .then(json => {
        if (!json) return;
        setFilterOptions({
          levels: json.levels || [],
          streams: json.streams || [],
          courses: json.courses || [],
          universities: json.universities || [],
          colleges: json.colleges || [],
          locations: json.locations || [],
        });
      })
      .catch(err => console.error("Failed to load filter options", err));
  }, []);

  // Query Builder helper
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

  // 3. Initial Load & Reaction to filter/search changes
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
        if (myRequestId !== requestIdRef.current) return;
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
  }, [buildQueryParams, refreshKey]);

  // 4. Load More (Pagination logic via Scroll)
  const loadMore = useCallback(() => {
    if (loading || loadingMore || !hasMore || !nextCursor) return;

    const myRequestId = requestIdRef.current; 
    setLoadingMore(true);

    const params = buildQueryParams(NEXT_PAGE_SIZE, nextCursor);

    fetch(`/api/university?${params.toString()}`, { headers: { Accept: "application/json" } })
      .then(res => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
      .then(json => {
        if (myRequestId !== requestIdRef.current) return; 
        setData(prev => [...prev, ...(json.data || [])]);
        setNextCursor(json.next_cursor ?? null);
        setHasMore(Boolean(json.has_more));
      })
      .catch(err => console.error("Failed to load more records", err))
      .finally(() => setLoadingMore(false));
  }, [loading, loadingMore, hasMore, nextCursor, buildQueryParams]);

  // IntersectionObserver on Sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" } 
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  // ── Group flat rows into one card per University name ─────────────────────
  const universityGroups = useMemo<UniversityGroup[]>(() => {
    const map = new Map<string, UniversityGroup>();

    for (const row of data) {
      const key = row.University || "Unnamed University";
      let group = map.get(key);
      if (!group) {
        group = {
          name: key,
          logoUrl: row.university_logo_url || null,
          levels: [],
          collegeCount: 0,
          courseCount: 0,
          sampleId: row.id,
        };
        map.set(key, group);
      }
      // Prefer the first non-empty logo url encountered
      if (!group.logoUrl && row.university_logo_url) group.logoUrl = row.university_logo_url;
      if (row.level && !group.levels.includes(row.level)) group.levels.push(row.level);
      group.courseCount += 1;
    }

    // Compute distinct college counts per group
    const collegeSets = new Map<string, Set<string>>();
    for (const row of data) {
      const key = row.University || "Unnamed University";
      if (!collegeSets.has(key)) collegeSets.set(key, new Set());
      collegeSets.get(key)!.add(row.College || "");
    }
    for (const [key, group] of map.entries()) {
      group.collegeCount = collegeSets.get(key)?.size ?? 0;
    }

    return Array.from(map.values());
  }, [data]);

  // Helpers / Handlers
  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => { setToast(null); }, 4000);
  };

  const executeDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/universities/${id}`, {
        method: "DELETE",
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const responseData = await res.json();
      
      if (res.ok && responseData.success) {
        setData(prev => prev.filter(item => item.id !== id));
        triggerToast(responseData.message || "Record successfully deleted.", "success");
      } else {
        triggerToast(responseData.message || "Failed to delete entry.", "error");
      }
    } catch (err) {
      triggerToast("Network error. Unable to process deletion.", "error");
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleExport = () => {
    window.location.href = "/api/university/export";
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/university/import", {
        method: "POST",
        body: formData,
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });
      const result = await res.json();

      if (res.ok && result.success) {
        triggerToast(result.message, "success");
        setRefreshKey(prev => prev + 1); // Trigger refresh
      } else {
        triggerToast(result.message || "Failed to import CSV dataset.", "error");
      }
    } catch (err) {
      triggerToast("Network error during file import.", "error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleClearAll = () => {
    setSelectedUniversities([]);
    setSelectedColleges([]);
    setSelectedLocations([]);
    setSelectedCourses([]);
    setSelectedLevels([]);
    setSelectedStreams([]);
    setRawSearch("");
    setSearch("");
  };

  // Navigate to the edit form for a university, scoped to one level.
  // Registered route is Route::inertia('/universities/{id}', 'university/universityedit')
  // — there is no "/edit" suffix, so we must not append one.
  const goToLevelEdit = (group: UniversityGroup, level: string) => {
    const params = new URLSearchParams();
    params.set("level", level);
    window.location.href = `/universities/${group.sampleId}?${params.toString()}`;
  };

  const targetItemToDelete = useMemo(() => {
    return data.find(item => item.id === deleteTargetId);
  }, [deleteTargetId, data]);

  const filtersActive = selectedUniversities.length > 0 || selectedColleges.length > 0 || selectedLocations.length > 0 || selectedCourses.length > 0 || selectedLevels.length > 0 || selectedStreams.length > 0;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Manrope', sans-serif", paddingBottom: 64, position: "relative" }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes expandDown { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 300px; } }
      `}</style>
      <link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@600;700&family=Manrope:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Hidden File Input for CSV Import */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".csv, .xlsx, .xls"
        style={{ display: "none" }} 
      />

      {/* Header */}
      <div style={{ padding: "48px 48px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${P}12`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: P, margin: "0 0 14px" }}>
              University Management — Directory
            </p>
            <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: 40, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT, margin: "0 0 12px", lineHeight: 1.15 }}>
              Registered <span style={{ color: P }}>Universities</span>
            </h1>
            <p style={{ fontSize: 13, color: TEXT2, maxWidth: 560, lineHeight: 1.7, margin: 0 }}>
              Manage all uploaded university programs, streams, and fee structures from the database.
            </p>
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button style={btnGhost} onClick={handleExport} title="Export CSV Data">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ExportIcon />
                <span>Export</span>
              </div>
            </button>
            <button style={btnGhost} onClick={handleImportClick} title="Import CSV Data">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ImportIcon />
                <span>Import</span>
              </div>
            </button>
            <button style={btnPrimary()} onClick={() => window.location.href = '/universities'}>
              <PlusIcon /> Add New Entry
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "36px 48px" }}>
        
        {/* Top toolbar */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "16px", alignItems: "center" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <SearchIcon />
            <input 
              type="text" 
              placeholder="Fuzzy search by keyword (University, Course, Location, College)..."
              value={rawSearch}
              onChange={(e) => setRawSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={inputBase(searchFocused)}
            />
          </div>

          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "13px 20px", borderRadius: 8,
              background: filtersOpen ? `${P}12` : SURFACE,
              border: `1px solid ${filtersOpen ? P : BORDER}`,
              color: filtersOpen ? P : TEXT,
              fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
              cursor: "pointer", transition: "all .15s"
            }}
          >
            <FilterIcon /> 
            <span>{filtersOpen ? "Hide Filters" : "Filter Options"}</span>
            {filtersActive && <span style={{ width: 6, height: 6, borderRadius: "50%", background: P }} />}
          </button>
        </div>

        {/* Collapsible Filters Panel */}
        {filtersOpen && (
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: "24px", marginBottom: "24px", animation: "fadeIn 0.2s ease-out"
          }}>
            <p style={{
              fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT3, marginBottom: 16
            }}>
              Multi-Select Directory Filters
            </p>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <MultiSelectDropdown 
                label="Universities" 
                options={filterOptions.universities} 
                selected={selectedUniversities} 
                onChange={setSelectedUniversities} 
              />
              <MultiSelectDropdown 
                label="Colleges" 
                options={filterOptions.colleges} 
                selected={selectedColleges} 
                onChange={setSelectedColleges} 
              />
              <MultiSelectDropdown 
                label="Locations" 
                options={filterOptions.locations} 
                selected={selectedLocations} 
                onChange={setSelectedLocations} 
              />
              <MultiSelectDropdown 
                label="Courses" 
                options={filterOptions.courses} 
                selected={selectedCourses} 
                onChange={setSelectedCourses} 
              />
              <MultiSelectDropdown 
                label="Streams" 
                options={filterOptions.streams} 
                selected={selectedStreams} 
                onChange={setSelectedStreams} 
              />
              <MultiSelectDropdown 
                label="Levels" 
                options={filterOptions.levels} 
                selected={selectedLevels} 
                onChange={setSelectedLevels} 
              />
            </div>

            {/* Clear Filters Panel Action */}
            {(filtersActive || search || rawSearch) && (
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
                <button 
                  onClick={handleClearAll}
                  style={{
                    background: "transparent", border: `1px dashed ${DANGER}44`,
                    color: DANGER, padding: "8px 14px", borderRadius: 6,
                    fontFamily: "'Rajdhani', sans-serif", fontSize: 11, fontWeight: 700,
                    letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
                    transition: "background 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = `${DANGER}11`}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Directory Row Headers */}
        {universityGroups.length > 0 && !loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "24px",
            padding: "12px 28px",
            marginBottom: "8px",
          }}>
            <div style={headerTextStyle}>University</div>
            <div style={{ ...headerTextStyle, textAlign: "right" }}>Levels Offered</div>
          </div>
        )}

        {/* University Cards (grouped) */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "48px", color: TEXT3, fontSize: 13 }}>
              <SpinnerIcon />
              Loading directory records...
            </div>
          ) : universityGroups.length === 0 ? (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "48px", textAlign: "center", color: TEXT3, fontSize: 13 }}>
              No universities found matching your criteria.
            </div>
          ) : (
            universityGroups.map((group) => {
              const isExpanded = expandedUniversity === group.name;
              return (
                <div
                  key={group.name}
                  style={{
                    background: SURFACE,
                    border: `1px solid ${isExpanded ? P : BORDER}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Card header row — click to expand/collapse level pills */}
                  <div
                    onClick={() => setExpandedUniversity(isExpanded ? null : group.name)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: "24px", padding: "18px 28px", cursor: "pointer",
                      background: isExpanded ? `${P}08` : "transparent",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => { if (!isExpanded) e.currentTarget.style.background = SURFACE2; }}
                    onMouseLeave={(e) => { if (!isExpanded) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 16, minWidth: 0 }}>
                      <UniversityLogo url={group.logoUrl} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ ...truncateStyle, fontSize: 15, color: TEXT, fontWeight: 700, fontFamily: "'Manrope', sans-serif" }} title={group.name}>
                          {group.name}
                        </div>
                        <div style={{ fontSize: 11, color: TEXT3, marginTop: 2 }}>
                          {group.collegeCount} college{group.collegeCount !== 1 ? "s" : ""} • {group.courseCount} course{group.courseCount !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {group.levels.length === 0 ? (
                          <span style={{ fontSize: 11, color: TEXT3 }}>No level set</span>
                        ) : (
                          group.levels.map(lvl => (
                            <StatusPill key={lvl} label={lvl} color={AMBER} />
                          ))
                        )}
                      </div>
                      <span style={{ color: isExpanded ? P : TEXT3 }}>
                        <ChevronIcon open={isExpanded} />
                      </span>
                    </div>
                  </div>

                  {/* Expanded panel — clickable level pills that route to scoped edit */}
                  {isExpanded && (
                    <div style={{
                      borderTop: `1px solid ${BORDER}`, padding: "18px 28px",
                      background: SURFACE2, animation: "expandDown 0.2s ease-out"
                    }}>
                      <p style={{
                        fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
                        letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT3, margin: "0 0 12px"
                      }}>
                        Select a level to edit its colleges & courses
                      </p>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {group.levels.length === 0 ? (
                          <span style={{ fontSize: 12, color: TEXT3 }}>
                            This university has no level assigned yet.
                          </span>
                        ) : (
                          group.levels.map(lvl => (
                            <StatusPill
                              key={lvl}
                              label={lvl}
                              color={P}
                              onClick={() => goToLevelEdit(group, lvl)}
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Pagination Sentinel */}
          <div ref={sentinelRef} style={{ height: 1 }} />
          {loadingMore && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, padding: "16px 0", color: TEXT3, fontSize: 12 }}>
              <SpinnerIcon /> Loading more entries...
            </div>
          )}
        </div>

      </div>

      {/* ── CUSTOM DELETE CONFIRMATION POPUP MODAL ─────────────────────────── */}
      {deleteTargetId !== null && targetItemToDelete && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          backgroundColor: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          animation: "fadeIn 0.15s ease-out"
        }}>
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16,
            padding: "32px 40px", maxWidth: 440, width: "90%", textAlign: "center",
            boxShadow: "0 25px 50px rgba(0, 0, 0, 0.15)"
          }}>
            {/* Warning Circular Icon */}
            <div style={{
              width: 56, height: 56, borderRadius: "50%", background: "rgba(248,113,113,0.1)",
              border: `1.5px solid ${DANGER}`, display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px", fontSize: 22, color: DANGER
            }}>
              ⚠
            </div>

            <h3 style={{
              fontFamily: "'Castoro Titling', serif", fontSize: 20, fontWeight: 400,
              textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT, margin: "0 0 10px"
            }}>
              Confirm Deletion
            </h3>

            <p style={{ color: TEXT2, fontSize: 13, lineHeight: 1.6, marginBottom: 24, fontFamily: "'Manrope', sans-serif" }}>
              Are you sure you want to permanently delete <strong style={{ color: TEXT }}>{targetItemToDelete.Course}</strong> at <strong style={{ color: TEXT }}>{targetItemToDelete.University}</strong>? This action cannot be undone.
            </p>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button onClick={() => setDeleteTargetId(null)} style={btnGhost}>
                Cancel
              </button>
              <button onClick={() => executeDelete(targetItemToDelete.id)} style={btnDanger()}>
                Delete Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ALERTS / TOAST FEEDBACK PANEL ────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 32, right: 32,
          background: toast.type === "success" ? SUCCESS : DANGER,
          color: "#ffffff", padding: "14px 28px", borderRadius: 8,
          boxShadow: "0 20px 40px rgba(0,0,0,0.15)", zIndex: 10000,
          fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
          fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase",
          animation: "slideUp 0.3s ease-out"
        }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}