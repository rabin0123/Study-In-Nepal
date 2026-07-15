import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import {
    Search, Book, Building2, ChevronUp, ChevronDown, Inbox,
    Bold, Italic, Underline, Type, Highlighter,
    List, ListOrdered, GraduationCap, Loader2, Save, CheckCircle2,
    AlertCircle, FileText, Briefcase, Layers, BookOpen, Copy,
    Plus, Calendar, Trash2, X, Coins, Info, CheckCircle
} from 'lucide-react';

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
        <div ref={wrapperRef} className="relative">
            <div 
                className={`flex items-center shadow-sm bg-white border px-2 transition-all ${error ? 'border-red-500' : 'border-gray-200 focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]'}`}
                style={{ borderRadius: '9999px' }}
            >
                <span className="flex items-center pl-3 pr-2 text-gray-400">
                    <Search size={16} />
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
                    className="w-full py-2.5 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    style={{ borderRadius: '9999px' }}
                    autoComplete="off"
                />
            </div>

            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul
                    className="absolute z-[1000] w-full mt-2 p-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-y-auto"
                    style={{ maxHeight: 240 }}
                >
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <button
                                type="button"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                                className="w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#008AE6] transition-colors"
                            >
                                <Book size={14} className="text-gray-400" />
                                <span className="truncate">{opt}</span>
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
        <div ref={wrapperRef} className="relative">
            <div
                className={`flex items-center justify-between shadow-sm px-5 py-2.5 text-sm transition-colors ${disabled ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-white text-gray-900 border border-gray-200 hover:border-[#008AE6] cursor-pointer'}`}
                style={{ borderRadius: '9999px' }}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <Building2 size={16} className={disabled ? 'text-gray-300' : 'text-[#008AE6]'} />
                    <span>{displayText}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </div>

            {isOpen && !disabled && (
                <div
                    className="absolute z-[1000] w-full mt-2 p-2 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-y-auto"
                    style={{ maxHeight: 280 }}
                >
                    {options.length === 0 ? (
                        <div className="text-gray-400 p-4 text-center text-sm flex flex-col items-center">
                            <Inbox size={24} className="mb-2 opacity-50" />
                            No institutions found.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <div
                                key={opt.key}
                                className="flex items-start gap-3 rounded-xl px-3 py-3 mb-1 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggle(opt.key);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 flex-shrink-0 cursor-pointer text-[#008AE6] focus:ring-[#008AE6] rounded"
                                    checked={selectedKeys.includes(opt.key)}
                                    readOnly
                                />
                                <div>
                                    <div className="font-medium leading-snug mb-1 text-gray-900 text-sm">{opt.label}</div>
                                    <div className="text-gray-500 leading-snug text-xs">{opt.subLabel}</div>
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
// 3. Rich Text Editor
// ---------------------------------------------------------------------------
const FONT_FAMILIES = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
];

const HIGHLIGHT_COLORS = ['#FFF59D', '#A5D6A7', '#90CAF9', '#EF9A9A', '#CE93D8', '#FFCC80', 'transparent'];
const TEXT_COLORS = ['#111827', '#008AE6', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#FFFFFF'];

function ToolbarButton({ icon: Icon, title, onClick, active }: { icon: any; title: string; onClick: () => void; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`flex items-center justify-center w-8 h-8 border transition-colors ${active ? 'bg-[#008AE6]/10 border-[#008AE6]/30 text-[#008AE6]' : 'bg-white border-transparent hover:bg-gray-100 text-gray-700'}`}
            style={{ borderRadius: '9999px' }}
        >
            <Icon size={14} />
        </button>
    );
}

function SwatchPopover({
    colors, onPick, icon: Icon, title,
}: { colors: string[]; onPick: (c: string) => void; icon: any; title: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener('mousedown', onClickOutside);
        return () => document.removeEventListener('mousedown', onClickOutside);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                title={title}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setOpen((o) => !o)}
                className="flex items-center justify-center w-8 h-8 border border-transparent hover:bg-gray-100 text-gray-700 transition-colors"
                style={{ borderRadius: '9999px' }}
            >
                <Icon size={14} />
            </button>
            {open && (
                <div className="absolute z-[1000] top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-wrap gap-1" style={{ width: 132 }}>
                    {colors.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onPick(c); setOpen(false); }}
                            className="w-6 h-6 border border-gray-200 hover:scale-110 transition-transform"
                            style={{ borderRadius: '9999px', background: c === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : c }}
                            title={c}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function RichTextEditor({ value, onChange, placeholder, error }: { value: string; onChange: (v: string) => void; placeholder?: string; error?: string; }) {
    const editorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (editorRef.current && value === '' && editorRef.current.innerHTML !== '') {
            editorRef.current.innerHTML = '';
        }
    }, [value]);

    const exec = (cmd: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, arg);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    return (
        <div className={`rounded-2xl shadow-sm bg-white overflow-hidden border ${error ? 'border-red-500' : 'border-gray-200'}`}>
            <div className="bg-gray-50/80 p-2 border-b border-gray-100 flex flex-wrap items-center gap-1.5">
                <select
                    onChange={(e) => exec('formatBlock', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:border-[#008AE6] hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ borderRadius: '9999px' }}
                >
                    <option value="" disabled>Style</option>
                    <option value="P">Paragraph</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                </select>

                <select
                    onChange={(e) => exec('fontName', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:border-[#008AE6] hover:bg-gray-50 transition-colors cursor-pointer"
                    style={{ borderRadius: '9999px', maxWidth: 120 }}
                >
                    <option value="" disabled>Font</option>
                    {FONT_FAMILIES.map((f) => (
                        <option key={f.label} value={f.value}>{f.label}</option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-200 mx-1" />
                <ToolbarButton icon={Bold} title="Bold" onClick={() => exec('bold')} />
                <ToolbarButton icon={Italic} title="Italic" onClick={() => exec('italic')} />
                <ToolbarButton icon={Underline} title="Underline" onClick={() => exec('underline')} />
                
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <SwatchPopover icon={Type} title="Text color" colors={TEXT_COLORS} onPick={(c) => exec('foreColor', c)} />
                <SwatchPopover icon={Highlighter} title="Highlight color" colors={HIGHLIGHT_COLORS} onPick={(c) => exec('hiliteColor', c === 'transparent' ? 'transparent' : c)} />
                
                <div className="w-px h-6 bg-gray-200 mx-1" />
                <ToolbarButton icon={List} title="Bullet list" onClick={() => exec('insertUnorderedList')} />
                <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => exec('insertOrderedList')} />
            </div>
            <div
                ref={editorRef}
                className="p-5 bg-white text-sm text-gray-800 editor-content"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 180, outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`.editor-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; font-style: italic; }`}</style>
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

    // Separated active tabs for logic
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);

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

    // Keep tabs synced with multiselect
    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearModules(); });
            return next;
        });
        setActiveModuleTab((prev) => (prev && selectedInstKeys.includes(prev) ? prev : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));

        setFeesByInst((prev) => {
            const next: Record<string, YearFee[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearFee(); });
            return next;
        });
        setActiveFeeTab((prev) => (prev && selectedInstKeys.includes(prev) ? prev : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));
    }, [selectedInstKeys]);

    const toggleInstitution = (key: string) => setSelectedInstKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    // -- Modules Handlers --
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

    // -- Fees Handlers --
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

        // Payload structure ensures complete matching with the provided Laravel Controller validation
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
        <div className="max-w-full py-8 px-4 sm:px-6 bg-[#fafafa] min-h-screen">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '900px' }}>

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-gray-200">
                    <div>
                        <h4 className="mb-2 font-serif text-gray-900 flex items-center gap-3 text-3xl">
                            <GraduationCap size={32} className="text-[#008AE6]" />
                            New Course Details
                        </h4>
                        <p className="text-gray-500 text-sm">
                            Define a course once and securely link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button 
                        type="submit" 
                        className="inline-flex items-center justify-center gap-2 bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-md px-6 py-3 transition-colors disabled:opacity-60" 
                        disabled={saving}
                        style={{ borderRadius: '9999px' }}
                    >
                        {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
                        <span className="font-bold text-xs uppercase tracking-widest">{saving ? 'Saving...' : 'Save details'}</span>
                    </button>
                </div>

                {savedMessage && (
                    <div className="flex items-center gap-3 bg-green-50 text-green-800 border border-green-200 shadow-sm px-5 py-3 mb-6 text-sm" style={{ borderRadius: '9999px' }}>
                        <CheckCircle2 size={20} className="text-green-600" />
                        <span className="font-semibold">{savedMessage}</span>
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="bg-white shadow-sm rounded-3xl mb-6 border border-gray-100">
                    <div className="p-6 md:p-8">
                        <h6 className="font-bold mb-2 text-gray-900 flex items-center gap-3 text-base">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm w-7 h-7 text-xs">1</span>
                            Select Course
                        </h6>
                        <p className="text-gray-500 text-sm mb-5 ml-10">Search or type a course to unlock the connected institutions.</p>

                        <div className="ml-10 max-w-2xl">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Course Name <span className="text-red-500">*</span></label>
                            <ComboboxInput
                                placeholder="e.g. BSc Computer Science..."
                                value={courseName}
                                onChange={setCourseName}
                                options={uniqueCourses}
                                error={errors.course_name}
                            />
                            {errors.course_name && <div className="text-red-500 text-xs mt-2 flex items-center gap-1.5"><AlertCircle size={14} />{errors.course_name}</div>}
                        </div>
                    </div>
                </div>

                {/* 2. Select Institutions */}
                <div className="bg-white shadow-sm rounded-3xl mb-6 border border-gray-100">
                    <div className="p-6 md:p-8">
                        <h6 className="font-bold mb-2 text-gray-900 flex items-center gap-3 text-base">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm w-7 h-7 text-xs">2</span>
                            Select Institutions
                        </h6>
                        <p className="text-gray-500 text-sm mb-5 ml-10">Check all the colleges this curriculum should apply to.</p>

                        <div className="ml-10 max-w-2xl">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Colleges / Universities <span className="text-red-500">*</span></label>
                            <MultiSelectDropdown
                                options={availableInstitutions}
                                selectedKeys={selectedInstKeys}
                                onToggle={toggleInstitution}
                                disabled={!courseName || availableInstitutions.length === 0}
                                placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                            />
                            {errors.institutions && <div className="text-red-500 text-xs mt-2 flex items-center gap-1.5"><AlertCircle size={14} />{errors.institutions}</div>}
                        </div>
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="bg-white shadow-sm rounded-3xl mb-6 border border-gray-100">
                    <div className="p-6 md:p-8">
                        <h6 className="font-bold mb-2 text-gray-900 flex items-center gap-3 text-base">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm w-7 h-7 text-xs">3</span>
                            Global Course Information
                        </h6>
                        <p className="text-gray-500 text-sm mb-6 ml-10">This description applies globally to the course.</p>

                        <div className="ml-10 space-y-6">
                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    <FileText size={14} /> Course Summary
                                </label>
                                <RichTextEditor value={summaryHtml} onChange={setSummaryHtml} placeholder="Write an engaging overview..." error={errors.summary} />
                            </div>

                            <div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    <Briefcase size={14} /> Career Prospects
                                </label>
                                <RichTextEditor value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers_summary} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4. Course Modules */}
                <div className="bg-white shadow-sm rounded-3xl mb-6 border border-gray-100">
                    <div className="p-6 md:p-8">
                        <h6 className="font-bold mb-2 text-gray-900 flex items-center gap-3 text-base">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm w-7 h-7 text-xs">4</span>
                            Course Modules (Per Institution)
                        </h6>
                        <p className="text-gray-500 text-sm mb-6 ml-10">Configure the syllabus independently for each selected college.</p>

                        <div className="ml-0 md:ml-10">
                            {selectedInstKeys.length === 0 ? (
                                <div className="text-gray-400 p-8 border border-dashed border-gray-300 rounded-3xl bg-gray-50 text-center text-sm">
                                    <Layers size={36} className="mb-3 opacity-30 mx-auto" />
                                    No institutions selected. Select a course and institution first.
                                </div>
                            ) : (
                                <>
                                    <ul className="flex flex-nowrap overflow-x-auto pb-3 gap-3 mb-6 custom-scrollbar">
                                        {selectedInstKeys.map((key) => {
                                            const info = institutionLookup.get(key);
                                            const isActive = key === activeModuleTab;
                                            return (
                                                <li key={key} className="flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        className={`border px-5 py-2.5 text-left flex flex-col transition-all ${isActive ? 'bg-[#008AE6] border-[#008AE6] shadow-md text-white' : 'bg-white text-gray-700 border-gray-200 hover:border-[#008AE6] hover:text-[#008AE6]'}`}
                                                        onClick={() => setActiveModuleTab(key)}
                                                        style={{ minWidth: '160px', borderRadius: '9999px' }}
                                                    >
                                                        <span className="font-bold block truncate text-sm" style={{ maxWidth: '180px' }}>{info ? info.label : key}</span>
                                                        <span className={`block truncate ${isActive ? 'text-white/80' : 'text-gray-400'}`} style={{ maxWidth: '180px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                            <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                                                <BookOpen size={18} className="text-[#008AE6]" /> Course Modules
                                            </div>
                                            {activeModuleTab && (
                                                <div className="flex" style={{ gap: '8px' }}>
                                                    {selectedInstKeys.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#008AE6] transition-colors uppercase tracking-wider" 
                                                            onClick={copyToAllInstitutions} 
                                                            title="Copy to all"
                                                            style={{ borderRadius: '9999px' }}
                                                        >
                                                            <Copy size={14} /> <span className="hidden sm:inline">Apply to all</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        type="button" 
                                                        className="inline-flex items-center justify-center gap-2 bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-4 py-2 text-xs font-bold transition-colors uppercase tracking-wider" 
                                                        onClick={addYear}
                                                        style={{ borderRadius: '9999px' }}
                                                    >
                                                        <Plus size={14} /> Add Year
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-4">
                                            {activeYearModules.map((yearBlock, yearIndex) => (
                                                <div key={yearIndex} className="border border-gray-200 bg-gray-50/50 rounded-2xl p-5 relative">
                                                    {activeYearModules.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="absolute top-4 right-4 text-red-400 hover:text-red-600 bg-white hover:bg-red-50 p-2 transition-colors border border-gray-200 shadow-sm" 
                                                            onClick={() => removeYear(yearIndex)}
                                                            style={{ borderRadius: '9999px' }}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}

                                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-4">
                                                        <Calendar size={16} className="text-[#008AE6]" /> Academic Year Set {yearIndex + 1}
                                                    </div>

                                                    <div className="grid grid-cols-12 gap-4 mb-5 pr-10">
                                                        <div className="col-span-12 sm:col-span-3 lg:col-span-2">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Year Num</label>
                                                            <input type="number" min={1} className="w-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" style={{ borderRadius: '9999px' }} value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                        </div>
                                                        <div className="col-span-12 sm:col-span-9 lg:col-span-10">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Year Title (Optional)</label>
                                                            <input type="text" className="w-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" style={{ borderRadius: '9999px' }} placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-3">
                                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">Modules / Subjects</label>
                                                        {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                            <div key={moduleIndex} className="flex gap-2 items-center">
                                                                <div className="flex items-center flex-1 border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]" style={{ borderRadius: '9999px' }}>
                                                                    <span className="bg-gray-50 text-gray-400 px-4 py-2.5 text-sm border-r border-gray-200 font-medium">{moduleIndex + 1}.</span>
                                                                    <input type="text" className="flex-1 px-4 py-2.5 text-sm focus:outline-none bg-transparent" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                                </div>
                                                                {yearBlock.modules.length > 1 && (
                                                                    <button 
                                                                        type="button" 
                                                                        className="border border-gray-200 shadow-sm text-red-500 bg-white hover:bg-red-50 p-2.5 flex-shrink-0 transition-colors" 
                                                                        onClick={() => removeModuleLine(yearIndex, moduleIndex)}
                                                                        style={{ borderRadius: '9999px' }}
                                                                    >
                                                                        <X size={16} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <button 
                                                        type="button" 
                                                        className="inline-flex items-center gap-2 border border-gray-300 text-gray-600 px-4 py-2 mt-4 hover:bg-white hover:text-[#008AE6] transition-colors shadow-sm text-xs font-bold uppercase tracking-wider" 
                                                        onClick={() => addModuleLine(yearIndex)}
                                                        style={{ borderRadius: '9999px' }}
                                                    >
                                                        <Plus size={14} /> Add Subject
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 5. Fee Structure */}
                <div className="bg-white shadow-sm rounded-3xl mb-8 border border-gray-100">
                    <div className="p-6 md:p-8">
                        <h6 className="font-bold mb-2 text-gray-900 flex items-center gap-3 text-base">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm w-7 h-7 text-xs">5</span>
                            Fee Structure (Per Institution)
                        </h6>
                        <p className="text-gray-500 text-sm mb-6 ml-10">Outline the standard estimated tuition independently for each selected college.</p>

                        <div className="ml-0 md:ml-10">
                            {selectedInstKeys.length === 0 ? (
                                <div className="text-gray-400 p-8 border border-dashed border-gray-300 rounded-3xl bg-gray-50 text-center text-sm">
                                    <Layers size={36} className="mb-3 opacity-30 mx-auto" />
                                    No institutions selected. Select a course and institution first.
                                </div>
                            ) : (
                                <>
                                    <ul className="flex flex-nowrap overflow-x-auto pb-3 gap-3 mb-6 custom-scrollbar">
                                        {selectedInstKeys.map((key) => {
                                            const info = institutionLookup.get(key);
                                            const isActive = key === activeFeeTab;
                                            return (
                                                <li key={key} className="flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        className={`border px-5 py-2.5 text-left flex flex-col transition-all ${isActive ? 'bg-[#008AE6] border-[#008AE6] shadow-md text-white' : 'bg-white text-gray-700 border-gray-200 hover:border-[#008AE6] hover:text-[#008AE6]'}`}
                                                        onClick={() => setActiveFeeTab(key)}
                                                        style={{ minWidth: '160px', borderRadius: '9999px' }}
                                                    >
                                                        <span className="font-bold block truncate text-sm" style={{ maxWidth: '180px' }}>{info ? info.label : key}</span>
                                                        <span className={`block truncate ${isActive ? 'text-white/80' : 'text-gray-400'}`} style={{ maxWidth: '180px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>

                                    <div>
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                            <div className="font-bold text-gray-900 text-base flex items-center gap-2">
                                                <Coins size={18} className="text-[#008AE6]" /> Fee Structure
                                            </div>
                                            {activeFeeTab && (
                                                <div className="flex" style={{ gap: '8px' }}>
                                                    {selectedInstKeys.length > 1 && (
                                                        <button 
                                                            type="button" 
                                                            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 hover:text-[#008AE6] transition-colors uppercase tracking-wider" 
                                                            onClick={copyFeesToAllInstitutions} 
                                                            title="Copy to all"
                                                            style={{ borderRadius: '9999px' }}
                                                        >
                                                            <Copy size={14} /> <span className="hidden sm:inline">Apply to all</span>
                                                        </button>
                                                    )}
                                                    <button 
                                                        type="button" 
                                                        className="inline-flex items-center justify-center gap-2 bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-4 py-2 text-xs font-bold transition-colors uppercase tracking-wider" 
                                                        onClick={addFeeYear}
                                                        style={{ borderRadius: '9999px' }}
                                                    >
                                                        <Plus size={14} /> Add Fee Row
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
                                            {activeFeeTab && institutionLookup.has(activeFeeTab) && (
                                                <div className="mb-5 flex items-center gap-3 text-[#008AE6] bg-[#008AE6]/10 px-4 py-3 rounded-xl text-sm font-semibold">
                                                    <Info size={16} />
                                                    Editing fees for: {institutionLookup.get(activeFeeTab)?.label} ({institutionLookup.get(activeFeeTab)?.subLabel})
                                                </div>
                                            )}

                                            <div className="space-y-4">
                                                {activeYearFees.map((fee, feeIndex) => (
                                                    <div key={feeIndex} className={`flex flex-wrap md:flex-nowrap gap-3 items-end pb-4 ${feeIndex < activeYearFees.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                        <div className="w-full md:w-24">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Year</label>
                                                            <input type="number" min={1} className="w-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" style={{ borderRadius: '9999px' }} value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                                        </div>
                                                        <div className="w-full md:w-32">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Currency</label>
                                                            <div className="flex items-center border border-gray-200 shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]" style={{ borderRadius: '9999px' }}>
                                                                <span className="bg-gray-50 px-3 py-2 text-gray-400 border-r border-gray-200"><Coins size={14} /></span>
                                                                <input type="text" className="flex-1 px-3 py-2 text-sm focus:outline-none w-full bg-transparent" placeholder="NPR/USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                                            </div>
                                                        </div>
                                                        <div className="flex-1 min-w-[140px]">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Amount</label>
                                                            <input type="text" className="w-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" style={{ borderRadius: '9999px' }} placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                                        </div>
                                                        <div className="flex-1 min-w-[160px]">
                                                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Note</label>
                                                            <input type="text" className="w-full border border-gray-200 px-4 py-2 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" style={{ borderRadius: '9999px' }} placeholder="e.g. Tuition fee" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                                        </div>
                                                        <div className="flex justify-end ml-auto">
                                                            {activeYearFees.length > 1 ? (
                                                                <button 
                                                                    type="button" 
                                                                    className="border border-gray-200 shadow-sm text-red-500 bg-white hover:bg-red-50 p-2.5 transition-colors" 
                                                                    onClick={() => removeFeeYear(feeIndex)}
                                                                    style={{ borderRadius: '9999px' }}
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            ) : (
                                                                <div style={{ width: '38px' }} />
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Submit */}
                <div className="flex justify-end pb-12 pt-4">
                    <button 
                        type="submit" 
                        className="inline-flex items-center justify-center gap-3 bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-lg px-8 py-4 transition-colors disabled:opacity-60" 
                        disabled={saving}
                        style={{ borderRadius: '9999px' }}
                    >
                        {saving ? <Loader2 size={20} className="spin" /> : <CheckCircle size={20} />}
                        <span className="font-bold text-sm uppercase tracking-widest">{saving ? 'Processing...' : 'Save All Details'}</span>
                    </button>
                </div>

                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                    .custom-scrollbar::-webkit-scrollbar { height: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
                `}</style>
            </form>
        </div>
    );
}