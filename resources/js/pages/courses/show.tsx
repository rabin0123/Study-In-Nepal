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
        /** Big hero banner image for the course — set this from the backend (course/college photo). */
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
    const careers = courseDetail.careers ?? [];

    const sections = [
        { id: 'overview', label: 'Overview', show: Boolean(courseDetail.summary) },
        { id: 'study', label: 'What you will study', show: modules.length > 0 },
        { id: 'fees', label: 'Fees and funding', show: fees.length > 0 },
        { id: 'careers', label: 'Careers', show: careers.length > 0 },
    ].filter((s) => s.show);

    const [openSections, setOpenSections] = useState<Record<string, boolean>>(
        () => Object.fromEntries(sections.map((s, i) => [s.id, i === 0])),
    );

    const toggleSection = (id: string) =>
        setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

    const jumpTo = (id: string) => {
        setOpenSections((prev) => ({ ...prev, [id]: true }));
        requestAnimationFrame(() => {
            const el = document.getElementById(id);
            if (!el) return;
            const top = el.getBoundingClientRect().top + window.scrollY - 84;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    };

    return (
        <div className="cd-page">
            <Head title={`${courseDetail.course_name} — ${courseDetail.university_name}`} />

            {/* Top utility bar */}
            <div className="cd-topbar">
                <div className="cd-topbar__inner">
                    <div className="cd-topbar__brand">
                        {courseDetail.university?.university_logo_url ? (
                            <img src={courseDetail.university.university_logo_url} alt="" className="cd-topbar__logo" />
                        ) : (
                            <span className="cd-topbar__logo cd-topbar__logo--fallback">
                                {courseDetail.university_name.slice(0, 1).toUpperCase()}
                            </span>
                        )}
                        <span className="cd-topbar__name">{courseDetail.university_name}</span>
                    </div>
                </div>
            </div>

            {/* Full-bleed hero image with overlaid title, GCU-style */}
            <header
                className="cd-hero"
                style={
                    courseDetail.hero_image_url
                        ? { backgroundImage: `url(${courseDetail.hero_image_url})` }
                        : undefined
                }
            >
                <div className="cd-hero__scrim" />
                <div className="cd-hero__inner">
                    <p className="cd-hero__crumbs">
                        {courseDetail.university_name}
                        <span className="cd-hero__crumb-sep">/</span>
                        {courseDetail.college_name}
                    </p>
                    <h1 className="cd-hero__title">{courseDetail.course_name}</h1>
                </div>
            </header>

            {/* Sticky anchor nav */}
            {sections.length > 1 && (
                <nav className="cd-subnav" aria-label="Page contents">
                    <div className="cd-subnav__inner">
                        {sections.map((s) => (
                            <button key={s.id} type="button" onClick={() => jumpTo(s.id)} className="cd-subnav__link">
                                {s.label}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            <main className="cd-content">
                {/* Overview */}
                {courseDetail.summary && (
                    <section id="overview" className="cd-section">
                        <h2 className="cd-section__title">Overview</h2>
                        <p className="cd-prose">{courseDetail.summary}</p>

                        {(courseDetail.university?.level || courseDetail.university?.Intake || courseDetail.university?.Location) && (
                            <div className="cd-quickfacts">
                                {courseDetail.university?.level && (
                                    <div className="cd-quickfacts__item">
                                        <span className="cd-quickfacts__label">Level</span>
                                        <span className="cd-quickfacts__value">{courseDetail.university.level}</span>
                                    </div>
                                )}
                                {courseDetail.university?.Intake && (
                                    <div className="cd-quickfacts__item">
                                        <span className="cd-quickfacts__label">Intake</span>
                                        <span className="cd-quickfacts__value">{courseDetail.university.Intake}</span>
                                    </div>
                                )}
                                {courseDetail.university?.Location && (
                                    <div className="cd-quickfacts__item">
                                        <span className="cd-quickfacts__label">Location</span>
                                        <span className="cd-quickfacts__value">{courseDetail.university.Location}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* What you will study — GCU-style module accordion rows with arrow_forward */}
                {modules.length > 0 && (
                    <section id="study" className="cd-section">
                        <h2 className="cd-section__title">What you will study</h2>

                        {modules.map((yearBlock) => (
                            <div key={yearBlock.year} className="cd-yearblock">
                                <h3 className="cd-yearblock__title">
                                    {yearBlock.title || `Year ${yearBlock.year}`}
                                </h3>
                                {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                    <div className="cd-modulerows">
                                        {yearBlock.modules.map((m, i) => (
                                            <ModuleRow key={i} label={m} />
                                        ))}
                                    </div>
                                ) : (
                                    <p className="cd-muted">No modules listed for this year.</p>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* Fees and funding — GCU-style study options table */}
                {fees.length > 0 && (
                    <section id="fees" className="cd-section">
                        <h2 className="cd-section__title">Fees and funding</h2>
                        <p className="cd-section__intro">
                            Estimated tuition by year of study. Confirm current figures with the institution.
                        </p>

                        <div className="cd-tablewrap">
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

                {/* Careers */}
                {careers.length > 0 && (
                    <section id="careers" className="cd-section">
                        <h2 className="cd-section__title">Careers</h2>
                        <p className="cd-section__intro">This course could help you get a career as a:</p>
                        <ul className="cd-careerlist">
                            {careers.map((career, i) => (
                                <li key={i}>{career}</li>
                            ))}
                        </ul>
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
                    --cd-blue: #003da6;
                    --cd-blue-dark: #002d7a;
                    --cd-blue-light: #eaf1fb;
                    --cd-ink: #12181f;
                    --cd-ink-soft: #4c5764;
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
                .cd-topbar { background: var(--cd-blue-dark); color: #fff; }
                .cd-topbar__inner {
                    max-width: 1120px; margin: 0 auto; padding: 10px 24px;
                    display: flex; align-items: center;
                }
                .cd-topbar__brand { display: flex; align-items: center; gap: 10px; }
                .cd-topbar__logo {
                    width: 26px; height: 26px; border-radius: 4px;
                    object-fit: contain; background: #fff;
                }
                .cd-topbar__logo--fallback {
                    display: flex; align-items: center; justify-content: center;
                    font-weight: 700; font-size: 0.8rem; color: var(--cd-blue-dark);
                }
                .cd-topbar__name { font-size: 0.85rem; font-weight: 600; letter-spacing: 0.01em; }

                /* Full-bleed hero */
                .cd-hero {
                    position: relative;
                    min-height: 320px;
                    display: flex;
                    align-items: flex-end;
                    background-color: var(--cd-blue);
                    background-size: cover;
                    background-position: center;
                }
                .cd-hero__scrim {
                    position: absolute; inset: 0;
                    background: linear-gradient(0deg, rgba(0,20,60,0.82) 0%, rgba(0,20,60,0.45) 55%, rgba(0,20,60,0.15) 100%);
                }
                .cd-hero__inner {
                    position: relative;
                    max-width: 1120px;
                    margin: 0 auto;
                    padding: 48px 24px 32px;
                    width: 100%;
                    color: #fff;
                }
                .cd-hero__crumbs {
                    margin: 0 0 10px;
                    font-size: 0.8rem;
                    font-weight: 600;
                    color: rgba(255,255,255,0.8);
                    letter-spacing: 0.01em;
                }
                .cd-hero__crumb-sep { margin: 0 8px; opacity: 0.6; }
                .cd-hero__title {
                    margin: 0;
                    font-size: 2.1rem;
                    font-weight: 800;
                    line-height: 1.2;
                    max-width: 820px;
                    letter-spacing: -0.01em;
                }

                /* Sticky subnav */
                .cd-subnav {
                    position: sticky; top: 0; z-index: 30;
                    background: var(--cd-surface);
                    border-bottom: 1px solid var(--cd-line);
                }
                .cd-subnav__inner {
                    max-width: 1120px; margin: 0 auto; padding: 0 24px;
                    display: flex; gap: 4px; overflow-x: auto;
                }
                .cd-subnav__link {
                    appearance: none; background: none; border: none;
                    border-bottom: 3px solid transparent;
                    padding: 16px 14px 13px;
                    font-size: 0.88rem; font-weight: 700;
                    color: var(--cd-ink-soft);
                    cursor: pointer; white-space: nowrap;
                    transition: color .15s ease, border-color .15s ease;
                }
                .cd-subnav__link:hover { color: var(--cd-blue); border-bottom-color: var(--cd-line); }
                .cd-subnav__link:active,
                .cd-subnav__link:focus-visible { color: var(--cd-blue); border-bottom-color: var(--cd-blue); }

                /* Content */
                .cd-content { max-width: 860px; margin: 0 auto; padding: 40px 24px 96px; }
                .cd-section { padding: 34px 0; border-bottom: 1px solid var(--cd-line); }
                .cd-section:first-child { padding-top: 0; }
                .cd-section:last-child { border-bottom: none; }
                .cd-section__title {
                    margin: 0 0 16px;
                    font-size: 1.5rem; font-weight: 800;
                    color: var(--cd-blue-dark);
                    letter-spacing: -0.01em;
                }
                .cd-section__intro { margin: -6px 0 18px; font-size: 0.94rem; color: var(--cd-ink-soft); }
                .cd-prose { font-size: 1.02rem; line-height: 1.75; color: var(--cd-ink); white-space: pre-line; margin: 0 0 20px; }
                .cd-muted { color: var(--cd-ink-soft); font-size: 0.95rem; }

                .cd-quickfacts {
                    display: flex; flex-wrap: wrap; gap: 0;
                    border-top: 1px solid var(--cd-line);
                    padding-top: 16px;
                }
                .cd-quickfacts__item {
                    display: flex; flex-direction: column; gap: 4px;
                    padding-right: 28px; margin-right: 28px;
                    border-right: 1px solid var(--cd-line);
                }
                .cd-quickfacts__item:last-child { border-right: none; margin-right: 0; padding-right: 0; }
                .cd-quickfacts__label {
                    font-size: 0.7rem; font-weight: 700; letter-spacing: 0.05em;
                    text-transform: uppercase; color: var(--cd-ink-soft);
                }
                .cd-quickfacts__value { font-size: 0.95rem; font-weight: 700; color: var(--cd-blue-dark); }

                /* Year blocks + module rows, GCU-style */
                .cd-yearblock { margin-bottom: 26px; }
                .cd-yearblock:last-child { margin-bottom: 0; }
                .cd-yearblock__title {
                    margin: 0 0 10px;
                    font-size: 1.02rem; font-weight: 700; color: var(--cd-ink);
                    text-transform: uppercase; letter-spacing: 0.03em; font-size: 0.78rem;
                    color: var(--cd-ink-soft);
                }
                .cd-modulerows { border-top: 1px solid var(--cd-line); }

                .cd-module-row { border-bottom: 1px solid var(--cd-line); }
                .cd-module-row__head {
                    width: 100%;
                    appearance: none; background: none; border: none;
                    display: flex; align-items: center; justify-content: space-between;
                    padding: 14px 4px;
                    font-size: 0.98rem; font-weight: 600; color: var(--cd-blue-dark);
                    cursor: pointer; text-align: left;
                }
                .cd-module-row__arrow {
                    flex-shrink: 0; margin-left: 14px;
                    width: 22px; height: 22px;
                    border-radius: 50%;
                    background: var(--cd-blue-light);
                    color: var(--cd-blue);
                    display: flex; align-items: center; justify-content: center;
                    font-size: 0.85rem;
                    transition: transform .18s ease, background .15s ease;
                }
                .cd-module-row.is-open .cd-module-row__arrow { transform: rotate(90deg); background: var(--cd-blue); color: #fff; }
                .cd-module-row__body {
                    padding: 0 4px 16px;
                    font-size: 0.92rem;
                    color: var(--cd-ink-soft);
                    line-height: 1.6;
                }

                /* Fee table, GCU-style */
                .cd-tablewrap { overflow-x: auto; }
                .cd-table { width: 100%; border-collapse: collapse; font-size: 0.93rem; }
                .cd-table thead th {
                    text-align: left; font-size: 0.72rem; font-weight: 700;
                    letter-spacing: 0.05em; text-transform: uppercase;
                    color: #fff; background: var(--cd-blue);
                    padding: 10px 14px;
                }
                .cd-table thead th:first-child { border-radius: 6px 0 0 0; }
                .cd-table thead th:last-child { border-radius: 0 6px 0 0; }
                .cd-table tbody td {
                    padding: 12px 14px;
                    border-bottom: 1px solid var(--cd-line);
                    vertical-align: top;
                }
                .cd-table tbody tr:nth-child(even) { background: var(--cd-blue-light); }
                .cd-table__year { font-weight: 700; white-space: nowrap; }
                .cd-table__amount { font-weight: 700; color: var(--cd-blue-dark); white-space: nowrap; }
                .cd-table__note { color: var(--cd-ink-soft); }

                /* Careers list */
                .cd-careerlist {
                    margin: 0; padding-left: 20px;
                    display: grid; gap: 8px;
                    font-size: 0.98rem; color: var(--cd-ink);
                }
                .cd-careerlist li::marker { color: var(--cd-blue); }

                @media (max-width: 640px) {
                    .cd-hero { min-height: 240px; }
                    .cd-hero__title { font-size: 1.5rem; }
                    .cd-hero__inner { padding: 32px 20px 24px; }
                    .cd-content { padding: 32px 20px 72px; }
                    .cd-quickfacts__item { margin-right: 18px; padding-right: 18px; }
                }
            `}</style>
        </div>
    );
}

function ModuleRow({ label }: { label: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`cd-module-row ${open ? 'is-open' : ''}`}>
            <button type="button" className="cd-module-row__head" onClick={() => setOpen((o) => !o)}>
                <span>{label}</span>
                <span className="cd-module-row__arrow" aria-hidden="true">
                    &rsaquo;
                </span>
            </button>
        </div>
    );
}