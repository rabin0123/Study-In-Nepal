import { useEffect, useState, useMemo, useRef, type FormEvent } from 'react';
import {
    Search, Book, Building2, ChevronUp, ChevronDown, Inbox,
    Bold, Italic, Underline, Strikethrough, Type, Highlighter,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Outdent, Indent, Link as LinkIcon, Unlink, Eraser,
    Undo2, Redo2,
    Loader2, Save, CheckCircle2,
    AlertCircle, FileText, Briefcase, Calendar, Trash2, X, Coins, Info,
    CheckCircle, Copy, Plus, Layers, GraduationCap, AlertTriangle
} from 'lucide-react';

// ── Interfaces ──
type ModuleEntry = { name: string; info: string };
type YearModule = { year: number; title: string; modules: ModuleEntry[] };
type YearFee = { year: number; amount: string; currency: string; note: string };

interface ApiDataRow {
    id: number;
    University: string;
    College: string;
    Course: string;
    [key: string]: any;
}

// Shape returned by the Laravel controller for an existing record.
// IMPORTANT: a CourseDetail row is ONE institution, not a course with a
// nested institutions[] array — store() loops and creates one flat row per
// selected institution, and edit()/update() operate on a single row. Field
// names match app/Models/CourseDetail.php exactly (note: `careers`, not
// `careers_summary`; `year_wise_modules` and `fees` are flat columns on the
// row, not nested under institutions).
interface CourseDetailRecord {
    uuid: string;
    course_name: string;
    university_name: string;
    college_name: string;
    summary: string | null;
    careers: string | null;
    year_wise_modules: any[] | null; // raw shape from backend — may be legacy string[] modules or {name, info}[]; run through normalizeYearModules()
    fees: YearFee[] | null;
}

interface InstitutionOption {
    key: string;
    label: string;
    subLabel: string;
    /** true when this institution came from the saved record but is no longer
     *  present in the live admin.studyinnepal.com master list (renamed/removed/etc). */
    isStale?: boolean;
}

// ── Helpers ──
function nextYear(existing: { year: number }[]): number {
    return !existing || existing.length === 0 ? 1 : Math.max(...existing.map((e) => e.year)) + 1;
}

