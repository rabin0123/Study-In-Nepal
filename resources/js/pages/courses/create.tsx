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
        <div ref={wrapperRef} className="relative">
            <div className={`flex items-center rounded-md shadow-sm bg-white border ${error ? 'border-red-500' : 'border-gray-200'}`}>
                <span className="flex items-center pl-2 pr-2 text-gray-400">
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
                    className="w-full py-1.5 pr-3 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
                    autoComplete="off"
                />
            </div>

            {isOpen && filteredOptions.length > 0 && !disabled && (
                <ul
                    className="absolute z-[1000] w-full mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-100 overflow-y-auto"
                    style={{ maxHeight: 240 }}
                >
                    {filteredOptions.map((opt, idx) => (
                        <li key={idx}>
                            <a
                                href="javascript:void(0)"
                                onMouseDown={(e) => { e.preventDefault(); onChange(opt); setIsOpen(false); }}
                                className="flex items-center gap-2 rounded px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
                            >
                                <span className="iconify text-gray-400" data-icon="lucide:book" data-width="14"></span>
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
        <div ref={wrapperRef} className="relative">
            <div
                className={`flex items-center justify-between rounded-md shadow-sm px-3 py-1.5 text-sm ${disabled ? 'bg-gray-50 text-gray-400 border border-gray-100 cursor-not-allowed' : 'bg-white text-gray-900 border border-gray-200 cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <span className="iconify text-gray-400" data-icon="lucide:building-2" data-width="18"></span>
                    <span>{displayText}</span>
                </div>
                <span className="iconify text-gray-400" data-icon={isOpen ? "lucide:chevron-up" : "lucide:chevron-down"} data-width="18"></span>
            </div>

            {isOpen && !disabled && (
                <div
                    className="absolute z-[1000] w-full mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-100 overflow-y-auto"
                    style={{ maxHeight: 280 }}
                >
                    {options.length === 0 ? (
                        <div className="text-gray-400 p-2 text-center text-sm">
                            <span className="iconify mb-1 opacity-50 block mx-auto" data-icon="lucide:inbox" data-width="20"></span>
                            No institutions found.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <div
                                key={opt.key}
                                className="flex items-start gap-2 rounded px-2 py-2 mb-1 cursor-pointer hover:bg-gray-100"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggle(opt.key);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 flex-shrink-0 cursor-pointer"
                                    checked={selectedKeys.includes(opt.key)}
                                    readOnly
                                />
                                <div>
                                    <div className="font-medium leading-snug mb-1 text-gray-900 text-sm">{opt.label}</div>
                                    <div className="text-gray-400 leading-snug text-xs">{opt.subLabel}</div>
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
// 3. Rich Text Editor — Word-like toolbar (execCommand based, saves as HTML)
// ---------------------------------------------------------------------------
const FONT_FAMILIES = [
    { label: 'Default', value: '' },
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: "'Times New Roman', serif" },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Verdana', value: 'Verdana, sans-serif' },
    { label: 'Calibri', value: 'Calibri, sans-serif' },
    { label: 'Courier New', value: "'Courier New', monospace" },
];

const FONT_SIZES = [
    { label: '8', value: '1' },
    { label: '10', value: '2' },
    { label: '12', value: '3' },
    { label: '14', value: '4' },
    { label: '18', value: '5' },
    { label: '24', value: '6' },
    { label: '32', value: '7' },
];

const HIGHLIGHT_COLORS = ['#FFF59D', '#A5D6A7', '#90CAF9', '#EF9A9A', '#CE93D8', '#FFCC80', 'transparent'];
const TEXT_COLORS = ['#111827', '#DC2626', '#2563EB', '#16A34A', '#D97706', '#7C3AED', '#FFFFFF'];

function ToolbarButton({ icon, title, onClick, active }: { icon: string; title: string; onClick: () => void; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`flex items-center justify-center w-7 h-7 rounded border text-gray-700 shadow-sm ${active ? 'bg-blue-50 border-blue-300 text-blue-600' : 'bg-white border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
        >
            <span className="iconify" data-icon={icon} data-width="15"></span>
        </button>
    );
}

function SwatchPopover({
    colors, onPick, icon, title,
}: { colors: string[]; onPick: (c: string) => void; icon: string; title: string }) {
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
                className="flex items-center justify-center w-7 h-7 rounded border border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700 shadow-sm"
            >
                <span className="iconify" data-icon={icon} data-width="15"></span>
            </button>
            {open && (
                <div className="absolute z-[1000] top-full left-0 mt-1 p-2 bg-white rounded-md shadow-lg border border-gray-100 flex flex-wrap gap-1" style={{ width: 132 }}>
                    {colors.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onPick(c); setOpen(false); }}
                            className="w-5 h-5 rounded border border-gray-200"
                            style={{ background: c === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 8px 8px' : c }}
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

    const focusEditor = () => editorRef.current?.focus();

    const exec = (cmd: string, arg?: string) => {
        focusEditor();
        document.execCommand(cmd, false, arg);
        if (editorRef.current) onChange(editorRef.current.innerHTML);
    };

    const applyBlock = (tag: string) => exec('formatBlock', tag);

    return (
        <div className={`rounded-md shadow-sm bg-white overflow-hidden border ${error ? 'border-red-500' : 'border-gray-200'}`}>
            <div className="bg-gray-50 p-1.5 border-b border-gray-100 flex flex-wrap items-center gap-1">
                {/* Paragraph / Heading style */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => applyBlock(e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 shadow-sm focus:outline-none"
                    title="Paragraph style"
                >
                    <option value="" disabled>Style</option>
                    <option value="P">Paragraph</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="H3">Heading 3</option>
                    <option value="BLOCKQUOTE">Quote</option>
                </select>

                {/* Font family */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => exec('fontName', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 shadow-sm focus:outline-none"
                    title="Font family"
                    style={{ maxWidth: 120 }}
                >
                    <option value="" disabled>Font</option>
                    {FONT_FAMILIES.map((f) => (
                        <option key={f.label} value={f.value}>{f.label}</option>
                    ))}
                </select>

                {/* Font size */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => exec('fontSize', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white text-gray-700 shadow-sm focus:outline-none"
                    title="Font size"
                >
                    <option value="" disabled>Size</option>
                    {FONT_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <ToolbarButton icon="lucide:bold" title="Bold" onClick={() => exec('bold')} />
                <ToolbarButton icon="lucide:italic" title="Italic" onClick={() => exec('italic')} />
                <ToolbarButton icon="lucide:underline" title="Underline" onClick={() => exec('underline')} />
                <ToolbarButton icon="lucide:strikethrough" title="Strikethrough" onClick={() => exec('strikeThrough')} />

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <SwatchPopover icon="lucide:baseline" title="Text color" colors={TEXT_COLORS} onPick={(c) => exec('foreColor', c)} />
                <SwatchPopover icon="lucide:highlighter" title="Highlight color" colors={HIGHLIGHT_COLORS} onPick={(c) => exec('hiliteColor', c === 'transparent' ? 'transparent' : c)} />

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <ToolbarButton icon="lucide:align-left" title="Align left" onClick={() => exec('justifyLeft')} />
                <ToolbarButton icon="lucide:align-center" title="Align center" onClick={() => exec('justifyCenter')} />
                <ToolbarButton icon="lucide:align-right" title="Align right" onClick={() => exec('justifyRight')} />
                <ToolbarButton icon="lucide:align-justify" title="Justify" onClick={() => exec('justifyFull')} />

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <ToolbarButton icon="lucide:list" title="Bullet list" onClick={() => exec('insertUnorderedList')} />
                <ToolbarButton icon="lucide:list-ordered" title="Numbered list" onClick={() => exec('insertOrderedList')} />
                <ToolbarButton icon="lucide:indent-decrease" title="Decrease indent" onClick={() => exec('outdent')} />
                <ToolbarButton icon="lucide:indent-increase" title="Increase indent" onClick={() => exec('indent')} />

                <div className="w-px h-5 bg-gray-200 mx-0.5" />

                <ToolbarButton icon="lucide:link" title="Insert link" onClick={() => {
                    const url = window.prompt('Enter URL');
                    if (url) exec('createLink', url);
                }} />
                <ToolbarButton icon="lucide:unlink" title="Remove link" onClick={() => exec('unlink')} />
                <ToolbarButton icon="lucide:eraser" title="Clear formatting" onClick={() => exec('removeFormat')} />
                <ToolbarButton icon="lucide:undo-2" title="Undo" onClick={() => exec('undo')} />
                <ToolbarButton icon="lucide:redo-2" title="Redo" onClick={() => exec('redo')} />
            </div>
            <div
                ref={editorRef}
                className="p-3 bg-white text-sm editor-content"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 140, outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`.editor-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; }`}</style>
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

    // Fees per institution
    const [feesByInst, setFeesByInst] = useState<Record<string, YearFee[]>>({});

    // Single shared tab drives BOTH modules and fees sections
    const [activeInstTab, setActiveInstTab] = useState<string | null>(null);

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

    // Keep Modules and Fees in sync with selected institutions, and drive the single shared tab
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

        setActiveInstTab((prevActive) => (prevActive && selectedInstKeys.includes(prevActive) ? prevActive : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));
    }, [selectedInstKeys]);

    const toggleInstitution = (key: string) => setSelectedInstKeys((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

    // -- Module Handlers --
    const addYear = () => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: [...prev[activeInstTab], { year: nextYear(prev[activeInstTab]), title: '', modules: [''] }] }));
    };
    const removeYear = (index: number) => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].filter((_, i) => i !== index) }));
    };
    const updateYear = (index: number, patch: Partial<YearModule>) => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].map((y, i) => (i === index ? { ...y, ...patch } : y)) }));
    };
    const addModuleLine = (yearIndex: number) => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].map((y, i) => i === yearIndex ? { ...y, modules: [...y.modules, ''] } : y) }));
    };
    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? value : m)) } : y) }));
    };
    const removeModuleLine = (yearIndex: number, moduleIndex: number) => {
        if (!activeInstTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.filter((_, mi) => mi !== moduleIndex) } : y) }));
    };
    const copyToAllInstitutions = () => {
        if (!activeInstTab) return;
        const source = yearModulesByInst[activeInstTab];
        setYearModulesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeInstTab) next[key] = JSON.parse(JSON.stringify(source)); });
            return next;
        });
    };

    // -- Fee Handlers --
    const addFeeYear = () => {
        if (!activeInstTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeInstTab]: [...prev[activeInstTab], { year: nextYear(prev[activeInstTab]), amount: '', currency: '', note: '' }] }));
    };
    const removeFeeYear = (index: number) => {
        if (!activeInstTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].filter((_, i) => i !== index) }));
    };
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => {
        if (!activeInstTab) return;
        setFeesByInst((prev) => ({ ...prev, [activeInstTab]: prev[activeInstTab].map((f, i) => (i === index ? { ...f, ...patch } : f)) }));
    };
    const copyFeesToAllInstitutions = () => {
        if (!activeInstTab) return;
        const source = feesByInst[activeInstTab];
        setFeesByInst((prev) => {
            const next = { ...prev };
            selectedInstKeys.forEach((key) => { if (key !== activeInstTab) next[key] = JSON.parse(JSON.stringify(source)); });
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

    const activeYearModules = activeInstTab ? (yearModulesByInst[activeInstTab] ?? []) : [];
    const activeYearFees = activeInstTab ? (feesByInst[activeInstTab] ?? []) : [];

    return (
        <div className="max-w-full py-6 px-4">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '850px' }}>

                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
                    <div>
                        <h4 className="mb-1 font-bold text-gray-900 flex items-center gap-2 text-xl">
                            <span className="iconify text-blue-600" data-icon="lucide:graduation-cap" data-width="24"></span>
                            New Course Details
                        </h4>
                        <p className="mb-0 text-gray-500 text-sm">
                            Define a course once and securely link it to multiple colleges effortlessly.
                        </p>
                    </div>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-3 py-2 disabled:opacity-60" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:save"} data-width="16"></span>
                        <span className="font-medium text-sm">{saving ? 'Saving...' : 'Save details'}</span>
                    </button>
                </div>

                {savedMessage && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-800 shadow-sm rounded-lg px-3 py-2 mb-4 text-sm">
                        <span className="iconify" data-icon="lucide:check-circle-2" data-width="18"></span>
                        <span className="font-medium">{savedMessage}</span>
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="bg-white shadow-sm rounded-lg mb-4">
                    <div className="p-4 md:p-5">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>1</span>
                            Select Course
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">Search or type a course to unlock the connected institutions.</p>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8">
                                <label className="block font-semibold text-gray-900 text-sm mb-1">Course Name <span className="text-red-500">*</span></label>
                                <ComboboxInput
                                    placeholder="e.g. BSc Computer Science..."
                                    value={courseName}
                                    onChange={setCourseName}
                                    options={uniqueCourses}
                                    error={errors.course_name}
                                />
                                {errors.course_name && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Colleges & Universities */}
                <div className="bg-white shadow-sm rounded-lg mb-4">
                    <div className="p-4 md:p-5">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>2</span>
                            Select Institutions
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">Check all the colleges this curriculum should apply to.</p>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            <div className="md:col-span-8">
                                <label className="block font-semibold text-gray-900 text-sm mb-1">Colleges / Universities <span className="text-red-500">*</span></label>
                                <MultiSelectDropdown
                                    options={availableInstitutions}
                                    selectedKeys={selectedInstKeys}
                                    onToggle={toggleInstitution}
                                    disabled={!courseName || availableInstitutions.length === 0}
                                    placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                                />
                                {errors.institutions && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><span className="iconify" data-icon="lucide:alert-circle" data-width="14"></span>{errors.institutions}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="bg-white shadow-sm rounded-lg mb-4">
                    <div className="p-4 md:p-5">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>3</span>
                            Global Course Information
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">This description applies globally to the course.</p>

                        <div className="mb-4">
                            <label className="flex items-center gap-1 font-semibold text-gray-900 text-sm mb-1">
                                <span className="iconify text-gray-400" data-icon="lucide:file-text" data-width="16"></span> Course Summary
                            </label>
                            <RichTextEditor value={summaryHtml} onChange={setSummaryHtml} placeholder="Write an engaging overview..." error={errors.summary} />
                        </div>

                        <div>
                            <label className="flex items-center gap-1 font-semibold text-gray-900 text-sm mb-1">
                                <span className="iconify text-gray-400" data-icon="lucide:briefcase" data-width="16"></span> Career Prospects
                            </label>
                            <RichTextEditor value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers_summary} />
                        </div>
                    </div>
                </div>

                {/* 4 & 5. Modules + Fees — single shared institution tab */}
                <div className="bg-white shadow-sm rounded-lg mb-5">
                    <div className="p-4 md:p-5">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>4</span>
                            Modules &amp; Fees (Per Institution)
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">Pick an institution below — its modules and fees are edited together.</p>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-gray-400 p-6 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-center text-sm">
                                <span className="iconify opacity-25 mb-2 block mx-auto" data-icon="lucide:layers" data-width="32"></span>
                                No institutions selected.
                            </div>
                        ) : (
                            <>
                                {/* Single shared tab bar */}
                                <ul className="flex flex-nowrap overflow-x-auto pb-1 gap-2 mb-4">
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeInstTab;
                                        return (
                                            <li key={key} className="flex-shrink-0">
                                                <button
                                                    type="button"
                                                    className={`rounded-full border px-3 py-1.5 text-left flex flex-col ${isActive ? 'bg-blue-600 border-blue-600 shadow-sm text-white' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'}`}
                                                    onClick={() => setActiveInstTab(key)}
                                                    style={{ minWidth: '150px' }}
                                                >
                                                    <span className="font-semibold block truncate text-sm" style={{ maxWidth: '170px' }}>{info ? info.label : key}</span>
                                                    <span className={`block truncate ${isActive ? 'text-blue-100' : 'text-gray-400'}`} style={{ maxWidth: '170px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {/* -- Modules block -- */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                            <span className="iconify text-blue-600" data-icon="lucide:book-open" data-width="16"></span> Course Modules
                                        </div>
                                        {activeInstTab && (
                                            <div className="flex gap-2">
                                                {selectedInstKeys.length > 1 && (
                                                    <button type="button" className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 shadow-sm px-2 py-1 text-xs text-gray-700 hover:bg-gray-50" onClick={copyToAllInstitutions} title="Copy to all">
                                                        <span className="iconify" data-icon="lucide:copy" data-width="14"></span> <span className="hidden sm:inline">Apply to all</span>
                                                    </button>
                                                )}
                                                <button type="button" className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-2 py-1 text-xs" onClick={addYear}>
                                                    <span className="iconify" data-icon="lucide:plus" data-width="14"></span> Add Year
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {activeYearModules.map((yearBlock, yearIndex) => (
                                        <div key={yearIndex} className="border border-gray-100 rounded-lg mb-3">
                                            <div className="bg-gray-50 border-b border-gray-100 p-2 px-3 flex items-center justify-between rounded-t-lg">
                                                <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                                    <span className="iconify text-blue-600" data-icon="lucide:calendar" data-width="16"></span> Academic Year Set {yearIndex + 1}
                                                </div>
                                                {activeYearModules.length > 1 && (
                                                    <button type="button" className="text-red-500 flex items-center gap-1 py-0" onClick={() => removeYear(yearIndex)}>
                                                        <span className="iconify" data-icon="lucide:trash-2" data-width="14"></span>
                                                    </button>
                                                )}
                                            </div>
                                            <div className="p-3">
                                                <div className="grid grid-cols-12 gap-2 mb-3">
                                                    <div className="col-span-3 md:col-span-2">
                                                        <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year Num</label>
                                                        <input type="number" min={1} className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm shadow-sm" value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                    </div>
                                                    <div className="col-span-9 md:col-span-10">
                                                        <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year Title (Optional)</label>
                                                        <input type="text" className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm shadow-sm" placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-2">
                                                    {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                        <div key={moduleIndex} className="flex gap-2">
                                                            <div className="flex items-center flex-1 rounded-md border border-gray-200 shadow-sm overflow-hidden">
                                                                <span className="bg-gray-50 text-gray-400 px-2 py-1 text-sm border-r border-gray-200">{moduleIndex + 1}.</span>
                                                                <input type="text" className="flex-1 px-2 py-1 text-sm focus:outline-none" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                            </div>
                                                            {yearBlock.modules.length > 1 && (
                                                                <button type="button" className="rounded-md border border-gray-200 shadow-sm text-red-500 px-2 flex-shrink-0" onClick={() => removeModuleLine(yearIndex, moduleIndex)}><span className="iconify" data-icon="lucide:x" data-width="14"></span></button>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                <button type="button" className="inline-flex items-center gap-1 rounded-full border border-gray-300 text-gray-600 px-2 py-1 mt-2 hover:bg-gray-50" style={{ fontSize: '0.75rem' }} onClick={() => addModuleLine(yearIndex)}>
                                                    <span className="iconify" data-icon="lucide:plus" data-width="12"></span> Add Module Subject
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* -- Fees block -- */}
                                <div>
                                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                                        <div className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                                            <span className="iconify text-blue-600" data-icon="lucide:coins" data-width="16"></span> Fee Structure
                                        </div>
                                        {activeInstTab && (
                                            <div className="flex gap-2">
                                                {selectedInstKeys.length > 1 && (
                                                    <button type="button" className="inline-flex items-center gap-1 rounded-md bg-white border border-gray-200 shadow-sm px-2 py-1 text-xs text-gray-700 hover:bg-gray-50" onClick={copyFeesToAllInstitutions} title="Copy to all">
                                                        <span className="iconify" data-icon="lucide:copy" data-width="14"></span> <span className="hidden sm:inline">Apply to all</span>
                                                    </button>
                                                )}
                                                <button type="button" className="inline-flex items-center gap-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-2 py-1 text-xs" onClick={addFeeYear}>
                                                    <span className="iconify" data-icon="lucide:plus" data-width="14"></span> Add Fee Row
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        {activeInstTab && institutionLookup.has(activeInstTab) && (
                                            <div className="mb-3 flex items-center gap-2 text-blue-700 bg-blue-50 px-3 py-2 rounded-md text-sm font-medium">
                                                <span className="iconify" data-icon="lucide:info" data-width="14"></span>
                                                Editing fees for: {institutionLookup.get(activeInstTab)?.label} ({institutionLookup.get(activeInstTab)?.subLabel})
                                            </div>
                                        )}

                                        {activeYearFees.map((fee, feeIndex) => (
                                            <div key={feeIndex} className={`grid grid-cols-12 gap-2 items-end mb-2 pb-2 ${feeIndex < activeYearFees.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                                <div className="col-span-4 md:col-span-2">
                                                    <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year</label>
                                                    <input type="number" min={1} className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm shadow-sm" value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                                </div>
                                                <div className="col-span-8 md:col-span-3">
                                                    <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Currency</label>
                                                    <div className="flex items-center rounded-md border border-gray-200 shadow-sm overflow-hidden">
                                                        <span className="bg-white px-2 py-1 text-gray-400"><span className="iconify" data-icon="lucide:coins" data-width="14"></span></span>
                                                        <input type="text" className="flex-1 px-1 py-1 text-sm focus:outline-none" placeholder="NPR/USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                                    </div>
                                                </div>
                                                <div className="col-span-12 md:col-span-3">
                                                    <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Amount</label>
                                                    <input type="text" className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm shadow-sm" placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                                </div>
                                                <div className="col-span-9 md:col-span-3">
                                                    <label className="block text-gray-400 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Note</label>
                                                    <input type="text" className="w-full rounded-md border border-gray-200 px-2 py-1 text-sm shadow-sm" placeholder="Tuition" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                                </div>
                                                <div className="col-span-3 md:col-span-1 flex justify-end">
                                                    {activeYearFees.length > 1 ? (
                                                        <button type="button" className="rounded-md border border-gray-200 shadow-sm text-red-500 px-2 py-1" onClick={() => removeFeeYear(feeIndex)}>
                                                            <span className="iconify" data-icon="lucide:trash-2" data-width="14"></span>
                                                        </button>
                                                    ) : (
                                                        <div style={{ width: '32px' }} />
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pb-5 pt-2">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm px-4 py-2 disabled:opacity-60" disabled={saving}>
                        <span className={`iconify ${saving ? "spin" : ""}`} data-icon={saving ? "lucide:loader-2" : "lucide:check-circle"} data-width="18"></span>
                        <span className="font-medium text-sm">{saving ? 'Processing...' : 'Save All Details'}</span>
                    </button>
                </div>

                <style>{`
                    .spin { animation: spin 1s linear infinite; }
                    @keyframes spin { 100% { transform: rotate(360deg); } }
                `}</style>
            </form>
        </div>
    );
}