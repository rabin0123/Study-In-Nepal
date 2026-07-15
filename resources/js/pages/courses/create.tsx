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

// ---------------------------------------------------------------------------
// 1. ComboboxInput — Searchable dropdown combined with text input (For Course)
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
        <div ref={wrapperRef} className="position-relative">
            <div className="input-group input-group-lg shadow-sm rounded-3">
                <span className="input-group-text bg-white border-end-0 text-muted ps-3 pe-2 rounded-start-3">
                    <span className="iconify" data-icon="lucide:search" data-width="20"></span>
                </span>
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
                    className={`form-control border-start-0 ps-0 fs-6 ${error ? 'is-invalid border-danger' : ''} rounded-end-3`}
                    autoComplete="off"
                    style={{ boxShadow: 'none' }}
                />
            </div>
            
            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul
                    className="dropdown-menu show w-100 p-2 mt-2 shadow border-0 rounded-3"
                    style={{ maxHeight: 260, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <a
                                href="javascript:void(0)"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                                className="dropdown-item rounded py-2 d-flex align-items-center gap-2 transition-all"
                            >
                                <span className="iconify text-muted" data-icon="lucide:book" data-width="16"></span>
                                {opt}
                            </a>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// 2. MultiSelect Dropdown — Checkbox dropdown (For Institutions)
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
        <div ref={wrapperRef} className="position-relative">
            <div 
                className={`form-control form-control-lg fs-6 shadow-sm d-flex justify-content-between align-items-center rounded-3 ${disabled ? 'bg-light text-muted border-light' : 'bg-white cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                <div className="d-flex align-items-center gap-2">
                    <span className="iconify text-muted" data-icon="lucide:building-2" data-width="20"></span>
                    <span>{displayText}</span>
                </div>
                <span className="iconify text-muted" data-icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} data-width="20"></span>
            </div>
            
            {isOpen && !disabled && (
                <div 
                    className="dropdown-menu show w-100 p-2 mt-2 shadow border-0 rounded-3"
                    style={{ maxHeight: 300, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {options.length === 0 ? (
                        <div className="text-muted p-3 text-center fs-6">
                            <span className="iconify mb-2 opacity-50 d-block mx-auto" data-icon="lucide:inbox" data-width="24"></span>
                            No institutions found.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <div 
                                key={opt.key} 
                                className="dropdown-item rounded px-3 py-2 mb-1 d-flex align-items-start gap-3 transition-all"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggle(opt.key);
                                }}
                                style={{ cursor: 'pointer', whiteSpace: 'normal' }}
                            >
                                <input 
                                    type="checkbox" 
                                    className="form-check-input mt-1 flex-shrink-0" 
                                    checked={selectedKeys.includes(opt.key)}
                                    readOnly 
                                    style={{ cursor: 'pointer', width: '1.2em', height: '1.2em' }}
                                />
                                <div>
                                    <div className="fw-semibold text-wrap lh-sm mb-1 text-dark">{opt.label}</div>
                                    <div className="small text-muted text-wrap lh-sm">{opt.subLabel}</div>
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
// 3. Simple WYSIWYG Editor (Bold, Italic, Bullet Points)
// ---------------------------------------------------------------------------
function SimpleWysiwyg({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string; }) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const exec = (cmd: string) => {
        document.execCommand(cmd, false, undefined);
        editorRef.current?.focus();
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    return (
        <div className={`border rounded-3 shadow-sm bg-white overflow-hidden ${error ? 'border-danger' : 'border-light-subtle'}`}>
            {/* Toolbar */}
            <div className="bg-light p-2 border-bottom d-flex gap-2">
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('bold')} title="Bold">
                    <span className="iconify" data-icon="lucide:bold" data-width="18"></span>
                </button>
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('italic')} title="Italic">
                    <span className="iconify" data-icon="lucide:italic" data-width="18"></span>
                </button>
                <div className="vr mx-1 opacity-25"></div>
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('insertUnorderedList')} title="Bullet Points">
                    <span className="iconify" data-icon="lucide:list" data-width="18"></span>
                </button>
            </div>
            
            {/* Editor Area */}
            <div
                ref={editorRef}
                className="p-3 bg-white editor-content"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 140, outline: 'none' }}
                data-placeholder={placeholder}
            />

            <style>{`
                .editor-content:empty:before {
                    content: attr(data-placeholder);
                    color: #adb5bd;
                    pointer-events: none;
                    display: block;
                }
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
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);
    const [fees, setFees] = useState<YearFee[]>([{ year: 1, amount: '', currency: '', note: '' }]);
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
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then((data) => {
                if (Array.isArray(data)) setMasterData(data);
                else setMasterData([]);
            })
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
                if (!unique.has(key)) {
                    unique.set(key, { key, label: m.College, subLabel: m.University });
                }
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

    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearModules(); });
            return next;
        });
        setActiveModuleTab((prevActive) => {
            if (prevActive && selectedInstKeys.includes(prevActive)) return prevActive;
            return selectedInstKeys.length > 0 ? selectedInstKeys[0] : null;
        });
    }, [selectedInstKeys]);

    const toggleInstitution = (key: string) => setSelectedInstKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    const addYear = () => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: [...prev[activeModuleTab], { year: nextYear(prev[activeModuleTab]), title: '', modules: [''] }] }));
    };
    const removeYear = (index: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].filter((_, i) => i !== index) }));
    };
    const updateYear = (index: number, patch: Partial<YearModule>) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => (i === index ? { ...y, ...patch } : y)) }));
    };
    const addModuleLine = (yearIndex: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y) }));
    };
    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y) }));
    };
    const removeModuleLine = (yearIndex: number, moduleIndex: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y) }));
    };

    const copyToAllInstitutions = () => {
        if (!activeModuleTab) return;
        const source = yearModulesByInst[activeModuleTab];
        setYearModulesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeModuleTab) next[key] = JSON.parse(JSON.stringify(source)); });
            return next;
        });
    };

    const addFeeYear = () => setFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    const removeFeeYear = (index: number) => setFees((prev) => prev.filter((_, i) => i !== index));
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => setFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (!courseName.trim()) { setErrors({ course_name: 'Course name is required.' }); return; }
        if (selectedInstKeys.length === 0) { setErrors({ institutions: 'Please select at least one institution from the dropdown.' }); return; }

        setSaving(true);
        setErrors({});

        const cleanModulesFor = (key: string) =>
            (yearModulesByInst[key] ?? []).filter((y) => y.year).map((y) => ({
                year: y.year, title: y.title.trim() || null, modules: y.modules.map((m) => m.trim()).filter(Boolean),
            }));

        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');
            return { university_name: uni, college_name: col, year_wise_modules: cleanModulesFor(key) };
        });

        const payload = {
            course_name: courseName.trim(), summary: summaryHtml.trim() || null, careers_summary: careersHtml.trim() || null,
            institutions: institutionsPayload,
            fees: fees.filter((f) => f.year).map((f) => ({ year: f.year, amount: f.amount.trim() || null, currency: f.currency.trim() || null, note: f.note.trim() || null })),
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

    const activeYearModules = activeModuleTab ? (yearModulesByInst[activeModuleTab] ?? []) : [];

    return (
        <div className="container-lg py-5">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '900px' }}>
                
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between pb-4 mb-4 border-bottom">
                    <div>
                        <h3 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                            <span className="iconify text-primary" data-icon="lucide:graduation-cap" data-width="28"></span>
                            New Course Details
                        </h3>
                        <p className="mb-0 text-muted fs-6">
                            Define a course once and securely link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg d-flex align-items-center gap-2 shadow-sm rounded-pill px-4" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:save"} data-width="20"></span>
                        <span className="fw-medium">{saving ? 'Saving...' : 'Save details'}</span>
                    </button>
                </div>

                {/* Success Message */}
                {savedMessage && (
                    <div className="alert alert-success d-flex align-items-center gap-2 shadow-sm border-0 rounded-4 p-3 mb-4">
                        <span className="iconify" data-icon="lucide:check-circle-2" data-width="24"></span>
                        <span className="fw-medium">{savedMessage}</span>
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <h5 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 28, height: 28, fontSize: 14}}>1</span>
                            Select Course
                        </h5>
                        <p className="text-muted fs-6 mb-4">Search or type a course to unlock the connected institutions.</p>
                        
                        <div className="row">
                            <div className="col-md-8">
                                <label className="form-label fw-semibold text-dark">Course Name <span className="text-danger">*</span></label>
                                <ComboboxInput
                                    placeholder="e.g. BSc Computer Science..."
                                    value={courseName}
                                    onChange={setCourseName}
                                    options={uniqueCourses}
                                    error={errors.course_name}
                                />
                                {errors.course_name && <div className="text-danger small mt-2 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Colleges & Universities */}
                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <h5 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 28, height: 28, fontSize: 14}}>2</span>
                            Select Institutions
                        </h5>
                        <p className="text-muted fs-6 mb-4">Check all the colleges this curriculum should apply to.</p>
                        
                        <div className="row">
                            <div className="col-md-8">
                                <label className="form-label fw-semibold text-dark">Colleges / Universities <span className="text-danger">*</span></label>
                                <MultiSelectDropdown 
                                    options={availableInstitutions}
                                    selectedKeys={selectedInstKeys}
                                    onToggle={toggleInstitution}
                                    disabled={!courseName || availableInstitutions.length === 0}
                                    placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                                />
                                {errors.institutions && <div className="text-danger small mt-2 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.institutions}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <h5 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 28, height: 28, fontSize: 14}}>3</span>
                            Global Course Information
                        </h5>
                        <p className="text-muted fs-6 mb-4">This description applies globally to the course.</p>
                        
                        <div className="mb-4">
                            <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2">
                                <span className="iconify text-muted" data-icon="lucide:file-text" data-width="18"></span> Course Summary
                            </label>
                            <SimpleWysiwyg
                                value={summaryHtml}
                                onChange={setSummaryHtml}
                                placeholder="Write an engaging overview of what this course covers..."
                                error={errors.summary}
                            />
                            {errors.summary && <div className="text-danger small mt-2 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.summary}</div>}
                        </div>

                        <div>
                            <label className="form-label fw-semibold text-dark d-flex align-items-center gap-2">
                                <span className="iconify text-muted" data-icon="lucide:briefcase" data-width="18"></span> Career Prospects
                            </label>
                            <SimpleWysiwyg
                                value={careersHtml}
                                onChange={setCareersHtml}
                                placeholder="Highlight future job opportunities after graduation..."
                                error={errors.careers_summary}
                            />
                            {errors.careers_summary && <div className="text-danger small mt-2 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.careers_summary}</div>}
                        </div>
                    </div>
                </div>

                {/* 4. Course Modules */}
                <div className="card border-0 shadow-sm mb-4 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
                            <div>
                                <h5 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 28, height: 28, fontSize: 14}}>4</span>
                                    Course Modules
                                </h5>
                                <p className="text-muted fs-6 mb-0">Configure the year-by-year syllabus per institution.</p>
                            </div>
                            
                            {activeModuleTab && (
                                <div className="d-flex gap-2">
                                    {selectedInstKeys.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-light border shadow-sm d-flex align-items-center gap-2"
                                            onClick={copyToAllInstitutions}
                                            title="Copy these modules to all other selected institutions"
                                        >
                                            <span className="iconify" data-icon="lucide:copy" data-width="16"></span>
                                            <span className="d-none d-sm-inline">Apply to all</span>
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-primary shadow-sm d-flex align-items-center gap-2" onClick={addYear}>
                                        <span className="iconify" data-icon="lucide:plus" data-width="16"></span> Add Year
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-muted p-5 border border-dashed rounded-4 bg-light text-center">
                                <span className="iconify opacity-25 mb-3 d-block mx-auto" data-icon="lucide:layers" data-width="40"></span>
                                <span className="fs-5 fw-medium">No institutions selected.</span><br/>
                                Please select at least one institution above to add modules.
                            </div>
                        ) : (
                            <>
                                {/* Institution Nav Pills */}
                                <ul className="nav nav-pills mb-4 flex-nowrap overflow-auto pb-2 gap-2" style={{ scrollbarWidth: 'thin' }}>
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeModuleTab;
                                        return (
                                            <li className="nav-item" key={key}>
                                                <button
                                                    type="button"
                                                    className={`nav-link rounded-pill border px-4 py-2 text-start d-flex flex-column transition-all ${isActive ? 'active shadow-sm border-primary' : 'bg-white text-dark border-light-subtle hover-bg-light'}`}
                                                    onClick={() => setActiveModuleTab(key)}
                                                    style={{ minWidth: '180px' }}
                                                >
                                                    <span className="fw-semibold d-block text-truncate" style={{ maxWidth: '200px' }}>{info ? info.label : key}</span>
                                                    <span className={`small d-block text-truncate ${isActive ? 'text-white-50' : 'text-muted'}`} style={{ maxWidth: '200px', fontSize: '0.75rem' }}>
                                                        {info?.subLabel}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Year Blocks */}
                                {activeYearModules.map((yearBlock, yearIndex) => (
                                    <div key={yearIndex} className="card border border-light-subtle shadow-none rounded-4 mb-4">
                                        <div className="card-header bg-light border-bottom p-3 px-4 d-flex align-items-center justify-content-between rounded-top-4">
                                            <div className="fw-bold text-dark d-flex align-items-center gap-2">
                                                <span className="iconify text-primary" data-icon="lucide:calendar" data-width="18"></span>
                                                Academic Year Set {yearIndex + 1}
                                            </div>
                                            {activeYearModules.length > 1 && (
                                                <button type="button" className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1 border-0" onClick={() => removeYear(yearIndex)}>
                                                    <span className="iconify" data-icon="lucide:trash-2" data-width="16"></span> <span className="d-none d-sm-inline">Remove Year</span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="card-body p-4">
                                            <div className="row g-3 mb-4">
                                                <div className="col-sm-3 col-md-2">
                                                    <label className="form-label small text-muted fw-semibold">Year Num</label>
                                                    <input type="number" min={1} className="form-control" value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                </div>
                                                <div className="col-sm-9 col-md-10">
                                                    <label className="form-label small text-muted fw-semibold">Year Title (Optional)</label>
                                                    <input type="text" className="form-control" placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                </div>
                                            </div>

                                            <label className="form-label small text-muted fw-semibold d-flex align-items-center gap-2">
                                                <span className="iconify" data-icon="lucide:book-open-check" data-width="16"></span> Modules Included
                                            </label>
                                            
                                            <div className="d-flex flex-column gap-2 mb-3">
                                                {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                    <div key={moduleIndex} className="d-flex gap-2">
                                                        <div className="input-group">
                                                            <span className="input-group-text bg-light text-muted border-end-0">{moduleIndex + 1}.</span>
                                                            <input type="text" className="form-control border-start-0 ps-0" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                        </div>
                                                        {yearBlock.modules.length > 1 && (
                                                            <button type="button" className="btn btn-light border text-danger flex-shrink-0 px-3" onClick={() => removeModuleLine(yearIndex, moduleIndex)} title="Remove Module">
                                                                <span className="iconify" data-icon="lucide:x" data-width="18"></span>
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            
                                            <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-3 mt-2" onClick={() => addModuleLine(yearIndex)}>
                                                <span className="iconify" data-icon="lucide:plus" data-width="14"></span> Add Module Subject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* 5. Fees */}
                <div className="card border-0 shadow-sm mb-5 rounded-4">
                    <div className="card-body p-4 p-md-5">
                        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-bold mb-2 text-dark d-flex align-items-center gap-2">
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 28, height: 28, fontSize: 14}}>5</span>
                                    Fee Structure
                                </h5>
                                <p className="text-muted fs-6 mb-0">Outline the standard estimated tuition per year.</p>
                            </div>
                            <button type="button" className="btn btn-primary shadow-sm d-flex align-items-center gap-2" onClick={addFeeYear}>
                                <span className="iconify" data-icon="lucide:plus" data-width="16"></span> Add Fee Row
                            </button>
                        </div>

                        <div className="bg-light p-3 p-md-4 rounded-4 border border-light-subtle">
                            {fees.map((fee, feeIndex) => (
                                <div key={feeIndex} className="row g-2 align-items-end mb-3 pb-3 border-bottom border-light-subtle last-no-border">
                                    <div className="col-4 col-md-2">
                                        <label className="form-label mb-1 small text-muted fw-semibold">Year</label>
                                        <input type="number" min={1} className="form-control" value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                    </div>
                                    <div className="col-8 col-md-2">
                                        <label className="form-label mb-1 small text-muted fw-semibold">Currency</label>
                                        <div className="input-group">
                                            <span className="input-group-text bg-white px-2">
                                                <span className="iconify text-muted" data-icon="lucide:coins" data-width="16"></span>
                                            </span>
                                            <input type="text" className="form-control ps-1" placeholder="USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="col-12 col-md-3">
                                        <label className="form-label mb-1 small text-muted fw-semibold">Amount</label>
                                        <input type="text" className="form-control" placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                    </div>
                                    <div className="col">
                                        <label className="form-label mb-1 small text-muted fw-semibold">Note (Optional)</label>
                                        <input type="text" className="form-control" placeholder="e.g. Tuition only" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                    </div>
                                    <div className="col-auto">
                                        {fees.length > 1 ? (
                                            <button type="button" className="btn btn-light border text-danger px-3 shadow-sm" onClick={() => removeFeeYear(feeIndex)} title="Remove row">
                                                <span className="iconify" data-icon="lucide:trash-2" data-width="18"></span>
                                            </button>
                                        ) : (
                                            <div style={{width: '50px'}} /> // spacing placeholder if no button
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="d-flex justify-content-end pb-5 pt-3">
                    <button type="submit" className="btn btn-primary btn-lg px-5 py-3 shadow d-flex align-items-center gap-2 rounded-pill" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:check-circle"} data-width="24"></span>
                        <span className="fw-bold fs-5">{saving ? 'Processing Details...' : 'Save All Details'}</span>
                    </button>
                </div>

                <style>{`
                    .last-no-border:last-child {
                        border-bottom: none !important;
                        margin-bottom: 0 !important;
                        padding-bottom: 0 !important;
                    }
                    .hover-bg-light:hover { background-color: #f8f9fa !important; }
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
            </form>
        </div>
    );
}