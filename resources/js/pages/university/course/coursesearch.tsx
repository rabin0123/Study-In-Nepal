import { useState, useEffect, useMemo, useRef } from "react";
import { Link } from '@inertiajs/react';
import { Search, MapPin, Building, Filter, ChevronDown, ChevronRight } from 'lucide-react';

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

// ── Reusable Dropdown Component (Styled for Hero Banner) ───────────────────
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
    <div ref={containerRef} className="relative text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold text-white font-['Manrope',sans-serif] cursor-pointer transition-all duration-200 whitespace-nowrap backdrop-blur-md border ${
          hasSelected 
            ? "bg-[#008ce3] border-[#008ce3]" 
            : "bg-white/10 border-white/25 hover:bg-white/20 hover:border-white/40"
        }`}
      >
        {label} {hasSelected && `(${selected.length})`}
        <ChevronDown 
          size={14} 
          strokeWidth={2.5} 
          className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+12px)] left-0 w-[280px] max-h-[300px] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.2)] z-50 p-2 custom-scroll">
          {options.length === 0 ? (
            <div className="p-3 text-[13px] text-gray-500">No options available</div>
          ) : (
            options.map(opt => (
              <label 
                key={opt} 
                className="flex items-center gap-3 px-3 py-2.5 cursor-pointer text-[13px] text-gray-900 rounded-lg transition-colors hover:bg-gray-100"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggleOption(opt)}
                  className="accent-[#008ce3] w-4 h-4 cursor-pointer shrink-0"
                />
                <span className="block leading-[1.4]">{opt}</span>
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
  const [searchFocused, setSearchFocused] = useState(false);
  
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
      const res = await fetch("/api/university", {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json.data || json);
      }
    } catch (error) {
      console.error("Failed to load records", error);
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
      const stdStream = standardizeName(item.stream);
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
    <div className="bg-[#F8FAFB] min-h-screen text-gray-900 font-['Manrope',sans-serif]">
      <link href="https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── VISUAL HERO BANNER ─────────────────────── */}
      <div className="pt-[110px] px-6 pb-20 text-center relative">
        {/* Background Layer */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <video autoPlay muted loop playsInline poster="/students_hero.jpg" className="absolute inset-0 w-full h-full object-cover">
            <source src="https://admin.studyinnepal.com/storage/videos/d47e6ef1-9380-4968-b9b3-5b0b3a9a6e81.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 to-black/50" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(0,0,0,0.15)_0%,transparent_40%)] pointer-events-none" />
        </div>

        {/* Hero Content Layer */}
        <div className="max-w-[1040px] mx-auto relative z-10">
          <p className="font-['Rajdhani',sans-serif] text-amber-400 text-[11px] font-bold tracking-[0.28em] uppercase mb-4 drop-shadow-md">
            Explore Academic Fields
          </p>
          <h1 className="font-['Castoro_Titling',serif] text-white text-[calc(26px+2.2vw)] font-normal uppercase tracking-[0.06em] mb-6 leading-[1.15] drop-shadow-xl">
            Discover <span className="text-[#008ce3]">Your Pathway</span> in Nepal
          </h1>
          <p className="text-white/85 text-[14px] leading-relaxed max-w-[620px] mx-auto mb-8 drop-shadow-md">
            Search registered universities, streams, specialized colleges, and find the perfect program that meets your academic goals.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-[640px] mx-auto mb-6">
            <Search 
              size={20} 
              className="absolute left-6 top-1/2 -translate-y-1/2 text-[#008ce3]" 
              strokeWidth={2.5} 
            />
            <input
              type="text"
              placeholder="Search by course, stream, college, or keyword..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={`w-full bg-white rounded-full py-4 pr-6 pl-[54px] text-[15px] text-gray-900 font-['Manrope',sans-serif] outline-none transition-all duration-300 border-[1.5px] shadow-lg ${
                searchFocused ? 'border-[#008ce3] shadow-[0_12px_30px_rgba(0,140,227,0.2)]' : 'border-transparent shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
              }`}
            />
          </div>

          {/* Horizontal Filters Section */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <div className="flex items-center text-[13px] font-extrabold text-white/85 font-['Rajdhani',sans-serif] uppercase tracking-widest mr-1 drop-shadow-md">
              <Filter size={16} className="mr-1.5" /> Filters
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
                className="bg-red-500/15 border border-red-500/30 text-red-400 backdrop-blur-sm text-[12px] font-bold font-['Rajdhani',sans-serif] cursor-pointer uppercase tracking-[0.05em] px-[18px] py-2.5 rounded-full transition-all duration-200 hover:bg-red-500/25 hover:border-red-500/50"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ──────────────────────────────────────────────── */}
      <div className="max-w-[1040px] mx-auto px-6 py-10 pb-24">

        {/* Results Info Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-[15px] text-gray-600">
            Showing <strong className="text-gray-900">{filteredData.length}</strong> programs available
          </div>
        </div>

        {/* ── COURSE CARDS ── */}
        {loading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-500 shadow-sm">
            Searching directory listings...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center text-gray-500 shadow-sm">
            No matches found. Try adjusting your filter terms or keywords.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredData.map(item => {
              const stdLevel = standardizeLevel(item.level);
              const stdUni = standardizeName(item.University);
              const stdCol = standardizeName(item.College);
              const stdLoc = standardizeName(item.Location);
              const stdStream = standardizeName(item.stream);
              const stdCourse = standardizeCourse(item.Course); 

              const collegeLogo = validUrl(item.college_logo_url);
              const universityLogo = validUrl(item.university_logo_url);
              const fallbackImage = getStreamImage(item.stream, item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white border-[1.5px] border-gray-200 rounded-2xl flex flex-col md:flex-row overflow-hidden transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:border-[#008ce3] hover:-translate-y-[2px] hover:shadow-[0_14px_30px_rgba(0,0,0,0.06)] group"
                >
                  {/* Left Column: Image (CLICKABLE - Goes to Details) */}
                  <Link 
                    href={`/course-details/${item.id}`}
                    className={`w-full md:w-[240px] h-[200px] md:h-auto relative overflow-hidden shrink-0 flex items-center justify-center border-b md:border-b-0 md:border-r border-gray-200 group/img ${collegeLogo ? 'bg-white' : 'bg-[#E5E7EB]'}`}
                  >
                    <img
                      src={collegeLogo ?? fallbackImage}
                      alt={stdCol}
                      className={`w-full h-full transition-transform duration-500 ease-in-out ${collegeLogo ? 'object-contain p-6' : 'object-cover group-hover/img:scale-105'}`}
                      onError={(e) => {
                        e.currentTarget.src = fallbackImage;
                        e.currentTarget.className = "w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105";
                        e.currentTarget.parentElement!.classList.add("bg-[#E5E7EB]");
                      }}
                    />
                    <div className="absolute bottom-3 left-3 bg-black/65 backdrop-blur-sm text-white text-[10px] font-bold font-['Rajdhani',sans-serif] px-2 py-1 rounded tracking-[0.08em] uppercase">
                      {stdStream}
                    </div>
                  </Link>

                  {/* Right Column: Content */}
                  <div className="p-6 md:px-6 md:py-7 flex-1 flex flex-col justify-between min-w-0">
                    
                    {/* Top Content (CLICKABLE - Goes to Details) */}
                    <Link href={`/course-details/${item.id}`} className="flex flex-col gap-3 group/link cursor-pointer block">
                      
                      {/* Tags */}
                      <div className="flex gap-2 flex-wrap">
                        <span className="bg-amber-400/10 text-amber-500 border border-amber-400/20 text-[9px] font-['Rajdhani',sans-serif] font-bold tracking-[0.12em] px-2.5 py-1 rounded-full uppercase">
                          {stdLevel}
                        </span>
                        {item.Intake && (
                          <span className="bg-gray-100 text-gray-500 border border-gray-200 text-[9px] font-['Rajdhani',sans-serif] font-bold tracking-[0.12em] px-2.5 py-1 rounded-full uppercase">
                            Intake: {item.Intake}
                          </span>
                        )}
                      </div>

                      {/* Title & Meta */}
                      <div>
                        <h2 className="text-[18px] font-bold text-gray-900 m-0 mb-1.5 font-['Manrope',sans-serif] transition-colors group-hover/link:text-[#008ce3]">
                          {stdCourse}
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 text-[13px] text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <Building size={14} />
                            {stdCol}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} />
                            {stdLoc}
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* Footer Row: Uni & Inquire Button (NOT CLICKABLE for Details) */}
                    <div className="border-t border-gray-200 pt-3.5 mt-4 flex items-center justify-between gap-2.5">
                      
                      {/* Affiliated University */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        {universityLogo ? (
                          <img
                            src={universityLogo}
                            alt={stdUni}
                            className="w-8 h-8 object-contain rounded-md border border-gray-200 bg-white p-[3px] shrink-0 shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-md border border-gray-200 bg-[#008ce3]/10 shrink-0 flex items-center justify-center text-[11px] font-extrabold text-[#008ce3] font-['Rajdhani',sans-serif]">
                            {stdUni.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col gap-[1px] min-w-0">
                          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.06em]">
                            Affiliated University
                          </span>
                          <span className="text-[13px] font-bold text-gray-900 truncate" title={stdUni}>
                            {stdUni}
                          </span>
                        </div>
                      </div>

                      {/* Inquire Button */}
                      <Link href="/student-inquiry" className="shrink-0 outline-none">
                        <button className="bg-[#008ce3] hover:bg-[#0072b8] hover:scale-[1.02] text-white border-none py-2 px-4 rounded-lg text-[12px] font-bold font-['Rajdhani',sans-serif] uppercase tracking-[0.05em] cursor-pointer transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap shadow-sm">
                          Inquire Now
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </button>
                      </Link>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global CSS Overrides */}
      <style>{`
        /* Custom scrollbars for inner filter dropdowns */
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