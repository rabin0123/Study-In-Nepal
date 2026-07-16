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
    const [isLoading, setIsLoading] = useState(true); // New state to track initial data load
    
    // Non-navigating HTTP client hook
    const http = useHttp();

    useEffect(() => {
        async function loadDashboardData() {
            try {
                const response = (await http.get('/api/dashboard')) as DashboardResponse;
                setStats(response.stats);
                setLatestApplications(response.latestApplications);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setIsLoading(false); // Done loading (stops spinner even on error)
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
            case 'PENDING':
            default:
                return 'bg-warning-subtle text-warning border border-warning-subtle';
        }
    };

    // Handler to navigate to the student application record
    const viewApplicationRecord = (appId: number) => {
        router.visit(`/applications/${appId}`);
    };

    // Full-screen / container-centered loading spinner before page is loaded
    if (isLoading) {
        return (
            <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '75vh' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3.5rem', height: '3.5rem' }}>
                    <span className="visually-hidden">Loading Dashboard...</span>
                </div>
                <h6 className="mt-3 text-muted fw-semibold">Loading dashboard data...</h6>
            </div>
        );
    }

    return (
        <>
            <Head title="Dashboard" />
            <div className="container-fluid p-4">
                
                {/* Statistics Cards Section */}
                <div className="row g-4 mb-4">
                    
                    {/* Card 1: Total Applications */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100 border-top border-primary border-3">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Total Applications</span>
                                    <div className="bg-primary rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                                            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
                                            <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
                                            <path d="M10 9H8"/>
                                            <path d="M16 13H8"/>
                                            <path d="M16 17H8"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="display-6 fw-bold mb-1 text-primary">
                                        {stats?.totalApplications ?? 0}
                                    </h3>
                                    <p className="text-muted small mb-0">Submitted applications across agencies</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Applications Processed */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100 border-top border-primary border-3">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Applications Processed</span>
                                    <div className="bg-primary-subtle rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                            <circle cx="12" cy="12" r="10"/>
                                            <path d="m9 12 2 2 4-4"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="display-6 fw-bold mb-1 text-primary">
                                        {stats?.processedApplications ?? 0}
                                    </h3>
                                    <p className="text-muted small mb-0">Approved or rejected applications</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Case Closed */}
                    <div className="col-12 col-md-4">
                        <div className="card border-0 shadow-sm h-100 border-top border-primary border-3">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    <span className="text-muted fw-medium small">Case Closed</span>
                                    <div className="bg-info-subtle rounded p-2 d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-info">
                                            <rect width="20" height="5" x="2" y="3" rx="1"/>
                                            <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/>
                                            <line x1="10" x2="14" y1="12" y2="12"/>
                                        </svg>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <h3 className="display-6 fw-bold mb-1 text-primary">
                                        {stats?.closedApplications ?? 0}
                                    </h3>
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
                            <div className="card-header bg-transparent border-bottom border-primary-subtle pt-4 px-4 pb-3 d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="card-title fw-bold mb-1 text-primary">Latest Applications</h5>
                                    <p className="card-subtitle text-muted small">Recently submitted student entries</p>
                                </div>
                                <div className="text-primary small d-flex align-items-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                        <circle cx="12" cy="12" r="10"/>
                                        <polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    <span className="fw-semibold">Real-time updates</span>
                                </div>
                            </div>

                            <div className="card-body px-0 pb-0">
                                {latestApplications.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2 opacity-50 text-primary">
                                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                        <p className="mb-0">No applications found.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover align-middle mb-0">
                                            <thead className="bg-primary text-white">
                                                <tr className="text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                                                    <th className="px-4 py-3 bg-primary text-white border-0">App ID</th>
                                                    <th className="px-4 py-3 bg-primary text-white border-0">Student Name</th>
                                                    <th className="px-4 py-3 bg-primary text-white border-0">Course / University</th>
                                                    <th className="px-4 py-3 bg-primary text-white border-0">Status</th>
                                                    <th className="px-4 py-3 bg-primary text-white border-0 text-end">Submitted</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {latestApplications.map((app) => (
                                                    <tr 
                                                        key={app.id} 
                                                        onClick={() => viewApplicationRecord(app.id)}
                                                        style={{ cursor: 'pointer' }}
                                                        title="Click to view full application record"
                                                    >
                                                        <td className="px-4 py-3 font-monospace text-primary small fw-bold">
                                                            {app.app_id}
                                                        </td>
                                                        <td className="px-4 py-3 fw-bold">
                                                            {app.student_name}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="d-flex flex-column">
                                                                <span className="fw-semibold">{app.course_name}</span>
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