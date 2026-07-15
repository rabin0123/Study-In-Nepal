import { useEffect, useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

// Structure based on the JSON sample you provided
interface ApiDataRow {
    id: number;
    University: string;
    College: string;
    Course: string;
    [key: string]: any;
}

function nextYear(existing: { year: number }[]): number {
    return existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
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

    // Dropdown Selection States (controls the cascade)
    const [selectedDropdownUniv, setSelectedDropdownUniv] = useState('');
    const [selectedDropdownCol, setSelectedDropdownCol] = useState('');
    const [selectedDropdownCourse, setSelectedDropdownCourse] = useState('');

    // Actual Text Input States (locked until dropdown selected, then editable)
    const [universityName, setUniversityName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [courseName, setCourseName] = useState('');

    // Content fields supporting HTML Templates
    const [summaryHtml, setSummaryHtml] = useState('');
    const [careersHtml, setCareersHtml] = useState('');

    // Repeaters
    const [yearModules, setYearModules] = useState<YearModule[]>([{ year: 1, title: 'Year 1', modules: [''] }]);
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

    // Fetch the single "flat" list from API once on mount
    useEffect(() => {
        fetch('https://www.admin.studyinnepal.com/api/university')
            .then((res) => {
                if (!res.ok) throw new Error('Failed to fetch data');
                return res.json();
            })
            .then((data) => {
                // Ensure data is an array to prevent .map errors
                if (Array.isArray(data)) {
                    setMasterData(data);
                } else {
                    console.error('API did not return an array:', data);
                    setMasterData([]);
                }
            })
            .catch((err) => console.error('Error fetching university data:', err));
    }, []);

    // Extract unique Universities, Colleges, and Courses dynamically
    const uniqueUniversities = Array.from(new Set(masterData.map((item) => item.University).filter(Boolean)));

    const uniqueColleges = Array.from(
        new Set(
            masterData
                .filter((item) => item.University === selectedDropdownUniv)
                .map((item) => item.College)
                .filter(Boolean)
        )
    );

    const uniqueCourses = Array.from(
        new Set(
            masterData
                .filter((item) => item.University === selectedDropdownUniv && item.College === selectedDropdownCol)
                .map((item) => item.Course)
                .filter(Boolean)
        )
    );

    // ---- Handlers for Cascading Dropdowns ----
    const handleUniversitySelect = (val: string) => {
        setSelectedDropdownUniv(val);
        setUniversityName(val); // Populate input

        // Reset downstream selections
        setSelectedDropdownCol('');
        setCollegeName('');
        setSelectedDropdownCourse('');
        setCourseName('');
    };

    const handleCollegeSelect = (val: string) => {
        setSelectedDropdownCol(val);
        setCollegeName(val); // Populate input

        // Reset downstream selections
        setSelectedDropdownCourse('');
        setCourseName('');
    };

    const handleCourseSelect = (val: string) => {
        setSelectedDropdownCourse(val);
        setCourseName(val); // Populate input
    };

    // ---- Repeaters Handlers ----
    const addYear = () => setYearModules((prev) => [...prev, { year: nextYear(prev), title: '', modules: [''] }]);
    const removeYear = (index: number) => setYearModules((prev) => prev.filter((_, i) => i !== index));
    const updateYear = (index: number, patch: Partial<YearModule>) =>
        setYearModules((prev) => prev.map((y, i) => (i === index ? { ...y, ...patch } : y)));
    const addModuleLine = (yearIndex: number) =>
        setYearModules((prev) => prev.map((y, i) => (i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y)));
    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) =>
        setYearModules((prev) =>
            prev.map((y, i) =>
                i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y,
            ),
        );
    const removeModuleLine = (yearIndex: number, moduleIndex: number) =>
        setYearModules((prev) =>
            prev.map((y, i) => (i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y)),
        );

    const addFeeYear = () => setFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    const removeFeeYear = (index: number) => setFees((prev) => prev.filter((_, i) => i !== index));
    const updateFeeYear = (index: number, patch: Partial<YearFee>) =>
        setFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    // ---- Form Submission ----
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const payload = {
            university_name: universityName.trim(),
            college_name: collegeName.trim(),
            course_name: courseName.trim(),
            summary: summaryHtml.trim() || null,
            careers_summary: careersHtml.trim() || null,
            year_wise_modules: yearModules
                .filter((y) => y.year)
                .map((y) => ({
                    year: y.year,
                    title: y.title.trim() || null,
                    modules: y.modules.map((m) => m.trim()).filter(Boolean),
                })),
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
                setTimeout(() => router.visit(`/course-details/${data.courseDetail.uuid}`), 800);
            })
            .catch((err) => console.error('Failed to save course details', err))
            .finally(() => setSaving(false));
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Course Details', href: '/course-details' },
                { title: 'New', href: '/course-details/create' },
            ]}
        >
            <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4 mt-3">
                    <div>
                        <h4 className="mb-1 fw-semibold">New Course Details</h4>
                        <p className="mb-0 text-body-secondary">
                            Fill out the rich template definitions and metadata for this course mapping.
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save details'}
                    </button>
                </div>

                {savedMessage && <div className="alert alert-success">{savedMessage}</div>}

                {/* Identity / Cascading Dropdowns */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">Course Identity</h5>
                        <p className="text-body-secondary fs-6 mb-4">
                            Select the relationships below. The input fields will unlock for modifications only after an initial dropdown selection is made.
                        </p>
                        <div className="row g-4">
                            {/* University */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold">1. Select University</label>
                                <select
                                    className="form-select mb-2"
                                    value={selectedDropdownUniv}
                                    onChange={(e) => handleUniversitySelect(e.target.value)}
                                    required
                                >
                                    <option value="">-- Choose University --</option>
                                    {uniqueUniversities.map((u, i) => (
                                        <option key={i} value={u}>
                                            {u}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className={`form-control ${errors.university_name ? 'is-invalid' : ''}`}
                                    placeholder="University Name"
                                    value={universityName}
                                    onChange={(e) => setUniversityName(e.target.value)}
                                    disabled={!selectedDropdownUniv}
                                    required
                                />
                                {errors.university_name && <div className="invalid-feedback d-block">{errors.university_name}</div>}
                            </div>

                            {/* College */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold">2. Select College</label>
                                <select
                                    className="form-select mb-2"
                                    value={selectedDropdownCol}
                                    onChange={(e) => handleCollegeSelect(e.target.value)}
                                    disabled={!selectedDropdownUniv || uniqueColleges.length === 0}
                                    required
                                >
                                    <option value="">-- Choose College --</option>
                                    {uniqueColleges.map((c, i) => (
                                        <option key={i} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className={`form-control ${errors.college_name ? 'is-invalid' : ''}`}
                                    placeholder="College Name"
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    disabled={!selectedDropdownCol}
                                    required
                                />
                                {errors.college_name && <div className="invalid-feedback d-block">{errors.college_name}</div>}
                            </div>

                            {/* Course */}
                            <div className="col-md-4">
                                <label className="form-label fw-bold">3. Select Course</label>
                                <select
                                    className="form-select mb-2"
                                    value={selectedDropdownCourse}
                                    onChange={(e) => handleCourseSelect(e.target.value)}
                                    disabled={!selectedDropdownCol || uniqueCourses.length === 0}
                                    required
                                >
                                    <option value="">-- Choose Course --</option>
                                    {uniqueCourses.map((c, i) => (
                                        <option key={i} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    type="text"
                                    className={`form-control ${errors.course_name ? 'is-invalid' : ''}`}
                                    placeholder="Course Name"
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    disabled={!selectedDropdownCourse}
                                    required
                                />
                                {errors.course_name && <div className="invalid-feedback d-block">{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Course Summary (HTML Supported) */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">Course Summary (HTML Supported)</h5>
                        <HtmlField
                            value={summaryHtml}
                            onChange={setSummaryHtml}
                            placeholder="<p>Give an overview of what this course covers, who it's for, and what makes it distinct...</p>"
                            error={errors.summary}
                            rows={6}
                        />
                    </div>
                </div>

                {/* Careers Summary (HTML Supported) */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">Careers After This Course (HTML Supported)</h5>
                        <p className="text-muted small mb-2">Write a detailed HTML summary covering career prospects and job titles.</p>
                        <HtmlField
                            value={careersHtml}
                            onChange={setCareersHtml}
                            placeholder="<ul><li>Software Engineer</li><li>Data Analyst</li></ul>"
                            error={errors.careers_summary}
                            rows={6}
                        />
                    </div>
                </div>

                {/* Year-wise modules */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="fw-semibold mb-0">Year-wise Course Modules</h5>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addYear}>
                                + Add year
                            </button>
                        </div>

                        {yearModules.map((yearBlock, yearIndex) => (
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
                                        {yearModules.length > 1 && (
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
                    </div>
                </div>

                {/* Fees */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="fw-semibold mb-0">Fee Summary (per year)</h5>
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
        </AppSidebarLayout>
    );
}