function csrfToken(): string {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function defaultYearModules(): YearModule[] {
    return [{ year: 1, title: 'Year 1', modules: [{ name: '', info: '' }] }];
}

// Backend rows saved before this change store `modules` as a flat string[]
// (just names, no info). Newer rows store {name, info}[]. This normalizes
// either shape into ModuleEntry[] so the form works with both.
function normalizeYearModules(raw: any[] | null | undefined): YearModule[] {
    if (!raw || raw.length === 0) return defaultYearModules();
    return raw.map((y) => ({
        year: y.year,
        title: y.title ?? '',
        modules: (y.modules ?? []).map((m: any) =>
            typeof m === 'string' ? { name: m, info: '' } : { name: m.name ?? '', info: m.info ?? '' }
        ),
    }));
}

function defaultYearFee(): YearFee[] {
    return [{ year: 1, amount: '', currency: '', note: '' }];
}

function instKey(university: string, college: string): string {
    return `${university}|||${college}`;
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
    options: InstitutionOption[];
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
                                    <div className="font-medium leading-snug mb-0.5 text-gray-900 text-sm flex items-center gap-1.5">
                                        {opt.label}
                                        {opt.isStale && (
                                            <span title="Saved on this record but not found in the current institution list" className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 rounded-full px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                                <AlertTriangle size={10} /> not in master list
                                            </span>
                                        )}
                                    </div>
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
// 3. Rich Text Editor — Word-like toolbar (paragraph/heading styles, font,
//    size, bold/italic/underline/strike, colors, alignment, lists, links)
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
    // Track whether we've already pushed `value` into the DOM once, so that
    // external updates (e.g. loading an existing record) render correctly,
    // while typing doesn't get clobbered by re-renders.
    const initializedRef = useRef(false);

    useEffect(() => {
        if (!editorRef.current) return;
        // Sync from parent only on first mount / when value changes externally
        // (e.g. courseDetail finished loading) and editor isn't focused.
        if (!initializedRef.current || document.activeElement !== editorRef.current) {
            if (editorRef.current.innerHTML !== value) {
                editorRef.current.innerHTML = value || '';
            }
            initializedRef.current = true;
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
                {/* Paragraph / Heading style */}
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

                {/* Font family */}
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

                {/* Font size */}
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
                style={{ height: 200, overflowY: 'auto', outline: 'none' }}
                data-placeholder={placeholder}
            />
            <style>{`
                .editor-content:empty:before { content: attr(data-placeholder); color: #9ca3af; pointer-events: none; display: block; font-style: italic; }
                .editor-content ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                .editor-content ul ul { list-style-type: circle; }
                .editor-content ul ul ul { list-style-type: square; }
                .editor-content ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                .editor-content ol ol { list-style-type: lower-alpha; }
                .editor-content ol ol ol { list-style-type: lower-roman; }
                .editor-content li { display: list-item; margin: 0.15rem 0; }
                .editor-content blockquote { border-left: 3px solid #e5e7eb; padding-left: 0.75rem; color: #6b7280; margin: 0.5rem 0; }
            `}</style>
        </div>
    );
}

// ----------------------------------------------------------------------
// Main Component — handles BOTH create and edit.
// Pass `courseDetail` (from Inertia props) when editing; leave it
// undefined/null on the create route.
// ----------------------------------------------------------------------
export default function CourseDetailsForm({ courseDetail }: { courseDetail?: CourseDetailRecord | null }) {
    const isEditMode = !!courseDetail;

    const [masterData, setMasterData] = useState<ApiDataRow[]>([]);
    const [masterLoading, setMasterLoading] = useState(true);
    const [masterError, setMasterError] = useState<string | null>(null);

    // The single saved institution key for this row (edit mode only).
    const savedInstKey = courseDetail ? instKey(courseDetail.university_name, courseDetail.college_name) : null;

    const [courseName, setCourseName] = useState(courseDetail?.course_name ?? '');
    const [selectedInstKeys, setSelectedInstKeys] = useState<string[]>(
        () => (savedInstKey ? [savedInstKey] : [])
    );
    const [summaryHtml, setSummaryHtml] = useState(courseDetail?.summary ?? '');
    const [careersHtml, setCareersHtml] = useState(courseDetail?.careers ?? '');

    // Modules per institution — seeded from the saved record's flat
    // `year_wise_modules` column, keyed under this row's single institution.
    const [yearModulesByInst, setYearModulesByInst] = useState<Record<string, YearModule[]>>(() => {
        if (!savedInstKey) return {};
        return {
            [savedInstKey]: normalizeYearModules(courseDetail?.year_wise_modules ?? null),
        };
    });
    const [activeModuleTab, setActiveModuleTab] = useState<string | null>(savedInstKey);
    // Tracks which module rows have their "course info" field expanded, keyed
    // "instKey:yearIndex:moduleIndex". Separate from the data itself so an
    // empty info string doesn't force the checkbox closed.
    const [expandedModuleInfo, setExpandedModuleInfo] = useState<Set<string>>(() => {
        const seed = new Set<string>();
        if (savedInstKey) {
            (yearModulesByInst[savedInstKey] ?? []).forEach((year, yi) => {
                year.modules.forEach((m, mi) => {
                    if (m.info && m.info.trim() !== '') seed.add(`${savedInstKey}:${yi}:${mi}`);
                });
            });
        }
        return seed;
    });
    const moduleInfoKey = (instKey: string, yearIndex: number, moduleIndex: number) => `${instKey}:${yearIndex}:${moduleIndex}`;
    const toggleModuleInfoVisible = (yearIndex: number, moduleIndex: number) => {
        if (!activeModuleTab) return;
        const key = moduleInfoKey(activeModuleTab, yearIndex, moduleIndex);
        setExpandedModuleInfo((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                // Clear the info text when unchecked so it isn't silently
                // saved despite the checkbox appearing off.
                updateModuleInfo(yearIndex, moduleIndex, '');
            } else {
                next.add(key);
            }
            return next;
        });
    };

    // Fees are stored as a flat column on the row.
    const [courseFees, setCourseFees] = useState<YearFee[]>(
        () => (courseDetail?.fees && courseDetail.fees.length > 0 ? courseDetail.fees : defaultYearFee())
    );

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [savedMessage, setSavedMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!savedMessage) return;
        const t = setTimeout(() => setSavedMessage(null), 4000);
        return () => clearTimeout(t);
    }, [savedMessage]);

    useEffect(() => {
        if (!errorMessage) return;
        const t = setTimeout(() => setErrorMessage(null), 6000);
        return () => clearTimeout(t);
    }, [errorMessage]);

    // Fetch the master list (courses + institutions) from the external admin API.
    // This runs in both create and edit mode — edit mode still needs it so the
    // combobox/course list and "add another institution" picker work.
    useEffect(() => {
        setMasterLoading(true);
        setMasterError(null);
        fetch('/api/university')
            .then((res) => { if (!res.ok) throw new Error('Failed to fetch'); return res.json(); })
            .then((data) => { setMasterData(Array.isArray(data) ? data : []); })
            .catch((err) => {
                console.error('Error fetching university data:', err);
                setMasterError('Could not reach the institution directory. Saved selections are still shown below; search for new ones may be unavailable until this loads.');
            })
            .finally(() => setMasterLoading(false));
    }, []);

    const uniqueCourses = useMemo(() => Array.from(new Set(masterData.map((item) => item.Course).filter(Boolean))), [masterData]);

    // Institutions matching the currently-typed course name, from the live master list.
    const masterInstitutionsForCourse = useMemo(() => {
        if (!courseName) return [];
        const matches = masterData.filter((d) => d.Course?.toLowerCase() === courseName.toLowerCase());
        const unique = new Map<string, InstitutionOption>();
        matches.forEach((m) => {
            if (m.University && m.College) {
                const key = instKey(m.University, m.College);
                if (!unique.has(key)) unique.set(key, { key, label: m.College, subLabel: m.University });
            }
        });
        return Array.from(unique.values());
    }, [masterData, courseName]);

    // The saved institution on this record (edit mode only), independent of
    // whatever the master list currently contains.
    const savedInstitutionOptions = useMemo<InstitutionOption[]>(() => {
        if (!courseDetail) return [];
        return [{
            key: instKey(courseDetail.university_name, courseDetail.college_name),
            label: courseDetail.college_name,
            subLabel: courseDetail.university_name,
        }];
    }, [courseDetail]);

    // Merge: master-list matches ∪ saved selections. Anything present only in
    // the saved record (not in the live master list) is flagged `isStale` so
    // the user can see it, but it's never silently dropped.
    const availableInstitutions = useMemo<InstitutionOption[]>(() => {
        const merged = new Map<string, InstitutionOption>();
        masterInstitutionsForCourse.forEach((opt) => merged.set(opt.key, opt));
        savedInstitutionOptions.forEach((opt) => {
            if (!merged.has(opt.key)) {
                merged.set(opt.key, { ...opt, isStale: true });
            }
        });
        return Array.from(merged.values());
    }, [masterInstitutionsForCourse, savedInstitutionOptions]);

    const institutionLookup = useMemo(() => {
        const map = new Map<string, { label: string; subLabel: string }>();
        availableInstitutions.forEach((i) => map.set(i.key, { label: i.label, subLabel: i.subLabel }));
        return map;
    }, [availableInstitutions]);

    // Prune selections that are neither in the master list nor part of the
    // originally-saved record. This only strips genuinely invalid/new-typed
    // selections — it never removes something that was saved on the record.
    useEffect(() => {
        const validKeys = new Set(availableInstitutions.map((i) => i.key));
        setSelectedInstKeys((prev) => prev.filter((k) => validKeys.has(k)));
    }, [availableInstitutions]);

    // Keep Modules in sync with selected institutions.
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
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: [...prev[activeModuleTab], { year: nextYear(prev[activeModuleTab]), title: '', modules: [{ name: '', info: '' }] }] }));
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
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: [...y.modules, { name: '', info: '' }] } : y) }));
    };
    const updateModuleLine = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeModuleTab) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? { ...m, name: value } : m)) } : y) }));
    };
    // Info text is capped at 50 words — extra words typed past the cap are
    // simply not applied, rather than silently truncating what's on screen.
    const updateModuleInfo = (yearIndex: number, moduleIndex: number, value: string) => {
        if (!activeModuleTab) return;
        const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
        if (wordCount > 50) return;
        setYearModulesByInst((prev) => ({ ...prev, [activeModuleTab]: prev[activeModuleTab].map((y, i) => i === yearIndex ? { ...y, modules: y.modules.map((m, mi) => (mi === moduleIndex ? { ...m, info: value } : m)) } : y) }));
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

    // -- Fee Handlers (course-level, shared) --
    const addFeeYear = () => {
        setCourseFees((prev) => [...prev, { year: nextYear(prev), amount: '', currency: '', note: '' }]);
    };
    const removeFeeYear = (index: number) => {
        setCourseFees((prev) => prev.filter((_, i) => i !== index));
    };
    const updateFeeYear = (index: number, patch: Partial<YearFee>) => {
        setCourseFees((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
    };

    const cleanModulesFor = (key: string) =>
        (yearModulesByInst[key] ?? []).filter((y) => y.year).map((y) => ({
            year: y.year,
            title: y.title.trim() || null,
            modules: y.modules
                .map((m) => ({ name: m.name.trim(), info: m.info.trim() || null }))
                .filter((m) => m.name !== ''),
        }));

    const cleanFees = () =>
        courseFees.filter((f) => f.year).map((f) => ({
            year: f.year,
            amount: f.amount.trim() || null,
            currency: f.currency.trim() || null,
            note: f.note.trim() || null,
        }));

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (!courseName.trim()) { setErrors({ course_name: 'Course name is required.' }); return; }
        if (selectedInstKeys.length === 0) { setErrors({ institutions: 'Please select at least one institution from the dropdown.' }); return; }

        setSaving(true);
        setErrors({});

        if (isEditMode && courseDetail) {
            // update() (PUT /course-details/{uuid}) only ever patches THIS single
            // flat row — it has no concept of a multi-institution course. So:
            //  - the row's own institution (savedInstKey) is PUT to /course-details/{uuid}
            //  - any additional institutions the user checked are NEW rows,
            //    created via the same store() endpoint the create page uses
            // If the user unchecked the original institution, its row is left
            // as-is (not deleted) — deleting would need a separate DELETE call,
            // which this form intentionally doesn't do implicitly.
            const updatePayload = {
                course_name: courseName.trim(),
                summary: summaryHtml.trim() || null,
                careers: careersHtml.trim() || null,
                year_wise_modules: savedInstKey ? cleanModulesFor(savedInstKey) : [],
                fees: cleanFees(),
            };

            const newInstKeys = selectedInstKeys.filter((k) => k !== savedInstKey);
            const newInstitutionsPayload = newInstKeys.length > 0 ? {
                course_name: courseName.trim(),
                summary: summaryHtml.trim() || null,
                careers: careersHtml.trim() || null,
                fees: cleanFees(),
                institutions: newInstKeys.map((key) => {
                    const [uni, col] = key.split('|||');
                    return { university_name: uni, college_name: col, year_wise_modules: cleanModulesFor(key) };
                }),
            } : null;

            const requests: Promise<Response>[] = [
                fetch(`/course-details/${courseDetail.uuid}`, {
                    method: 'POST', // spoofed PUT — see note below
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify({ ...updatePayload, _method: 'PUT' }),
                }),
            ];
            if (newInstitutionsPayload) {
                requests.push(fetch('/course-details', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken() },
                    body: JSON.stringify(newInstitutionsPayload),
                }));
            }

            Promise.all(requests)
                .then(async (responses) => {
                    for (const res of responses) {
                        if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : {});
                            throw new Error(data.message || 'Failed to save changes.');
                        }
                    }
                    setSavedMessage(newInstitutionsPayload
                        ? 'Updated, and added new institution rows for this course.'
                        : 'Updated successfully.');
                })
                .catch((err) => {
                    console.error('Failed to save course details', err);
                    setErrorMessage(err instanceof Error ? err.message : 'Failed to save changes. Please try again.');
                })
                .finally(() => setSaving(false));
            return;
        }

        // Create mode: one store() call creates a row per selected institution.
        const institutionsPayload = selectedInstKeys.map((key) => {
            const [uni, col] = key.split('|||');
            return { university_name: uni, college_name: col, year_wise_modules: cleanModulesFor(key) };
        });

        const payload = {
            course_name: courseName.trim(),
            summary: summaryHtml.trim() || null,
            careers: careersHtml.trim() || null,
            institutions: institutionsPayload,
            fees: cleanFees(),
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
                    throw new Error(data.message || 'Failed to save.');
                }
                setSavedMessage(data.message || 'Saved successfully.');
                // Reset the form so the user can create another entry without
                // accidentally re-submitting the same course/institutions again.
                setCourseName('');
                setSelectedInstKeys([]);
                setSummaryHtml('');
                setCareersHtml('');
                setYearModulesByInst({});
                setActiveModuleTab(null);
                setCourseFees(defaultYearFee());
            })
            .catch((err) => {
                console.error('Failed to save course details', err);
                setErrorMessage(err instanceof Error ? err.message : 'Failed to save. Please try again.');
            })
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
                            {isEditMode ? 'Edit Course Details' : 'New Course Details'}
                        </h4>
                        <p className="text-gray-500 text-sm mb-0">
                            {isEditMode
                                ? 'Update the course and its per-institution details.'
                                : 'Define a course once and securely link it to multiple colleges effortlessly.'}
                        </p>
                    </div>
                    <button type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#008AE6] hover:bg-[#0071bf] text-white shadow-sm px-4 py-2 transition-colors disabled:opacity-60" disabled={saving}>
                        {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
                        <span className="font-medium text-sm">{saving ? 'Saving...' : isEditMode ? 'Update details' : 'Save details'}</span>
                    </button>
                </div>

                {(savedMessage || errorMessage) && (
                    <div className="fixed bottom-4 right-4 z-[2000] flex flex-col-reverse gap-2" style={{ maxWidth: 360 }}>
                        {savedMessage && (
                            <div className="flex items-start gap-2 bg-green-50 text-green-800 border-0 shadow-lg rounded-xl p-3 text-sm animate-in">
                                <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5" />
                                <span className="font-medium flex-1">{savedMessage}</span>
                                <button type="button" onClick={() => setSavedMessage(null)} className="text-green-700 hover:text-green-900 flex-shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                        {errorMessage && (
                            <div className="flex items-start gap-2 bg-red-50 text-red-800 border-0 shadow-lg rounded-xl p-3 text-sm">
                                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                                <span className="font-medium flex-1">{errorMessage}</span>
                                <button type="button" onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-900 flex-shrink-0">
                                    <X size={14} />
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {masterError && (
                    <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border-0 shadow-sm rounded-xl p-2 mb-4 text-sm">
                        <AlertTriangle size={16} />
                        <span className="font-medium">{masterError}</span>
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
                        <p className="text-gray-500 text-sm mb-3">
                            Check all the colleges this curriculum should apply to.
                            {masterLoading && <span className="inline-flex items-center gap-1 text-gray-400 ml-2"><Loader2 size={12} className="spin" /> loading institution directory...</span>}
                        </p>

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
                            <RichTextEditor value={careersHtml} onChange={setCareersHtml} placeholder="Highlight future job opportunities..." error={errors.careers} />
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

                                            <div className="flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar" style={{ maxHeight: 260 }}>
                                                {yearBlock.modules.map((moduleEntry, moduleIndex) => {
                                                    const infoKey = activeModuleTab ? moduleInfoKey(activeModuleTab, yearIndex, moduleIndex) : '';
                                                    const isInfoOpen = expandedModuleInfo.has(infoKey);
                                                    const infoWordCount = moduleEntry.info.trim() === '' ? 0 : moduleEntry.info.trim().split(/\s+/).length;
                                                    return (
                                                        <div key={moduleIndex} className="flex flex-col gap-1.5">
                                                            <div className="flex gap-2 items-center">
                                                                <label className="flex-shrink-0 flex items-center justify-center cursor-pointer" title="Add course information for this module">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="cursor-pointer accent-[#008AE6]"
                                                                        checked={isInfoOpen}
                                                                        onChange={() => toggleModuleInfoVisible(yearIndex, moduleIndex)}
                                                                    />
                                                                </label>
                                                                <div className="flex items-center flex-1 rounded-full border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]">
                                                                    <span className="bg-gray-50 text-gray-400 px-3 py-1.5 text-sm border-r border-gray-200">{moduleIndex + 1}.</span>
                                                                    <input type="text" className="flex-1 px-3 py-1.5 text-sm focus:outline-none bg-transparent" placeholder="Module Name..." value={moduleEntry.name} onChange={(e) => updateModuleLine(yearIndex, moduleIndex, e.target.value)} />
                                                                </div>
                                                                {yearBlock.modules.length > 1 && (
                                                                    <button type="button" className="rounded-full border border-gray-200 shadow-sm text-red-500 bg-white hover:bg-red-50 px-2.5 flex-shrink-0 transition-colors" onClick={() => removeModuleLine(yearIndex, moduleIndex)}><X size={14} /></button>
                                                                )}
                                                            </div>
                                                            {isInfoOpen && (
                                                                <div className="ml-7 flex flex-col gap-1">
                                                                    <div className="flex items-center rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden focus-within:border-[#008AE6] focus-within:ring-1 focus-within:ring-[#008AE6]">
                                                                        <input
                                                                            type="text"
                                                                            className="flex-1 px-3 py-1.5 text-sm focus:outline-none bg-transparent"
                                                                            placeholder="Short course information for this module (max 50 words)..."
                                                                            value={moduleEntry.info}
                                                                            onChange={(e) => updateModuleInfo(yearIndex, moduleIndex, e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <span className={`text-right ${infoWordCount >= 50 ? 'text-amber-600' : 'text-gray-400'}`} style={{ fontSize: '0.65rem' }}>{infoWordCount}/50 words</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
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

                {/* 5. Fees (course-level, applies to all selected institutions) */}
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
                        <span className="font-medium text-sm">{saving ? 'Processing...' : isEditMode ? 'Update All Details' : 'Save All Details'}</span>
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