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

    // Maps a status string to an icon + Bootstrap-native semantic class
    const getStatusMeta = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return { icon: 'mdi:check-circle', className: 'status-pill status-approved' };
            case 'REJECTED':
                return { icon: 'mdi:close-circle', className: 'status-pill status-rejected' };
            case 'PENDING REVIEW':
            case 'PENDING':
            default:
                return { icon: 'mdi:clock-outline', className: 'status-pill status-pending' };
        }
    };

    const viewApplicationRecord = (appId: number) => {
        router.visit(`/applications/${appId}`);
    };

    if (isLoading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '75vh' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading Dashboard...</span>
                </div>
                <p className="mt-3 fw-medium text-muted">Loading dashboard&hellip;</p>
            </div>
        );
    }

    const statCards = [
        {
            label: 'Total Applications',
            value: stats?.totalApplications ?? 0,
            helper: 'Submitted across all agencies',
            icon: 'mdi:file-document-multiple-outline',
        },
        {
            label: 'Applications Processed',
            value: stats?.processedApplications ?? 0,
            helper: 'Approved or rejected to date',
            icon: 'mdi:progress-check',
        },
        {
            label: 'Case Closed',
            value: stats?.closedApplications ?? 0,
            helper: 'Completed enrollments',
            icon: 'mdi:archive-check-outline',
        },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.3/css/bootstrap.min.css" />
            <script src="https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js"></script>
            <style>{`
                /* Uses Bootstrap's own --bs-primary as the single source of truth for brand blue.
                   Nothing here overrides that color -- only structure, spacing, and depth. */

                .dash-page {
                    background: #F7F9FC;
                    min-height: 100vh;
                }

                .dash-header-eyebrow {
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    font-size: 0.72rem;
                    font-weight: 700;
                    color: var(--bs-primary);
                }

                .dash-header-title {
                    font-weight: 800;
                    letter-spacing: -0.02em;
                }

                /* ---- Stat cards ---- */
                .stat-card {
                    background: #fff;
                    border: 1px solid #E9EDF3;
                    border-radius: 14px;
                    padding: 1.6rem 1.75rem;
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.18s ease, box-shadow 0.18s ease;
                    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
                }

                .stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 14px 28px -10px rgba(13, 110, 253, 0.22);
                }

                .stat-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 100%;
                    height: 3px;
                    background: var(--bs-primary);
                    opacity: 0.9;
                }

                .stat-icon-wrap {
                    width: 46px;
                    height: 46px;
                    border-radius: 12px;
                    background: rgba(13, 110, 253, 0.08);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--bs-primary);
                    font-size: 22px;
                    flex-shrink: 0;
                }

                .stat-value {
                    font-size: 2.3rem;
                    font-weight: 800;
                    letter-spacing: -0.02em;
                    line-height: 1.1;
                    color: #101828;
                }

                .stat-label {
                    color: #475467;
                    font-weight: 600;
                    font-size: 0.85rem;
                }

                .stat-helper {
                    color: #98A2B3;
                    font-size: 0.8rem;
                }

                /* ---- Panel / table card ---- */
                .panel-card {
                    background: #fff;
                    border: 1px solid #E9EDF3;
                    border-radius: 14px;
                    box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
                }

                .panel-header {
                    padding: 1.4rem 1.75rem 1.15rem;
                    border-bottom: 1px solid #EEF1F6;
                }

                .panel-title {
                    font-weight: 700;
                    font-size: 1.05rem;
                    margin-bottom: 0.15rem;
                    color: #101828;
                }

                .panel-subtitle {
                    color: #475467;
                    font-size: 0.85rem;
                }

                .panel-icon-badge {
                    width: 38px;
                    height: 38px;
                    border-radius: 10px;
                    background: var(--bs-primary);
                    color: #fff;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                }

                .live-badge {
                    background: rgba(13, 110, 253, 0.08);
                    color: var(--bs-primary);
                    font-weight: 600;
                    font-size: 0.78rem;
                    padding: 0.35rem 0.75rem;
                    border-radius: 999px;
                }

                .live-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: #17B26A;
                    display: inline-block;
                    box-shadow: 0 0 0 3px rgba(23, 178, 106, 0.18);
                }

                /* ---- Table ---- */
                .app-table thead th {
                    background: var(--bs-primary);
                    color: #fff;
                    font-size: 0.72rem;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    font-weight: 600;
                    border: none;
                    padding: 0.9rem 1.25rem;
                    white-space: nowrap;
                }

                .app-table tbody td {
                    padding: 1rem 1.25rem;
                    border-bottom: 1px solid #EEF1F6;
                    vertical-align: middle;
                }

                .app-table tbody tr {
                    cursor: pointer;
                    transition: background 0.12s ease;
                }

                .app-table tbody tr:hover {
                    background: rgba(13, 110, 253, 0.045);
                }

                .app-table tbody tr:last-child td {
                    border-bottom: none;
                }

                .student-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    background: rgba(13, 110, 253, 0.1);
                    color: var(--bs-primary);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    font-size: 0.8rem;
                    flex-shrink: 0;
                }

                .app-id-chip {
                    font-family: 'SFMono-Regular', Consolas, Menlo, monospace;
                    font-size: 0.8rem;
                    font-weight: 700;
                    color: var(--bs-primary);
                    background: rgba(13, 110, 253, 0.08);
                    padding: 0.2rem 0.55rem;
                    border-radius: 6px;
                }

                .student-name {
                    font-weight: 600;
                    color: #101828;
                }

                .course-name {
                    font-weight: 600;
                    font-size: 0.9rem;
                    color: #101828;
                }

                .uni-name {
                    color: #98A2B3;
                    font-size: 0.8rem;
                    display: flex;
                    align-items: center;
                    gap: 0.3rem;
                }

                .submitted-date {
                    color: #98A2B3;
                    font-size: 0.82rem;
                }

                .status-pill {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    font-size: 0.78rem;
                    font-weight: 600;
                    padding: 0.32rem 0.7rem;
                    border-radius: 999px;
                    border: 1px solid transparent;
                }

                .status-approved {
                    background: #ECFDF3;
                    color: #067647;
                    border-color: #ABEFC6;
                }

                .status-rejected {
                    background: #FEF3F2;
                    color: #B42318;
                    border-color: #FECDCA;
                }

                .status-pending {
                    background: #FFFAEB;
                    color: #B54708;
                    border-color: #FEDF89;
                }

                .row-arrow {
                    color: #D0D5DD;
                    font-size: 18px;
                    transition: transform 0.12s ease, color 0.12s ease;
                }

                .app-table tbody tr:hover .row-arrow {
                    color: var(--bs-primary);
                    transform: translateX(3px);
                }

                .empty-state {
                    padding: 4rem 1rem;
                    text-align: center;
                }

                .empty-state .icon-wrap {
                    width: 64px;
                    height: 64px;
                    border-radius: 16px;
                    background: rgba(13, 110, 253, 0.08);
                    color: var(--bs-primary);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 32px;
                    margin-bottom: 1rem;
                }
            `}</style>

            <div className="dash-page">
                <div className="container-fluid px-4 py-4" style={{ maxWidth: '1320px' }}>

                    {/* Page heading */}
                    <div className="d-flex justify-content-between align-items-end flex-wrap gap-2 mb-4">
                        <div>
                            <div className="dash-header-eyebrow mb-1">Overview</div>
                            <h2 className="dash-header-title mb-0">Applications Dashboard</h2>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="row g-3 mb-4">
                        {statCards.map((card) => (
                            <div className="col-12 col-md-4" key={card.label}>
                                <div className="stat-card h-100">
                                    <div className="d-flex align-items-start justify-content-between mb-4">
                                        <span className="stat-label">{card.label}</span>
                                        <div className="stat-icon-wrap">
                                            <iconify-icon icon={card.icon}></iconify-icon>
                                        </div>
                                    </div>
                                    <div className="stat-value mb-1">{card.value.toLocaleString()}</div>
                                    <div className="stat-helper">{card.helper}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Latest applications */}
                    <div className="panel-card">
                        <div className="panel-header d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div className="d-flex align-items-center gap-3">
                                <div className="panel-icon-badge">
                                    <iconify-icon icon="mdi:table-large"></iconify-icon>
                                </div>
                                <div>
                                    <div className="panel-title">Latest Applications</div>
                                    <div className="panel-subtitle">Recently submitted student entries</div>
                                </div>
                            </div>
                            <span className="live-badge d-inline-flex align-items-center gap-2">
                                <span className="live-dot"></span>
                                Real-time updates
                            </span>
                        </div>

                        {latestApplications.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon-wrap">
                                    <iconify-icon icon="mdi:account-search-outline"></iconify-icon>
                                </div>
                                <p className="mb-0 fw-medium text-secondary">No applications found.</p>
                                <p className="mb-0 text-muted" style={{ fontSize: '0.85rem' }}>
                                    New submissions will appear here as they come in.
                                </p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table app-table mb-0">
                                    <thead>
                                        <tr>
                                            <th>App ID</th>
                                            <th>Student</th>
                                            <th>Course / University</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th className="text-end"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {latestApplications.map((app) => {
                                            const meta = getStatusMeta(app.status);
                                            const initials = app.student_name
                                                ?.split(' ')
                                                .map((n) => n[0])
                                                .slice(0, 2)
                                                .join('')
                                                .toUpperCase();
                                            return (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => viewApplicationRecord(app.id)}
                                                    title="Click to view full application record"
                                                >
                                                    <td>
                                                        <span className="app-id-chip">{app.app_id}</span>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className="student-avatar">{initials}</span>
                                                            <span className="student-name">{app.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="d-flex flex-column">
                                                            <span className="course-name">{app.course_name}</span>
                                                            <span className="uni-name">
                                                                <iconify-icon icon="mdi:school-outline" style={{ fontSize: '13px' }}></iconify-icon>
                                                                {app.college_name || app.university_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={meta.className}>
                                                            <iconify-icon icon={meta.icon} style={{ fontSize: '14px' }}></iconify-icon>
                                                            {app.status}
                                                        </span>
                                                    </td>
                                                    <td className="submitted-date">{app.created_at}</td>
                                                    <td className="text-end">
                                                        <iconify-icon icon="mdi:chevron-right" className="row-arrow"></iconify-icon>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
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