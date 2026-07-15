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

const NAV_SECTIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'modules', label: 'Curriculum' },
    { id: 'fees', label: 'Tuition & Fees' },
    { id: 'careers', label: 'Careers' },
] as const;

export default function CourseDetailsShow({ courseDetail }: Props) {
    const modules = sortByYear(courseDetail.year_wise_modules);
    const fees = sortByYear(courseDetail.fees);
    const careers = courseDetail.careers ?? [];

    const availableSections = NAV_SECTIONS.filter((s) => {
        if (s.id === 'overview') return Boolean(courseDetail.summary);
        if (s.id === 'modules') return modules.length > 0;
        if (s.id === 'fees') return fees.length > 0;
        if (s.id === 'careers') return careers.length > 0;
        return false;
    });

    const [activeSection, setActiveSection] = useState<string>(availableSections[0]?.id ?? 'overview');

    useEffect(() => {
        const handleScroll = () => {
            const offsets = availableSections.map((s) => {
                const el = document.getElementById(s.id);
                if (!el) return { id: s.id, top: Infinity };
                return { id: s.id, top: Math.abs(el.getBoundingClientRect().top - 140) };
            });
            offsets.sort((a, b) => a.top - b.top);
            if (offsets[0]) setActiveSection(offsets[0].id);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY - 96;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    };

    return (
        <div className="course-page">
            <Head title={`${courseDetail.course_name} — ${courseDetail.university_name}`} />

            {/* ── Hero ── */}
            <header className="course-hero">
                <div className="course-hero__inner">
                    <nav className="course-hero__crumbs" aria-label="Breadcrumb">
                        <span>{courseDetail.university_name}</span>
                        <span className="crumb-sep">/</span>
                        <span>{courseDetail.college_name}</span>
                    </nav>

                    <div className="course-hero__main">
                        <div className="course-hero__badge">
                            {courseDetail.university?.university_logo_url ? (
                                <img
                                    src={courseDetail.university.university_logo_url}
                                    alt={courseDetail.university_name}
                                    className="course-hero__logo"
                                />
                            ) : (
                                <span className="course-hero__logo course-hero__logo--fallback">
                                    {courseDetail.university_name.slice(0, 2).toUpperCase()}
                                </span>
                            )}
                        </div>

                        <div className="course-hero__text">
                            <h1 className="course-hero__title">{courseDetail.course_name}</h1>
                            <p className="course-hero__subtitle">
                                {courseDetail.college_name} &middot; {courseDetail.university_name}
                            </p>

                            <div className="course-hero__tags">
                                {courseDetail.university?.level && (
                                    <span className="course-tag">{courseDetail.university.level}</span>
                                )}
                                {courseDetail.university?.Intake && (
                                    <span className="course-tag">Intake &middot; {courseDetail.university.Intake}</span>
                                )}
                                {courseDetail.university?.Location && (
                                    <span className="course-tag">{courseDetail.university.Location}</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Sticky section nav ── */}
            {availableSections.length > 1 && (
                <div className="course-subnav">
                    <div className="course-subnav__inner">
                        {availableSections.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                onClick={() => scrollTo(s.id)}
                                className={`course-subnav__link ${activeSection === s.id ? 'is-active' : ''}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Body ── */}
            <main className="course-body">
                <div className="course-body__grid">
                    <div className="course-body__main">
                        {courseDetail.summary && (
                            <section id="overview" className="course-section">
                                <h2 className="course-section__title">Overview</h2>
                                <p className="course-section__prose">{courseDetail.summary}</p>
                            </section>
                        )}

                        {modules.length > 0 && (
                            <section id="modules" className="course-section">
                                <h2 className="course-section__title">Curriculum</h2>
                                <p className="course-section__lede">
                                    A year-by-year breakdown of what you&rsquo;ll study on this programme.
                                </p>

                                <div className="course-modules">
                                    {modules.map((yearBlock) => (
                                        <details key={yearBlock.year} className="course-modules__year" open>
                                            <summary className="course-modules__year-head">
                                                <span className="course-modules__year-label">
                                                    {yearBlock.title || `Year ${yearBlock.year}`}
                                                </span>
                                                <span className="course-modules__chevron" aria-hidden="true" />
                                            </summary>
                                            <div className="course-modules__year-body">
                                                {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                                    <ul className="course-modules__list">
                                                        {yearBlock.modules.map((m, i) => (
                                                            <li key={i}>{m}</li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p className="course-modules__empty">No modules listed for this year.</p>
                                                )}
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </section>
                        )}

                        {careers.length > 0 && (
                            <section id="careers" className="course-section">
                                <h2 className="course-section__title">Careers After This Course</h2>
                                <p className="course-section__lede">Common paths graduates of this programme pursue.</p>
                                <div className="course-careers">
                                    {careers.map((career, i) => (
                                        <span key={i} className="course-careers__chip">
                                            {career}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {!courseDetail.summary && modules.length === 0 && careers.length === 0 && (
                            <section className="course-section course-empty">
                                <p>Detailed information for this course hasn&rsquo;t been published yet.</p>
                            </section>
                        )}
                    </div>

                    {fees.length > 0 && (
                        <aside className="course-body__aside">
                            <section id="fees" className="course-fees">
                                <h2 className="course-fees__title">Tuition &amp; Fees</h2>
                                <ul className="course-fees__list">
                                    {fees.map((fee) => (
                                        <li key={fee.year} className="course-fees__row">
                                            <span className="course-fees__year">Year {fee.year}</span>
                                            <span className="course-fees__amount">
                                                {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : 'Not specified'}
                                            </span>
                                            {fee.note && <span className="course-fees__note">{fee.note}</span>}
                                        </li>
                                    ))}
                                </ul>
                                <p className="course-fees__disclaimer">
                                    Fees are indicative and may vary. Contact the institution for the latest figures.
                                </p>
                            </section>
                        </aside>
                    )}
                </div>
            </main>

            <style>{`
                :root {
                    --cp-ink: #1b2430;
                    --cp-ink-soft: #4a5567;
                    --cp-line: #e4e7ec;
                    --cp-surface: #ffffff;
                    --cp-canvas: #f6f7f9;
                    --cp-navy: #0f2a4a;
                    --cp-navy-deep: #0a1e38;
                    --cp-gold: #b8860b;
                    --cp-gold-soft: #f4ead0;
                }

                .course-page {
                    background: var(--cp-canvas);
                    min-height: 100vh;
                    color: var(--cp-ink);
                    font-family: 'Georgia', 'Iowan Old Style', 'Charter', serif;
                }

                .course-hero,
                .course-body,
                .course-subnav__inner {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
                }

                /* Hero */
                .course-hero {
                    background: linear-gradient(155deg, var(--cp-navy) 0%, var(--cp-navy-deep) 100%);
                    color: #fff;
                    padding: 28px 24px 40px;
                }
                .course-hero__inner {
                    max-width: 1080px;
                    margin: 0 auto;
                }
                .course-hero__crumbs {
                    font-size: 0.8rem;
                    letter-spacing: 0.02em;
                    color: rgba(255,255,255,0.6);
                    margin-bottom: 20px;
                }
                .crumb-sep { margin: 0 8px; opacity: 0.5; }

                .course-hero__main {
                    display: flex;
                    align-items: flex-start;
                    gap: 20px;
                }
                .course-hero__logo {
                    width: 64px;
                    height: 64px;
                    border-radius: 10px;
                    object-fit: contain;
                    background: #fff;
                    padding: 6px;
                    flex-shrink: 0;
                }
                .course-hero__logo--fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 1.15rem;
                    color: var(--cp-navy);
                    background: var(--cp-gold-soft);
                }
                .course-hero__title {
                    font-family: 'Georgia', 'Iowan Old Style', 'Charter', serif;
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1.2;
                    margin: 0 0 6px;
                    letter-spacing: -0.01em;
                }
                .course-hero__subtitle {
                    margin: 0 0 14px;
                    color: rgba(255,255,255,0.78);
                    font-size: 1rem;
                }
                .course-hero__tags {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .course-tag {
                    font-size: 0.75rem;
                    font-weight: 600;
                    letter-spacing: 0.03em;
                    text-transform: uppercase;
                    padding: 5px 12px;
                    border-radius: 999px;
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.18);
                    color: #fff;
                }

                /* Sticky subnav */
                .course-subnav {
                    position: sticky;
                    top: 0;
                    z-index: 20;
                    background: var(--cp-surface);
                    border-bottom: 1px solid var(--cp-line);
                }
                .course-subnav__inner {
                    max-width: 1080px;
                    margin: 0 auto;
                    display: flex;
                    gap: 4px;
                    padding: 0 24px;
                    overflow-x: auto;
                }
                .course-subnav__link {
                    appearance: none;
                    background: none;
                    border: none;
                    border-bottom: 2px solid transparent;
                    padding: 14px 14px 12px;
                    font-size: 0.88rem;
                    font-weight: 600;
                    color: var(--cp-ink-soft);
                    cursor: pointer;
                    white-space: nowrap;
                    transition: color 0.15s ease, border-color 0.15s ease;
                }
                .course-subnav__link:hover { color: var(--cp-navy); }
                .course-subnav__link.is-active {
                    color: var(--cp-navy);
                    border-bottom-color: var(--cp-gold);
                }

                /* Body layout */
                .course-body {
                    max-width: 1080px;
                    margin: 0 auto;
                    padding: 40px 24px 80px;
                }
                .course-body__grid {
                    display: grid;
                    grid-template-columns: 1fr 320px;
                    gap: 40px;
                    align-items: start;
                }
                @media (max-width: 860px) {
                    .course-body__grid { grid-template-columns: 1fr; }
                    .course-body__aside { order: -1; }
                }

                .course-section { margin-bottom: 44px; }
                .course-section:last-child { margin-bottom: 0; }
                .course-section__title {
                    font-family: 'Georgia', 'Iowan Old Style', 'Charter', serif;
                    font-size: 1.4rem;
                    font-weight: 700;
                    color: var(--cp-navy);
                    margin: 0 0 14px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid var(--cp-line);
                }
                .course-section__lede {
                    color: var(--cp-ink-soft);
                    font-size: 0.92rem;
                    margin: -4px 0 18px;
                }
                .course-section__prose {
                    font-size: 1.02rem;
                    line-height: 1.75;
                    color: var(--cp-ink);
                    white-space: pre-line;
                    margin: 0;
                }

                .course-empty {
                    color: var(--cp-ink-soft);
                    font-style: italic;
                }

                /* Modules accordion */
                .course-modules__year {
                    background: var(--cp-surface);
                    border: 1px solid var(--cp-line);
                    border-radius: 10px;
                    margin-bottom: 10px;
                    overflow: hidden;
                }
                .course-modules__year-head {
                    list-style: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 18px;
                    font-weight: 600;
                    color: var(--cp-ink);
                }
                .course-modules__year-head::-webkit-details-marker { display: none; }
                .course-modules__year-label { font-size: 0.95rem; }
                .course-modules__chevron {
                    width: 9px;
                    height: 9px;
                    border-right: 2px solid var(--cp-ink-soft);
                    border-bottom: 2px solid var(--cp-ink-soft);
                    transform: rotate(45deg);
                    transition: transform 0.18s ease;
                    flex-shrink: 0;
                }
                details[open] .course-modules__chevron { transform: rotate(-135deg); }
                .course-modules__year-body {
                    padding: 0 18px 16px;
                    border-top: 1px solid var(--cp-line);
                    padding-top: 12px;
                }
                .course-modules__list {
                    margin: 0;
                    padding-left: 20px;
                    display: grid;
                    gap: 6px;
                    font-size: 0.92rem;
                    color: var(--cp-ink);
                }
                .course-modules__empty {
                    color: var(--cp-ink-soft);
                    font-size: 0.9rem;
                    margin: 0;
                }

                /* Careers */
                .course-careers {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                .course-careers__chip {
                    font-size: 0.85rem;
                    font-weight: 500;
                    padding: 7px 14px;
                    border-radius: 8px;
                    background: var(--cp-gold-soft);
                    color: #6b5218;
                    border: 1px solid #e4d3a3;
                }

                /* Fees aside */
                .course-fees {
                    background: var(--cp-surface);
                    border: 1px solid var(--cp-line);
                    border-radius: 12px;
                    padding: 22px;
                    position: sticky;
                    top: 68px;
                }
                .course-fees__title {
                    font-family: 'Georgia', 'Iowan Old Style', 'Charter', serif;
                    font-size: 1.1rem;
                    font-weight: 700;
                    color: var(--cp-navy);
                    margin: 0 0 16px;
                }
                .course-fees__list {
                    list-style: none;
                    margin: 0 0 14px;
                    padding: 0;
                    display: grid;
                    gap: 0;
                }
                .course-fees__row {
                    display: grid;
                    grid-template-columns: auto 1fr;
                    gap: 2px 12px;
                    padding: 12px 0;
                    border-bottom: 1px solid var(--cp-line);
                }
                .course-fees__row:last-child { border-bottom: none; }
                .course-fees__year {
                    font-size: 0.78rem;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.03em;
                    color: var(--cp-ink-soft);
                }
                .course-fees__amount {
                    grid-column: 1 / -1;
                    font-size: 1.15rem;
                    font-weight: 700;
                    color: var(--cp-ink);
                }
                .course-fees__note {
                    grid-column: 1 / -1;
                    font-size: 0.82rem;
                    color: var(--cp-ink-soft);
                }
                .course-fees__disclaimer {
                    font-size: 0.76rem;
                    color: var(--cp-ink-soft);
                    line-height: 1.5;
                    margin: 0;
                }

                @media (max-width: 640px) {
                    .course-hero__title { font-size: 1.5rem; }
                    .course-hero__main { gap: 14px; }
                    .course-hero__logo { width: 52px; height: 52px; }
                }
            `}</style>
        </div>
    );
}