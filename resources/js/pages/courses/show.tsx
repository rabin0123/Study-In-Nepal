import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

// --- Type Definitions based on Laravel Controller Schema ---
type YearModule = { year: number; title?: string | null; modules?: string[] | null };
type YearFee = { year: number; amount?: string | null; currency?: string | null; note?: string | null };

type Props = {
    courseDetail: {
        id?: number;
        uuid?: string;
        university_name: string;
        college_name: string;
        course_name: string;
        summary: string | null;
        year_wise_modules: YearModule[] | null;
        fees: YearFee[] | null;
        careers_summary: string | null; // Replaced careers array with HTML string
        university_id?: number | null;
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

export default function CourseDetailsShow({ courseDetail }: Props) {
    const modules = sortByYear(courseDetail.year_wise_modules);
    const fees = sortByYear(courseDetail.fees);

    // Section definitions for sticky navigation
    const sections = [
        { id: 'overview', label: 'Overview', show: Boolean(courseDetail.summary) },
        { id: 'study', label: 'What you will study', show: modules.length > 0 },
        { id: 'fees', label: 'Fees and funding', show: fees.length > 0 },
        { id: 'careers', label: 'Careers', show: Boolean(courseDetail.careers_summary) },
    ].filter((s) => s.show);

    // Track active tab for module blocks (by year index/value)
    const [activeTab, setActiveTab] = useState<number>(() => {
        return modules.length > 0 ? modules[0].year : 1;
    });

    const jumpTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 100;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    return (
        <div className="sky-page">
            <Head title={`${courseDetail.course_name} | ${courseDetail.university_name}`} />

            {/* Header Utility Logo Bar */}
            <header className="sky-top-nav">
                <div className="sky-top-nav__wrap">
                    <div className="sky-top-nav__logo">
                        {courseDetail.university?.university_logo_url ? (
                            <img src={courseDetail.university.university_logo_url} alt={courseDetail.university_name} />
                        ) : (
                            <span className="sky-top-nav__logo-fallback">
                                {courseDetail.university_name.slice(0, 1).toUpperCase()}
                            </span>
                        )}
                        <span className="sky-top-nav__name">{courseDetail.university_name}</span>
                    </div>
                </div>
            </header>

            {/* Hero Banner Section (Sky Blue tinted image & White overlapping card) */}
            <div className="sky-header-section">
                <div 
                    className="sky-header__bg"
                    style={{
                        backgroundImage: `url(${courseDetail.hero_image_url || 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80'})`
                    }}
                />
                <div className="sky-wrap">
                    <div className="sky-banner-info">
                        <div className="sky-banner-info__wrap">
                            <span className="sky-banner-info__award">
                                {courseDetail.university?.level || 'Postgraduate'}
                            </span>
                            <h1 className="sky-banner-info__title">
                                {courseDetail.course_name}
                            </h1>
                            <div className="sky-banner-info__meta">
                                <p className="sky-banner-info__tagline">
                                    {courseDetail.college_name}
                                </p>
                            </div>
                            <ul className="sky-banner-info__list">
                                {courseDetail.university?.Intake && (
                                    <li>
                                        <span className="sky-icon" aria-hidden="true">📅</span>
                                        <strong>Intake:</strong> {courseDetail.university.Intake}
                                    </li>
                                )}
                                {courseDetail.university?.Location && (
                                    <li>
                                        <span className="sky-icon" aria-hidden="true">📍</span>
                                        <strong>Location:</strong> {courseDetail.university.Location}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sticky Anchor Navigation Bar */}
            {sections.length > 1 && (
                <nav className="sky-subnav" aria-label="Course Sections">
                    <div className="sky-wrap">
                        <ul className="sky-subnav__list">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <button 
                                        type="button" 
                                        onClick={() => jumpTo(s.id)}
                                        className="sky-subnav__link"
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            )}

            {/* Main Content Layout */}
            <main className="sky-wrap sky-main-content">
                
                {/* Breadcrumbs */}
                <nav aria-label="Breadcrumb" className="sky-breadcrumb">
                    <ol className="sky-breadcrumb__order">
                        <li className="sky-breadcrumb__item">
                            <span className="sky-breadcrumb__link">{courseDetail.university_name}</span>
                        </li>
                        <li className="sky-breadcrumb__item">
                            <span className="sky-breadcrumb__link">{courseDetail.college_name}</span>
                        </li>
                        <li className="sky-breadcrumb__item">
                            <span className="sky-breadcrumb__current" aria-current="page">{courseDetail.course_name}</span>
                        </li>
                    </ol>
                </nav>

                {/* Overview Section */}
                {courseDetail.summary && (
                    <section id="overview" className="sky-panel">
                        <div className="sky-row">
                            <div className="sky-col-title">
                                <h2 className="sky-heading">Overview</h2>
                            </div>
                            <div className="sky-col-content">
                                <div className="sky-prose">
                                    {courseDetail.summary}
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* What you will study (Tabbed/Accordion Modules) */}
                {modules.length > 0 && (
                    <section id="study" className="sky-panel sky-panel--blue-bg">
                        <div className="sky-row">
                            <div className="sky-col-title">
                                <h2 className="sky-heading">What you<br />will study</h2>
                            </div>
                            <div className="sky-col-content mt-2">
                                
                                {/* Tab selection headers */}
                                {modules.length > 1 && (
                                    <div className="sky-tab-headers">
                                        {modules.map((yearBlock) => (
                                            <button
                                                key={yearBlock.year}
                                                type="button"
                                                className={`sky-tab-header-btn ${activeTab === yearBlock.year ? 'is-active' : ''}`}
                                                onClick={() => setActiveTab(yearBlock.year)}
                                            >
                                                {yearBlock.title || `Year ${yearBlock.year}`}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Active Year Modules */}
                                <div className="sky-tab-body">
                                    {modules.map((yearBlock) => {
                                        if (activeTab !== yearBlock.year && modules.length > 1) return null;
                                        return (
                                            <div key={yearBlock.year} className="sky-accordion-navigation">
                                                {yearBlock.title && modules.length === 1 && (
                                                    <h3 className="sky-single-year-title">{yearBlock.title}</h3>
                                                )}
                                                {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                                    yearBlock.modules.map((moduleName, i) => (
                                                        <ModuleAccordion key={i} label={moduleName} />
                                                    ))
                                                ) : (
                                                    <p className="sky-muted">No modules listed for this period.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                            </div>
                        </div>
                    </section>
                )}

                {/* Fees and Funding Section */}
                {fees.length > 0 && (
                    <section id="fees" className="sky-panel">
                        <div className="sky-row">
                            <div className="sky-col-title">
                                <h2 className="sky-heading">Fees and<br />funding</h2>
                            </div>
                            <div className="sky-col-content">
                                <p className="sky-section-intro">
                                    The tuition fees you pay are determined by your fee status. Estimated tuition breakdown by year is published below for guidance.
                                </p>
                                <div className="sky-table-wrap">
                                    <table className="sky-content-table">
                                        <thead>
                                            <tr>
                                                <th>Year of Study</th>
                                                <th>Tuition Fee</th>
                                                <th>Additional Notes</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fees.map((fee) => (
                                                <tr key={fee.year}>
                                                    <td className="sky-table-year">Year {fee.year}</td>
                                                    <td className="sky-table-amount">
                                                        {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : '—'}
                                                    </td>
                                                    <td className="sky-table-note">{fee.note || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Careers Summary Section (Rendered as HTML string according to controller) */}
                {courseDetail.careers_summary && (
                    <section id="careers" className="sky-panel">
                        <div className="sky-row">
                            <div className="sky-col-title">
                                <h2 className="sky-heading">Careers</h2>
                            </div>
                            <div className="sky-col-content">
                                {/* Using dangerouslySetInnerHTML as the backend provides an HTML string */}
                                <div 
                                    className="sky-html-content"
                                    dangerouslySetInnerHTML={{ __html: courseDetail.careers_summary }} 
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* Fallback Empty Block */}
                {!courseDetail.summary && modules.length === 0 && !courseDetail.careers_summary && fees.length === 0 && (
                    <section className="sky-panel">
                        <p className="sky-muted text-center">Detailed course structure information hasn't been published yet.</p>
                    </section>
                )}

            </main>

            {/* CSS STYLES FOR SKYBLUE & WHITE THEME */}
            <style>{`
                :root {
                    /* Skyblue & White Palette */
                    --color-sky-lightest: #f0f9ff;
                    --color-sky-light: #e0f2fe;
                    --color-sky: #38bdf8;
                    --color-sky-dark: #0284c7;
                    --color-sky-deep: #082f49;
                    
                    --color-white: #ffffff;
                    --color-gray-bg: #f8fafc;
                    --color-border: #bae6fd;
                    
                    --color-text-main: #334155;
                    --color-text-heading: #0f172a;
                    --color-text-muted: #64748b;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .sky-page {
                    background: var(--color-white);
                    color: var(--color-text-main);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
                    min-height: 100vh;
                    line-height: 1.6;
                }

                .sky-wrap {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 0 24px;
                    width: 100%;
                }

                /* Header Utility Bar */
                .sky-top-nav {
                    background: var(--color-white);
                    border-bottom: 1px solid var(--color-border);
                    position: relative;
                    z-index: 50;
                }
                .sky-top-nav__wrap {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 16px 24px;
                    display: flex;
                    align-items: center;
                }
                .sky-top-nav__logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .sky-top-nav__logo img {
                    height: 38px;
                    width: auto;
                    object-fit: contain;
                }
                .sky-top-nav__logo-fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 36px;
                    height: 36px;
                    border-radius: 8px;
                    background: var(--color-sky-dark);
                    color: var(--color-white);
                    font-weight: bold;
                    font-size: 1.1rem;
                }
                .sky-top-nav__name {
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--color-sky-deep);
                }

                /* Header Cover Background */
                .sky-header-section {
                    position: relative;
                    min-height: 480px;
                    display: flex;
                    align-items: flex-end;
                    background: var(--color-sky-deep);
                    overflow: visible;
                }
                .sky-header__bg {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    opacity: 0.6;
                    mix-blend-mode: multiply; /* Gives it the skyblue tint */
                }
                .sky-header-section::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(0deg, rgba(2, 132, 199, 0.9) 0%, rgba(255, 255, 255, 0) 100%);
                    pointer-events: none;
                }

                /* Overlay Info Box (White/Sky Theme) */
                .sky-banner-info {
                    position: relative;
                    z-index: 20;
                    background: var(--color-white);
                    color: var(--color-text-main);
                    padding: 40px;
                    margin-bottom: -60px; /* Overlaps content layer underneath */
                    box-shadow: 0 20px 40px rgba(2, 132, 199, 0.08);
                    border-radius: 12px;
                    border: 1px solid var(--color-sky-light);
                }
                .sky-banner-info__award {
                    display: inline-block;
                    background: var(--color-sky-light);
                    color: var(--color-sky-dark);
                    padding: 6px 14px;
                    border-radius: 20px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                    margin-bottom: 16px;
                }
                .sky-banner-info__title {
                    font-size: 2.5rem;
                    font-weight: 800;
                    line-height: 1.2;
                    margin-bottom: 10px;
                    color: var(--color-text-heading);
                    letter-spacing: -0.02em;
                }
                .sky-banner-info__meta {
                    margin-bottom: 24px;
                }
                .sky-banner-info__tagline {
                    font-size: 1.15rem;
                    font-weight: 500;
                    color: var(--color-text-muted);
                }
                .sky-banner-info__list {
                    list-style: none;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 24px;
                    border-top: 1px solid var(--color-sky-light);
                    padding-top: 24px;
                    font-size: 0.95rem;
                    color: var(--color-text-main);
                }
                .sky-banner-info__list li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sky-banner-info__list strong {
                    color: var(--color-sky-dark);
                }
                .sky-icon {
                    font-size: 1.1rem;
                }

                /* Sticky Navigation */
                .sky-subnav {
                    background: var(--color-white);
                    border-bottom: 1px solid var(--color-sky-light);
                    position: sticky;
                    top: 0;
                    z-index: 30;
                    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.04);
                }
                .sky-subnav__list {
                    list-style: none;
                    display: flex;
                    gap: 32px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .sky-subnav__list::-webkit-scrollbar { display: none; }
                .sky-subnav__link {
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: var(--color-text-muted);
                    cursor: pointer;
                    font-size: 0.95rem;
                    font-weight: 600;
                    padding: 20px 4px 17px;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: all .2s;
                }
                .sky-subnav__link:hover {
                    color: var(--color-sky-dark);
                    border-bottom-color: var(--color-sky-light);
                }
                .sky-subnav__link:focus, .sky-subnav__link:active {
                    color: var(--color-sky-dark);
                    border-bottom-color: var(--color-sky-dark);
                }

                /* Content Panels */
                .sky-main-content {
                    padding-top: 110px; /* Compensate for header card overlap */
                    padding-bottom: 100px;
                }
                .sky-breadcrumb {
                    margin-bottom: 40px;
                }
                .sky-breadcrumb__order {
                    display: flex;
                    flex-wrap: wrap;
                    list-style: none;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--color-text-muted);
                }
                .sky-breadcrumb__item::after {
                    content: '›';
                    margin: 0 10px;
                    font-size: 1.2rem;
                    line-height: 0.8;
                    vertical-align: middle;
                    color: var(--color-border);
                }
                .sky-breadcrumb__item:last-child::after { content: none; }
                .sky-breadcrumb__current {
                    color: var(--color-sky-dark);
                    font-weight: 600;
                }

                .sky-panel {
                    padding: 60px 0;
                    border-bottom: 1px solid var(--color-sky-lightest);
                }
                .sky-panel:last-of-type { border-bottom: none; }

                /* Panels with slightly tinted backgrounds for contrast */
                .sky-panel--blue-bg {
                    background-color: var(--color-sky-lightest);
                    border-radius: 16px;
                    padding: 60px 40px;
                    margin: 20px 0;
                }

                .sky-row {
                    display: grid;
                    grid-template-columns: 300px 1fr;
                    gap: 40px;
                }
                .sky-heading {
                    font-size: 2rem;
                    font-weight: 800;
                    color: var(--color-text-heading);
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                }
                .sky-section-intro {
                    font-size: 1.1rem;
                    color: var(--color-text-muted);
                    margin-bottom: 24px;
                }
                .sky-prose {
                    font-size: 1.05rem;
                    line-height: 1.8;
                    color: var(--color-text-main);
                    white-space: pre-line;
                }

                /* HTML Content styling for the Careers Summary string */
                .sky-html-content {
                    font-size: 1.05rem;
                    line-height: 1.8;
                    color: var(--color-text-main);
                }
                .sky-html-content p { margin-bottom: 16px; }
                .sky-html-content ul { 
                    margin-bottom: 16px; 
                    padding-left: 20px; 
                    list-style-type: disc;
                    color: var(--color-text-muted);
                }
                .sky-html-content li { margin-bottom: 8px; }
                .sky-html-content strong { color: var(--color-sky-dark); }

                /* Tabbed Headers */
                .sky-tab-headers {
                    display: flex;
                    border-bottom: 2px solid var(--color-border);
                    margin-bottom: 30px;
                    gap: 24px;
                }
                .sky-tab-header-btn {
                    background: none;
                    border: none;
                    color: var(--color-text-muted);
                    font-size: 1.1rem;
                    font-weight: 700;
                    padding: 10px 0 16px;
                    cursor: pointer;
                    border-bottom: 3px solid transparent;
                    transition: all 0.2s;
                }
                .sky-tab-header-btn.is-active, .sky-tab-header-btn:hover {
                    color: var(--color-sky-dark);
                    border-bottom-color: var(--color-sky-dark);
                }
                .sky-single-year-title {
                    font-size: 1.3rem;
                    font-weight: 700;
                    color: var(--color-text-heading);
                    margin-bottom: 20px;
                }

                /* Accordions */
                .sky-accordion-navigation {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .sky-module-row {
                    background: var(--color-white);
                    border-radius: 8px;
                    border: 1px solid var(--color-border);
                    box-shadow: 0 2px 4px rgba(2, 132, 199, 0.02);
                    overflow: hidden;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .sky-module-row:hover {
                    border-color: var(--color-sky);
                    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.08);
                }
                .sky-module-row__head {
                    width: 100%;
                    background: none;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 24px;
                    font-size: 1.05rem;
                    font-weight: 600;
                    color: var(--color-sky-deep);
                    cursor: pointer;
                    text-align: left;
                }
                .sky-module-row__arrow {
                    color: var(--color-sky);
                    font-size: 1.2rem;
                    transition: transform 0.3s ease;
                }
                .sky-module-row.is-open .sky-module-row__arrow {
                    transform: rotate(90deg);
                }
                .sky-module-row.is-open {
                    border-left: 4px solid var(--color-sky);
                }
                .sky-module-row__body {
                    padding: 0 24px 24px;
                    font-size: 0.95rem;
                    color: var(--color-text-muted);
                    line-height: 1.6;
                }

                /* Table representation */
                .sky-table-wrap {
                    overflow-x: auto;
                    border: 1px solid var(--color-border);
                    border-radius: 8px;
                    background: var(--color-white);
                }
                .sky-content-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.95rem;
                }
                .sky-content-table th {
                    background: var(--color-sky-light);
                    color: var(--color-sky-dark);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.8rem;
                    letter-spacing: 0.05em;
                    padding: 16px 20px;
                    text-align: left;
                }
                .sky-content-table td {
                    padding: 16px 20px;
                    border-bottom: 1px solid var(--color-border);
                    vertical-align: top;
                }
                .sky-content-table tr:last-child td { border-bottom: none; }
                .sky-content-table tr:nth-of-type(even) {
                    background-color: var(--color-gray-bg);
                }
                .sky-table-year {
                    font-weight: 700;
                    color: var(--color-text-heading);
                }
                .sky-table-amount {
                    font-weight: 700;
                    color: var(--color-sky-dark);
                    font-size: 1.05rem;
                }
                .sky-table-note {
                    color: var(--color-text-muted);
                }

                .sky-muted { color: var(--color-text-muted); }
                .text-center { text-align: center; }

                /* Responsive */
                @media (max-width: 900px) {
                    .sky-row {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                    .sky-panel--blue-bg {
                        padding: 40px 20px;
                    }
                }
                @media (max-width: 600px) {
                    .sky-header-section {
                        min-height: 380px;
                    }
                    .sky-banner-info {
                        padding: 24px;
                        margin-bottom: -40px;
                    }
                    .sky-banner-info__title {
                        font-size: 1.8rem;
                    }
                    .sky-main-content {
                        padding-top: 80px;
                    }
                }
            `}</style>
        </div>
    );
}

// Interactive Accordion Row Component
function ModuleAccordion({ label }: { label: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`sky-module-row ${open ? 'is-open' : ''}`}>
            <button 
                type="button" 
                className="sky-module-row__head" 
                onClick={() => setOpen((o) => !o)}
            >
                <span>{label}</span>
                <span className="sky-module-row__arrow" aria-hidden="true">
                    &#10142;
                </span>
            </button>
            {open && (
                <div className="sky-module-row__body">
                    <p>
                        This module covers advanced topics and foundational practices in <strong>{label}</strong>. You'll engage with contemporary industry case studies, practical exercises, and research methodologies designed to build robust operational knowledge.
                    </p>
                </div>
            )}
        </div>
    );
}