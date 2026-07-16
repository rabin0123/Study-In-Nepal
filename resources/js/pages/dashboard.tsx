import { Head } from '@inertiajs/react';
import { dashboard } from '@/routes';
import { 
    FileText, 
    CheckCircle, 
    Archive, 
    Clock, 
    ArrowUpRight,
    User
} from 'lucide-react';

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

interface DashboardProps {
    stats: {
        totalApplications: number;
        processedApplications: number;
        closedApplications: number;
    };
    latestApplications: Application[];
}

export default function Dashboard({ stats, latestApplications = [] }: DashboardProps) {
    // Utility to style status badges
    const getStatusStyles = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'APPROVED':
                return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900/50';
            case 'REJECTED':
                return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50';
            case 'PENDING REVIEW':
            default:
                return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50';
        }
    };

    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-6">
                
                {/* Statistics Cards Section */}
                <div className="grid gap-4 md:grid-cols-3">
                    
                    {/* Card 1: Total Applications */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Total Applications</span>
                            <div className="rounded-lg bg-neutral-100 p-2 dark:bg-neutral-800">
                                <FileText className="h-5 w-5 text-neutral-600 dark:text-neutral-400" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold tracking-tight">{stats?.totalApplications ?? 0}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Submitted applications across agencies</p>
                        </div>
                    </div>

                    {/* Card 2: Processed Applications */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Applications Processed</span>
                            <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                                <CheckCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold tracking-tight">{stats?.processedApplications ?? 0}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Approved or rejected applications</p>
                        </div>
                    </div>

                    {/* Card 3: Case Closed Applications */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-card p-6 shadow-sm dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted-foreground">Case Closed</span>
                            <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
                                <Archive className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-3xl font-bold tracking-tight">{stats?.closedApplications ?? 0}</h3>
                            <p className="text-xs text-muted-foreground mt-1">Completed / approved enrollments</p>
                        </div>
                    </div>

                </div>

                {/* Latest Applications Table Section */}
                <div className="rounded-xl border border-sidebar-border/70 bg-card shadow-sm dark:border-sidebar-border">
                    <div className="flex items-center justify-between border-b border-sidebar-border/70 p-6 dark:border-sidebar-border">
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Latest Applications</h2>
                            <p className="text-sm text-muted-foreground">Recently submitted student entries</p>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>Real-time updates</span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {latestApplications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <User className="h-8 w-8 mb-2 opacity-50" />
                                <p>No applications found.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-sidebar-border/50 text-xs font-semibold text-muted-foreground uppercase bg-muted/30">
                                        <th className="px-6 py-3">App ID</th>
                                        <th className="px-6 py-3">Student Name</th>
                                        <th className="px-6 py-3">Course / University</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/50">
                                    {latestApplications.map((app) => (
                                        <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                                {app.app_id}
                                            </td>
                                            <td className="px-6 py-4 font-medium">
                                                {app.student_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{app.course_name}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {app.college_name || app.university_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyles(app.status)}`}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                                                {app.created_at}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
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