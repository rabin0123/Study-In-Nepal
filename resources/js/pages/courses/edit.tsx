import { useEffect, useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';

type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

function nextYear(existing: { year: number }[]): number {
    return existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

type Props = {
    courseDetail: {
        uuid: string;
        university_name: string;
        college_name: string;
        course_name: string;
        summary: string | null;
        year_wise_modules: YearModule[] | null;
        fees: YearFee[] | null;
        careers: string[] | null;
    };
};

export default function CourseDetailsEdit({ courseDetail }: Props) {
    // Identity fields
    const [universityName, setUniversityName] = useState(courseDetail.university_name);
    const [collegeName, setCollegeName] = useState(courseDetail.college_name);
    const [courseName, setCourseName] = useState(courseDetail.course_name);

    const [summary, setSummary] = useState(courseDetail.summary ?? '');

    // Robust parsing for yearModules
    const [yearModules, setYearModules] = useState<YearModule[]>(() => {
        let raw = courseDetail.year_wise_modules;
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch { raw = null; }
        }
        if (Array.isArray(raw) && raw.length) {
            return raw.map((y) => ({
                year: typeof y.year === 'number' ? y.year : parseInt(y.year as any) || 1,
                title: y.title ?? '',
                modules: Array.isArray(y.modules) ? y.modules : []
            }));
        }
        return [{ year: 1, title: 'Year 1', modules: [''] }];
    });

    // Robust parsing for fees
    const [fees, setFees] = useState<YearFee[]>(() => {
        let raw = courseDetail.fees;
        if (typeof raw === 'string') {
            try { raw = JSON.parse(raw); } catch { raw = null; }
        }
        if (Array.isArray(raw) && raw.length) {
            return raw.map((f) => ({
                year: typeof f.year === 'number' ? f.year : parseInt(f.year as any) || 1,
                amount: f.amount ?? '',
                currency: f.currency ?? '',
                note: f.note ?? ''
            }));
        }
        return [{ year: 1, amount: '', currency: '', note: '' }];
    });

    // Safe, robust parsing for careers to prevent "careers.map is not a function"
    const [careers, setCareers] = useState<string[]>(() => {
        const raw = courseDetail.careers;
        if (Array.isArray(raw)) {
            return raw.length ? raw : [''];
        }
        if (typeof raw === 'string') {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    return parsed.length ? parsed : [''];
                }
            } catch {
                // Not a JSON string
            }
            if (raw && (raw as string).trim() !== '') {
                return [raw as string];
            }
        }
        return [''];
    });

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
            university_name: universityName.trim(),
            college_name: collegeName.trim(),
            course_name: courseName.trim(),
            summary: summary.trim() || null,
            year_wise_modules: yearModules
                .filter((y) => y.year)
                .map((y) => ({ 
                    year: y.year, 
                    title: y.title.trim() || null, 
                    modules: y.modules.map((m: string) => m.trim()).filter(Boolean) 
                })),
            fees: fees
                .filter((f) => f.year)
                .map((f) => ({ 
                    year: f.year, 
                    amount: f.amount.trim() || null, 
                    currency: f.currency.trim() || null, 
                    note: f.note.trim() || null 
                })),
            careers: careers.map((c: string) => c.trim()).filter(Boolean), // Explicitly type c as string
        };

        fetch(`/course-details/${courseDetail.uuid}`, {
            method: 'PUT',
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
                setTimeout(() => router.visit(`/course-details/${courseDetail.uuid}`), 800);
            })
            .catch((err) => console.error('Failed to save course details', err))
            .finally(() => setSaving(false));
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                {/* Breadcrumbs */}
                <nav className="flex mb-6 text-sm text-gray-500 space-x-2" aria-label="Breadcrumb">
                    <a href="/course-details" className="hover:text-gray-700 transition">Course Details</a>
                    <span>/</span>
                    <a href={`/course-details/${courseDetail.uuid}`} className="hover:text-gray-700 transition truncate max-w-[200px]">
                        {courseDetail.course_name}
                    </a>
                    <span>/</span>
                    <span className="text-gray-900 font-medium">Edit</span>
                </nav>

                <form onSubmit={handleSubmit}>
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Edit Course Details</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                {courseDetail.course_name} · {courseDetail.college_name} · {courseDetail.university_name}
                            </p>
                        </div>
                        <button
                            type="submit"
                            className="inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : 'Save details'}
                        </button>
                    </div>

                    {/* Success Message Banner */}
                    {savedMessage && (
                        <div className="mb-6 p-4 rounded-md bg-green-50 border border-green-200 text-sm text-green-800">
                            <div className="flex">
                                <svg className="h-5 w-5 text-green-400 mr-2 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{savedMessage}</span>
                            </div>
                        </div>
                    )}

                    {/* Identity Section */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Course Identity</h2>
                        <p className="text-xs text-gray-500 mb-4">
                            These three fields must match a university's exact University / College / Course text to auto-link.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">University name</label>
                                <input
                                    type="text"
                                    className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 border ${
                                        errors.university_name 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                    value={universityName}
                                    onChange={(e) => setUniversityName(e.target.value)}
                                    required
                                />
                                {errors.university_name && <p className="mt-1 text-xs text-red-600">{errors.university_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">College name</label>
                                <input
                                    type="text"
                                    className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 border ${
                                        errors.college_name 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                    value={collegeName}
                                    onChange={(e) => setCollegeName(e.target.value)}
                                    required
                                />
                                {errors.college_name && <p className="mt-1 text-xs text-red-600">{errors.college_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Course name</label>
                                <input
                                    type="text"
                                    className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 border ${
                                        errors.course_name 
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                                    }`}
                                    value={courseName}
                                    onChange={(e) => setCourseName(e.target.value)}
                                    required
                                />
                                {errors.course_name && <p className="mt-1 text-xs text-red-600">{errors.course_name}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Summary Section */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">Course Summary</h2>
                        <textarea
                            className={`block w-full rounded-md shadow-sm sm:text-sm px-3 py-2 border ${
                                errors.summary 
                                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                            }`}
                            rows={5}
                            placeholder="Give an overview of what this course covers, who it's for, and what makes it distinct..."
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                        />
                        {errors.summary && <p className="mt-1 text-xs text-red-600">{errors.summary}</p>}
                    </div>

                    {/* Year-wise Course Modules Section */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Year-wise Course Modules</h2>
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                onClick={addYear}
                            >
                                + Add year
                            </button>
                        </div>

                        {yearModules.map((yearBlock, yearIndex) => (
                            <div key={yearIndex} className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            value={yearBlock.year}
                                            onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="md:col-span-8">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Title (optional)</label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            placeholder={`Year ${yearBlock.year}`}
                                            value={yearBlock.title}
                                            onChange={(e) => updateYear(yearIndex, { title: e.target.value })}
                                        />
                                    </div>
                                    <div className="md:col-span-2 text-right">
                                        {yearModules.length > 1 && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center w-full justify-center px-3 py-2 border border-red-200 text-xs font-medium rounded-md text-red-600 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                                                onClick={() => removeYear(yearIndex)}
                                            >
                                                Remove year
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Modules</label>
                                <div className="space-y-2 mb-3">
                                    {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                        <div key={moduleIndex} className="flex gap-2">
                                            <input
                                                type="text"
                                                className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                                placeholder={`Module ${moduleIndex + 1}`}
                                                value={moduleValue}
                                                onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)}
                                            />
                                            {yearBlock.modules.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center px-3 py-2 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                                                    onClick={() => removeModuleLine(yearIndex, moduleIndex)}
                                                >
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                    onClick={() => addModuleLine(yearIndex)}
                                >
                                    + Add module
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Fees Section */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Fee Summary (per year)</h2>
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                onClick={addFeeYear}
                            >
                                + Add year
                            </button>
                        </div>

                        <div className="space-y-4">
                            {fees.map((fee, feeIndex) => (
                                <div key={feeIndex} className="flex flex-col sm:flex-row gap-3 items-end border-b sm:border-0 pb-4 sm:pb-0 border-gray-100 last:border-0">
                                    <div className="w-full sm:w-20 shrink-0">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                        <input
                                            type="number"
                                            min={1}
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            value={fee.year}
                                            onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })}
                                        />
                                    </div>
                                    <div className="w-full sm:w-24 shrink-0">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            placeholder="USD"
                                            value={fee.currency}
                                            onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-full sm:flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Amount</label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            placeholder="e.g. 12,000"
                                            value={fee.amount}
                                            onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="w-full sm:flex-1">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                            placeholder="e.g. Tuition only"
                                            value={fee.note}
                                            onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })}
                                        />
                                    </div>
                                    <div className="shrink-0 w-full sm:w-auto text-right">
                                        {fees.length > 1 && (
                                            <button
                                                type="button"
                                                className="inline-flex items-center px-3 py-2 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                                                onClick={() => removeFeeYear(feeIndex)}
                                            >
                                                &times;
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Careers Section */}
                    <div className="bg-white shadow-sm border border-gray-200 rounded-lg p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-gray-900">Careers After This Course</h2>
                            <button
                                type="button"
                                className="inline-flex items-center px-3 py-1.5 border border-blue-600 text-xs font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition"
                                onClick={addCareer}
                            >
                                + Add career
                            </button>
                        </div>

                        <div className="space-y-2">
                            {careers.map((career, i) => (
                                <div key={i} className="flex gap-2">
                                    <input
                                        type="text"
                                        className="block flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 bg-white"
                                        placeholder="e.g. Software Engineer"
                                        value={career}
                                        onChange={(e) => updateCareer(i, e.target.value)}
                                    />
                                    {careers.length > 1 && (
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-3 py-2 border border-red-300 text-red-600 bg-white hover:bg-red-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition"
                                            onClick={() => removeCareer(i)}
                                        >
                                            &times;
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Submit Bar */}
                    <div className="flex justify-end mb-12">
                        <button
                            type="submit"
                            className="inline-flex justify-center items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                            disabled={saving}
                        >
                            {saving ? 'Saving…' : 'Save details'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}