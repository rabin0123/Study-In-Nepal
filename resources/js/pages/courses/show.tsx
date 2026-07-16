import { Head } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';

// Iconify is loaded globally via CDN in app.blade.php and registers the
// <iconify-icon> custom element. Declare it here so TSX/JSX recognizes the
// tag and its attributes (icon, width, height, class) without extra imports.
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'iconify-icon': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                icon?: string;
                width?: string | number;
                height?: string | number;
            };
        }
    }
}

type ModuleEntry = { name: string; info?: string | null };
type YearModule = { year: number; title?: string | null; modules?: (string | ModuleEntry)[] | null };
type YearFee = { year: number; amount?: string | null; currency?: string | null; note?: string | null };

type Props = {
    courseDetail: {
        uuid: string;
        university_name: string;
        college_name: string;
        course_name: string;
        summary: string | null;
        year_wise_modules: YearModule[] | null;
        fees: YearFee[] | null;
        careers: string | string[] | null;
        university_id: number | null;
        hero_image_url?: string | null;
        university?: {
            id: number;
            level?: string;
            Intake?: string;
            Location?: string;
            university_logo_url?: string | null;
        } | null;
    };
};

function sortByYear<T extends { year: number }>(items: T[] | null | undefined): T[] {
    if (!items) return [];
    return [...items].sort((a, b) => a.year - b.year);
}

// Modules may come through as either a legacy flat string (just a name) or
// the newer {name, info} object. Normalize to a consistent shape so the
// rendering logic doesn't need to branch everywhere.
function normalizeModuleEntry(m: string | ModuleEntry): ModuleEntry {
    if (typeof m === 'string') return { name: m, info: null };
    return { name: m.name, info: m.info ?? null };
}

// Defensive unwrap: if `careers` ever comes through as a raw JSON string like
// `{"html": "<h2>...</h2>"}` instead of the plain HTML string, pull the HTML
// back out so the page still renders correctly instead of showing raw JSON.
function normalizeCareersData(careers: string | string[] | null | undefined): string | string[] | null {
    if (!careers) return null;

    if (typeof careers === 'string') {
        const trimmed = careers.trim();
        if (trimmed.startsWith('{') && trimmed.includes('"html"')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (typeof parsed?.html === 'string') {
                    return parsed.html;
                }
            } catch {
                // not valid JSON, fall through and use the raw string as-is
            }
        }
        return careers;
    }

    return careers;
}

