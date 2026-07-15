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
                className={`form-control ${error ? 'is-invalid' : ''}`}
                autoComplete="off"
            />
            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul
                    className="dropdown-menu show w-100 p-2 mt-1 shadow-sm border"
                    style={{ maxHeight: 240, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <a
                                href="javascript:void(0)"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
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
                className={`form-control d-flex justify-content-between align-items-center ${disabled ? 'bg-light text-muted' : 'cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
            >
                <span>{displayText}</span>
                <span className="small text-muted">▼</span>
            </div>
            
            {isOpen && !disabled && (
                <div 
                    className="dropdown-menu show w-100 p-2 mt-1 shadow border"
                    style={{ maxHeight: 260, overflowY: 'auto', position: 'absolute', zIndex: 1000 }}
                >
                    {options.length === 0 ? (
                        <div className="text-muted p-2 small">No institutions found.</div>
                    ) : (
                        options.map((opt) => (
                            <div 
                                key={opt.key} 
                                className="dropdown-item rounded px-2 py-1 mb-1 d-flex align-items-start gap-2"
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
                                    <div className="fw-semibold text-wrap lh-sm mb-1">{opt.label}</div>
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

    // Sync only when empty (to prevent cursor jumps while typing)
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
        <div className={`border rounded ${error ? 'border-danger' : ''}`}>
            {/* Toolbar */}
            <div className="bg-light p-2 border-bottom d-flex gap-2 rounded-top">
                <button type="button" className="btn btn-sm btn-light border px-3 fw-bold" onClick={() => exec('bold')} title="Bold">B</button>
                <button type="button" className="btn btn-sm btn-light border px-3 fst-italic" onClick={() => exec('italic')} title="Italic">I</button>
                <button type="button" className="btn btn-sm btn-light border px-3" onClick={() => exec('insertUnorderedList')} title="Bullet Points">• List</button>
            </div>
            
            {/* Editor Area */}
            <div
                ref={editorRef}
                className="p-3 bg-white rounded-bottom editor-content"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 140, outline: 'none' }}
                data-placeholder={placeholder}
            />

            {/* CSS for Placeholder when empty */}
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
    // Master data from the API
    const [masterData, setMasterData] = useState<ApiDataRow[]>([]);

    // 1. Course Selection
    const [courseName, setCourseName] = useState('');

    // 2. Institutions Selection (Dropdown with Checkboxes)
    const [selectedInstKeys, setSelectedInstKeys] = useState<string[]>([]);

    // Content fields (WYSIWYG)
    const [summaryHtml, setSummaryHtml] = useState('');
    const [careersHtml, setCareersHtml] = useState('');

    // Per-institution year-wise modules: { [instKey]: YearModule[] }
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    // Which institution tab is currently active in the modules section
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);

    const [fees, setFees] = useState<YearFee[]>([{ year: 1, amount: '', currency: '', note: '' }]);

    // UI States
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    // Fade out success message
    useEffect(() => {
        if (!savedMessage) return;
        const t = setTimeout(() => setSavedMessage(null), 4000);
        return () => clearTimeout(t);
    }, [savedMessage]);

    // Fetch master list on mount
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

    // ── Dynamic Options ──
    const uniqueCourses = useMemo(() => {
        return Array.from(new Set(masterData.map((item) => item.Course).filter(Boolean)));
    }, [masterData]);

    // Find all institutions that teach the currently typed/selected course
    const availableInstitutions = useMemo(() => {
        if (!courseName) return [];
        const matches = masterData.filter((d) => d.Course?.toLowerCase() === courseName.toLowerCase());
        const unique = new Map();
        matches.forEach((m) => {
            if (m.University && m.College) {
                const key = `${m.University}|||${m.College}`;
                if (!unique.has(key)) {
                    unique.set(key, { 
                        key, 
                        label: m.College, 
                        subLabel: m.University 
                    });
                }
            }
        });
        return Array.from(unique.values());
    }, [masterData, courseName]);

    // Lookup map so tabs can show label/subLabel without re-deriving each render
    const institutionLookup = useMemo(() => {
        const map = new Map<string, { label: string; subLabel: string }>();
        availableInstitutions.forEach((i) => map.set(i.key, { label: i.label, subLabel: i.subLabel }));
        return map;
    }, [availableInstitutions]);

    // Clear selections if course changes and old selections don't match anymore
    useEffect(() => {
        const validKeys = availableInstitutions.map(i => i.key);
        setSelectedInstKeys(prev => prev.filter(k => validKeys.includes(k)));
    }, [availableInstitutions]);

    // Keep yearModulesByInst in sync with selectedInstKeys:
    // - seed a default block for newly selected institutions
    // - drop entries for institutions that are no longer selected
    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => {
                next[key] = prev[key] ?? defaultYearModules();
            });
            return next;
        });

        // Keep the active tab valid: default to the first selected institution,
        // or clear it if nothing is selected.
        setActiveModuleTab((prevActive) => {
            if (prevActive && selectedInstKeys.includes(prevActive)) return prevActive;
            return selectedInstKeys.length > 0 ? selectedInstKeys[0] : null;
        });
    }, [selectedInstKeys]);

    // ── Handlers ──
    const toggleInstitution = (key: string) => {
        setSelectedInstKeys((prev) => 
            prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
        );
    };

    // ---- Per-institution Modules Repeaters Handlers ----
    // All handlers operate on the currently active tab's institution key.
    const addYear = () => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: [...prev[activeModuleTab], { year: nextYear(prev[activeModuleTab]), title: '', modules: [''] }],
        }));
    };

    const removeYear = (index: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: prev[activeModuleTab].filter((_, i) => i !== index),
        }));
    };

    const updateYear = (index: number, patch: Partial<YearModule>) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: prev[activeModuleTab].map((y, i) => (i === index ? { ...y, ...patch } : y)),
        }));
    };

    const addModuleLine = (yearIndex: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: prev[activeModuleTab].map((y, i) =>
                i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y,
            ),
        }));
    };

    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: prev[activeModuleTab].map((y, i) =>
                i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y,
            ),
        }));
    };

    const removeModuleLine = (yearIndex: number, moduleIndex: number) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({
            ...prev,
            [activeModuleTab]: prev[activeModuleTab].map((y, i) =>
                i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y,
            ),
        }));
    };

    // Convenience: copy the active tab's modules to all other selected institutions
    const copyToAllInstitutions = () => {
        if (!activeModuleTab) return;
        const source = yearModulesByInst[activeModuleTab];
        setYearModulesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => {
                if (key !== activeModuleTab) {
                    next[key] = JSON.parse(JSON.stringify(source));
                }
            });
            return next;
        });
    };

    // ---- Fees Handlers ----
    const addFeeYear = () => setFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    const removeFeeYear = (index: number) => setFees((prev) => prev.filter((_, i) => i !== index));
    const updateFeeYear = (index: number, patch: Partial<YearFee>) =>
        setFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    // ---- Form Submission ----
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        if (!courseName.trim()) {
            setErrors({ course_name: 'Course name is required.' });
            return;
        }
        if (selectedInstKeys.length === 0) {
            setErrors({ institutions: 'Please select at least one institution from the dropdown.' });
            return;
        }

        setSaving(true);
        setErrors({});

        const cleanModulesFor = (key: string) =>
            (yearModulesByInst[key] ?? [])
                .filter((y) => y.year)
                .map((y) => ({
                    year: y.year,
                    title: y.title.trim() || null,
                    modules: y.modules.map((m) => m.trim()).filter(Boolean),
                }));

        // Map selected keys back into objects, each with its OWN modules
        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');
            return {
                university_name: uni,
                college_name: col,
                year_wise_modules: cleanModulesFor(key),
            };
        });

        const payload = {
            course_name: courseName.trim(),
            summary: summaryHtml.trim() || null,
            careers_summary: careersHtml.trim() || null,
            institutions: institutionsPayload,
            fees: fees
                .filter((f) => f.year)
                .map((f) => ({
                    year: f.year,
                    amount: f.amount.trim() || null,
                    currency: f.currency.trim() || null,
                    note: f.note.trim() || null,
                })),
        };

        fetch('/course-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': csrfToken(),
            },
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
        <div className="container-fluid py-4">
            <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
                    <div>
                        <h4 className="mb-1 fw-semibold">New Course Details</h4>
                        <p className="mb-0 text-body-secondary">
                            Define a course once and link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save details'}
                    </button>
                </div>

                {savedMessage && <div className="alert alert-success">{savedMessage}</div>}

                {/* 1. Course Selection */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">1. Select Course</h5>
                        <p className="text-body-secondary fs-6 mb-3">
                            Select a Course first to unlock the Institutions dropdown.
                        </p>
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Course Name <span className="text-danger">*</span></label>
                                <ComboboxInput
                                    placeholder="Type or select a Course"
                                    value={courseName}
                                    onChange={setCourseName}
                                    options={uniqueCourses}
                                    error={errors.course_name}
                                />
                                {errors.course_name && <div className="text-danger small mt-1">{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. College & University Multi-Select Dropdown */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">2. Select Institutions</h5>
                        <p className="text-body-secondary fs-6 mb-3">
                            Open the dropdown to check all the colleges this setup should apply to.
                        </p>
                        <div className="row">
                            <div className="col-md-6">
                                <label className="form-label fw-bold">Colleges / Universities <span className="text-danger">*</span></label>
                                <MultiSelectDropdown 
                                    options={availableInstitutions}
                                    selectedKeys={selectedInstKeys}
                                    onToggle={toggleInstitution}
                                    disabled={!courseName || availableInstitutions.length === 0}
                                    placeholder={!courseName ? "Select a course first..." : "Select institutions..."}
                                />
                                {errors.institutions && <div className="text-danger small mt-1">{errors.institutions}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Course Summary & Careers (WYSIWYG Supported) */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">3. Global Course Information</h5>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Course Summary</label>
                            <SimpleWysiwyg
                                value={summaryHtml}
                                onChange={setSummaryHtml}
                                placeholder="Give an overview of what this course covers..."
                                error={errors.summary}
                            />
                            {errors.summary && <div className="text-danger small mt-1">{errors.summary}</div>}
                        </div>
                        <div>
                            <label className="form-label fw-bold">Careers After This Course</label>
                            <SimpleWysiwyg
                                value={careersHtml}
                                onChange={setCareersHtml}
                                placeholder="List career prospects..."
                                error={errors.careers_summary}
                            />
                            {errors.careers_summary && <div className="text-danger small mt-1">{errors.careers_summary}</div>}
                        </div>
                    </div>
                </div>

                {/* 4. Per-institution Year-wise modules */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                            <div>
                                <h5 className="fw-semibold mb-1">4. Course Modules</h5>
                                <p className="text-body-secondary fs-6 mb-0">
                                    Each institution below has its own independent module list. Switch tabs to edit each one.
                                </p>
                            </div>
                            {activeModuleTab && (
                                <div className="d-flex gap-2">
                                    {selectedInstKeys.length > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={copyToAllInstitutions}
                                            title="Copy this institution's modules to all other selected institutions"
                                        >
                                            Copy to all institutions
                                        </button>
                                    )}
                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={addYear}>
                                        + Add year
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-muted p-3 border rounded bg-light text-center">
                                Select at least one institution above to start adding modules.
                            </div>
                        ) : (
                            <>
                                {/* Institution Tabs */}
                                <ul className="nav nav-tabs mb-3 flex-nowrap overflow-auto">
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeModuleTab;
                                        return (
                                            <li className="nav-item" key={key} style={{ whiteSpace: 'nowrap' }}>
                                                <button
                                                    type="button"
                                                    className={`nav-link ${isActive ? 'active' : ''}`}
                                                    onClick={() => setActiveModuleTab(key)}
                                                >
                                                    {info ? info.label : key}
                                                    <span className="text-muted small d-block" style={{ fontWeight: 400 }}>
                                                        {info?.subLabel}
                                                    </span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {activeYearModules.map((yearBlock, yearIndex) => (
                                    <div key={yearIndex} className="border rounded p-3 mb-3 bg-light bg-opacity-50">
                                        <div className="row g-2 align-items-center mb-3">
                                            <div className="col-auto">
                                                <label className="form-label mb-0 small text-body-secondary fw-bold">Year</label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="form-control"
                                                    style={{ width: 90 }}
                                                    value={yearBlock.year}
                                                    onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })}
                                                />
                                            </div>
                                            <div className="col">
                                                <label className="form-label mb-0 small text-body-secondary fw-bold">Title (optional)</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={`e.g. Year ${yearBlock.year} Fundamentals`}
                                                    value={yearBlock.title}
                                                    onChange={(e) => updateYear(yearIndex, { title: e.target.value })}
                                                />
                                            </div>
                                            <div className="col-auto align-self-end">
                                                {activeYearModules.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => removeYear(yearIndex)}
                                                    >
                                                        Remove year
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <label className="form-label small text-body-secondary fw-bold">Modules List</label>
                                        {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                            <div key={moduleIndex} className="d-flex gap-2 mb-2">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder={`Module ${moduleIndex + 1}`}
                                                    value={moduleValue}
                                                    onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)}
                                                />
                                                {yearBlock.modules.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-outline-danger"
                                                        onClick={() => removeModuleLine(yearIndex, moduleIndex)}
                                                    >
                                                        ×
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-sm btn-light border mt-1" onClick={() => addModuleLine(yearIndex)}>
                                            + Add module line
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* 5. Fees */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="fw-semibold mb-0">5. Fee Summary (per year)</h5>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addFeeYear}>
                                + Add fee year
                            </button>
                        </div>

                        {fees.map((fee, feeIndex) => (
                            <div key={feeIndex} className="row g-2 align-items-end mb-2">
                                <div className="col-auto">
                                    <label className="form-label mb-0 small text-body-secondary fw-bold">Year</label>
                                    <input
                                        type="number"
                                        min={1}
                                        className="form-control"
                                        style={{ width: 90 }}
                                        value={fee.year}
                                        onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })}
                                    />
                                </div>
                                <div className="col-auto">
                                    <label className="form-label mb-0 small text-body-secondary fw-bold">Currency</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ width: 90 }}
                                        placeholder="USD"
                                        value={fee.currency}
                                        onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label mb-0 small text-body-secondary fw-bold">Amount</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. 12,000"
                                        value={fee.amount}
                                        onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label mb-0 small text-body-secondary fw-bold">Note (optional)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. Tuition only"
                                        value={fee.note}
                                        onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })}
                                    />
                                </div>
                                <div className="col-auto">
                                    {fees.length > 1 && (
                                        <button type="button" className="btn btn-outline-danger" onClick={() => removeFeeYear(feeIndex)}>
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="d-flex justify-content-end pb-5 mb-5">
                    <button type="submit" className="btn btn-primary px-4 py-2" disabled={saving}>
                        {saving ? 'Saving Details…' : 'Save Details'}
                    </button>
                </div>
            </form>
        </div>
    );
}