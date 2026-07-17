import { useEffect, useState } from 'react';
import { Head, useHttp, router } from '@inertiajs/react';
import { dashboard } from '@/routes';

interface Application {
    id: number;
    app_id: string;
    student_name: string;
    university_name: string;
    college_name: string;
    course_name: string;
    status: string;
    created_at: string;
}

interface Stats {
    totalApplications: number;
    processedApplications: number;
    closedApplications: number;
}

interface DashboardResponse {
    stats: Stats;
    latestApplications: Application[];
}

// Brand tokens pulled from studyinnepal.com — keep in sync if the marketing
// site's palette ever changes.
const BRAND = {
    primary: '#0084DB',
    primaryHover: '#0068AB',
    gold: '#F5B942',
    ink: '#0A0A0A',
    panel: '#1E1A1B',
    bg: '#F8FAFB',
    line: '#EEF1F4',
    muted: '#8A93A0',
};

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [latestApplications, setLatestApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const http = useHttp();

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const response = (await http.get('/api/dashboard')) as DashboardResponse;
                setStats(response.stats);
                setLatestApplications(response.latestApplications);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        loadDashboardData();
    }, []);

    const getStatusMeta = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return { className: 'sd-badge sd-badge--approved', label: status };
            case 'REJECTED':
                return { className: 'sd-badge sd-badge--rejected', label: status };
            case 'PENDING REVIEW':
            case 'PENDING':
            default:
                return { className: 'sd-badge sd-badge--pending', label: status || 'PENDING' };
        }
    };

    const viewApplicationRecord = (appId: number) => {
        router.visit(`/applications/${appId}`);
    };

    const todayLabel = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
    });

    if (isLoading) {
        return (
            <>
                <BrandStyles />
                <div className="sd-root">
                    <div className="sd-loading">
                        <span className="sd-spinner" aria-hidden="true" />
                        <p className="sd-loading__text">Loading dashboard&hellip;</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <BrandStyles />
            <div className="sd-root">
                {/* Page header */}
                <div className="sd-header">
                    <div>
                        <span className="sd-eyebrow">Study in Nepal &middot; Admin</span>
                        <h1 className="sd-title">Dashboard</h1>
                        <p className="sd-subtitle">{todayLabel} &mdash; here's how applications are moving.</p>
                    </div>
                    <button
                        type="button"
                        className="sd-btn sd-btn--primary"
                        onClick={() => router.visit('/applications')}
                    >
                        <span>View All Applications</span>
                        <span className="sd-btn__arrow" aria-hidden="true">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M5 12h14" />
                                <path d="m12 5 7 7-7 7" />
                            </svg>
                        </span>
                    </button>
                </div>

                {/* Stat cards */}
                <div className="sd-stats">
                    <div className="sd-stat">
                        <div className="sd-stat__top">
                            <span className="sd-eyebrow sd-eyebrow--muted">Total Applications</span>
                            <StatIcon variant="light">
                                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                                <path d="M10 9H8" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                            </StatIcon>
                        </div>
                        <span className="sd-stat__value">{stats?.totalApplications ?? 0}</span>
                        <p className="sd-stat__desc">Submitted applications across agencies</p>
                    </div>

                    <div className="sd-stat">
                        <div className="sd-stat__top">
                            <span className="sd-eyebrow sd-eyebrow--muted">Applications Processed</span>
                            <StatIcon variant="light">
                                <circle cx="12" cy="12" r="10" />
                                <path d="m9 12 2 2 4-4" />
                            </StatIcon>
                        </div>
                        <span className="sd-stat__value">{stats?.processedApplications ?? 0}</span>
                        <p className="sd-stat__desc">Approved or rejected applications</p>
                    </div>

                    {/* Dark panel — an homage to the "Facts & Figures" block on the marketing site */}
                    <div className="sd-stat sd-stat--dark">
                        <div className="sd-stat__top">
                            <span className="sd-eyebrow sd-eyebrow--gold">Case Closed</span>
                            <StatIcon variant="dark">
                                <rect width="20" height="5" x="2" y="3" rx="1" />
                                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                                <line x1="10" x2="14" y1="12" y2="12" />
                            </StatIcon>
                        </div>
                        <span className="sd-stat__value sd-stat__value--light">{stats?.closedApplications ?? 0}</span>
                        <p className="sd-stat__desc sd-stat__desc--light">Completed / approved enrollments</p>
                    </div>
                </div>

                {/* Latest applications */}
                <div className="sd-panel">
                    <div className="sd-panel__header">
                        <div>
                            <h2 className="sd-panel__title">Latest Applications</h2>
                            <p className="sd-panel__subtitle">Recently submitted student entries</p>
                        </div>
                        <div className="sd-live">
                            <span className="sd-live__dot" aria-hidden="true" />
                            Real-time updates
                        </div>
                    </div>

                    {latestApplications.length === 0 ? (
                        <div className="sd-empty">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <p>No applications found yet.</p>
                        </div>
                    ) : (
                        <div className="sd-table-wrap">
                            <table className="sd-table">
                                <thead>
                                    <tr>
                                        <th>App ID</th>
                                        <th>Student Name</th>
                                        <th>Course / University</th>
                                        <th>Status</th>
                                        <th className="sd-table__right">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {latestApplications.map((app) => {
                                        const badge = getStatusMeta(app.status);
                                        return (
                                            <tr
                                                key={app.id}
                                                onClick={() => viewApplicationRecord(app.id)}
                                                title="Click to view full application record"
                                            >
                                                <td className="sd-table__id">{app.app_id}</td>
                                                <td className="sd-table__name">{app.student_name}</td>
                                                <td>
                                                    <div className="sd-course">
                                                        <span className="sd-course__name">{app.course_name}</span>
                                                        <span className="sd-course__school">
                                                            {app.college_name || app.university_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={badge.className}>{badge.label}</span>
                                                </td>
                                                <td className="sd-table__right sd-table__date">{app.created_at}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

function StatIcon({ children, variant }: { children: React.ReactNode; variant: 'light' | 'dark' }) {
    return (
        <div className={`sd-stat__icon sd-stat__icon--${variant}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {children}
            </svg>
        </div>
    );
}

function BrandStyles() {
    return (
        <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Castoro+Titling&display=swap');

            .sd-root {
                --sd-primary: ${BRAND.primary};
                --sd-primary-hover: ${BRAND.primaryHover};
                --sd-gold: ${BRAND.gold};
                --sd-ink: ${BRAND.ink};
                --sd-panel: ${BRAND.panel};
                --sd-bg: ${BRAND.bg};
                --sd-line: ${BRAND.line};
                --sd-muted: ${BRAND.muted};

                background: var(--sd-bg);
                min-height: 100vh;
                padding: 2.5rem 2.75rem 4rem;
                font-family: 'Rajdhani', 'Segoe UI', sans-serif;
                color: var(--sd-ink);
            }

            .sd-eyebrow {
                font-family: 'Rajdhani', sans-serif;
                font-weight: 700;
                font-size: 0.7rem;
                letter-spacing: 0.16em;
                text-transform: uppercase;
                color: var(--sd-primary);
                display: inline-block;
            }
            .sd-eyebrow--muted { color: var(--sd-muted); }
            .sd-eyebrow--gold { color: var(--sd-gold); }

            .sd-header {
                display: flex;
                align-items: flex-end;
                justify-content: space-between;
                gap: 1.5rem;
                flex-wrap: wrap;
                margin-bottom: 2.25rem;
            }
            .sd-title {
                font-family: 'Castoro Titling', serif;
                font-weight: 400;
                font-size: 2.1rem;
                letter-spacing: 0.03em;
                text-transform: uppercase;
                margin: 0.35rem 0 0.35rem;
                color: var(--sd-ink);
            }
            .sd-subtitle {
                margin: 0;
                font-size: 0.95rem;
                font-weight: 600;
                color: var(--sd-muted);
            }

            .sd-btn {
                display: inline-flex;
                align-items: center;
                gap: 1.25rem;
                border: none;
                cursor: pointer;
                border-radius: 999px;
                padding: 0.15rem 0.15rem 0.15rem 1.4rem;
                font-family: 'Rajdhani', sans-serif;
                font-weight: 700;
                font-size: 0.85rem;
                letter-spacing: 0.04em;
                transition: all 0.25s ease;
            }
            .sd-btn--primary {
                background: var(--sd-primary);
                color: #fff;
                box-shadow: 0 10px 24px -10px rgba(0, 132, 219, 0.55);
            }
            .sd-btn--primary:hover { background: var(--sd-primary-hover); transform: translateY(-1px); }
            .sd-btn__arrow {
                width: 2.35rem;
                height: 2.35rem;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.18);
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .sd-stats {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1.25rem;
                margin-bottom: 2rem;
            }
            @media (max-width: 900px) {
                .sd-stats { grid-template-columns: 1fr; }
            }

            .sd-stat {
                background: #fff;
                border: 1px solid var(--sd-line);
                border-radius: 18px;
                padding: 1.6rem 1.6rem 1.5rem;
                display: flex;
                flex-direction: column;
                transition: transform 0.25s ease, box-shadow 0.25s ease;
            }
            .sd-stat:hover {
                transform: translateY(-2px);
                box-shadow: 0 18px 32px -20px rgba(10, 10, 10, 0.18);
            }
            .sd-stat--dark {
                background: var(--sd-panel);
                border-color: var(--sd-panel);
            }

            .sd-stat__top {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                margin-bottom: 1.4rem;
            }
            .sd-stat__icon {
                width: 2.5rem;
                height: 2.5rem;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                flex-shrink: 0;
            }
            .sd-stat__icon--light { background: rgba(0, 132, 219, 0.1); color: var(--sd-primary); }
            .sd-stat__icon--dark { background: rgba(245, 185, 66, 0.15); color: var(--sd-gold); }

            .sd-stat__value {
                font-family: 'Castoro Titling', serif;
                font-size: 2.6rem;
                line-height: 1;
                color: var(--sd-ink);
                margin-bottom: 0.6rem;
            }
            .sd-stat__value--light { color: #fff; }
            .sd-stat__desc {
                margin: 0;
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--sd-muted);
            }
            .sd-stat__desc--light { color: rgba(255, 255, 255, 0.6); }

            .sd-panel {
                background: #fff;
                border: 1px solid var(--sd-line);
                border-radius: 18px;
                overflow: hidden;
            }
            .sd-panel__header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 1rem;
                flex-wrap: wrap;
                padding: 1.6rem 1.75rem 1.3rem;
                border-bottom: 1px solid var(--sd-line);
            }
            .sd-panel__title {
                font-family: 'Castoro Titling', serif;
                font-weight: 400;
                font-size: 1.15rem;
                letter-spacing: 0.02em;
                text-transform: uppercase;
                color: var(--sd-ink);
                margin: 0 0 0.25rem;
            }
            .sd-panel__subtitle {
                margin: 0;
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--sd-muted);
            }
            .sd-live {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
                font-weight: 700;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                color: var(--sd-primary);
            }
            .sd-live__dot {
                width: 7px;
                height: 7px;
                border-radius: 50%;
                background: var(--sd-primary);
                box-shadow: 0 0 0 4px rgba(0, 132, 219, 0.15);
            }

            .sd-table-wrap { overflow-x: auto; }
            .sd-table {
                width: 100%;
                border-collapse: collapse;
                font-family: 'Rajdhani', sans-serif;
            }
            .sd-table thead th {
                text-align: left;
                padding: 0.9rem 1.75rem;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.12em;
                text-transform: uppercase;
                color: var(--sd-muted);
                background: var(--sd-bg);
                border-bottom: 1px solid var(--sd-line);
                white-space: nowrap;
            }
            .sd-table__right { text-align: right; }
            .sd-table tbody tr {
                cursor: pointer;
                border-bottom: 1px solid var(--sd-line);
                transition: background 0.15s ease;
            }
            .sd-table tbody tr:last-child { border-bottom: none; }
            .sd-table tbody tr:hover { background: rgba(0, 132, 219, 0.04); }
            .sd-table tbody td {
                padding: 1rem 1.75rem;
                font-size: 0.92rem;
                vertical-align: middle;
            }
            .sd-table__id {
                font-family: monospace;
                font-weight: 700;
                color: var(--sd-primary);
                font-size: 0.82rem;
                letter-spacing: 0.02em;
            }
            .sd-table__name { font-weight: 700; color: var(--sd-ink); }
            .sd-course { display: flex; flex-direction: column; gap: 0.15rem; }
            .sd-course__name { font-weight: 600; color: var(--sd-ink); }
            .sd-course__school { font-size: 0.78rem; font-weight: 600; color: var(--sd-muted); }
            .sd-table__date { color: var(--sd-muted); font-size: 0.82rem; font-weight: 600; }

            .sd-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.32rem 0.85rem;
                border-radius: 999px;
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                border: 1px solid transparent;
            }
            .sd-badge--approved { background: rgba(16, 163, 104, 0.1); color: #0f9d58; border-color: rgba(16, 163, 104, 0.18); }
            .sd-badge--rejected { background: rgba(220, 38, 38, 0.08); color: #dc2626; border-color: rgba(220, 38, 38, 0.16); }
            .sd-badge--pending { background: rgba(245, 185, 66, 0.16); color: #a9761c; border-color: rgba(245, 185, 66, 0.35); }

            .sd-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.75rem;
                padding: 4rem 1rem;
                color: var(--sd-muted);
            }
            .sd-empty svg { color: var(--sd-primary); opacity: 0.5; }
            .sd-empty p { margin: 0; font-weight: 600; }

            .sd-loading {
                min-height: 70vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 1rem;
            }
            .sd-spinner {
                width: 2.75rem;
                height: 2.75rem;
                border-radius: 50%;
                border: 3px solid var(--sd-line);
                border-top-color: var(--sd-primary);
                animation: sd-spin 0.8s linear infinite;
            }
            .sd-loading__text {
                font-family: 'Rajdhani', sans-serif;
                font-weight: 700;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                font-size: 0.85rem;
                color: var(--sd-muted);
            }
            @keyframes sd-spin { to { transform: rotate(360deg); } }
        `}</style>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};