export default function CourseDetailsShow({ courseDetail }: Props) {
    const modules = sortByYear(courseDetail.year_wise_modules);
    const fees = sortByYear(courseDetail.fees);
    const careersData = normalizeCareersData(courseDetail.careers);

    // Memoize the sections array so we can safely use it in our useEffect observer
    const sections = useMemo(() => {
        return [
            { id: 'overview', label: 'Overview', show: Boolean(courseDetail.summary) },
            { id: 'study', label: 'What you will study', show: modules.length > 0 },
            { id: 'fees', label: 'Fees and funding', show: fees.length > 0 },
            { id: 'careers', label: 'Career Prospectus', show: true },
        ].filter((s) => s.show);
    }, [courseDetail.summary, modules.length, fees.length]);

    const [activeTab, setActiveTab] = useState<number>(() => {
        return modules.length > 0 ? modules[0].year : 1;
    });

    // Tracks the active section for the sticky sub-navigation
    const [activeSection, setActiveSection] = useState<string>('');

    const jumpTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    // States for logos
    const [univLogo, setUnivLogo] = useState<string | null | undefined>(courseDetail.university?.university_logo_url);
    const [collegeLogo, setCollegeLogo] = useState<string | null | undefined>(null);

    // Fetch logos from the API
    useEffect(() => {
        let isMounted = true;

        const fetchLogos = async () => {
            try {
                const res = await fetch('https://www.admin.studyinnepal.com/api/university');
                const data = await res.json();

                if (!isMounted) return;

                // Attempt to match exact university AND college
                const exactMatch = data.find(
                    (item: any) =>
                        item.University === courseDetail.university_name &&
                        item.College === courseDetail.college_name
                );

                if (exactMatch) {
                    if (exactMatch.university_logo_url) setUnivLogo(exactMatch.university_logo_url);
                    if (exactMatch.college_logo_url) setCollegeLogo(exactMatch.college_logo_url);
                } else {
                    // Fallback to partial matching if exactly matching both fails
                    const univMatch = data.find((item: any) => item.University === courseDetail.university_name);
                    const colMatch = data.find((item: any) => item.College === courseDetail.college_name);

                    if (univMatch?.university_logo_url) setUnivLogo(univMatch.university_logo_url);
                    if (colMatch?.college_logo_url) setCollegeLogo(colMatch.college_logo_url);
                }
            } catch (err) {
                console.error('Failed to fetch university API data for logos:', err);
            }
        };

        fetchLogos();

        return () => {
            isMounted = false;
        };
    }, [courseDetail.university_name, courseDetail.college_name]);

    // Intersection Observer to highlight active navigation link based on scroll position
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setActiveSection(entry.target.id);
                    }
                });
            },
            { rootMargin: '-100px 0px -60% 0px', threshold: 0 }
        );

        sections.forEach((s) => {
            const el = document.getElementById(s.id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [sections]);

    return (
        <div className="gcu-page">
            <Head title={`${courseDetail.course_name} | ${courseDetail.university_name}`} />

            {/* ================= HERO SECTION ================= */}
            <div className="gcu-hero position-relative d-flex align-items-end overflow-hidden">
                <div
                    className="gcu-hero__bg position-absolute top-0 start-0 w-100 h-100"
                    style={{
                        backgroundImage: `url(${courseDetail.hero_image_url || 'https://www.studyinnepal.com/images/event_hallway.png'})`,
                    }}
                />
                <div className="gcu-hero__overlay position-absolute top-0 start-0 w-100 h-100" />

                {/* University strip, top-left */}
                <div className="position-absolute top-0 start-0 w-100 pt-4 z-2">
                    <div className="container-xl px-4">
                        <div className="d-flex align-items-center flex-wrap gap-3">
                            {univLogo && (
                                <img
                                    src={univLogo}
                                    alt={courseDetail.university_name}
                                    className="gcu-logo-sm bg-white rounded-3 p-1 flex-shrink-0"
                                />
                            )}
                            <span className="text-white fw-bold fs-6">{courseDetail.university_name}</span>
                        </div>
                    </div>
                </div>

                <div className="container-xl px-4 position-relative z-2">
                    <div className="gcu-banner card border-0 shadow-lg rounded-4 text-white p-4 p-md-5 mb-n5">
                        <span className="badge bg-white bg-opacity-25 text-white fw-bold text-uppercase mb-3 align-self-start px-3 py-2">
                            {courseDetail.university?.level || 'Postgraduate'}
                        </span>
                        <h1 className="fw-bold mb-3 gcu-banner__title">{courseDetail.course_name}</h1>

                        <div className="d-flex align-items-center flex-wrap gap-3 mb-4 fs-5 fw-semibold">
                            {collegeLogo && (
                                <img
                                    src={collegeLogo}
                                    alt={courseDetail.college_name}
                                    className="gcu-logo-xs bg-white rounded-2 p-1 flex-shrink-0"
                                />
                            )}
                            <span>{courseDetail.college_name}</span>
                        </div>

                        <ul className="list-unstyled d-flex flex-wrap gap-4 border-top border-white border-opacity-25 pt-3 mb-0 fw-semibold small">
                            {courseDetail.university?.Intake && (
                                <li className="d-flex align-items-center gap-2">
                                    <iconify-icon icon="material-symbols:calendar-month-outline" width="18" height="18" />
                                    Intake: {courseDetail.university.Intake}
                                </li>
                            )}
                            {courseDetail.university?.Location && (
                                <li className="d-flex align-items-center gap-2">
                                    <iconify-icon icon="material-symbols:location-on-outline" width="18" height="18" />
                                    Location: {courseDetail.university.Location}
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>

            {/* ================= STICKY SUBNAV ================= */}
            {sections.length > 1 && (
                <nav className="gcu-subnav sticky-top bg-white border-bottom" aria-label="Course Sections">
                    <div className="container-xl px-4">
                        <ul className="nav gcu-subnav__list justify-content-center flex-nowrap overflow-auto">
                            {sections.map((s) => (
                                <li className="nav-item" key={s.id}>
                                    <button
                                        type="button"
                                        onClick={() => jumpTo(s.id)}
                                        className={`nav-link gcu-subnav__link fw-bold text-nowrap ${
                                            activeSection === s.id ? 'active' : ''
                                        }`}
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            )}

            <main className="gcu-main">
                {/* ================= OVERVIEW ================= */}
                {courseDetail.summary && (
                    <section id="overview" className="container-xl px-4 gcu-panel border-bottom">
                        <div className="row gy-4 gy-lg-0" style={{ maxWidth: 1200 }}>
                            <div className="col-lg-3">
                                <h2 className="gcu-heading fw-bold fs-3">Overview</h2>
                            </div>
                            <div className="col-lg-9">
                                <div
                                    className="gcu-html-content"
                                    dangerouslySetInnerHTML={{ __html: courseDetail.summary }}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= WHAT YOU WILL STUDY ================= */}
                {modules.length > 0 && (
                    <section id="study" className="gcu-panel-dark gcu-panel">
                        <div className="container-xl px-4">
                            <div className="row gy-4 gy-lg-0" style={{ maxWidth: 1200 }}>
                                <div className="col-lg-3">
                                    <h2 className="fw-bold fs-3 text-white">
                                        What you
                                        <br />
                                        will study
                                    </h2>
                                </div>
                                <div className="col-lg-9">
                                    {modules.length > 1 && (
                                        <ul className="nav gcu-tab-headers flex-wrap gap-4 mb-4 pb-1">
                                            {modules.map((yearBlock) => (
                                                <li className="nav-item" key={yearBlock.year}>
                                                    <button
                                                        type="button"
                                                        className={`nav-link gcu-tab-header-btn fw-bold fs-5 ${
                                                            activeTab === yearBlock.year ? 'active' : ''
                                                        }`}
                                                        onClick={() => setActiveTab(yearBlock.year)}
                                                    >
                                                        {yearBlock.title || `Year ${yearBlock.year}`}
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="accordion gcu-accordion" id="moduleAccordion">
                                        {modules.map((yearBlock) => {
                                            if (activeTab !== yearBlock.year && modules.length > 1) return null;
                                            return (
                                                <div key={yearBlock.year} className="d-flex flex-column gap-3">
                                                    {yearBlock.title && modules.length === 1 && (
                                                        <h3 className="fs-5 fw-bold text-white mb-2">{yearBlock.title}</h3>
                                                    )}
                                                    {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                                        yearBlock.modules
                                                            .map(normalizeModuleEntry)
                                                            .map((mod, i) => (
                                                                <ModuleAccordion
                                                                    key={i}
                                                                    id={`mod-${yearBlock.year}-${i}`}
                                                                    name={mod.name}
                                                                    info={mod.info}
                                                                />
                                                            ))
                                                    ) : (
                                                        <p className="text-white-50 mb-0">No modules listed for this period.</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= FEES AND FUNDING ================= */}
                {fees.length > 0 && (
                    <section id="fees" className="container-xl px-4 gcu-panel border-bottom">
                        <div className="row gy-4 gy-lg-0" style={{ maxWidth: 1200 }}>
                            <div className="col-lg-3">
                                <h2 className="gcu-heading fw-bold fs-3">
                                    Fees and
                                    <br />
                                    funding
                                </h2>
                            </div>
                            <div className="col-lg-9">
                                <p className="text-secondary fs-5 mb-4">
                                    The tuition fees you pay are determined by your fee status. Estimated tuition
                                    breakdown by year is published below for guidance.
                                </p>
                                <div className="table-responsive border rounded-3">
                                    <table className="table table-striped table-hover mb-0 align-middle gcu-fees-table">
                                        <thead>
                                            <tr>
                                                <th className="text-uppercase fw-bold py-3 px-3">
                                                    Year of Study
                                                </th>
                                                <th className="text-uppercase fw-bold py-3 px-3">
                                                    Tuition Fee
                                                </th>
                                                <th className="text-uppercase fw-bold py-3 px-3">
                                                    Additional Notes
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fees.map((fee) => (
                                                <tr key={fee.year}>
                                                    <td className="fw-bold px-3">Year {fee.year}</td>
                                                    <td className="fw-bold text-primary px-3">
                                                        {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : '—'}
                                                    </td>
                                                    <td className="text-secondary px-3">{fee.note || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* ================= CAREER PROSPECTUS ================= */}
                <section
                    id="careers"
                    className="gcu-panel-careers gcu-panel position-relative"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`,
                    }}
                >
                    <div className="gcu-panel-careers__overlay position-absolute top-0 start-0 w-100 h-100" />
                    <div className="container-xl px-4 position-relative z-2">
                        <div className="row gy-4 gy-lg-0" style={{ maxWidth: 1200 }}>
                            <div className="col-lg-3">
                                <h2 className="fw-bold fs-3 text-white">
                                    Career
                                    <br />
                                    Prospectus
                                </h2>
                            </div>
                            <div className="col-lg-9">
                                <p className="text-white-50 fs-5 mb-4">
                                    Our course helps set the trajectory for career positions such as:
                                </p>

                                {typeof careersData === 'string' ? (
                                    <div
                                        className="gcu-html-content gcu-html-content--dark"
                                        dangerouslySetInnerHTML={{ __html: careersData }}
                                    />
                                ) : Array.isArray(careersData) && careersData.length > 0 ? (
                                    <ul className="list-unstyled d-flex flex-wrap gap-2 mb-0">
                                        {careersData.map((c, i) => (
                                            <li key={i} className="gcu-career-pill">
                                                {c}
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-white-50 fst-italic mb-0">
                                        No detailed career prospectus information has been published for this course
                                        yet.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/*
                Bootstrap 5 handles layout, spacing, grid, tables, nav, and badges.
                What's left below is only what Bootstrap has no utility for:
                brand colors, the hero image treatment, sticky-tab underline
                styling, module accordion look, and the dark careers panel
                pill tags. No Tailwind, no other custom framework.
            */}
            <style>{`
                :root {
                    --gcu-blue: #0085da;
                    --gcu-blue-dark: #006bb0;
                    --gcu-blue-deep: #005490;
                    --gcu-blue-light: #6ec4f7;
                    --gcu-black: #12181f;
                }

                .gcu-page {
                    font-family: -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", Arial, sans-serif;
                    overflow-x: clip;
                }

                .gcu-main { padding-top: 50px; padding-bottom: 100px; }
                .gcu-panel { padding-top: 50px; padding-bottom: 50px; }
                .gcu-panel-dark.gcu-panel,
                .gcu-panel-careers.gcu-panel { padding-top: 60px; padding-bottom: 60px; }

                /* ---- Hero ---- */
                .gcu-hero {
                    min-height: 480px;
                    background: #111;
                }
                .gcu-hero__bg {
                    background-size: cover;
                    background-position: center;
                }
                .gcu-hero__overlay {
                    background: linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,133,218,0.6) 100%);
                }
                .z-2 { z-index: 2; }
                .gcu-logo-sm { width: 60px; height: 60px; object-fit: contain; }
                .gcu-logo-xs { width: 50px; height: 50px; object-fit: contain; }

                .gcu-banner {
                    background: linear-gradient(135deg, var(--gcu-blue-dark) 0%, #041118 100%);
                }
                .gcu-banner__title {
                    font-size: 2.3rem;
                    line-height: 1.15;
                    color: #dae4f3;
                }

                /* ---- Sticky subnav ---- */
                .gcu-subnav { top: 0; z-index: 1030; }
                .gcu-subnav__list { --bs-nav-link-padding-y: 0; }
                .gcu-subnav__link { padding-top: 20px !important; padding-bottom: 17px !important; }
                .gcu-subnav__link {
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent !important;
                    border-radius: 0 !important;
                    color: #4c5764 !important;
                }
                .gcu-subnav__link:hover {
                    color: var(--gcu-blue) !important;
                    border-bottom-color: var(--gcu-blue-light) !important;
                }
                .gcu-subnav__link.active {
                    color: var(--gcu-blue) !important;
                    border-bottom-color: var(--gcu-blue) !important;
                }
                .gcu-subnav__link:focus-visible {
                    outline: 2px solid var(--gcu-blue);
                    outline-offset: 2px;
                }

                /* ---- Headings / prose ---- */
                .gcu-heading { color: var(--gcu-blue-dark); }
                .gcu-html-content { font-size: 1.05rem; line-height: 1.75; }
                .gcu-html-content h2 { font-size: 1.4rem; font-weight: 800; margin: 28px 0 12px; color: var(--gcu-blue-dark); }
                .gcu-html-content h2:first-child { margin-top: 0; }
                .gcu-html-content h3 { font-size: 1.1rem; font-weight: 700; margin: 22px 0 10px; color: var(--gcu-blue); }
                .gcu-html-content p { margin-bottom: 14px; }
                .gcu-html-content ul { list-style: none; display: flex; flex-wrap: wrap; gap: 10px; margin: 10px 0 20px; padding: 0; }
                .gcu-html-content ul li {
                    background: #f4f6f8; border: 1px solid #bae0fb; padding: 8px 16px;
                    border-radius: 999px; font-weight: 600; font-size: 0.9rem; color: var(--gcu-blue-dark);
                }
                .gcu-html-content--dark { color: rgba(255,255,255,0.9); }
                .gcu-html-content--dark h2 { color: #fff; }
                .gcu-html-content--dark h3 { color: var(--gcu-blue-light); }
                .gcu-html-content--dark p { color: rgba(255,255,255,0.8); }
                .gcu-html-content--dark ul li {
                    background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); color: #fff;
                }

                /* ---- Study panel (dark) ---- */
                .gcu-panel-dark { background-color: var(--gcu-black); }
                .gcu-tab-headers { border-bottom: 2px solid rgba(255,255,255,0.2); }
                .gcu-tab-header-btn {
                    background: none; border: none; border-bottom: 4px solid transparent !important;
                    border-radius: 0 !important; color: rgba(255,255,255,0.6) !important; padding-bottom: 14px !important;
                }
                .gcu-tab-header-btn:hover, .gcu-tab-header-btn.active {
                    color: #fff !important; border-bottom-color: #fff !important;
                }

                /* Module accordion rows */
                .gcu-accordion .card { border: none; border-radius: 6px; overflow: hidden; }
                .gcu-mod-btn {
                    color: var(--gcu-blue);
                    font-weight: 700;
                }
                .gcu-mod-btn:not(.collapsed) { color: var(--gcu-blue-dark); }
                .gcu-mod-arrow { transition: transform 0.2s ease; }
                .gcu-mod-btn[aria-expanded="true"] .gcu-mod-arrow { transform: rotate(90deg); }

                /* ---- Fees table header ----
                   Bootstrap's .table/.table-striped set background via the
                   --bs-table-bg CSS variable on td/th, which otherwise wins
                   over a plain background-color rule here. Set both the
                   variable and the property directly on thead th, and force
                   white text so header labels stay visible against the blue
                   background — this fixes the header row rendering blank
                   (white text was landing on a white-inherited background). */
                .gcu-fees-table thead th {
                    --bs-table-bg: var(--gcu-blue);
                    background-color: var(--gcu-blue) !important;
                    color: #fff !important;
                    border-color: var(--gcu-blue);
                }
                .gcu-fees-table { font-size: 0.95rem; }
                .gcu-fees-table thead th {
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                }
                .gcu-fees-table tbody td {
                    font-size: 0.95rem;
                }

                /* ---- Careers panel ---- */
                .gcu-panel-careers {
                    background-color: #1e293b;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                }
                .gcu-panel-careers__overlay { background-color: rgba(15,23,42,0.88); }
                .gcu-career-pill {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.14);
                    color: #fff;
                    padding: 8px 16px;
                    border-radius: 999px;
                    font-size: 0.88rem;
                    transition: background 0.15s, border-color 0.15s;
                }
                .gcu-career-pill:hover {
                    background: rgba(255,255,255,0.16);
                    border-color: var(--gcu-blue-light);
                }

                @media (max-width: 500px) {
                    .gcu-hero { min-height: 270px; }
                    .gcu-banner__title { font-size: 1.4rem; }
                }
            `}</style>
        </div>
    );
}

// Renders a single module row using a Bootstrap accordion-style card.
// The expand chevron and click-to-open behavior only appear when `info`
// has real content — modules with no info render as a plain static row.
function ModuleAccordion({ id, name, info }: { id: string; name: string; info?: string | null }) {
    const hasInfo = Boolean(info && info.trim() !== '');
    const [open, setOpen] = useState(false);

    return (
        <div className="card border-0 shadow-sm">
            <button
                type="button"
                className={`gcu-mod-btn btn bg-white w-100 d-flex align-items-center justify-content-between text-start px-4 py-3 ${
                    !hasInfo ? 'pe-none' : ''
                }`}
                onClick={() => hasInfo && setOpen((o) => !o)}
                aria-expanded={hasInfo ? open : undefined}
                style={{ cursor: hasInfo ? 'pointer' : 'default' }}
            >
                <span>{name}</span>
                {hasInfo && (
                    <iconify-icon
                        icon="material-symbols:chevron-right-rounded"
                        width="22"
                        height="22"
                        className="gcu-mod-arrow flex-shrink-0"
                    />
                )}
            </button>
            {hasInfo && open && (
                <div className="bg-white px-4 pb-3 pt-2 border-top border-dashed">
                    <p className="text-secondary small mb-0" id={id}>
                        {info}
                    </p>
                </div>
            )}
        </div>
    );
}