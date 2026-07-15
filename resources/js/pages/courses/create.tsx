import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import {
    Search, Book, Building2, ChevronUp, ChevronDown, Inbox,
    Bold, Italic, Underline, Strikethrough, Type, Highlighter,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Outdent, Indent, Link as LinkIcon, Unlink, Eraser,
    Undo2, Redo2,
    Loader2, Save, CheckCircle2,
    AlertCircle, FileText, Briefcase, Calendar, Trash2, X, Coins, Info,
    CheckCircle, Copy, Plus, Layers, GraduationCap
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

interface CourseDetailPayload {
    id: number;
    uuid: string;
    course_name: string;
    summary: string | null;
    careers_summary: string | null;
    institutions?: Array<{
        university_name: string;
        college_name: string;
        year_wise_modules?: Array<{
            year: number;
            title: string | null;
            modules: string[];
        }>;
    }>;
    fees?: Array<{
        year: number;
        amount: string | null;
        currency: string | null;
        note: string | null;
    }>;
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
            <div className={`flex items-center rounded-full shadow-sm bg-white border px-2 ${error ? 'border-red-500' : 'border-gray-200 focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]'}`}>
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
                    className="w-full py-2.5 pr-4 rounded-full text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
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
                                className="w-full flex items-center gap-2 rounded-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#008AE6] transition-colors"
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
                className={`flex items-center justify-between rounded-full shadow-sm px-4 py-2.5 text-sm transition-colors ${disabled ? 'bg-gray-50 text-gray-400 border border-gray-200 cursor-not-allowed' : 'bg-white text-gray-900 border border-gray-200 hover:border-[#008AE6] cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2">
                    <Building2 size={16} className={disabled ? 'text-gray-300' : 'text-gray-400'} />
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
                        <div className="text-gray-400 p-2 text-center text-sm">
                            <Inbox size={20} className="mb-1 opacity-50 mx-auto" />
                            No institutions found.
                        </div>
                    ) : (
                        options.map((opt) => (
                            <div
                                key={opt.key}
                                className="flex items-start gap-2 rounded-lg px-2 py-2 mb-1 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggle(opt.key);
                                }}
                            >
                                <input
                                    type="checkbox"
                                    className="mt-1 flex-shrink-0 cursor-pointer accent-[#008AE6]"
                                    checked={selectedKeys.includes(opt.key)}
                                    readOnly
                                />
                                <div>
                                    <div className="font-medium leading-snug mb-0.5 text-gray-900 text-sm">{opt.label}</div>
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
const TEXT_COLORS = ['#111827', '#008AE6', '#DC2626', '#16A34A', '#D97706', '#7C3AED', '#FFFFFF'];

function ToolbarButton({ icon: Icon, title, onClick, active }: { icon: any; title: string; onClick: () => void; active?: boolean }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClick}
            className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors ${active ? 'bg-[#008AE6]/10 border-[#008AE6]/30 text-[#008AE6]' : 'bg-white border-gray-200 shadow-sm hover:bg-gray-100 text-gray-700'}`}
        >
            <Icon size={13} />
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
                className="flex items-center justify-center w-7 h-7 rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-100 text-gray-700 transition-colors"
            >
                <Icon size={13} />
            </button>
            {open && (
                <div className="absolute z-[1000] top-full left-0 mt-2 p-2 bg-white rounded-xl shadow-lg border border-gray-100 flex flex-wrap gap-1" style={{ width: 132 }}>
                    {colors.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onPick(c); setOpen(false); }}
                            className="w-6 h-6 rounded-full border border-gray-200 hover:scale-110 transition-transform"
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
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (editorRef.current) {
            if (isFirstRender.current || (value === '' && editorRef.current.innerHTML !== '')) {
                editorRef.current.innerHTML = value || '';
                isFirstRender.current = false;
            }
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
        <div className={`rounded-2xl shadow-sm bg-white overflow-hidden border ${error ? 'border-red-500' : 'border-gray-200'}`}>
            <div className="bg-gray-50 p-2 border-b border-gray-100 flex flex-wrap items-center gap-1.5">
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => applyBlock(e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:border-[#008AE6] hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Paragraph style"
                >
                    <option value="" disabled>Style</option>
                    <option value="P">Paragraph</option>
                    <option value="H1">Heading 1</option>
                    <option value="H2">Heading 2</option>
                    <option value="H3">Heading 3</option>
                    <option value="BLOCKQUOTE">Quote</option>
                </select>

                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => exec('fontName', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:border-[#008AE6] hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Font family"
                    style={{ maxWidth: 120 }}
                >
                    <option value="" disabled>Font</option>
                    {FONT_FAMILIES.map((f) => (
                        <option key={f.label} value={f.value}>{f.label}</option>
                    ))}
                </select>

                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => exec('fontSize', e.target.value)}
                    defaultValue=""
                    className="text-xs border border-gray-200 rounded-full px-3 py-1.5 bg-white text-gray-700 shadow-sm focus:outline-none focus:border-[#008AE6] hover:bg-gray-50 transition-colors cursor-pointer"
                    title="Font size"
                >
                    <option value="" disabled>Size</option>
                    {FONT_SIZES.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <ToolbarButton icon={Bold} title="Bold" onClick={() => exec('bold')} />
                <ToolbarButton icon={Italic} title="Italic" onClick={() => exec('italic')} />
                <ToolbarButton icon={Underline} title="Underline" onClick={() => exec('underline')} />
                <ToolbarButton icon={Strikethrough} title="Strikethrough" onClick={() => exec('strikeThrough')} />

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <SwatchPopover icon={Type} title="Text color" colors={TEXT_COLORS} onPick={(c) => exec('foreColor', c)} />
                <SwatchPopover icon={Highlighter} title="Highlight color" colors={HIGHLIGHT_COLORS} onPick={(c) => exec('hiliteColor', c === 'transparent' ? 'transparent' : c)} />

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <ToolbarButton icon={AlignLeft} title="Align left" onClick={() => exec('justifyLeft')} />
                <ToolbarButton icon={AlignCenter} title="Align center" onClick={() => exec('justifyCenter')} />
                <ToolbarButton icon={AlignRight} title="Align right" onClick={() => exec('justifyRight')} />
                <ToolbarButton icon={AlignJustify} title="Justify" onClick={() => exec('justifyFull')} />

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <ToolbarButton icon={List} title="Bullet list" onClick={() => exec('insertUnorderedList')} />
                <ToolbarButton icon={ListOrdered} title="Numbered list" onClick={() => exec('insertOrderedList')} />
                <ToolbarButton icon={Outdent} title="Decrease indent" onClick={() => exec('outdent')} />
                <ToolbarButton icon={Indent} title="Increase indent" onClick={() => exec('indent')} />

                <div className="w-px h-6 bg-gray-200 mx-1" />

                <ToolbarButton icon={LinkIcon} title="Insert link" onClick={() => {
                    const url = window.prompt('Enter URL');
                    if (url) exec('createLink', url);
                }} />
                <ToolbarButton icon={Unlink} title="Remove link" onClick={() => exec('unlink')} />
                <ToolbarButton icon={Eraser} title="Clear formatting" onClick={() => exec('removeFormat')} />
                <ToolbarButton icon={Undo2} title="Undo" onClick={() => exec('undo')} />
                <ToolbarButton icon={Redo2} title="Redo" onClick={() => exec('redo')} />
            </div>
            <div
                ref={editorRef}
                className="p-4 bg-white text-sm text-gray-800 editor-content"
                contentEditable
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
                style={{ minHeight: 160, outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`.editor-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; font-style: italic; }`}</style>
        </div>
    );
}

// ----------------------------------------------------------------------
// Unified Component
// ----------------------------------------------------------------------
export default function CourseDetailsForm({ courseDetail }: { courseDetail?: CourseDetailPayload }) {
    const isEdit = !!courseDetail;

    const [masterData, setMasterData] = useState<ApiDataRow[]>([]);
    const [courseName, setCourseName] = useState('');
    const [selectedInstKeys, setSelectedInstKeys] = useState<string[]>([]);
    const [summaryHtml, setSummaryHtml] = useState('');
    const [careersHtml, setCareersHtml] = useState('');

    // Modules per institution
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>({});
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(null);

    // Fees are course-level
    const [courseFees, setCourseFees] = useState<YearFee[]>(defaultYearFee());

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [savedMessage, setSavedMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!savedMessage) return;
        const t = setTimeout(() => setSavedMessage(null), 4000);
        return () => clearTimeout(t);
    }, [savedMessage]);

    // Fetch university list on mount
    useEffect(() => {
        fetch('https://www.admin.studyinnepal.com/api/university')
            .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
            .then((data) => { setMasterData(Array.isArray(data) ? data : []); })
            .catch((err) => console.error('Error fetching university data:', err));
    }, []);

    // Set initial values dynamically if in edit mode (or when courseDetail prop updates)
    useEffect(() => {
        if (!courseDetail) return;

        setCourseName(courseDetail.course_name ?? '');
        setSummaryHtml(courseDetail.summary ?? '');
        setCareersHtml(courseDetail.careers_summary ?? '');

        if (courseDetail.fees && courseDetail.fees.length > 0) {
            setCourseFees(courseDetail.fees.map((f: any) => ({
                year: Number(f.year),
                amount: String(f.amount ?? ''),
                currency: String(f.currency ?? ''),
                note: String(f.note ?? '')
            })));
        } else {
            setCourseFees(defaultYearFee());
        }

        if (courseDetail.institutions && courseDetail.institutions.length > 0) {
            const keys = courseDetail.institutions.map((i: any) => `${i.university_name}|||${i.college_name}`);
            setSelectedInstKeys(keys);

            const modules: Record<string, YearModule[]> = {};
            courseDetail.institutions.forEach((i: any) => {
                const key = `${i.university_name}|||${i.college_name}`;
                if (i.year_wise_modules && i.year_wise_modules.length > 0) {
                    modules[key] = i.year_wise_modules.map((y: any) => ({
                        year: Number(y.year),
                        title: String(y.title ?? ''),
                        modules: Array.isArray(y.modules) ? y.modules.map(String) : ['']
                    }));
                } else {
                    modules[key] = defaultYearModules();
                }
            });
            setYearModulesByInst(modules);
        }
    }, [courseDetail]);

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

    // Safeguard selected keys from being purged until master data successfully finishes loading
    useEffect(() => {
        if (masterData.length === 0) return;
        const validKeys = availableInstitutions.map(i => i.key);
        setSelectedInstKeys(prev => prev.filter(k => validKeys.includes(k)));
    }, [availableInstitutions, masterData]);

    // Keep Modules in sync with selected institutions
    useEffect(() => {
        setYearModulesByInst((prev) => {
            const next: Record<string, YearModule[]> = {};
            selectedInstKeys.forEach((key) => { next[key] = prev[key] ?? defaultYearModules(); });
            return next;
        });
        setActiveModuleTab((prevActive) => (prevActive && selectedInstKeys.includes(prevActive) ? prevActive : selectedInstKeys.length > 0 ? selectedInstKeys[0] : null));
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
        setCourseFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    };
    const removeFeeYear = (index: number) => {
        setCourseFees((prev) => prev.filter((_, i) => i !== index));
    };
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => {
        setCourseFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!courseName.trim()) { setErrors({ course_name: 'Course name is required.' }); return; }
        if (selectedInstKeys.length === 0) { setErrors({ institutions: 'Please select at least one institution.' }); return; }

        setSaving(true);
        setErrors({});

        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');

            const cleanModules = (yearModulesByInst[key] ?? []).filter((y) => y.year).map((y) => ({
                year: y.year,
                title: y.title.trim() || null,
                modules: y.modules.map((m) => m.trim()).filter(Boolean),
            }));

            return {
                university_name: uni,
                college_name: col,
                year_wise_modules: cleanModules,
            };
        });

        const cleanFees = courseFees
            .filter((f) => f.year)
            .map((f) => ({
                year: f.year,
                amount: f.amount.trim() || null,
                currency: f.currency.trim() || null,
                note: f.note.trim() || null,
            }));

        const payload = {
            course_name: courseName.trim(),
            summary: summaryHtml.trim() || null,
            careers_summary: careersHtml.trim() || null,
            institutions: institutionsPayload,
            fees: cleanFees,
        };

        const endpoint = isEdit ? `/course-details/${courseDetail.uuid}` : '/course-details';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(endpoint, {
            method: method,
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
        <div className="max-w-full py-6 px-4 sm:px-6 bg-[#fafafa] min-h-screen">
            <form onSubmit={handleSubmit} className="mx-auto" style={{ maxWidth: '850px' }}>

                {/* Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-gray-200 flex-wrap gap-3">
                    <div>
                        <h4 className="mb-1 font-bold text-gray-900 flex items-center gap-2 text-xl">
                            <GraduationCap size={22} className="text-[#008AE6]" />
                            {isEdit ? 'Edit Course Details' : 'New Course Details'}
                        </h4>
                        <p className="text-gray-500 text-sm mb-0">
                            {isEdit 
                              ? 'Modify this curriculum specification and apply updates to connected colleges.' 
                              : 'Define a course once and securely link it to multiple colleges effortlessly.'}
                        </p>
                    </div>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-4 py-2 transition-colors disabled:opacity-60" disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        <span className="font-medium text-sm">
                            {saving ? (isEdit ? 'Updating...' : 'Saving...') : (isEdit ? 'Update details' : 'Save details')}
                        </span>
                    </button>
                </div>

                {savedMessage && (
                    <div className="flex items-center gap-2 bg-green-50 text-green-800 border-0 shadow-sm rounded-xl p-2 mb-4 text-sm">
                        <CheckCircle2 size={18} />
                        <span className="font-medium">{savedMessage}</span>
                    </div>
                )}

                {/* 1. Course Selection */}
                <div className="bg-white shadow-sm rounded-xl mb-4 border-0">
                    <div className="p-3 md:p-4">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>1</span>
                            Select Course
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">Search or type a course to unlock the connected institutions.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block font-semibold text-gray-900 text-sm mb-1.5">Course Name <span className="text-red-500">*</span></label>
                                <ComboboxInput
                                    placeholder="e.g. BSc Computer Science..."
                                    value={courseName}
                                    onChange={setCourseName}
                                    options={uniqueCourses}
                                    error={errors.course_name}
                                />
                                {errors.course_name && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.course_name}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Colleges & Universities */}
                <div className="bg-white shadow-sm rounded-xl mb-4 border-0">
                    <div className="p-3 md:p-4">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>2</span>
                            Select Institutions
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">Check all the colleges this curriculum should apply to.</p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <label className="block font-semibold text-gray-900 text-sm mb-1.5">Colleges / Universities <span className="text-red-500">*</span></label>
                                <MultiSelectDropdown
                                    options={availableInstitutions}
                                    selectedKeys={selectedInstKeys}
                                    onToggle={toggleInstitution}
                                    disabled={!courseName || availableInstitutions.length === 0}
                                    placeholder={!courseName ? "Waiting for course selection..." : "Select institutions..."}
                                />
                                {errors.institutions && <div className="text-red-500 text-sm mt-1 flex items-center gap-1"><AlertCircle size={14} />{errors.institutions}</div>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Global Information */}
                <div className="bg-white shadow-sm rounded-xl mb-4 border-0">
                    <div className="p-3 md:p-4">
                        <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                            <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>3</span>
                            Global Course Information
                        </h6>
                        <p className="text-gray-500 text-sm mb-3">This description applies globally to the course.</p>

                        <div className="mb-3">
                            <label className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm mb-1.5">
                                <FileText size={16} className="text-gray-400" /> Course Summary
                            </label>
                            <RichTextEditor value={summaryHtml} onChange={setSummaryHtml} placeholder="Write an engaging overview..." error={errors.summary} />
                        </div>

                        <div>
                            <label className="flex items-center gap-1.5 font-semibold text-gray-900 text-sm mb-1.5">
                                <Briefcase size={16} className="text-gray-400" /> Career Prospects
                            </label>
                            <RichTextEditor value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers_summary} />
                        </div>
                    </div>
                </div>

                {/* 4. Course Modules */}
                <div className="bg-white shadow-sm rounded-xl mb-4 border-0">
                    <div className="p-3 md:p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div>
                                <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                                    <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>4</span>
                                    Course Modules (Per Institution)
                                </h6>
                                <p className="text-gray-500 text-sm mb-0">Configure the syllabus independently for each selected college.</p>
                            </div>

                            {activeModuleTab && (
                                <div className="flex gap-2">
                                    {selectedInstKeys.length > 1 && (
                                        <button type="button" className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 shadow-sm px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors" onClick={copyToAllInstitutions} title="Copy to all">
                                            <Copy size={14} /> <span className="hidden sm:inline">Apply to all</span>
                                        </button>
                                    )}
                                    <button type="button" className="inline-flex items-center gap-1 rounded-full bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-3 py-1.5 text-sm transition-colors" onClick={addYear}>
                                        <Plus size={14} /> Add Year
                                    </button>
                                </div>
                            )}
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-gray-400 p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center text-sm">
                                <Layers size={28} className="opacity-25 mb-2 mx-auto" />
                                No institutions selected.
                            </div>
                        ) : (
                            <>
                                <ul className="flex flex-nowrap overflow-x-auto pb-1 gap-2 mb-3 custom-scrollbar">
                                    {selectedInstKeys.map((key) => {
                                        const info = institutionLookup.get(key);
                                        const isActive = key === activeModuleTab;
                                        return (
                                            <li key={key} className="flex-shrink-0">
                                                <button
                                                    type="button"
                                                    className={`rounded-full border px-3 py-1.5 text-left flex flex-col transition-colors ${isActive ? 'bg-[#008AE6] border-[#008AE6] shadow-sm text-white' : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'}`}
                                                    onClick={() => setActiveModuleTab(key)}
                                                    style={{ minWidth: '150px' }}
                                                >
                                                    <span className="font-semibold block truncate text-sm" style={{ maxWidth: '170px' }}>{info ? info.label : key}</span>
                                                    <span className={`block truncate ${isActive ? 'text-white/70' : 'text-gray-500'}`} style={{ maxWidth: '170px', fontSize: '0.65rem' }}>{info?.subLabel}</span>
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>

                                {activeYearModules.map((yearBlock, yearIndex) => (
                                    <div key={yearIndex} className="border border-gray-100 rounded-xl mb-3">
                                        <div className="bg-gray-50 border-b border-gray-100 p-2 px-3 flex items-center justify-between rounded-t-xl">
                                            <div className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                <Calendar size={16} className="text-[#008AE6]" /> Academic Year Set {yearIndex + 1}
                                            </div>
                                            {activeYearModules.length > 1 && (
                                                <button type="button" className="text-red-500 hover:text-red-700 flex items-center gap-1 p-0.5" onClick={() => removeYear(yearIndex)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                        <div className="p-3">
                                            <div className="grid grid-cols-12 gap-2 mb-3">
                                                <div className="col-span-3 md:col-span-2">
                                                    <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year Num</label>
                                                    <input type="number" min={1} className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" value={yearBlock.year} onChange={(e) => updateYear(yearIndex, { year: Number(e.target.value) || 1 })} />
                                                </div>
                                                <div className="col-span-9 md:col-span-10">
                                                    <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year Title (Optional)</label>
                                                    <input type="text" className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" placeholder={`e.g. Year ${yearBlock.year} - Core Fundamentals`} value={yearBlock.title} onChange={(e) => updateYear(yearIndex, { title: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                {yearBlock.modules.map((moduleValue, moduleIndex) => (
                                                    <div key={moduleIndex} className="flex gap-2">
                                                        <div className="flex items-center flex-1 rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]">
                                                            <span className="bg-gray-50 text-gray-400 px-3 py-1.5 text-sm border-r border-gray-200">{moduleIndex + 1}.</span>
                                                            <input type="text" className="flex-1 px-3 py-1.5 text-sm focus:outline-none bg-transparent" placeholder="Module Name..." value={moduleValue} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                        </div>
                                                        {yearBlock.modules.length > 1 && (
                                                            <button type="button" className="rounded-full border border-gray-200 shadow-sm text-red-500 bg-white hover:bg-red-50 px-2.5 flex-shrink-0 transition-colors" onClick={() => removeModuleLine(yearIndex, moduleIndex)}><X size={14} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" className="inline-flex items-center gap-1 rounded-full border border-gray-300 text-gray-600 px-3 py-1 mt-2 hover:bg-gray-50 transition-colors" style={{ fontSize: '0.75rem' }} onClick={() => addModuleLine(yearIndex)}>
                                                <Plus size={12} /> Add Module Subject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>

                {/* 5. Fees */}
                <div className="bg-white shadow-sm rounded-xl mb-6 border-0">
                    <div className="p-3 md:p-4">
                        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div>
                                <h6 className="font-bold mb-1 text-gray-900 flex items-center gap-2 text-sm">
                                    <span className="bg-[#008AE6] text-white rounded-full flex items-center justify-center shadow-sm" style={{ width: 22, height: 22, fontSize: 11 }}>5</span>
                                    Fee Structure
                                </h6>
                                <p className="text-gray-500 text-sm mb-0">Outline the standard estimated tuition. This applies to all selected institutions.</p>
                            </div>

                            <button type="button" className="inline-flex items-center gap-1 rounded-full bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-3 py-1.5 text-sm transition-colors" onClick={addFeeYear}>
                                <Plus size={14} /> Add Fee Row
                            </button>
                        </div>

                        {selectedInstKeys.length === 0 ? (
                            <div className="text-gray-400 p-6 border border-dashed border-gray-300 rounded-xl bg-gray-50 text-center text-sm">
                                <Coins size={28} className="opacity-25 mb-2 mx-auto" />
                                No institutions selected.
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <div className="mb-3 flex items-center gap-2 text-[#008AE6] bg-[#008AE6]/10 px-3 py-2 rounded-lg text-sm font-medium">
                                    <Info size={14} />
                                    Applies to: {selectedInstKeys.map((k) => institutionLookup.get(k)?.label).filter(Boolean).join(', ')}
                                </div>

                                {courseFees.map((fee, feeIndex) => (
                                    <div key={feeIndex} className={`grid grid-cols-12 gap-2 items-end mb-2 pb-2 ${feeIndex < courseFees.length - 1 ? 'border-b border-gray-100' : ''}`}>
                                        <div className="col-span-4 md:col-span-2">
                                            <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Year</label>
                                            <input type="number" min={1} className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" value={fee.year} onChange={(e) => updateFeeYear(feeIndex, { year: Number(e.target.value) || 1 })} />
                                        </div>
                                        <div className="col-span-8 md:col-span-3">
                                            <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Currency</label>
                                            <div className="flex items-center rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]">
                                                <span className="px-2.5 text-gray-400"><Coins size={14} /></span>
                                                <input type="text" className="flex-1 px-1.5 py-1.5 text-sm focus:outline-none bg-transparent w-full" placeholder="NPR/USD" value={fee.currency} onChange={(e) => updateFeeYear(feeIndex, { currency: e.target.value })} />
                                            </div>
                                        </div>
                                        <div className="col-span-12 md:col-span-3">
                                            <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Amount</label>
                                            <input type="text" className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" placeholder="12,000" value={fee.amount} onChange={(e) => updateFeeYear(feeIndex, { amount: e.target.value })} />
                                        </div>
                                        <div className="col-span-10 md:col-span-3">
                                            <label className="block text-gray-500 font-semibold mb-1" style={{ fontSize: '0.75rem' }}>Note</label>
                                            <input type="text" className="w-full rounded-full border border-gray-200 px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:border-[#008AE6] focus:ring-1 focus:ring-[#008AE6]" placeholder="Tuition" value={fee.note} onChange={(e) => updateFeeYear(feeIndex, { note: e.target.value })} />
                                        </div>
                                        <div className="col-span-2 md:col-span-1 flex justify-end">
                                            {courseFees.length > 1 ? (
                                                <button type="button" className="rounded-full border border-gray-200 shadow-sm text-red-500 bg-white hover:bg-red-50 p-1.5 transition-colors" onClick={() => removeFeeYear(feeIndex)}>
                                                    <Trash2 size={14} />
                                                </button>
                                            ) : (
                                                <div style={{ width: '30px' }} />
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pb-10 pt-2">
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-4 py-2.5 transition-colors disabled:opacity-60" disabled={saving}>
                        {saving ? <Loader2 size={18} className="spin" /> : <CheckCircle size={18} />}
                        <span className="font-medium text-sm">
                            {saving ? 'Processing...' : (isEdit ? 'Update All Details' : 'Save All Details')}
                        </span>
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