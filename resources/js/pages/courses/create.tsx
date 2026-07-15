import { useEffect, useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type YearModule = { year: number; title: string; modules: string[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

function nextYear(existing: { year: number }[]): number {
    return existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

export default function CourseDetailsCreate() {
    // Identity fields — free text, matched later against `universities`
    // by name once a matching row exists (or already exists now).
    const [universityName, setUniversityName] = useState('');
    const [collegeName, setCollegeName] = useState('');
    const [courseName, setCourseName] = useState('');

    const [summary, setSummary] = useState('');
    const [yearModules, setYearModules] = useState<YearModule[]>([{ year: 1, title: 'Year 1', modules: [''] }]);
    const [fees, setFees] = useState<YearFee[]>([{ year: 1, amount: '', currency: '', note: '' }]);
    const [careers, setCareers] = useState<string[]>(['']);

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
                .map((y) => ({ year: y.year, title: y.title.trim() || null, modules: y.modules.map((m) => m.trim()).filter(Boolean) })),
            fees: fees
                .filter((f) => f.year)
                .map((f) => ({ year: f.year, amount: f.amount.trim() || null, currency: f.currency.trim() || null, note: f.note.trim() || null })),
            careers: careers.map((c) => c.trim()).filter(Boolean),
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

  
}
