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
// 1. ComboboxInput — Searchable dropdown combined with text input
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
            <div className="input-group shadow-sm rounded-2">
                <span className="input-group-text bg-white border-end-0 text-muted ps-2 pe-2">
                    <span className="iconify" data-icon="lucide:search" data-width="18"></span>
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
                    className={`form-control border-start-0 ps-0 ${error ? 'is-invalid border-danger' : ''}`}
                    autoComplete="off"
                    style={{ boxShadow: 'none' }}
                />
            </div>
            
            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul
                    className="dropdown-menu show w-100 p-2 mt-1 shadow border-0 rounded-2"
                    style={{ maxHeight: 240, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <a
                                href="javascript:void(0)"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                                className="dropdown-item rounded py-1 d-flex align-items-center gap-2"
                            >
                                <span className="iconify text-muted" data-icon="lucide:book" data-width="14"></span>
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
// 2. MultiSelect Dropdown — Checkbox dropdown
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
                className={`form-control shadow-sm d-flex justify-content-between align-items-center rounded-2 ${disabled ? 'bg-light text-muted border-light' : 'bg-white cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                <div className="d-flex align-items-center gap-2">
                    <span className="iconify text-muted" data-icon="lucide:building-2" data-width="18"></span>
                    <span>{displayText}</span>
                </div>
                <span className="iconify text-muted" data-icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} data-width="18"></span>
            </div>
            
            {isOpen && !disabled && (
                <div 
                    className="dropdown-menu show w-100 p-2 mt-1 shadow border-0 rounded-2"
                    style={{ maxHeight: 280, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {options.length === 0 ? (
                        <div className="text-muted p-2 text-center small">
                            <span className="iconify mb-1 opacity-50 d-block mx-auto" data-icon="lucide:inbox" data-width="20"></span>
                            No institutions found.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <div 
                                key={opt.key} 
                                className="dropdown-item rounded px-2 py-2 mb-1 d-flex align-items-start gap-2"
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
                                    style={{ cursor: 'pointer' }}
                                />
                                <div>
                                    <div className="fw-medium text-wrap lh-sm mb-1 text-dark small">{opt.label}</div>
                                    <div className="text-muted text-wrap lh-sm" style={{fontSize: '0.75rem'}}>{opt.subLabel}</div>
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
// 3. Simple WYSIWYG Editor
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
        <div className={`border rounded-2 shadow-sm bg-white overflow-hidden ${error ? 'border-danger' : 'border-light-subtle'}`}>
            <div className="bg-light p-1 border-bottom d-flex gap-1">
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('bold')} title="Bold">
                    <span className="iconify" data-icon="lucide:bold" data-width="16"></span>
                </button>
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('italic')} title="Italic">
                    <span className="iconify" data-icon="lucide:italic" data-width="16"></span>
                </button>
                <div className="vr mx-1 opacity-25"></div>
                <button type="button" className="btn btn-sm btn-white border bg-white shadow-sm px-2 text-dark" onClick={() => exec('insertUnorderedList')} title="Bullet Points">
                    <span className="iconify" data-icon="lucide:list" data-width="16"></span>
                </button>
            </div>
            <div
                ref={editorRef}
                className="p-3 bg-white editor-content small"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 120, outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`.editor-content:empty:before { content: attr(data-placeholder); color: #adb5bd; pointer-events: none; display: block; }`}</style>
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
    
    // Modules per institution
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);

    // Fees per institution
    const [feesByInst, setFeesByInst] = useState<Record<string, YearFee[]>>({});
    const [activeFeeTab, setActiveFeeTab] = useState<string | null>(null);

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

    // Keep Modules and Fees in sync with selected institutions
    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearModules(); });
            return next;
        });
        setActiveModuleTab((prevActive) => (prevActive && selectedInstKeys.includes(prevActive) ? prevActive : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));

        setFeesByInst((prev) => {
            const next: Record<string, YearFee[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearFee(); });
            return next;
        });
        setActiveFeeTab((prevActive) => (prevActive && selectedInstKeys.includes(prevActive) ? prevActive : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));
    }, [selectedInstKeys]);

    const toggleInstitution = (key: string) => setSelectedInstKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    // -- Module Handlers --
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

    // -- Fee Handlers --
    const addFeeYear = () => {
        if (!activeFeeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeFeeTab]: [...prev[activeFeeTab], { year: nextYear(prev[activeFeeTab]), amount: '', currency: '', note: '' }] }));
    };
    const removeFeeYear = (index: number) => {
        if (!activeFeeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeFeeTab]: prev[activeFeeTab].filter((_, i) => i !== index) }));
    };
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => {
        if (!activeFeeTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeFeeTab]: prev[activeFeeTab].map((f, i) => (i === index ? { ...f, ...patch } : f)) }));
    };
    const copyFeesToAllInstitutions = () => {
        if (!activeFeeTab) return;
        const source = feesByInst[activeFeeTab];
        setFeesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeFeeTab) next[key] = JSON.parse(JSON.stringify(source)); });
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

        // Maintain global fees array just in case the backend still requires it at root level
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

    const activeYearModules = activeModuleTab ? (yearModulesByInst[activeModuleTab] ?? []) : [];
    const activeYearFees = activeFeeTab ? (feesByInst[activeFeeTab] ?? []) : [];

    return (
        <div className="container-lg py-4">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '850px' }}>
                
                {/* Header */}
                <div className="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom">
                    <div>
                        <h4 className="mb-1 fw-bold text-dark d-flex align-items-center gap-2">
                            <span className="iconify text-primary" data-icon="lucide:graduation-cap" data-width="24"></span>
                            New Course Details
                        </h4>
                        <p className="mb-0 text-muted small">
                            Define a course once and securely link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary d-flex align-items-center gap-2 shadow-sm rounded-pill px-3" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:save"} data-width="16"></span>
                        <span className="fw-medium small">{saving ? 'Saving...' : 'Save details'}</span>
                    </button>
                </div>

                {savedMessage && (
                    <div className="alert alert-success d-flex align-items-center gap-2 shadow-sm border-0 rounded-3 p-2 mb-4 small">
                        <span className="iconify" data-icon="lucide:check-circle-2" data-width="18"></span>
                        <span className="fw-medium">{savedMessage}</span>
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="card border-0 shadow-sm mb-4 rounded-3">
                    <div className="card-body p-3 p-md-4">
                        <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 22, height: 22, fontSize: 11}}>1</span>
                            Select Course
                        </h6>
                        <p className="text-muted small mb-3">Search or type a course to unlock the connected institutions.</p>
                        
                        <div className="row">
                            <div className="col-md-8">
                                <label className="form-label fw-semibold text-dark small">Course Name <span className="text-danger">*</span></label>
                                <ComboboxInput
                                    placeholder="e.g. BSc Computer Science..."
                                    value={courseName}
                                    onChange={setCourseName}
                                    options={uniqueCourses}
                                    error={errors.course_name}
                                />
                                {errors.course_name && <div className="text-danger small mt-1 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Colleges & Universities */}
                <div className="card border-0 shadow-sm mb-4 rounded-3">
                    <div className="card-body p-3 p-md-4">
                        <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 22, height: 22, fontSize: 11}}>2</span>
                            Select Institutions
                        </h6>
                        <p className="text-muted small mb-3">Check all the colleges this curriculum should apply to.</p>
                        
                        <div className="row">
                            <div className="col-md-8">
                                <label className="form-label fw-semibold text-dark small">Colleges / Universities <span className="text-danger">*</span></label>
                                <MultiSelectDropdown 
                                    options={availableInstitutions}
                                    selectedKeys={selectedInstKeys}
                                    onToggle={toggleInstitution}
                                    disabled={!courseName || availableInstitutions.length === 0}
                                    placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                                />
                                {errors.institutions && <div className="text-danger small mt-1 d-flex align-items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.institutions}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="card border-0 shadow-sm mb-4 rounded-3">
                    <div className="card-body p-3 p-md-4">
                        <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                            <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 22, height: 22, fontSize: 11}}>3</span>
                            Global Course Information
                        </h6>
                        <p className="text-muted small mb-3">This description applies globally to the course.</p>
                        
                        <div className="mb-3">
                            <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-1">
                                <span className="iconify text-muted" data-icon="lucide:file-text" data-width="16"></span> Course Summary
                            </label>
                            <SimpleWysiwyg value={summaryHtml} onChange={setSummaryHtml} placeholder="Write an engaging overview..." error={errors.summary} />
                        </div>

                        <div>
                            <label className="form-label fw-semibold text-dark small d-flex align-items-center gap-1">
                                <span className="iconify text-muted" data-icon="lucide:briefcase" data-width="16"></span> Career Prospects
                            </label>
                            <SimpleWysiwyg value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers_summary} />
                        </div>
                    </div>
                </div>

                {/* 4. Course Modules */}
                <div className="card border-0 shadow-sm mb-4 rounded-3">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 22, height: 22, fontSize: 11}}>4</span>
                                    Course Modules (Per Institution)
                                </h6>
                                <p className="text-muted small mb-0">Configure the syllabus independently for each selected college.</p>
                            </div>
                            
                            {activeModuleTab && (
                                <div className="d-flex gap-2">
                                    {selectedInstKeys.length > 1 && (
                                        <button type="button" className="btn btn-sm btn-light border shadow-sm d-flex align-items-center gap-1" onClick={copyToAllInstitutions} title="Copy to all">
                                            <span className="iconify" data-icon="lucide:copy" data-width="14"></span> <span className="d-none d-sm-inline small">Apply to all</span>
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-sm btn-primary shadow-sm d-flex align-items-center gap-1" onClick={addYear}>
                                        <span className="iconify" data-icon="lucide:plus" data-width="14"></span> Add Year
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-muted p-4 border border-dashed rounded-3 bg-light text-center small">
                                <span className="iconify opacity-25 mb-2 d-block mx-auto" data-icon="lucide:layers" data-width="32"></span>
                                No institutions selected.
                            </div>
                        ) : (
                            <>
                                <ul className="nav nav-pills mb-3 flex-nowrap overflow-auto pb-1 gap-2" style={{ scrollbarWidth: 'thin' }}>
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeModuleTab;
                                        return (
                                            <li className="nav-item" key={key}>
                                                <button type="button" className={`nav-link rounded-pill border px-3 py-1 text-start d-flex flex-column transition-all ${isActive ? 'active shadow-sm border-primary' : 'bg-white text-dark border-light-subtle hover-bg-light'}`} onClick={() => setActiveModuleTab(key)} style={{ minWidth: '150px' }}>
                                                    <span className="fw-semibold d-block text-truncate small" style={{ maxWidth: '170px' }}>{info ? info.label : key}</span>
                                                    <span className={`d-block text-truncate ${isActive ? 'text-white-50' : 'text-muted'}`} style={{ maxWidth: '170px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {activeYearModules.map((yearBlock, yearIndex) => (
                                    <div key={yearIndex} className="card border border-light-subtle shadow-none rounded-3 mb-3">
                                        <div className="card-header bg-light border-bottom p-2 px-3 d-flex align-items-center justify-content-between rounded-top-3">
                                            <div className="fw-semibold text-dark small d-flex align-items-center gap-1">
                                                <span className="iconify text-primary" data-icon="lucide:calendar" data-width="16"></span> Academic Year Set {yearIndex + 1}
                                            </div>
                                            {activeYearModules.length > 1 && (
                                                <button type="button" className="btn btn-sm text-danger d-flex align-items-center gap-1 border-0 py-0" onClick={() => removeYear(yearIndex)}>
                                                    <span className="iconify" data-icon="lucide:trash-2" data-width="14"></span>
                                                </button>
                                            )}
                                        </div>
                                        <div className="card-body p-3">
                                            <div className="row g-2 mb-3">
                                                <div className="col-sm-3 col-md-2">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Year Num</label>
                                                    <input type="number" min={1} className="form-control form-control-sm" value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                </div>
                                                <div className="col-sm-9 col-md-10">
                                                    <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Year Title (Optional)</label>
                                                    <input type="text" className="form-control form-control-sm" placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                </div>
                                            </div>
                                            
                                            <div className="d-flex flex-column gap-2">
                                                {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                    <div key={moduleIndex} className="d-flex gap-2">
                                                        <div className="input-group input-group-sm">
                                                            <span className="input-group-text bg-light text-muted border-end-0">{moduleIndex + 1}.</span>
                                                            <input type="text" className="form-control border-start-0 ps-0" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                        </div>
                                                        {yearBlock.modules.length > 1 && (
                                                            <button type="button" className="btn btn-sm btn-light border text-danger flex-shrink-0 px-2" onClick={() => removeModuleLine(yearIndex, moduleIndex)}><span className="iconify" data-icon="lucide:x" data-width="14"></span></button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 rounded-pill px-2 mt-2" style={{fontSize: '0.75rem'}} onClick={() => addModuleLine(yearIndex)}>
                                                <span className="iconify" data-icon="lucide:plus" data-width="12"></span> Add Module Subject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* 5. Fees */}
                <div className="card border-0 shadow-sm mb-5 rounded-3">
                    <div className="card-body p-3 p-md-4">
                        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                                <h6 className="fw-bold mb-1 text-dark d-flex align-items-center gap-2">
                                    <span className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{width: 22, height: 22, fontSize: 11}}>5</span>
                                    Fee Structure (Per Institution)
                                </h6>
                                <p className="text-muted small mb-0">Outline the standard estimated tuition independently for each selected college.</p>
                            </div>
                            
                            {activeFeeTab && (
                                <div className="d-flex gap-2">
                                    {selectedInstKeys.length > 1 && (
                                        <button type="button" className="btn btn-sm btn-light border shadow-sm d-flex align-items-center gap-1" onClick={copyFeesToAllInstitutions} title="Copy to all">
                                            <span className="iconify" data-icon="lucide:copy" data-width="14"></span> <span className="d-none d-sm-inline small">Apply to all</span>
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-sm btn-primary shadow-sm d-flex align-items-center gap-1" onClick={addFeeYear}>
                                        <span className="iconify" data-icon="lucide:plus" data-width="14"></span> Add Fee Row
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-muted p-4 border border-dashed rounded-3 bg-light text-center small">
                                <span className="iconify opacity-25 mb-2 d-block mx-auto" data-icon="lucide:coins" data-width="32"></span>
                                No institutions selected.
                            </div>
                        ) : (
                            <>
                                <ul className="nav nav-pills mb-3 flex-nowrap overflow-auto pb-1 gap-2" style={{ scrollbarWidth: 'thin' }}>
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeFeeTab;
                                        return (
                                            <li className="nav-item" key={key}>
                                                <button type="button" className={`nav-link rounded-pill border px-3 py-1 text-start d-flex flex-column transition-all ${isActive ? 'active shadow-sm border-primary' : 'bg-white text-dark border-light-subtle hover-bg-light'}`} onClick={() => setActiveFeeTab(key)} style={{ minWidth: '150px' }}>
                                                    <span className="fw-semibold d-block text-truncate small" style={{ maxWidth: '170px' }}>{info ? info.label : key}</span>
                                                    <span className={`d-block text-truncate ${isActive ? 'text-white-50' : 'text-muted'}`} style={{ maxWidth: '170px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                <div className="bg-light p-3 rounded-3 border border-light-subtle">
                                    {/* Indicator showing which institution's fees are being edited */}
                                    {activeFeeTab && institutionLookup.has(activeFeeTab) && (
                                        <div className="mb-3 d-flex align-items-center gap-2 text-primary bg-primary bg-opacity-10 px-3 py-2 rounded-2 small fw-medium">
                                            <span className="iconify" data-icon="lucide:info" data-width="14"></span>
                                            Editing fees for: {institutionLookup.get(activeFeeTab)?.label} ({institutionLookup.get(activeFeeTab)?.subLabel})
                                        </div>
                                    )}

                                    {activeYearFees.map((fee, feeIndex) => (
                                        <div key={feeIndex} className="row g-2 align-items-end mb-2 pb-2 border-bottom border-light-subtle last-no-border">
                                            <div className="col-4 col-md-2">
                                                <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Year</label>
                                                <input type="number" min={1} className="form-control form-control-sm" value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                            </div>
                                            <div className="col-8 col-md-3">
                                                <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Currency</label>
                                                <div className="input-group input-group-sm">
                                                    <span className="input-group-text bg-white px-2"><span className="iconify text-muted" data-icon="lucide:coins" data-width="14"></span></span>
                                                    <input type="text" className="form-control ps-1" placeholder="NPR/USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                                </div>
                                            </div>
                                            <div className="col-12 col-md-3">
                                                <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Amount</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                            </div>
                                            <div className="col">
                                                <label className="form-label text-muted fw-semibold mb-1" style={{fontSize: '0.75rem'}}>Note</label>
                                                <input type="text" className="form-control form-control-sm" placeholder="Tuition" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                            </div>
                                            <div className="col-auto">
                                                {activeYearFees.length > 1 ? (
                                                    <button type="button" className="btn btn-sm btn-light border text-danger px-2 shadow-sm" onClick={() => removeFeeYear(feeIndex)}>
                                                        <span className="iconify" data-icon="lucide:trash-2" data-width="14"></span>
                                                    </button>
                                                ) : (
                                                    <div style={{width: '32px'}} />
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="d-flex justify-content-end pb-5 pt-2">
                    <button type="submit" className="btn btn-primary px-4 py-2 shadow-sm d-flex align-items-center gap-2 rounded-pill" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:check-circle"} data-width="18"></span>
                        <span className="fw-medium small">{saving ? 'Processing...' : 'Save All Details'}</span>
                    </button>
                </div>

                <style>{`
                    .last-no-border:last-child { border-bottom: none !important; margin-bottom: 0 !important; padding-bottom: 0 !important; }
                    .hover-bg-light:hover { background-color: #f8f9fa !important; }
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
            </form>
        </div>
    );
}