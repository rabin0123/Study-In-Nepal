import { Head } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type YearModule = { year: number; title?: string | null; modules?: string[] | null };
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
        careers: string[] | null;
        university_id: number | null;
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
    const careers = courseDetail.careers ?? [];

    const sections = [
        { id: 'overview', label: 'Overview', show: Boolean(courseDetail.summary) },
        { id: 'structure', label: 'Course structure', show: modules.length > 0 },
        { id: 'fees', label: 'Fees and funding', show: fees.length > 0 },
        { id: 'careers', label: 'After the course', show: careers.length > 0 },
    ].filter((s) => s.show);

    const [activeSection, setActiveSection] = useState<string>(sections[0]?.id ?? 'overview');

    useEffect(() => {
        const onScroll = () => {
            let best = { id: activeSection, dist: Infinity };
            sections.forEach((s) => {
                const el = document.getElementById(s.id);
                if (!el) return;
                const dist = Math.abs(el.getBoundingClientRect().top - 130);
                if (dist < best.dist) best = { id: s.id, dist };
            });
            setActiveSection(best.id);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const jumpTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 92;
        window.scrollTo({ top, behavior: 'smooth' });
    };

    return (
        <div className="cd-page">
            <Head title={`${courseDetail.course_name} — ${courseDetail.university_name}`} />

            {/* Top utility bar, like a real institution site */}
            <div className="cd-topbar">
                <div className="cd-topbar__inner">
                    <div className="cd-topbar__brand">
                        {courseDetail.university?.university_logo_url ? (
                            <img
                                src={courseDetail.university.university_logo_url}
                                alt=""
                                className="cd-topbar__logo"
                            />
                        ) : (
                            <span className="cd-topbar__logo cd-topbar__logo--fallback">
                                {courseDetail.university_name.slice(0, 1).toUpperCase()}
                            </span>
                        )}
                        <span className="cd-topbar__name">{courseDetail.university_name}</span>
                    </div>
                </div>
            </div>

            {/* Hero */}
            <header className="cd-hero">
                <div className="cd-hero__media" aria-hidden="true" />
                <div className="cd-hero__inner">
                    <p className="cd-hero__eyebrow">Undergraduate &middot; {courseDetail.college_name}</p>
                    <h1 className="cd-hero__title">{courseDetail.course_name}</h1>

                    <div className="cd-hero__facts">
                        {courseDetail.university?.level && (
                            <div className="cd-fact">
                                <span className="cd-fact__label">Level</span>
                                <span className="cd-fact__value">{courseDetail.university.level}</span>
                            </div>
                        )}
                        {courseDetail.university?.Intake && (
                            <div className="cd-fact">
                                <span className="cd-fact__label">Intake</span>
                                <span className="cd-fact__value">{courseDetail.university.Intake}</span>
                            </div>
                        )}
                        {courseDetail.university?.Location && (
                            <div className="cd-fact">
                                <span className="cd-fact__label">Location</span>
                                <span className="cd-fact__value">{courseDetail.university.Location}</span>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Sticky contents jump nav */}
            {sections.length > 1 && (
                <nav className="cd-subnav" aria-label="Page contents">
                    <div className="cd-subnav__inner">
                        <span className="cd-subnav__label">On this page</span>
                        <div className="cd-subnav__links">
                            {sections.map((s) => (
                                <button
                                    key={s.id}
                                    type="button"
                                    onClick={() => jumpTo(s.id)}
                                    className={`cd-subnav__link ${activeSection === s.id ? 'is-active' : ''}`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </nav>
            )}

            {/* Content */}
            <main className="cd-content">
                {courseDetail.summary && (
                    <section id="overview" className="cd-section">
                        <h2 className="cd-section__title">Overview</h2>
                        <div className="cd-section__body">
                            <p className="cd-prose">{courseDetail.summary}</p>
                        </div>
                    </section>
                )}

                {modules.length > 0 && (
                    <section id="structure" className="cd-section">
                        <h2 className="cd-section__title">Course structure</h2>
                        <p className="cd-section__intro">
                            A year-by-year outline of what this programme covers.
                        </p>
                        <div className="cd-section__body">
                            {modules.map((yearBlock) => (
                                <details key={yearBlock.year} className="cd-accordion" open>
                                    <summary className="cd-accordion__head">
                                        <span>{yearBlock.title || `Year ${yearBlock.year}`}</span>
                                        <span className="cd-accordion__icon" aria-hidden="true" />
                                    </summary>
                                    <div className="cd-accordion__panel">
                                        {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                            <ul className="cd-list">
                                                {yearBlock.modules.map((m, i) => (
                                                    <li key={i}>{m}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <p className="cd-muted">No modules listed for this year.</p>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                )}

                {fees.length > 0 && (
                    <section id="fees" className="cd-section">
                        <h2 className="cd-section__title">Fees and funding</h2>
                        <p className="cd-section__intro">
                            Estimated tuition by year of study. Figures are indicative — confirm current rates with the institution.
                        </p>
                        <div className="cd-section__body">
                            <table className="cd-table">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Fee</th>
                                        <th>Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {fees.map((fee) => (
                                        <tr key={fee.year}>
                                            <td className="cd-table__year">Year {fee.year}</td>
                                            <td className="cd-table__amount">
                                                {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : '—'}
                                            </td>
                                            <td className="cd-table__note">{fee.note || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {careers.length > 0 && (
                    <section id="careers" className="cd-section">
                        <h2 className="cd-section__title">After the course</h2>
                        <p className="cd-section__intro">
                            Common destinations for graduates of this programme.
                        </p>
                        <div className="cd-section__body">
                            <ul className="cd-careers">
                                {careers.map((career, i) => (
                                    <li key={i} className="cd-careers__item">
                                        {career}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </section>
                )}

                {!courseDetail.summary && modules.length === 0 && careers.length === 0 && fees.length === 0 && (
                    <section className="cd-section">
                        <p className="cd-muted">Detailed information for this course hasn&rsquo;t been published yet.</p>
                    </section>
                )}
            </main>

            <style>{`
                :root {
                    --cd-blue-900: #0a2540;
                    --cd-blue-800: #0f3358;
                    --cd-blue-700: #14477a;
                    --cd-blue-600: #1b5da3;
                    --cd-blue-100: #e8f0fa;
                    --cd-ink: #101828;
                    --cd-ink-soft: #4b5768;
                    --cd-line: #dfe4ea;
                    --cd-surface: #ffffff;
                    --cd-canvas: #f7f9fb;
                }

                * { box-sizing: border-box; }

                .cd-page {
                    background: var(--cd-canvas);
                    min-height: 100vh;
                    color: var(--cd-ink);
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
                }

                /* Top utility bar */
                .cd-topbar {
                    background: var(--cd-blue-900);
                    color: #fff;
                }
                .cd-topbar__inner {
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 10px 24px;
                    display: flex;
                    align-items: center;
                }
                .cd-topbar__brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .cd-topbar__logo {
                    width: 26px;
                    height: 26px;
                    border-radius: 4px;
                    object-fit: contain;
                    background: #fff;
                }
                .cd-topbar__logo--fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                    color: var(--cd-blue-900);
                }
                .cd-topbar__name {
                    font-size: 0.85rem;
                    font-weight: 600;
                    letter-spacing: 0.01em;
                }

                /* Hero */
                .cd-hero {
                    position: relative;
                    background: linear-gradient(120deg, var(--cd-blue-800) 0%, var(--cd-blue-600) 100%);
                    color: #fff;
                    overflow: hidden;
                }
                .cd-hero__media {
                    position: absolute;
                    inset: 0;
                    background-image:
                        radial-gradient(circle at 85% 20%, rgba(255,255,255,0.14) 0%, transparent 45%),
                        radial-gradient(circle at 10% 90%, rgba(255,255,255,0.08) 0%, transparent 40%);
                    pointer-events: none;
                }
                .cd-hero__inner {
                    position: relative;
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 44px 24px 36px;
                }
                .cd-hero__eyebrow {
                    margin: 0 0 10px;
                    font-size: 0.78rem;
                    font-weight: 700;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.75);
                }
                .cd-hero__title {
                    margin: 0 0 24px;
                    font-size: 2.15rem;
                    line-height: 1.18;
                    font-weight: 800;
                    letter-spacing: -0.015em;
                    max-width: 780px;
                }
                .cd-hero__facts {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0;
                    border-top: 1px solid rgba(255,255,255,0.25);
                    padding-top: 18px;
                }
                .cd-fact {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    padding: 0 28px 0 0;
                    margin-right: 28px;
                    border-right: 1px solid rgba(255,255,255,0.22);
                }
                .cd-fact:last-child { border-right: none; margin-right: 0; padding-right: 0; }
                .cd-fact__label {
                    font-size: 0.7rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: rgba(255,255,255,0.65);
                }
                .cd-fact__value {
                    font-size: 0.95rem;
                    font-weight: 600;
                }

                /* Sticky subnav */
                .cd-subnav {
                    position: sticky;
                    top: 0;
                    z-index: 30;
                    background: var(--cd-surface);
                    border-bottom: 1px solid var(--cd-line);
                    box-shadow: 0 1px 0 rgba(16,24,40,0.02);
                }
                .cd-subnav__inner {
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 0 24px;
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    overflow-x: auto;
                }
                .cd-subnav__label {
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: var(--cd-ink-soft);
                    flex-shrink: 0;
                    padding: 14px 0;
                }
                .cd-subnav__links {
                    display: flex;
                    gap: 4px;
                }
                .cd-subnav__link {
                    appearance: none;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 14px 12px 12px;
                    font-size: 0.86rem;
                    font-weight: 600;
                    color: var(--cd-ink-soft);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: color .15s ease, border-color .15s ease;
                }
                .cd-subnav__link:hover { color: var(--cd-blue-700); }
                .cd-subnav__link.is-active {
                    color: var(--cd-blue-700);
                    border-bottom-color: var(--cd-blue-600);
                }

                /* Content */
                .cd-content {
                    max-width: 860px;
                    margin: 0 auto;
                    padding: 44px 24px 96px;
                }
                .cd-section {
                    padding: 36px 0;
                    border-bottom: 1px solid var(--cd-line);
                }
                .cd-section:first-child { padding-top: 0; }
                .cd-section:last-child { border-bottom: none; }
                .cd-section__title {
                    margin: 0 0 6px;
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: var(--cd-blue-900);
                    letter-spacing: -0.01em;
                }
                .cd-section__intro {
                    margin: 0 0 20px;
                    font-size: 0.94rem;
                    color: var(--cd-ink-soft);
                }
                .cd-section__body { margin-top: 4px; }
                .cd-prose {
                    font-size: 1.02rem;
                    line-height: 1.75;
                    color: var(--cd-ink);
                    white-space: pre-line;
                    margin: 0;
                }
                .cd-muted { color: var(--cd-ink-soft); font-size: 0.95rem; }

                /* Accordion */
                .cd-accordion {
                    border: 1px solid var(--cd-line);
                    border-radius: 8px;
                    margin-bottom: 10px;
                    background: var(--cd-surface);
                }
                .cd-accordion:last-child { margin-bottom: 0; }
                .cd-accordion__head {
                    list-style: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 18px;
                    font-weight: 700;
                    font-size: 0.96rem;
                    color: var(--cd-ink);
                }
                .cd-accordion__head::-webkit-details-marker { display: none; }
                .cd-accordion__icon {
                    width: 9px; height: 9px;
                    border-right: 2px solid var(--cd-blue-600);
                    border-bottom: 2px solid var(--cd-blue-600);
                    transform: rotate(45deg);
                    transition: transform .18s ease;
                    flex-shrink: 0;
                }
                details[open] .cd-accordion__icon { transform: rotate(-135deg); }
                .cd-accordion__panel {
                    padding: 2px 18px 16px;
                    border-top: 1px solid var(--cd-line);
                    padding-top: 12px;
                }
                .cd-list {
                    margin: 0; padding-left: 20px;
                    display: grid; gap: 6px;
                    font-size: 0.93rem;
                    color: var(--cd-ink);
                }

                /* Fee table */
                .cd-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.93rem;
                }
                .cd-table thead th {
                    text-align: left;
                    font-size: 0.72rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    color: var(--cd-ink-soft);
                    padding: 0 12px 10px 0;
                    border-bottom: 2px solid var(--cd-blue-900);
                }
                .cd-table tbody td {
                    padding: 12px 12px 12px 0;
                    border-bottom: 1px solid var(--cd-line);
                    vertical-align: top;
                }
                .cd-table__year { font-weight: 600; white-space: nowrap; }
                .cd-table__amount { font-weight: 700; color: var(--cd-blue-800); white-space: nowrap; }
                .cd-table__note { color: var(--cd-ink-soft); }

                /* Careers */
                .cd-careers {
                    list-style: none;
                    margin: 0; padding: 0;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
                    gap: 10px;
                }
                .cd-careers__item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px 14px;
                    border: 1px solid var(--cd-line);
                    border-left: 3px solid var(--cd-blue-600);
                    border-radius: 6px;
                    background: var(--cd-blue-100);
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: var(--cd-blue-900);
                }

                @media (max-width: 640px) {
                    .cd-hero__title { font-size: 1.55rem; }
                    .cd-hero__inner { padding: 32px 20px 28px; }
                    .cd-fact { margin-right: 18px; padding-right: 18px; }
                    .cd-content { padding: 32px 20px 72px; }
                }
            `}</style>
        </div>
    );
}