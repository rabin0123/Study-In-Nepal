import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

// ── interfaces ──
type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

interface ApiDataRow {
    id: number;
    University: string;
    College: string;
    Course: string;
    [key: string]: any;
}

interface ComboboxInputProps {
    placeholder?: string;
    value: string;
    onChange: (val: string) => void;
    options: string[];
    disabled?: boolean;
    error?: string;
}

// ── Helpers ──
function nextYear(existing: { year: number }[]): number {
    return !existing || existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

// ---------------------------------------------------------------------------
// ComboboxInput — Searchable dropdown combined with text input
// ---------------------------------------------------------------------------
function ComboboxInput({ placeholder, value, onChange, options, disabled, error }: ComboboxInputProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setQuery(value);
    }, [value]);

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
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onChange(opt);
                                    setIsOpen(false);
                                }}
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

// ----------------------------------------------------------------------
// Reusable HTML Template editor with an interactive preview tab
// ----------------------------------------------------------------------
function HtmlField({
    value,
    onChange,
    placeholder,
    error,
    rows = 6,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
    rows?: number;
}) {
    const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

    return (
        <div className="card border shadow-none mb-2">
            <div className="card-header bg-light d-flex justify-content-between align-items-center py-2 px-3 border-bottom-0">
                <div className="nav nav-pills card-header-pills gap-1">
                    <button
                        type="button"
                        className={`btn btn-sm py-1 px-3 ${activeTab === 'write' ? 'btn-primary' : 'btn-light text-dark border'}`}
                        onClick={() => setActiveTab('write')}
                    >
                        Edit HTML
                    </button>
                    <button
                        type="button"
                        className={`btn btn-sm py-1 px-3 ${activeTab === 'preview' ? 'btn-primary' : 'btn-light text-dark border'}`}
                        onClick={() => setActiveTab('preview')}
                    >
                        Preview HTML
                    </button>
                </div>
            </div>
            <div className="card-body p-0 border-top">
                {activeTab === 'write' ? (
                    <textarea
                        className={`form-control border-0 rounded-0 ${error ? 'is-invalid' : ''}`}
                        style={{ outline: 'none', boxShadow: 'none' }}
                        rows={rows}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                    />
                ) : (
                    <div
                        className="p-3 bg-white overflow-auto border-0 rounded-bottom"
                        style={{ minHeight: `${rows * 24}px` }}
                        dangerouslySetInnerHTML={{
                            __html: value.trim() || '<em class="text-muted">No content to preview yet.</em>',
                        }}
                    />
                )}
            </div>
            {error && <div className="text-danger small mt-1 px-3 pb-2">{error}</div>}
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

    // 2. Institutions Selection (Multiple Checkboxes)
    // We store a combined string "UniversityName|||CollegeName" to ensure uniqueness
    const [selectedInstKeys, setSelectedInstKeys] = useState<string[]>([]);

    // Content fields
    const [summaryHtml, setSummaryHtml] = useState('');
    const [careersHtml, setCareersHtml] = useState('');
    const [fees, setFees] = useState<YearFee[]>([{ year: 1, amount: '', currency: '', note: '' }]);

    // 3. Modules (Tabbed per College)
    // Structure: { "Uni|||College": [ { year: 1, modules: [] } ] }
    const [collegeModules, setCollegeModules] = useState<Record<string, YearModule[]>>({});
    const [activeTabKey, setActiveTabKey] = useState<string>('');

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
                    unique.set(key, { university: m.University, college: m.College, key });
                }
            }
        });
        return Array.from(unique.values());
    }, [masterData, courseName]);

    // Keep active tab valid
    useEffect(() => {
        if (selectedInstKeys.length > 0 && !selectedInstKeys.includes(activeTabKey)) {
            setActiveTabKey(selectedInstKeys[0]);
        } else if (selectedInstKeys.length === 0) {
            setActiveTabKey('');
        }
    }, [selectedInstKeys, activeTabKey]);

    // ── Handlers ──
    const toggleInstitution = (key: string) => {
        setSelectedInstKeys((prev) => {
            if (prev.includes(key)) {
                return prev.filter((k) => k !== key);
            } else {
                // Initialize default modules for this new college if it doesn't exist yet
                setCollegeModules((cm) => ({
                    ...cm,
                    [key]: cm[key] || [{ year: 1, title: 'Year 1', modules: [''] }],
                }));
                return [...prev, key];
            }
        });
    };

    // ---- Tabbed Repeaters Handlers ----
    const addYear = (instKey: string) => {
        setCollegeModules((prev) => {
            const current = prev[instKey] || [];
            return { ...prev, [instKey]: [...current, { year: nextYear(current), title: '', modules: [''] }] };
        });
    };

    const removeYear = (instKey: string, index: number) => {
        setCollegeModules((prev) => ({
            ...prev,
            [instKey]: prev[instKey].filter((_, i) => i !== index),
        }));
    };

    const updateYear = (instKey: string, index: number, patch: Partial<YearModule>) => {
        setCollegeModules((prev) => ({
            ...prev,
            [instKey]: prev[instKey].map((y, i) => (i === index ? { ...y, ...patch } : y)),
        }));
    };

    const addModuleLine = (instKey: string, yearIndex: number) => {
        setCollegeModules((prev) => ({
            ...prev,
            [instKey]: prev[instKey].map((y, i) => (i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y)),
        }));
    };

    const updateModuleLine = (instKey: string, yearIndex: number, moduleIndex: number, value: string) => {
        setCollegeModules((prev) => ({
            ...prev,
            [instKey]: prev[instKey].map((y, i) =>
                i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y
            ),
        }));
    };

    const removeModuleLine = (instKey: string, yearIndex: number, moduleIndex: number) => {
        setCollegeModules((prev) => ({
            ...prev,
            [instKey]: prev[instKey].map((y, i) =>
                i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y
            ),
        }));
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
            setErrors({ institutions: 'Please select at least one institution.' });
            return;
        }

        setSaving(true);
        setErrors({});

        // Map selected keys back into objects, attaching their specific modules
        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');
            const instModules = collegeModules[key] || [];
            
            return {
                university_name: uni,
                college_name: col,
                year_wise_modules: instModules
                    .filter((y) => y.year)
                    .map((y) => ({
                        year: y.year,
                        title: y.title.trim() || null,
                        modules: y.modules.map((m) => m.trim()).filter(Boolean),
                    })),
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

    return (
        <div className="container-fluid py-4">
            <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4 mt-2">
                    <div>
                        <h4 className="mb-1 fw-semibold">New Course Details</h4>
                        <p className="mb-0 text-body-secondary">
                            Define a course once and link it to multiple colleges with unique module structures.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save details'}
                    </button>
                </div>

                {savedMessage && <div className="alert alert-success">{savedMessage}</div>}
                {errors.institutions && <div className="alert alert-danger">{errors.institutions}</div>}

                {/* 1. Course Selection */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">1. Select Course</h5>
                        <p className="text-body-secondary fs-6 mb-3">
                            Select a Course first to automatically load the Universities and Colleges where it is taught.
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

                {/* 2. College & University Multi-Select */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">2. Select Institutions</h5>
                        <p className="text-body-secondary fs-6 mb-3">
                            Select which colleges (and their associated universities) this course mapping applies to.
                        </p>
                        
                        {!courseName ? (
                            <div className="p-3 bg-light rounded text-muted text-center border border-dashed">
                                Please select a course above to see available institutions.
                            </div>
                        ) : availableInstitutions.length === 0 ? (
                            <div className="p-3 bg-light rounded text-muted text-center border border-dashed">
                                No institutions found for <strong>{courseName}</strong> in the master list.
                            </div>
                        ) : (
                            <div className="row g-3">
                                {availableInstitutions.map((inst) => (
                                    <div key={inst.key} className="col-md-6">
                                        <div 
                                            className={`border rounded p-3 cursor-pointer ${selectedInstKeys.includes(inst.key) ? 'border-primary bg-primary-subtle' : ''}`}
                                            onClick={() => toggleInstitution(inst.key)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div className="form-check m-0 d-flex align-items-center gap-2">
                                                <input 
                                                    className="form-check-input mt-0" 
                                                    type="checkbox" 
                                                    checked={selectedInstKeys.includes(inst.key)}
                                                    onChange={() => {}} // Handled by parent div click
                                                />
                                                <div>
                                                    <div className="fw-bold">{inst.college}</div>
                                                    <div className="small text-muted">{inst.university}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Course Summary & Careers (HTML Supported) */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">3. Global Course Information</h5>
                        <div className="mb-4">
                            <label className="form-label fw-bold">Course Summary (HTML Supported)</label>
                            <HtmlField
                                value={summaryHtml}
                                onChange={setSummaryHtml}
                                placeholder="<p>Give an overview of what this course covers, who it's for, and what makes it distinct...</p>"
                                error={errors.summary}
                                rows={5}
                            />
                        </div>
                        <div>
                            <label className="form-label fw-bold">Careers After This Course (HTML Supported)</label>
                            <HtmlField
                                value={careersHtml}
                                onChange={setCareersHtml}
                                placeholder="<ul><li>Software Engineer</li><li>Data Analyst</li></ul>"
                                error={errors.careers_summary}
                                rows={4}
                            />
                        </div>
                    </div>
                </div>

                {/* 4. Tabbed Year-wise modules */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-1">4. College-Specific Modules</h5>
                        <p className="text-body-secondary fs-6 mb-4">
                            Define the year-by-year modules. Use the tabs to adjust the curriculum for each specific college if they differ.
                        </p>

                        {selectedInstKeys.length === 0 ? (
                            <div className="p-4 bg-light rounded text-muted text-center border border-dashed">
                                Select at least one institution above to define course modules.
                            </div>
                        ) : (
                            <div>
                                {/* Bootstrap Tabs Header */}
                                <ul className="nav nav-tabs mb-4">
                                    {selectedInstKeys.map((key) => {
                                        const [, col] = key.split('|||');
                                        return (
                                            <li className="nav-item" key={key}>
                                                <button
                                                    type="button"
                                                    className={`nav-link ${activeTabKey === key ? 'active fw-bold' : ''}`}
                                                    onClick={() => setActiveTabKey(key)}
                                                >
                                                    {col}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* Tabs Content (Repeater for the active institution) */}
                                <div className="tab-content">
                                    {selectedInstKeys.map((key) => {
                                        if (key !== activeTabKey) return null; // Render only active tab
                                        
                                        const instModules = collegeModules[key] || [];

                                        return (
                                            <div key={key} className="tab-pane show active animate-fade-in">
                                                <div className="d-flex align-items-center justify-content-end mb-3">
                                                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => addYear(key)}>
                                                        + Add year for this college
                                                    </button>
                                                </div>

                                                {instModules.map((yearBlock, yearIndex) => (
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
                                                                    onChange={(e) => updateYear(key, yearIndex, { year: Number(e.target.value) || 1 })}
                                                                />
                                                            </div>
                                                            <div className="col">
                                                                <label className="form-label mb-0 small text-body-secondary fw-bold">Title (optional)</label>
                                                                <input
                                                                    type="text"
                                                                    className="form-control"
                                                                    placeholder={`e.g. Year ${yearBlock.year} Fundamentals`}
                                                                    value={yearBlock.title}
                                                                    onChange={(e) => updateYear(key, yearIndex, { title: e.target.value })}
                                                                />
                                                            </div>
                                                            <div className="col-auto align-self-end">
                                                                {instModules.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-outline-danger"
                                                                        onClick={() => removeYear(key, yearIndex)}
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
                                                                    onChange={(e) => updateModuleLine(key, yearIndex, moduleIndex, e.target.value)}
                                                                />
                                                                {yearBlock.modules.length > 1 && (
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-danger"
                                                                        onClick={() => removeModuleLine(key, yearIndex, moduleIndex)}
                                                                    >
                                                                        ×
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        <button type="button" className="btn btn-sm btn-light border mt-1" onClick={() => addModuleLine(key, yearIndex)}>
                                                            + Add module line
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. Fees */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="fw-semibold mb-0">5. Global Fee Summary (per year)</h5>
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