import { useEffect, useState } from 'react';
import { Head, useHttp } from '@inertiajs/react';
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
    
    // Non-navigating HTTP client hook introduced in Inertia v3
    const http = useHttp();

    useEffect(() => {
        async function loadDashboardData() {
            try {
                // Fetching the data using await 
                const response = await http.get<DashboardResponse>('/api/dashboard-stats');
                
                setStats(response.stats);
                setLatestApplications(response.latestApplications);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            }
        }
        
        loadDashboardData();
    }, []);

    // Utility to map statuses to modern Bootstrap 5 contextual colors
    const getStatusStyles = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return 'bg-success-subtle text-success border border-success-subtle';
            case 'REJECTED':
                return 'bg-danger-subtle text-danger border border-danger-subtle';
            case 'PENDING REVIEW':
            default:
                return 'bg-warning-subtle text-warning border border-warning-subtle';
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="container-fluid p-4">
                
                {/* Statistics Cards Section */}
                <div className="row g-4 mb-4">
                    
                    {/* Card 1: Total Applications */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Total Applications</span>
                                    <div className="bg-light rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <span className="iconify fs-5 text-secondary" data-icon="lucide:file-text"></span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {http.processing || !stats ? (
                                        <div className="spinner-border spinner-border-sm text-secondary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    ) : (
                                        <h3 className="display-6 fw-bold mb-1">{stats.totalApplications}</h3>
                                    )}
                                    <p className="text-muted small mb-0">Submitted applications across agencies</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Applications Processed */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Applications Processed</span>
                                    <div className="bg-primary-subtle rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <span className="iconify fs-5 text-primary" data-icon="lucide:check-circle"></span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {http.processing || !stats ? (
                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    ) : (
                                        <h3 className="display-6 fw-bold mb-1">{stats.processedApplications}</h3>
                                    )}
                                    <p className="text-muted small mb-0">Approved or rejected applications</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Case Closed */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Case Closed</span>
                                    <div className="bg-success-subtle rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <span className="iconify fs-5 text-success" data-icon="lucide:archive"></span>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    {http.processing || !stats ? (
                                        <div className="spinner-border spinner-border-sm text-success" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                    ) : (
                                        <h3 className="display-6 fw-bold mb-1">{stats.closedApplications}</h3>
                                    )}
                                    <p className="text-muted small mb-0">Completed / approved enrollments</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Latest Applications Table Section */}
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm">
                            <div className="card-header bg-transparent border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="card-title fw-bold mb-1">Latest Applications</h5>
                                    <p className="card-subtitle text-muted small">Recently submitted student entries</p>
                                </div>
                                <div className="text-muted small d-flex align-items-center gap-1">
                                    <span className="iconify fs-6" data-icon="lucide:clock"></span>
                                    <span>Real-time updates</span>
                                </div>
                            </div>

                            <div className="card-body px-0 pb-0">
                                {http.processing ? (
                                    <div className="text-center py-5">
                                        <div className="spinner-border text-secondary" role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="text-muted mt-2 small">Loading applications...</p>
                                    </div>
                                ) : latestApplications.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <span className="iconify display-6 mb-2 opacity-50" data-icon="lucide:user"></span>
                                        <p className="mb-0">No applications found.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="table-light">
                                                <tr className="text-muted text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                                    <th className="px-4 py-3">App ID</th>
                                                    <th className="px-4 py-3">Student Name</th>
                                                    <th className="px-4 py-3">Course / University</th>
                                                    <th className="px-4 py-3">Status</th>
                                                    <th className="px-4 py-3 text-end">Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {latestApplications.map((app) => (
                                                    <tr key={app.id}>
                                                        <td className="px-4 py-3 font-monospace text-muted small fw-semibold">
                                                            {app.app_id}
                                                        </td>
                                                        <td className="px-4 py-3 fw-semibold">
                                                            {app.student_name}
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
                                                            <span className={`badge rounded-pill px-3 py-1.5 ${getStatusStyles(app.status)}`}>
                                                                {app.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-end text-muted small">
                                                            {app.created_at}
                                                        </td>
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