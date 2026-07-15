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
        careers_summary: string | null; 
        careers?: string[] | null; 
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

export default function CourseDetailsShow({ courseDetail }: Props) {
    const modules = sortByYear(courseDetail.year_wise_modules);
    const fees = sortByYear(courseDetail.fees);
    
    // Safely check for new string format or old array format from DB
    const careersData = courseDetail.careers_summary || courseDetail.careers;

    const sections = [
        { id: 'overview', label: 'Overview', show: Boolean(courseDetail.summary) },
        { id: 'study', label: 'What you will study', show: modules.length > 0 },
        { id: 'fees', label: 'Fees and funding', show: fees.length > 0 },
        { id: 'careers', label: 'Career Prospectus', show: true }, 
    ].filter((s) => s.show);

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
        <div className="gcu-page bg-circle">
            <Head title={`${courseDetail.course_name} | ${courseDetail.university_name}`} />

            
            {/* Hero Section */}
            <div className="gcu-header-section">
                <div 
                    className="gcu-header__bg"
                    style={{
                        backgroundImage: `url(${courseDetail.hero_image_url || 'https://www.studyinnepal.com/images/event_hallway.png'})`
                    }}
                />
                
                {/* Top-left container for Breadcrumbs and University Name */}
                <div className="gcu-hero-top-left">
                                         
                         <span className="gcu-hero-univ-name">{courseDetail.university_name}</span>
                </div>

                <div className="gcu-wrap">
                    <div className="gcu-banner-info scheme--skyblue">
                        <div className="gcu-banner-info__wrap">
                            <span className="gcu-banner-info__award">
                                {courseDetail.university?.level || 'Postgraduate'}
                            </span>
                            <h1 className="gcu-banner-info__title">
                                {courseDetail.course_name}
                            </h1>
                            <div className="gcu-banner-info__meta">
                                <p className="gcu-banner-info__tagline">
                                    {courseDetail.college_name}
                                </p>
                            </div>
                            <ul className="gcu-banner-info__list">
                                {courseDetail.university?.Intake && (
                                    <li>
                                        <span className="gcu-icon" aria-hidden="true">arrow_circle_up</span>
                                        Intake: {courseDetail.university.Intake}
                                    </li>
                                )}
                                {courseDetail.university?.Location && (
                                    <li>
                                        <span className="gcu-icon" aria-hidden="true">watch_later</span>
                                        Location: {courseDetail.university.Location}
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {sections.length > 1 && (
                <nav className="gcu-subnav" aria-label="Course Sections">
                    <div className="gcu-wrap">
                        <ul className="gcu-subnav__list">
                            {sections.map((s) => (
                                <li key={s.id}>
                                    <button 
                                        type="button" 
                                        onClick={() => jumpTo(s.id)}
                                        className="gcu-subnav__link"
                                    >
                                        {s.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </nav>
            )}

            <main className="gcu-wrap gcu-main-content">

                {courseDetail.summary && (
                    <section id="overview" className="gcu-panel">
                        <div className="gcu-row">
                            <div className="gcu-col-title">
                                <h2 className="gcu-heading">Overview</h2>
                            </div>
                            <div className="gcu-col-content">
                                <div 
                                    className="gcu-prose gcu-html-content"
                                    dangerouslySetInnerHTML={{ __html: courseDetail.summary }}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {/* What you will study (Black Card Scheme) */}
                {modules.length > 0 && (
                    <section id="study" className="gcu-panel full-bleed scheme--black-card">
                        <div className="gcu-wrap">
                            <div className="gcu-row">
                                <div className="gcu-col-title">
                                    <h2 className="gcu-heading">What you<br />will study</h2>
                                </div>
                                <div className="gcu-col-content mt-2">
                                    
                                    {modules.length > 1 && (
                                        <div className="gcu-tab-headers">
                                            {modules.map((yearBlock) => (
                                                <button
                                                    key={yearBlock.year}
                                                    type="button"
                                                    className={`gcu-tab-header-btn ${activeTab === yearBlock.year ? 'is-active' : ''}`}
                                                    onClick={() => setActiveTab(yearBlock.year)}
                                                >
                                                    {yearBlock.title || `Year ${yearBlock.year}`}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <div className="gcu-tab-body">
                                        {modules.map((yearBlock) => {
                                            if (activeTab !== yearBlock.year && modules.length > 1) return null;
                                            return (
                                                <div key={yearBlock.year} className="gcu-accordion-navigation">
                                                    {yearBlock.title && modules.length === 1 && (
                                                        <h3 className="gcu-single-year-title">{yearBlock.title}</h3>
                                                    )}
                                                    {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                                        yearBlock.modules.map((moduleName, i) => (
                                                            <ModuleAccordion key={i} label={moduleName} />
                                                        ))
                                                    ) : (
                                                        <p className="gcu-muted">No modules listed for this period.</p>
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

                {/* Fees and funding */}
                {fees.length > 0 && (
                    <section id="fees" className="gcu-panel">
                        <div className="gcu-row">
                            <div className="gcu-col-title">
                                <h2 className="gcu-heading">Fees and<br />funding</h2>
                            </div>
                            <div className="gcu-col-content">
                                <p className="gcu-section-intro">
                                    The tuition fees you pay are determined by your fee status. Estimated tuition breakdown by year is published below for guidance.
                                </p>
                                <div className="gcu-table-wrap">
                                    <table className="gcu-content-table">
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
                                                    <td className="gcu-table-year">Year {fee.year}</td>
                                                    <td className="gcu-table-amount">
                                                        {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : '—'}
                                                    </td>
                                                    <td className="gcu-table-note">{fee.note || '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </section>
                )}

                {/* Career Prospectus (Mild Black Background with Background Image) */}
                <section 
                    id="careers" 
                    className="gcu-panel full-bleed scheme--mild-black-bg"
                    style={{
                        backgroundImage: `url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80')`
                    }}
                >
                    <div className="gcu-wrap">
                        <div className="gcu-row">
                            <div className="gcu-col-title">
                                <h2 className="gcu-heading">Career<br />Prospectus</h2>
                            </div>
                            <div className="gcu-col-content">
                                <p className="gcu-section-intro">Our course helps set the trajectory for career positions such as:</p>
                                
                                {typeof careersData === 'string' ? (
                                    <div className="gcu-html-content" dangerouslySetInnerHTML={{ __html: careersData }} />
                                ) : Array.isArray(careersData) && careersData.length > 0 ? (
                                    <div className="gcu-html-content">
                                        <ul>{careersData.map((c, i) => <li key={i}>{c}</li>)}</ul>
                                    </div>
                                ) : (
                                    <p style={{ color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                                        No detailed career prospectus information has been published for this course yet.
                                    </p>
                                )}

                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <style>{`
                :root {
                    --color-skyblue: #0284c7;
                    --color-skyblue-dark: #0369a1;
                    --color-skyblue-deep: #075985;
                    --color-white: #ffffff;
                    
                    --color-grey: #f4f6f8;
                    --color-border: #bae6fd;
                    --color-black: #12181f; 
                    --color-muted-text: #4c5764;
                }

                * { box-sizing: border-box; margin: 0; padding: 0; }

                .gcu-page {
                    background: var(--color-white);
                    color: var(--color-black);
                    font-family: -apple-system, BlinkMacSystemFont, "Montserrat", "Segoe UI", Arial, sans-serif;
                    min-height: 100vh;
                    line-height: 1.5;
                }

                .gcu-wrap {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 0 24px;
                    width: 100%;
                }

                .gcu-top-nav {
                    background: var(--color-white);
                    border-bottom: 1px solid var(--color-border);
                    position: relative;
                    z-index: 50;
                }
                .gcu-top-nav__wrap {
                    max-width: 1140px;
                    margin: 0 auto;
                    padding: 14px 24px;
                    display: flex;
                    align-items: center;
                }
                .gcu-top-nav__logo {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .gcu-top-nav__logo img {
                    height: 32px;
                    width: auto;
                    object-fit: contain;
                }
                .gcu-top-nav__logo-fallback {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--color-skyblue);
                    color: var(--color-white);
                    font-weight: bold;
                    font-size: 0.95rem;
                }
                .gcu-top-nav__name {
                    font-size: 1rem;
                    font-weight: 700;
                    color: var(--color-skyblue-dark);
                }

                .gcu-header-section {
                    position: relative;
                    min-height: 480px;
                    display: flex;
                    align-items: flex-end;
                    background: var(--color-skyblue-dark);
                    overflow: visible;
                }
                .gcu-header__bg {
                    position: absolute;
                    inset: 0;
                    background-size: cover;
                    background-position: center;
                    opacity: 0.35;
                }
                .gcu-header-section::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(0deg, rgba(3, 105, 161, 0.65) 0%, rgba(3, 105, 161, 0.20) 100%);
                    pointer-events: none;
                }

                /* Hero Top Left Container */
                .gcu-hero-top-left {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    width: 100%;
                    padding-top: 32px;
                    z-index: 20;
                }
                .gcu-hero-top-left .gcu-wrap,
                .gcu-subnav .gcu-wrap {
                    max-width: none;
                    width: 100%;
                    margin: 0;
                    padding-left: 24px;
                    padding-right: 24px;
                }
                
                /* Breadcrumbs restyled for Dark Hero Background */
                .gcu-breadcrumb {
                    margin-bottom: 12px;
                    position: relative;
                }
                .gcu-breadcrumb__order {
                    display: flex;
                    flex-wrap: wrap;
                    list-style: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7); /* Light translucent white */
                }
                .gcu-breadcrumb__item::after {
                    content: '/';
                    margin: 0 8px;
                    opacity: 0.6;
                }
                .gcu-breadcrumb__item:last-child::after { content: none; }
                .gcu-breadcrumb__current {
                    color: var(--color-white); /* Solid white for current page */
                }

                /* University Name in Top Left */
                .gcu-hero-univ-name {
                    display: inline-block;
                    color: var(--color-white);
                    font-size: 1.1rem;
                    font-weight: 800;
                    margin-left: 100px;
                    text-shadow: 0 4px 15px rgba(0,0,0,0.4);
                    padding-bottom: 4px;
                }

                .gcu-banner-info {
                    position: relative;
                    z-index: 20;
                    background: linear-gradient(135deg, var(--color-skyblue-dark) 0%, var(--color-skyblue) 100%);
                    color: var(--color-white);
                    padding: 40px;
                    margin-bottom: -50px;
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
                    border-radius: 4px;
                }
                .gcu-banner-info__award {
                    display: inline-block;
                    background: rgba(255, 255, 255, 0.2);
                    padding: 4px 12px;
                    border-radius: 3px;
                    font-size: 0.75rem;
                    text-transform: uppercase;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                }
                .gcu-banner-info__title {
                    font-size: 2.3rem;
                    font-weight: 800;
                    line-height: 1.15;
                    margin-bottom: 8px;
                    letter-spacing: -0.01em;
                }
                .gcu-banner-info__meta {
                    margin-bottom: 24px;
                }
                .gcu-banner-info__tagline {
                    font-size: 1.1rem;
                    font-weight: 600;
                    opacity: 0.9;
                }
                .gcu-banner-info__list {
                    list-style: none;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 20px;
                    border-top: 1px solid rgba(255, 255, 255, 0.15);
                    padding-top: 20px;
                    font-size: 0.88rem;
                    font-weight: 600;
                }
                .gcu-banner-info__list li {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .gcu-icon {
                    font-size: 0.95rem;
                    opacity: 0.8;
                    display: inline-block;
                }

                .gcu-subnav {
                    background: var(--color-white);
                    border-bottom: 1px solid var(--color-border);
                    position: sticky;
                    top: 0;
                    z-index: 30;
                    box-shadow: 0 4px 6px -4px rgba(0,0,0,0.05);
                }
                .gcu-subnav__list {
                    list-style: none;
                    display: flex;
                    gap: 24px;
                    overflow-x: auto;
                    scrollbar-width: none;
                }
                .gcu-subnav__list::-webkit-scrollbar { display: none; }
                .gcu-subnav__link {
                    background: none;
                    border: none;
                    border-bottom: 3px solid transparent;
                    color: var(--color-muted-text);
                    cursor: pointer;
                    font-size: 0.9rem;
                    font-weight: 700;
                    padding: 20px 4px 17px;
                    text-decoration: none;
                    white-space: nowrap;
                    transition: color .2s, border-color .2s;
                }
                .gcu-subnav__link:hover {
                    color: var(--color-skyblue);
                    border-bottom-color: var(--color-border);
                }
                .gcu-subnav__link:focus, .gcu-subnav__link:active {
                    color: var(--color-skyblue);
                    border-bottom-color: var(--color-skyblue);
                }

                .gcu-main-content {
                    padding-top: 50px; /* Reduced since breadcrumbs moved */
                    padding-bottom: 100px;
                }

                .gcu-panel {
                    padding: 50px 0;
                    border-bottom: 1px solid var(--color-border);
                }
                .gcu-panel:last-of-type { border-bottom: none; }
                
                .gcu-panel.full-bleed {
                    width: 100vw;
                    position: relative;
                    left: 50%;
                    right: 50%;
                    margin-left: -50vw;
                    margin-right: -50vw;
                    padding: 60px 0;
                }

                /* BLACK CARD STYLING FOR "WHAT YOU WILL STUDY" */
                .gcu-panel.scheme--black-card {
                    background-color: var(--color-black);
                    color: var(--color-white);
                    border-bottom: none;
                }
                .gcu-panel.scheme--black-card .gcu-heading {
                    color: var(--color-white); 
                }
                .gcu-panel.scheme--black-card .gcu-tab-headers {
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                }
                .gcu-panel.scheme--black-card .gcu-tab-header-btn {
                    color: rgba(255, 255, 255, 0.6);
                }
                .gcu-panel.scheme--black-card .gcu-tab-header-btn.is-active,
                .gcu-panel.scheme--black-card .gcu-tab-header-btn:hover {
                    color: var(--color-white);
                    border-bottom-color: var(--color-white);
                }
                .gcu-panel.scheme--black-card .gcu-single-year-title {
                    color: var(--color-white);
                }
                .gcu-panel.scheme--black-card .gcu-muted {
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .gcu-panel.scheme--black-card .gcu-module-row {
                    background-color: var(--color-white);
                    border: none;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.25);
                }
                .gcu-panel.scheme--black-card .gcu-module-row__head {
                    color: var(--color-black);
                }
                .gcu-panel.scheme--black-card .gcu-module-row__arrow {
                    color: var(--color-black);
                }


                /* CAREERS SECTION - MILD BLACK BG WITH IMAGE */
                .gcu-panel.scheme--mild-black-bg {
                    background-color: #1e293b; 
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    position: relative;
                    color: var(--color-white);
                    border-bottom: none;
                }
                .gcu-panel.scheme--mild-black-bg::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-color: rgba(15, 23, 42, 0.85); 
                    z-index: 1;
                }
                .gcu-panel.scheme--mild-black-bg .gcu-wrap {
                    position: relative;
                    z-index: 2;
                }
                .gcu-panel.scheme--mild-black-bg .gcu-heading {
                    color: var(--color-white);
                }
                .gcu-panel.scheme--mild-black-bg .gcu-section-intro {
                    color: rgba(255, 255, 255, 0.8);
                }
                .gcu-panel.scheme--mild-black-bg .gcu-html-content {
                    color: rgba(255, 255, 255, 0.9);
                }
                /* Career List Items explicitly restyled for height and dark bg */
                .gcu-panel.scheme--mild-black-bg .gcu-html-content ul li {
                    background: rgba(255, 255, 255, 0.08);
                    border-left-color: var(--color-skyblue);
                    color: var(--color-white);
                    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                    backdrop-filter: blur(4px);
                    
                    /* BIGGER CARDS FIX */
                    min-height: 110px;
                    display: flex;
                    align-items: center;
                    padding: 24px 20px;
                }


                .gcu-row {
                    display: grid;
                    grid-template-columns: 280px 1fr;
                    gap: 40px;
                }
                .gcu-col-title {
                    font-size: 1.5rem;
                }
                .gcu-heading {
                    font-size: 1.8rem;
                    font-weight: 800;
                    color: var(--color-skyblue-dark);
                    line-height: 1.2;
                    letter-spacing: -0.01em;
                }
                .gcu-section-intro {
                    font-size: 1.05rem;
                    color: var(--color-muted-text);
                    margin-bottom: 24px;
                }

                .gcu-prose {
                    font-size: 1.05rem;
                    line-height: 1.75;
                    color: var(--color-black);
                    white-space: pre-line;
                }

                .gcu-tab-headers {
                    display: flex;
                    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
                    margin-bottom: 30px;
                    gap: 20px;
                }
                .gcu-tab-header-btn {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    font-size: 1.1rem;
                    font-weight: 700;
                    padding: 10px 0 16px;
                    cursor: pointer;
                    border-bottom: 4px solid transparent;
                    transition: border-color 0.2s, color 0.2s;
                }
                .gcu-tab-header-btn.is-active, .gcu-tab-header-btn:hover {
                    color: var(--color-white);
                    border-bottom-color: var(--color-white);
                }
                .gcu-single-year-title {
                    font-size: 1.25rem;
                    font-weight: 700;
                    margin-bottom: 20px;
                }

                .gcu-accordion-navigation {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }
                .gcu-module-row {
                    background: var(--color-white);
                    color: var(--color-black);
                    border-radius: 4px;
                    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
                    overflow: hidden;
                    border: 1px solid rgba(0,0,0,0.05);
                }
                .gcu-module-row__head {
                    width: 100%;
                    background: none;
                    border: none;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 18px 24px;
                    font-size: 1.02rem;
                    font-weight: 700;
                    color: var(--color-skyblue);
                    cursor: pointer;
                    text-align: left;
                    transition: background 0.15s;
                }
                .gcu-module-row__head:hover {
                    background-color: var(--color-grey);
                }
                .gcu-module-row__arrow {
                    color: var(--color-skyblue);
                    font-size: 1.2rem;
                    transition: transform 0.2s ease;
                }
                .gcu-module-row.is-open .gcu-module-row__arrow {
                    transform: rotate(90deg);
                }
                .gcu-module-row__body {
                    padding: 0 24px 20px;
                    font-size: 0.95rem;
                    color: var(--color-muted-text);
                    line-height: 1.6;
                    border-top: 1px dashed var(--color-border);
                    padding-top: 14px;
                }

                .gcu-table-wrap {
                    overflow-x: auto;
                    border: 1px solid var(--color-border);
                    border-radius: 4px;
                }
                .gcu-content-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 0.95rem;
                }
                .gcu-content-table th {
                    background: var(--color-skyblue);
                    color: var(--color-white);
                    font-weight: 700;
                    text-transform: uppercase;
                    font-size: 0.75rem;
                    letter-spacing: 0.05em;
                    padding: 14px 18px;
                    text-align: left;
                }
                .gcu-content-table td {
                    padding: 16px 18px;
                    border-bottom: 1px solid var(--color-border);
                    vertical-align: top;
                }
                .gcu-content-table tr:nth-of-type(even) {
                    background-color: var(--color-grey);
                }
                .gcu-table-year {
                    font-weight: 700;
                    color: var(--color-black);
                }
                .gcu-table-amount {
                    font-weight: 700;
                    color: var(--color-skyblue-dark);
                }
                .gcu-table-note {
                    color: var(--color-muted-text);
                }

                /* Default HTML styling (used by other sections if needed) */
                .gcu-html-content {
                    font-size: 1.05rem;
                    line-height: 1.75;
                }
                .gcu-html-content ul {
                    list-style: none;
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                    margin-top: 16px;
                }
                .gcu-html-content ul li {
                    background: var(--color-grey);
                    border-left: 4px solid var(--color-skyblue);
                    padding: 18px 20px;
                    border-radius: 0 4px 4px 0;
                    font-weight: 700;
                    color: var(--color-skyblue-dark);
                    
                    /* BIGGER CARDS FIX FOR OTHER SECTIONS */
                    min-height: 110px;
                    display: flex;
                    align-items: center;
                }
                .gcu-html-content p {
                    margin-bottom: 16px;
                }

                .gcu-muted {
                    color: var(--color-muted-text);
                }
                .text-center { text-align: center; }

                @media (max-width: 860px) {
                    .gcu-row {
                        grid-template-columns: 1fr;
                        gap: 20px;
                    }
                    .gcu-header-section {
                        min-height: 380px;
                    }
                    .gcu-banner-info {
                        padding: 24px;
                    }
                    .gcu-banner-info__title {
                        font-size: 1.8rem;
                    }
                }
                @media (max-width: 500px) {
                    .gcu-header-section {
                        min-height: 270px;
                    }
                    .gcu-main-content {
                        padding-top: 50px;
                    }
                    .gcu-banner-info {
                        margin-bottom: -40px;
                    }
                }
            `}</style>
        </div>
    );
}

function ModuleAccordion({ label }: { label: string }) {
    const [open, setOpen] = useState(false);
    return (
        <div className={`gcu-module-row ${open ? 'is-open' : ''}`}>
            <button 
                type="button" 
                className="gcu-module-row__head" 
                onClick={() => setOpen((o) => !o)}
            >
                <span>{label}</span>
                <span className="gcu-module-row__arrow" aria-hidden="true">
                    &#10142;
                </span>
            </button>
            {open && (
                <div className="gcu-module-row__body">
                    <p>This module develops specialized learning outcomes designed for {label}. Details include critical thinking practices, case examinations, and operational assessments focused on sector advancements.</p>
                </div>
            )}
        </div>
    );
}