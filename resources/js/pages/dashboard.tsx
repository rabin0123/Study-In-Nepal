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

// Loads the Iconify web-component runtime once, on demand.
function useIconify() {
    useEffect(() => {
        if (document.querySelector('script[data-iconify]')) return;
        const script = document.createElement('script');
        script.src = 'https://code.iconify.design/iconify-icon/2.1.0/iconify-icon.min.js';
        script.async = true;
        script.dataset.iconify = 'true';
        document.head.appendChild(script);
    }, []);
}

export default function Dashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [latestApplications, setLatestApplications] = useState<Application[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [query, setQuery] = useState('');

    const http = useHttp();
    useIconify();

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

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return 'badge rounded-pill bg-success-subtle text-success-emphasis border border-success-subtle px-3 py-2';
            case 'REJECTED':
                return 'badge rounded-pill bg-danger-subtle text-danger-emphasis border border-danger-subtle px-3 py-2';
            case 'PENDING REVIEW':
            case 'PENDING':
            default:
                return 'badge rounded-pill bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2';
        }
    };

    const viewApplicationRecord = (appId: number) => {
        router.visit(`/applications/${appId}`);
    };

    const processedRate = stats && stats.totalApplications > 0
        ? Math.round((stats.processedApplications / stats.totalApplications) * 100)
        : 0;

    const filteredApplications = query
        ? latestApplications.filter((app) =>
              [app.app_id, app.student_name, app.course_name, app.university_name, app.college_name]
                  .filter(Boolean)
                  .some((field) => field.toLowerCase().includes(query.toLowerCase())),
          )
        : latestApplications;

    const rootStyle = {
        '--bs-primary': '#0866C6',
        '--bs-primary-rgb': '8,102,198',
        '--bs-primary-bg-subtle': '#E8F1FC',
        '--bs-primary-border-subtle': '#C3DDF7',
        '--bs-primary-text-emphasis': '#0A529E',
        '--bs-link-color': '#0866C6',
        '--bs-link-hover-color': '#0A529E',
        backgroundColor: '#F5F8FB',
        minHeight: '100vh',
    } as React.CSSProperties;

    if (isLoading) {
        return (
            <div style={rootStyle} className="d-flex flex-column align-items-center justify-content-center" >
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                    <span className="visually-hidden">Loading Dashboard...</span>
                </div>
                <h6 className="mt-3 text-muted fw-semibold">Loading dashboard data...</h6>
            </div>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div style={rootStyle} className="pb-5">
                <div className="container-fluid px-4 px-lg-5 py-4">

                    {/* Header */}
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                        <div>
                            <div className="d-flex align-items-center gap-2 text-primary fw-bold text-uppercase small mb-1" style={{ letterSpacing: '0.08em' }}>
                                <iconify-icon icon="solar:widget-5-bold-duotone" width="16" />
                                Admin Dashboard
                            </div>
                            <h2 className="fw-bold text-dark mb-1">Welcome back 👋</h2>
                            <p className="text-muted mb-0">Here's what's happening with student applications today.</p>
                        </div>

                        <div className="d-flex flex-wrap gap-2">
                            <div className="input-group shadow-sm" style={{ width: 240 }}>
                                <span className="input-group-text bg-white border-end-0 text-muted">
                                    <iconify-icon icon="solar:magnifer-linear" width="16" />
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 ps-0"
                                    placeholder="Search applications..."
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                className="btn btn-primary d-flex align-items-center gap-2 px-3 shadow-sm"
                                onClick={() => router.visit('/applications/create')}
                            >
                                <iconify-icon icon="solar:add-circle-bold" width="18" />
                                New Application
                            </button>
                        </div>
                    </div>

                    {/* Stat cards */}
                    <div className="row g-3 mb-4">
                        <div className="col-12 col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 dashboard-stat-card">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                                            <iconify-icon icon="solar:documents-bold-duotone" width="24" />
                                        </div>
                                    </div>
                                    <p className="text-muted small fw-semibold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                                        Total Applications
                                    </p>
                                    <h2 className="fw-bold text-dark mb-2">{stats?.totalApplications ?? 0}</h2>
                                    <p className="text-muted small mb-0 d-flex align-items-center gap-1">
                                        <iconify-icon icon="solar:point-on-map-linear" width="14" />
                                        Submitted across all agencies
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 dashboard-stat-card">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                                            <iconify-icon icon="solar:check-circle-bold-duotone" width="24" />
                                        </div>
                                        <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill small">{processedRate}%</span>
                                    </div>
                                    <p className="text-muted small fw-semibold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                                        Applications Processed
                                    </p>
                                    <h2 className="fw-bold text-dark mb-2">{stats?.processedApplications ?? 0}</h2>
                                    <div className="progress" style={{ height: 6 }}>
                                        <div
                                            className="progress-bar bg-primary"
                                            role="progressbar"
                                            style={{ width: `${processedRate}%` }}
                                            aria-valuenow={processedRate}
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="col-12 col-md-4">
                            <div className="card border-0 shadow-sm rounded-4 h-100 text-white dashboard-stat-card dashboard-stat-card--accent">
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start mb-3">
                                        <div className="bg-white bg-opacity-25 rounded-3 d-flex align-items-center justify-content-center" style={{ width: 48, height: 48 }}>
                                            <iconify-icon icon="solar:folder-check-bold-duotone" width="24" />
                                        </div>
                                    </div>
                                    <p className="text-white-50 small fw-semibold text-uppercase mb-1" style={{ letterSpacing: '0.05em' }}>
                                        Case Closed
                                    </p>
                                    <h2 className="fw-bold mb-2">{stats?.closedApplications ?? 0}</h2>
                                    <p className="text-white-50 small mb-0 d-flex align-items-center gap-1">
                                        <iconify-icon icon="solar:medal-ribbons-star-bold" width="14" />
                                        Completed / approved enrollments
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Latest applications */}
                    <div className="card border-0 shadow-sm rounded-4">
                        <div className="card-header bg-white border-0 pt-4 px-4 pb-3 d-flex flex-wrap justify-content-between align-items-center gap-2 rounded-top-4">
                            <div>
                                <h5 className="fw-bold text-dark mb-1">Latest Applications</h5>
                                <p className="text-muted small mb-0">Recently submitted student entries</p>
                            </div>
                            <span className="badge bg-primary-subtle text-primary-emphasis rounded-pill px-3 py-2 d-flex align-items-center gap-2">
                                <span className="dashboard-live-dot" />
                                Real-time updates
                            </span>
                        </div>

                        <div className="card-body p-0">
                            {filteredApplications.length === 0 ? (
                                <div className="text-center py-5 text-muted">
                                    <iconify-icon icon="solar:inbox-line-bold-duotone" width="48" style={{ color: 'var(--bs-primary)', opacity: 0.5 }} />
                                    <p className="mb-0 mt-2">
                                        {query ? 'No applications match your search.' : 'No applications found.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead>
                                            <tr className="text-uppercase text-muted small" style={{ letterSpacing: '0.05em' }}>
                                                <th className="px-4 py-3 bg-light border-0 fw-semibold">App ID</th>
                                                <th className="px-4 py-3 bg-light border-0 fw-semibold">Student Name</th>
                                                <th className="px-4 py-3 bg-light border-0 fw-semibold">Course / University</th>
                                                <th className="px-4 py-3 bg-light border-0 fw-semibold">Status</th>
                                                <th className="px-4 py-3 bg-light border-0 fw-semibold text-end">Submitted</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredApplications.map((app) => (
                                                <tr
                                                    key={app.id}
                                                    onClick={() => viewApplicationRecord(app.id)}
                                                    style={{ cursor: 'pointer' }}
                                                    title="Click to view full application record"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-monospace text-primary small fw-bold">{app.app_id}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <div
                                                                className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold small"
                                                                style={{ width: 34, height: 34, flexShrink: 0 }}
                                                            >
                                                                {app.student_name?.charAt(0)?.toUpperCase() || '?'}
                                                            </div>
                                                            <span className="fw-semibold text-dark">{app.student_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <div className="d-flex flex-column">
                                                            <span className="fw-semibold text-dark">{app.course_name}</span>
                                                            <span className="text-muted small">
                                                                {app.college_name || app.university_name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={getStatusBadge(app.status)}>{app.status}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-end text-muted small">{app.created_at}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .dashboard-stat-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .dashboard-stat-card:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 0.75rem 1.75rem rgba(8, 102, 198, 0.12) !important;
                }
                .dashboard-stat-card--accent {
                    background: linear-gradient(135deg, #0866C6 0%, #0A529E 100%);
                }
                .dashboard-live-dot {
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: var(--bs-primary);
                    box-shadow: 0 0 0 4px rgba(8, 102, 198, 0.15);
                    display: inline-block;
                }
                .table > :not(caption) > * > * {
                    box-shadow: none;
                }
            `}</style>
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