import { useState, useEffect, useMemo, useRef } from "react";
import type { CSSProperties, ReactNode } from "react";

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

// ── Database Schema Mapping ──────────────────────────────────────────────────
interface UniversityEntry {
  id: number;
  University: string;
  level: string;
  Intake: string;
  College: string;
  Location: string;
  Course: string;
  stream: string;
  Amount: string | null;
  Scholarship: string | null;
  requireddocuments: string | null;
  ug_requirement: string | null;
  pg_requirement: string | null;
  created_at: string;
  updated_at: string;
}

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

const selectFilterStyle = (active: boolean): CSSProperties => ({
  background: SURFACE2,
  border: `1px solid ${active ? P : BORDER}`,
  borderRadius: 6, padding: "10px 32px 10px 14px",
  fontSize: 12, color: active ? TEXT : TEXT2, fontFamily: "'Manrope', sans-serif",
  outline: "none", cursor: "pointer", transition: "border-color .15s",
  appearance: "none", WebkitAppearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='6' viewBox='0 0 11 6'%3E%3Cpath d='M1 1l4.5 4L10 1' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center",
  minWidth: "160px", flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap"
});

const btnPrimary = (extra: CSSProperties = {}): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 26px", borderRadius: 999,
  background: P, border: "none", color: "#ffffff", // Forced white for contrast
  fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
  fontSize: 12, letterSpacing: "0.18em", textTransform: "uppercase",
  cursor: "pointer", transition: "opacity 0.2s", ...extra,
});

const btnDanger = (extra: CSSProperties = {}): CSSProperties => ({
  display: "flex", alignItems: "center", gap: 10,
  padding: "11px 26px", borderRadius: 999,
  background: DANGER, border: "none", color: "#ffffff", // Forced white for contrast
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
const gridLayoutRatio = "2.2fr 2.2fr 1.3fr 1fr 1.8fr auto";

const headerTextStyle: CSSProperties = {
  fontSize: 10,
  fontFamily: "'Rajdhani', sans-serif",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: TEXT3,
};

const truncateStyle: CSSProperties = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
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

const CalendarIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: TEXT3 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
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
              <div style={{ fontSize: 11, color: TEXT3, textAlign: "center", padding: "8px 0" }}>No relative options</div>
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
                      style={{
                        accentColor: P, width: 14, height: 14, cursor: "pointer"
                      }}
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
function StatusPill({ label, color = P }: { label: string; color?: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 999,
      background: `${color}18`, border: `1px solid ${color}33`,
      color: color, fontSize: 10, fontFamily: "'Rajdhani', sans-serif",
      fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase"
    }}>
      {label}
    </span>
  );
}

