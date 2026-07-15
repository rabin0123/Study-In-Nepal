import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

// ── Interfaces ──
type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

interface ApiDataRow {
    id: number;
    University: string;
    College: string;
    Course: string;
    [key: string]: any;
}

// ── Helpers ──
function nextYear(existing: { year: number }[]): number {
    return !existing || existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function defaultYearModules(): YearModule[] {
    return [{ year: 1, title: 'Year 1', modules: [''] }];
}

function defaultYearFee(): YearFee[] {
    return [{ year: 1, amount: '', currency: '', note: '' }];
}

// ---------------------------------------------------------------------------
// 1. ComboboxInput 
// ---------------------------------------------------------------------------
function ComboboxInput({
    placeholder, value, onChange, options, disabled, error
}: {
    placeholder?: string; value: string; onChange: (val: string) => void;
    options: string[]; disabled?: boolean; error?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => setQuery(value), [value]);

    const filteredOptions = useMemo(() => {
        return options.filter((opt) => opt.toLowerCase().includes((query || '').toLowerCase()));
    }, [options, query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setQuery(value);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value]);

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative">
                <input
                    type="text"
                    placeholder={placeholder}
                    value={query}
                    disabled={disabled}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    className={`block w-full pl-4 pr-10 py-3 border bg-gray-50 rounded-none sm:text-sm outline-none transition-colors ${
                        error ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 focus:ring-[#008AE6] focus:border-[#008AE6]'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    autoComplete="off"
                />
            </div>
            
            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-100 shadow-lg max-h-60 overflow-y-auto rounded-none">
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#008AE6] transition-colors"
                            >
                                {opt}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 2. MultiSelect Dropdown 
// ---------------------------------------------------------------------------
function MultiSelectDropdown({
    options, selectedKeys, onToggle, disabled, placeholder
}: {
    options: { key: string; label: string; subLabel: string }[];
    selectedKeys: string[];
    onToggle: (key: string) => void;
    disabled?: boolean;
    placeholder?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayText = selectedKeys.length === 0 
        ? (placeholder || 'Select options...') 
        : `${selectedKeys.length} institution(s) selected`;

    return (
        <div ref={wrapperRef} className="relative w-full">
            <button
                type="button"
                className={`w-full flex justify-between items-center pl-4 pr-4 py-3 border rounded-none sm:text-sm outline-none transition-colors ${
                    disabled ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-50 border-gray-200 hover:border-gray-300 text-gray-900 cursor-pointer'
                }`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <span>{displayText}</span>
                <span className="text-gray-400">▼</span>
            </button>
            
            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 shadow-lg max-h-72 overflow-y-auto rounded-none p-2">
                    {options.length === 0 ? (
                        <div className="text-gray-400 p-4 text-center text-sm">No institutions found.</div>
                    ) : (
                        options.map((opt) => (
                            <div 
                                key={opt.key} 
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggle(opt.key);
                                }}
                            >
                                <input 
                                    type="checkbox" 
                                    className="mt-1 h-4 w-4 text-[#008AE6] border-gray-300 rounded focus:ring-[#008AE6] cursor-pointer" 
                                    checked={selectedKeys.includes(opt.key)}
                                    readOnly 
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{opt.subLabel}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 3. Advanced WYSIWYG Editor
// ---------------------------------------------------------------------------
function AdvancedWysiwyg({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string; }) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const exec = (cmd: string, arg?: string) => {
        document.execCommand(cmd, false, arg);
        editorRef.current?.focus();
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    return (
        <div className={`border bg-white overflow-hidden transition-colors ${error ? 'border-red-500' : 'border-gray-200'}`}>
            <div className="bg-gray-50 px-3 py-2 border-b border-gray-200 flex flex-wrap gap-2 items-center">
                
                {/* Text Formatting */}
                <select 
                    onChange={(e) => exec('formatBlock', e.target.value)} 
                    className="text-xs border border-gray-300 bg-white py-1 px-2 focus:outline-none focus:border-[#008AE6] text-gray-700 h-8"
                    defaultValue="<P>"
                >
                    <option value="<P>">Paragraph</option>
                    <option value="<H1>">Heading 1</option>
                    <option value="<H2>">Heading 2</option>
                </select>

                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                <button type="button" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-serif font-bold text-sm" onClick={() => exec('bold')} title="Bold">B</button>
                <button type="button" className="w-8 h-8 flex items-center justify-center bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-serif italic text-sm" onClick={() => exec('italic')} title="Italic">I</button>
                
                <div className="w-px h-5 bg-gray-300 mx-1"></div>

                {/* Lists */}
                <button type="button" className="px-2 h-8 flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium" onClick={() => exec('insertUnorderedList')} title="Bullet Points">
                    • Bullets
                </button>
                <button type="button" className="px-2 h-8 flex items-center justify-center gap-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-medium" onClick={() => exec('insertOrderedList')} title="Numbered List">
                    1. Numbers
                </button>
            </div>
            <div
                ref={editorRef}
                className="p-4 bg-white editor-content prose prose-sm max-w-none text-gray-700"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: '150px', outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`
                .editor-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; font-style: italic; }
                .editor-content h1 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
                .editor-content h2 { font-size: 1.25em; font-weight: bold; margin-bottom: 0.5em; font-family: ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
                .editor-content p { margin-bottom: 0.75em; }
                .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 0.75em; }
                .editor-content ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 0.75em; }
            `}</style>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
export default function CourseDetailsCreate() {
    const [masterData, setMasterData] = useState<ApiDataRow[]>([]);
    const [courseName, setCourseName] = useState('');
    const [selectedInstKeys, setSelectedInstKeys] = useState<string[]>([]);
    const [summaryHtml, setSummaryHtml] = useState('');
    const [careersHtml, setCareersHtml] = useState('');
    
    // Modules & Fees mapping
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    const [feesByInst, setFeesByInst] = useState<Record<string, YearFee[]>>({});
    
    // Unified Tab Selection
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!savedMessage) return;
        const t = setTimeout(() => setSavedMessage(null), 4000);
        return () => clearTimeout(t);
    }, [savedMessage]);

    useEffect(() => {
        fetch('https://www.admin.studyinnepal.com/api/university')
            .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
            .then((data) => { setMasterData(Array.isArray(data) ? data : []); })
            .catch((err) => console.error('Error fetching university data:', err));
    }, []);

    const uniqueCourses = useMemo(() => Array.from(new Set(masterData.map((item) => item.Course).filter(Boolean))), [masterData]);

    const availableInstitutions = useMemo(() => {
        if (!courseName) return [];
        const matches = masterData.filter((d) => d.Course?.toLowerCase() === courseName.toLowerCase());
        const unique = new Map();
        matches.forEach((m) => {
            if (m.University && m.College) {
                const key = `${m.University}|||${m.College}`;
                if (!unique.has(key)) unique.set(key, { key, label: m.College, subLabel: m.University });
            }
        });
        return Array.from(unique.values());
    }, [masterData, courseName]);

    const institutionLookup = useMemo(() => {
        const map = new Map<string, { label: string; subLabel: string }>();
        availableInstitutions.forEach((i) => map.set(i.key, { label: i.label, subLabel: i.subLabel }));
        return map;
    }, [availableInstitutions]);

    useEffect(() => {
        const validKeys = availableInstitutions.map(i => i.key);
        setSelectedInstKeys(prev => prev.filter(k => validKeys.includes(k)));
    }, [availableInstitutions]);

    // Initialize state structure for new institutions and manage active tab
    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearModules(); });
            return next;
        });
        setFeesByInst((prev) => {
            const next: Record<string, YearFee[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearFee(); });
            return next;
        });
        
        setActiveTab((prevActive) => (prevActive && selectedInstKeys.includes(prevActive) ? prevActive : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));
    }, [selectedInstKeys]);

    const toggleInstitution = (key: string) => setSelectedInstKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    // -- Module Handlers --
    const addYear = () => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: [...prev[activeTab], { year: nextYear(prev[activeTab]), title: '', modules: [''] }] }));
    };
    const removeYear = (index: number) => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((_, i) => i !== index) }));
    };
    const updateYear = (index: number, patch: Partial<YearModule>) => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((y, i) => (i === index ? { ...y, ...patch } : y)) }));
    };
    const addModuleLine = (yearIndex: number) => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((y, i) => i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y) }));
    };
    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y) }));
    };
    const removeModuleLine = (yearIndex: number, moduleIndex: number) => {
        if (!activeTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y) }));
    };
    const copyModulesToAll = () => {
        if (!activeTab) return;
        const source = yearModulesByInst[activeTab];
        setYearModulesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeTab) next[key] = JSON.parse(JSON.stringify(source)); });
            return next;
        });
    };

    // -- Fee Handlers --
    const addFeeYear = () => {
        if (!activeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeTab]: [...prev[activeTab], { year: nextYear(prev[activeTab]), amount: '', currency: '', note: '' }] }));
    };
    const removeFeeYear = (index: number) => {
        if (!activeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].filter((_, i) => i !== index) }));
    };
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => {
        if (!activeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeTab]: prev[activeTab].map((f, i) => (i === index ? { ...f, ...patch } : f)) }));
    };
    const copyFeesToAll = () => {
        if (!activeTab) return;
        const source = feesByInst[activeTab];
        setFeesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeTab) next[key] = JSON.parse(JSON.stringify(source)); });
            return next;
        });
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (!courseName.trim()) { setErrors({ course_name: 'Course name is required.' }); return; }
        if (selectedInstKeys.length === 0) { setErrors({ institutions: 'Please select at least one institution from the dropdown.' }); return; }

        setSaving(true);
        setErrors({});

        // Prepare institutions array containing both modules and fees
        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');
            
            const cleanModules = (yearModulesByInst[key] ?? []).filter((y) => y.year).map((y) => ({
                year: y.year, title: y.title.trim() || null, modules: y.modules.map((m) => m.trim()).filter(Boolean)
            }));
            
            const cleanFees = (feesByInst[key] ?? []).filter((f) => f.year).map((f) => ({
                year: f.year, amount: f.amount.trim() || null, currency: f.currency.trim() || null, note: f.note.trim() || null
            }));

            return { university_name: uni, college_name: col, year_wise_modules: cleanModules, fees: cleanFees };
        });

        // Global Fees mapping 
        const globalFees = selectedInstKeys.flatMap(key => {
            const [uni, col] = key.split('|||');
            return (feesByInst[key] ?? []).filter(f => f.year).map(f => ({
                university_name: uni, college_name: col, year: f.year, amount: f.amount.trim() || null, currency: f.currency.trim() || null, note: f.note.trim() || null
            }));
        });

        const payload = {
            course_name: courseName.trim(), 
            summary: summaryHtml.trim() || null, 
            careers_summary: careersHtml.trim() || null,
            institutions: institutionsPayload,
            fees: globalFees,
        };

        fetch('/course-details', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
            body: JSON.stringify(payload),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : {});
                    throw new Error(data.message || 'Failed to save');
                }
                setSavedMessage(data.message || 'Saved successfully.');
                setTimeout(() => router.visit(`/course-details/${data.courseDetail?.uuid || ''}`), 800);
            })
            .catch((err) => console.error('Failed to save course details', err))
            .finally(() => setSaving(false));
    };

    const activeYearModules = activeTab ? (yearModulesByInst[activeTab] ?? []) : [];
    const activeYearFees = activeTab ? (feesByInst[activeTab] ?? []) : [];

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-10">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 tracking-wide">
                            New Course Details
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Define a course once and securely link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button type="submit" className="inline-flex items-center justify-center px-8 py-3 bg-[#008AE6] hover:bg-[#0071bf] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008AE6]" disabled={saving}>
                        {saving ? 'Processing...' : 'Save Details'}
                    </button>
                </div>

                {savedMessage && (
                    <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium tracking-wide">
                        {savedMessage}
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step 1</h2>
                    <h3 className="text-xl font-serif text-gray-900 mb-6">Select Course</h3>
                    
                    <div className="max-w-xl">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Course Name <span className="text-red-500">*</span></label>
                        <ComboboxInput
                            placeholder="e.g. BSc Computer Science..."
                            value={courseName}
                            onChange={setCourseName}
                            options={uniqueCourses}
                            error={errors.course_name}
                        />
                        {errors.course_name && <p className="mt-2 text-xs text-red-500">{errors.course_name}</p>}
                    </div>
                </div>

                {/* 2. Colleges & Universities */}
                <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step 2</h2>
                    <h3 className="text-xl font-serif text-gray-900 mb-6">Select Institutions</h3>
                    
                    <div className="max-w-xl">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Colleges / Universities <span className="text-red-500">*</span></label>
                        <MultiSelectDropdown 
                            options={availableInstitutions}
                            selectedKeys={selectedInstKeys}
                            onToggle={toggleInstitution}
                            disabled={!courseName || availableInstitutions.length === 0}
                            placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                        />
                        {errors.institutions && <p className="mt-2 text-xs text-red-500">{errors.institutions}</p>}
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step 3</h2>
                    <h3 className="text-xl font-serif text-gray-900 mb-6">Global Course Information</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Course Summary</label>
                            <AdvancedWysiwyg value={summaryHtml} onChange={setSummaryHtml} placeholder="Write an engaging overview..." error={errors.summary} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">Career Prospects</label>
                            <AdvancedWysiwyg value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers_summary} />
                        </div>
                    </div>
                </div>

                {/* 4. Unified Institution Configuration (Modules + Fees) */}
                <div className="bg-white p-6 md:p-8 shadow-sm border border-gray-100">
                    <h2 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Step 4</h2>
                    <h3 className="text-xl font-serif text-gray-900 mb-6">Institution Configuration</h3>

                    {selectedInstKeys.length === 0 ? (
                        <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-200 text-gray-400 text-sm tracking-wide">
                            No institutions selected. Please select institutions in Step 2.
                        </div>
                    ) : (
                        <div>
                            {/* Tabs Header */}
                            <div className="flex gap-1 overflow-x-auto border-b border-gray-200 mb-8 pb-px no-scrollbar">
                                {selectedInstKeys.map((key) => {
                                    const info = institutionLookup.get(key);
                                    const isActive = key === activeTab;
                                    return (
                                        <button 
                                            key={key}
                                            type="button" 
                                            className={`flex-shrink-0 px-6 py-4 text-left transition-colors border-b-2 ${
                                                isActive 
                                                    ? 'border-[#008AE6] bg-[#008AE6]/5' 
                                                    : 'border-transparent hover:bg-gray-50'
                                            }`}
                                            onClick={() => setActiveTab(key)}
                                            style={{ minWidth: '200px' }}
                                        >
                                            <span className={`block text-xs font-bold uppercase tracking-widest truncate ${isActive ? 'text-[#008AE6]' : 'text-gray-700'}`}>
                                                {info ? info.label : key}
                                            </span>
                                            <span className={`block text-[10px] mt-1 uppercase tracking-wider truncate ${isActive ? 'text-[#008AE6]/70' : 'text-gray-400'}`}>
                                                {info?.subLabel}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Active Tab Content */}
                            {activeTab && (
                                <div className="space-y-12">
                                    
                                    {/* --- MODULES SECTION --- */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <h4 className="text-lg font-serif text-gray-900">Course Modules</h4>
                                            <div className="flex gap-2">
                                                {selectedInstKeys.length > 1 && (
                                                    <button type="button" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors" onClick={copyModulesToAll}>
                                                        Apply to all
                                                    </button>
                                                )}
                                                <button type="button" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-[#008AE6] hover:bg-[#0071bf] transition-colors" onClick={addYear}>
                                                    + Add Year
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {activeYearModules.map((yearBlock, yearIndex) => (
                                                <div key={yearIndex} className="border border-gray-200 bg-gray-50 p-4 sm:p-6">
                                                    <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200">
                                                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-4">
                                                            <div className="sm:col-span-1">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Year</label>
                                                                <input type="number" min={1} className="w-full px-3 py-2 text-sm border border-gray-200 bg-white focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                            </div>
                                                            <div className="sm:col-span-3">
                                                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Year Title (Optional)</label>
                                                                <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 bg-white focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                            </div>
                                                        </div>
                                                        {activeYearModules.length > 1 && (
                                                            <button type="button" className="ml-4 mt-6 text-red-400 hover:text-red-600 font-bold text-xl leading-none" onClick={() => removeYear(yearIndex)} title="Remove Year">
                                                                ×
                                                            </button>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="space-y-2">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Subjects / Modules</label>
                                                        {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                            <div key={moduleIndex} className="flex gap-2">
                                                                <div className="flex-1 flex bg-white border border-gray-200 focus-within:ring-1 focus-within:ring-[#008AE6] focus-within:border-[#008AE6]">
                                                                    <span className="px-3 py-2 text-sm text-gray-400 bg-gray-50 border-r border-gray-200">{moduleIndex + 1}.</span>
                                                                    <input type="text" className="w-full px-3 py-2 text-sm border-none bg-transparent outline-none" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                                </div>
                                                                {yearBlock.modules.length > 1 && (
                                                                    <button type="button" className="px-3 py-2 border border-gray-200 bg-white text-red-400 hover:bg-gray-50 transition-colors text-lg leading-none" onClick={() => removeModuleLine(yearIndex, moduleIndex)}>
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button type="button" className="mt-4 text-[10px] font-bold uppercase tracking-widest text-[#008AE6] hover:text-[#0071bf]" onClick={() => addModuleLine(yearIndex)}>
                                                        + Add Subject
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="w-full h-px bg-gray-200"></div>

                                    {/* --- FEES SECTION --- */}
                                    <div>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <h4 className="text-lg font-serif text-gray-900">Fee Structure</h4>
                                            <div className="flex gap-2">
                                                {selectedInstKeys.length > 1 && (
                                                    <button type="button" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors" onClick={copyFeesToAll}>
                                                        Apply to all
                                                    </button>
                                                )}
                                                <button type="button" className="px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white bg-[#008AE6] hover:bg-[#0071bf] transition-colors" onClick={addFeeYear}>
                                                    + Add Fee Row
                                                </button>
                                            </div>
                                        </div>

                                        <div className="border border-gray-200 bg-white p-4 sm:p-6 space-y-4">
                                            {activeYearFees.map((fee, feeIndex) => (
                                                <div key={feeIndex} className="flex flex-wrap sm:flex-nowrap gap-3 items-end pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                                    <div className="w-20">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Year</label>
                                                        <input type="number" min={1} className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                                    </div>
                                                    <div className="w-24">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Currency</label>
                                                        <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" placeholder="NPR/USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                                    </div>
                                                    <div className="flex-1 min-w-[120px]">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Amount</label>
                                                        <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                                    </div>
                                                    <div className="flex-1 min-w-[150px]">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Note (Optional)</label>
                                                        <input type="text" className="w-full px-3 py-2 text-sm border border-gray-200 bg-gray-50 focus:ring-[#008AE6] focus:border-[#008AE6] outline-none" placeholder="e.g. Tuition fee" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                                    </div>
                                                    
                                                    {activeYearFees.length > 1 && (
                                                        <button type="button" className="px-3 py-2 text-lg leading-none border border-gray-200 bg-white text-red-400 hover:bg-gray-50" onClick={() => removeFeeYear(feeIndex)}>
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="flex justify-end pt-4 pb-12">
                    <button type="submit" className="inline-flex items-center justify-center px-8 py-4 bg-[#008AE6] hover:bg-[#0071bf] text-white text-sm font-bold uppercase tracking-widest rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008AE6]" disabled={saving}>
                        {saving ? 'Processing...' : 'Save All Details'}
                    </button>
                </div>
            </form>
        </div>
    );
}