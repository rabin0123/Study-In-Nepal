import { useEffect, useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

type Props = {
    university: { id: number; University: string; College: string; Course: string };
    courseDetail: {
        summary: string | null;
        year_wise_modules: YearModule[] | null;
        fees: YearFee[] | null;
        careers: string[] | null;
    } | null;
};

function nextYear(existing: { year: number }[]): number {
    return existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

export default function CourseDetailsEdit({ university, courseDetail }: Props) {
    const [summary, setSummary] = useState(courseDetail?.summary ?? '');
    const [yearModules, setYearModules] = useState<YearModule[]>(
        courseDetail?.year_wise_modules?.length
            ? courseDetail.year_wise_modules.map((y) => ({ year: y.year, title: y.title ?? '', modules: y.modules ?? [] }))
            : [{ year: 1, title: 'Year 1', modules: [''] }],
    );
    const [fees, setFees] = useState<YearFee[]>(
        courseDetail?.fees?.length
            ? courseDetail.fees.map((f) => ({ year: f.year, amount: f.amount ?? '', currency: f.currency ?? '', note: f.note ?? '' }))
            : [{ year: 1, amount: '', currency: '', note: '' }],
    );
    const [careers, setCareers] = useState<string[]>(courseDetail?.careers?.length ? courseDetail.careers : ['']);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!savedMessage) return;
        const t = setTimeout(() => setSavedMessage(null), 4000);
        return () => clearTimeout(t);
    }, [savedMessage]);

    // ---- Year modules repeater ----
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

    // ---- Fees repeater ----
    const addFeeYear = () => setFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    const removeFeeYear = (index: number) => setFees((prev) => prev.filter((_, i) => i !== index));
    const updateFeeYear = (index: number, patch: Partial<YearFee>) =>
        setFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));

    // ---- Careers repeater ----
    const addCareer = () => setCareers((prev) => [...prev, '']);
    const removeCareer = (index: number) => setCareers((prev) => prev.filter((_, i) => i !== index));
    const updateCareer = (index: number, value: string) =>
        setCareers((prev) => prev.map((c, i) => (i === index ? value : c)));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setErrors({});

        const payload = {
            summary: summary.trim() || null,
            year_wise_modules: yearModules
                .filter((y) => y.year)
                .map((y) => ({ year: y.year, title: y.title.trim() || null, modules: y.modules.map((m) => m.trim()).filter(Boolean) })),
            fees: fees
                .filter((f) => f.year)
                .map((f) => ({ year: f.year, amount: f.amount.trim() || null, currency: f.currency.trim() || null, note: f.note.trim() || null })),
            careers: careers.map((c) => c.trim()).filter(Boolean),
        };

        fetch(`/courses/${university.id}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
                'X-CSRF-TOKEN': document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '',
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
                setTimeout(() => router.visit(`/courses/${university.id}`), 800);
            })
            .catch((err) => console.error('Failed to save course details', err))
            .finally(() => setSaving(false));
    };

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Courses', href: '/explorecourses' },
                { title: university.Course, href: `/courses/${university.id}` },
                { title: 'Edit Details', href: `/courses/${university.id}/edit` },
            ]}
        >
            <form onSubmit={handleSubmit}>
                <div className="d-flex align-items-center justify-content-between mb-4">
                    <div>
                        <h4 className="mb-1 fw-semibold">Edit Course Details</h4>
                        <p className="mb-0 text-body-secondary">
                            {university.Course} · {university.College} · {university.University}
                        </p>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save details'}
                    </button>
                </div>

                {savedMessage && <div className="alert alert-success">{savedMessage}</div>}

                {/* Summary */}
                <div className="card mb-4">
                    <div className="card-body">
                        <h5 className="fw-semibold mb-3">Course Summary</h5>
                        <textarea
                            className={`form-control ${errors.summary ? 'is-invalid' : ''}`}
                            rows={5}
                            placeholder="Give an overview of what this course covers, who it's for, and what makes it distinct..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                        {errors.summary && <div className="invalid-feedback d-block">{errors.summary}</div>}
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
                            <div key={yearIndex} className="border rounded p-3 mb-3">
                                <div className="row g-2 align-items-center mb-2">
                                    <div className="col-auto">
                                        <label className="form-label mb-0 fs-2 text-body-secondary">Year</label>
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
                                        <label className="form-label mb-0 fs-2 text-body-secondary">Title (optional)</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder={`Year ${yearBlock.year}`}
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

                                <label className="form-label fs-2 text-body-secondary">Modules</label>
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
                                <button type="button" className="btn btn-sm btn-light" onClick={() => addModuleLine(yearIndex)}>
                                    + Add module
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
                                + Add year
                            </button>
                        </div>

                        {fees.map((fee, feeIndex) => (
                            <div key={feeIndex} className="row g-2 align-items-end mb-2">
                                <div className="col-auto">
                                    <label className="form-label mb-0 fs-2 text-body-secondary">Year</label>
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
                                    <label className="form-label mb-0 fs-2 text-body-secondary">Currency</label>
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
                                    <label className="form-label mb-0 fs-2 text-body-secondary">Amount</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="e.g. 12,000"
                                        value={fee.amount}
                                        onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })}
                                    />
                                </div>
                                <div className="col">
                                    <label className="form-label mb-0 fs-2 text-body-secondary">Note (optional)</label>
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

                {/* Careers */}
                <div className="card mb-4">
                    <div className="card-body">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                            <h5 className="fw-semibold mb-0">Careers After This Course</h5>
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={addCareer}>
                                + Add career
                            </button>
                        </div>
                        {careers.map((career, i) => (
                            <div key={i} className="d-flex gap-2 mb-2">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. Software Engineer"
                                    value={career}
                                    onChange={(e) => updateCareer(i, e.target.value)}
                                />
                                {careers.length > 1 && (
                                    <button type="button" className="btn btn-outline-danger" onClick={() => removeCareer(i)}>
                                        ×
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="d-flex justify-content-end mb-6">
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save details'}
                    </button>
                </div>
            </form>
        </AppSidebarLayout>
    );
}