// ── Main Index Page ──────────────────────────────────────────────────────────
export default function UniversityIndex() {
  const [data, setData] = useState<UniversityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  // Filters state
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [selectedColleges, setSelectedColleges] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedCourses, setSelectedCourses] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);

  const [filtersOpen, setFiltersOpen] = useState(false);

  // Custom Delete Target State
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);

  // Confirmation Alert/Toast Feedback State
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Hidden File Input Reference for CSV Import
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUniversities();
  }, []);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const fetchUniversities = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/university", {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json); 
      }
    } catch (error) {
      console.error("Failed to fetch universities", error);
    } finally {
      setLoading(false);
    }
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
        headers: {
          "X-Requested-With": "XMLHttpRequest"
        }
      });
      const result = await res.json();

      if (res.ok && result.success) {
        triggerToast(result.message, "success");
        fetchUniversities();
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
    setSearch("");
  };

  const targetItemToDelete = useMemo(() => {
    return data.find(item => item.id === deleteTargetId);
  }, [deleteTargetId, data]);

  // ── Dynamic / Cascade Filtering Options ────────────────────────────────────
  const getSubsetFilteredByOthers = (excludeField?: string) => {
    return data.filter(item => {
      const matchesSearch = !search || (
        item.University?.toLowerCase().includes(search.toLowerCase()) ||
        item.Course?.toLowerCase().includes(search.toLowerCase()) ||
        item.Location?.toLowerCase().includes(search.toLowerCase()) ||
        item.College?.toLowerCase().includes(search.toLowerCase())
      );

      const matchesUniversity = excludeField === "University" || selectedUniversities.length === 0 || selectedUniversities.includes(item.University);
      const matchesCollege = excludeField === "College" || selectedColleges.length === 0 || selectedColleges.includes(item.College);
      const matchesLocation = excludeField === "Location" || selectedLocations.length === 0 || selectedLocations.includes(item.Location);
      const matchesCourse = excludeField === "Course" || selectedCourses.length === 0 || selectedCourses.includes(item.Course);
      const matchesLevel = excludeField === "level" || selectedLevels.length === 0 || selectedLevels.includes(item.level);

      return matchesSearch && matchesUniversity && matchesCollege && matchesLocation && matchesCourse && matchesLevel;
    });
  };

  const relativeUniversities = useMemo(() => 
    Array.from(new Set(getSubsetFilteredByOthers("University").map(item => item.University).filter(Boolean))).sort()
  , [data, search, selectedColleges, selectedLocations, selectedCourses, selectedLevels]);

  const relativeColleges = useMemo(() => 
    Array.from(new Set(getSubsetFilteredByOthers("College").map(item => item.College).filter(Boolean))).sort()
  , [data, search, selectedUniversities, selectedLocations, selectedCourses, selectedLevels]);

  const relativeLocations = useMemo(() => 
    Array.from(new Set(getSubsetFilteredByOthers("Location").map(item => item.Location).filter(Boolean))).sort()
  , [data, search, selectedUniversities, selectedColleges, selectedCourses, selectedLevels]);

  const relativeCourses = useMemo(() => 
    Array.from(new Set(getSubsetFilteredByOthers("Course").map(item => item.Course).filter(Boolean))).sort()
  , [data, search, selectedUniversities, selectedColleges, selectedLocations, selectedLevels]);

  const relativeLevels = useMemo(() => 
    Array.from(new Set(getSubsetFilteredByOthers("level").map(item => item.level).filter(Boolean))).sort()
  , [data, search, selectedUniversities, selectedColleges, selectedLocations, selectedCourses]);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (
        item.University?.toLowerCase().includes(q) ||
        item.Course?.toLowerCase().includes(q) ||
        item.Location?.toLowerCase().includes(q) ||
        item.College?.toLowerCase().includes(q)
      );

      const matchesUniversity = selectedUniversities.length === 0 || selectedUniversities.includes(item.University);
      const matchesCollege = selectedColleges.length === 0 || selectedColleges.includes(item.College);
      const matchesLocation = selectedLocations.length === 0 || selectedLocations.includes(item.Location);
      const matchesCourse = selectedCourses.length === 0 || selectedCourses.includes(item.Course);
      const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(item.level);

      return matchesSearch && matchesUniversity && matchesCollege && matchesLocation && matchesCourse && matchesLevel;
    });
  }, [data, search, selectedUniversities, selectedColleges, selectedLocations, selectedCourses, selectedLevels]);

  const filtersActive = selectedUniversities.length > 0 || selectedColleges.length > 0 || selectedLocations.length > 0 || selectedCourses.length > 0 || selectedLevels.length > 0;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: TEXT, fontFamily: "'Manrope', sans-serif", paddingBottom: 64, position: "relative" }}>
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
      <div style={{  padding: "48px 48px 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, borderRadius: "50%", background: `${P}12`, pointerEvents: "none" }} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <p style={{ fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: P, margin: "0 0 14px" }}>
              University Management — Directory
            </p>
            <h1 style={{ fontFamily: "'Castoro Titling', serif", fontSize: 40, fontWeight: 400, textTransform: "uppercase", letterSpacing: "0.08em", color: TEXT, margin: "0 0 12px", lineHeight: 1.15 }}>
              Registered <span style={{ color: P }}>Courses</span>
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
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

        {/* Collapsible Relative Filters Panel */}
        {filtersOpen && (
          <div style={{
            background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12,
            padding: "24px", marginBottom: "24px", animation: "fadeIn 0.2s ease-out"
          }}>
            <p style={{
              fontSize: 10, fontFamily: "'Rajdhani', sans-serif", fontWeight: 700,
              letterSpacing: "0.14em", textTransform: "uppercase", color: TEXT3, marginBottom: 16
            }}>
              Cascading Multi-Select Filters
            </p>
            
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <MultiSelectDropdown 
                label="Universities" 
                options={relativeUniversities} 
                selected={selectedUniversities} 
                onChange={setSelectedUniversities} 
              />
              <MultiSelectDropdown 
                label="Colleges" 
                options={relativeColleges} 
                selected={selectedColleges} 
                onChange={setSelectedColleges} 
              />
              <MultiSelectDropdown 
                label="Locations" 
                options={relativeLocations} 
                selected={selectedLocations} 
                onChange={setSelectedLocations} 
              />
              <MultiSelectDropdown 
                label="Courses" 
                options={relativeCourses} 
                selected={selectedCourses} 
                onChange={setSelectedCourses} 
              />
              <MultiSelectDropdown 
                label="Levels" 
                options={relativeLevels} 
                selected={selectedLevels} 
                onChange={setSelectedLevels} 
              />
            </div>

            {/* Clear Filters Panel Action */}
            {(filtersActive || search) && (
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
        {filteredData.length > 0 && !loading && (
          <div style={{
            display: "grid",
            gridTemplateColumns: gridLayoutRatio,
            gap: "24px",
            padding: "12px 28px",
            marginBottom: "8px",
          }}>
            <div style={headerTextStyle}>Institution</div>
            <div style={headerTextStyle}>Program & Stream</div>
            <div style={headerTextStyle}>Level & Intake</div>
            <div style={headerTextStyle}>Financials</div>
            <div style={headerTextStyle}>Required Docs</div>
            <div style={{ ...headerTextStyle, textAlign: "right", width: "42px" }}>Delete</div>
          </div>
        )}

        {/* Standalone Directory Cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {loading ? (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "48px", textAlign: "center", color: TEXT3, fontSize: 13 }}>
              Loading records...
            </div>
          ) : filteredData.length === 0 ? (
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "48px", textAlign: "center", color: TEXT3, fontSize: 13 }}>
              No course entries found matching your criteria.
            </div>
          ) : (
            filteredData.map((item) => (
              <div 
                key={item.id} 
                onClick={() => window.location.href = `/universities/${item.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: gridLayoutRatio,
                  alignItems: "center",
                  gap: "24px",
                  background: SURFACE,
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: "20px 28px",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#cbd5e1"; // Slightly darker border on hover for light mode
                  e.currentTarget.style.background = SURFACE2;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER;
                  e.currentTarget.style.background = SURFACE;
                }}
              >
                {/* 1. Institution */}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ ...truncateStyle, fontSize: 14, color: TEXT, fontWeight: 600 }} title={item.University}>
                    {item.University}
                  </div>
                  <div style={{ ...truncateStyle, fontSize: 11, color: TEXT3 }} title={`${item.College} • ${item.Location}`}>
                    {item.College} • {item.Location}
                  </div>
                </div>

                {/* 2. Program & Stream */}
                <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ ...truncateStyle, fontSize: 14, color: TEXT, fontWeight: 500 }} title={item.Course}>
                    {item.Course}
                  </div>
                  <div style={{ ...truncateStyle, fontSize: 11, color: P }} title={item.stream}>
                    {item.stream}
                  </div>
                </div>

                {/* 3. Level & Intake */}
                <div>
                  <div style={{ marginBottom: 6 }}>
                    <StatusPill label={item.level} color={AMBER} />
                  </div>
                  <div style={{ fontSize: 11, color: TEXT3, display: "flex", alignItems: "center", gap: 6 }}>
                    <CalendarIcon />
                    Intake: {item.Intake}
                  </div>
                </div>

                {/* 4. Financials */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ ...truncateStyle, fontSize: 14, color: TEXT, fontWeight: 600 }} title={item.Amount || "N/A"}>
                   NPR {item.Amount || <span style={{ color: TEXT3 }}>N/A</span>}
                  </div>
                  {item.Scholarship && (
                    <div style={{ ...truncateStyle, fontSize: 11, color: SUCCESS, display: "flex", alignItems: "center", gap: 4 }} title={item.Scholarship}>
                     NPR {item.Scholarship}
                      </div>
                  )}
                </div>

                {/* 5. Required Documents */}
                <div>
                  {item.requireddocuments ? (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxWidth: "240px", maxHeight: "80px", overflow: "hidden" }}>
                      {item.requireddocuments.split(",").map((doc, i) => (
                        <span key={i} style={{ 
                          fontSize: 10, color: TEXT2, background: SURFACE2, 
                          padding: "3px 8px", borderRadius: 4, border: `1px solid ${BORDER}`,
                          fontFamily: "'Rajdhani', sans-serif", fontWeight: 600,
                          whiteSpace: "nowrap"
                        }} title={doc.trim()}>
                          {doc.trim()}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: TEXT3 }}>None specified</span>
                  )}
                </div>

                {/* 6. Actions (Only Delete Button) */}
                <div style={{ display: "flex", justifyContent: "flex-end", width: "42px", marginLeft: "auto" }}>
                  <button 
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "center",
                      width: "32px", height: "32px", borderRadius: 6, background: "transparent",
                      border: "1px solid rgba(248,113,113,0.25)", color: DANGER, cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                    onClick={(e) => {
                      e.stopPropagation(); 
                      setDeleteTargetId(item.id); 
                    }}
                    title="Delete Entry"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))
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
              <button 
                onClick={() => setDeleteTargetId(null)} 
                style={btnGhost}
              >
                Cancel
              </button>
              <button 
                onClick={() => executeDelete(targetItemToDelete.id)} 
                style={btnDanger()}
              >
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