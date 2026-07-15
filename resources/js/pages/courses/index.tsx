import { useState, type FormEvent } from 'react';
import { Link, router } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type CourseDetailRow = {
    uuid: string;
    university_name: string;
    college_name: string;
    course_name: string;
    university_id: number | null;
    created_at: string;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    courseDetails: Paginated<CourseDetailRow>;
    filters: { search: string | null };
};

export default function CourseDetailsIndex({ courseDetails, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');

    const handleSearch = (e: FormEvent) => {
        e.preventDefault();
        router.get('/course-details', { search: search || undefined }, { preserveState: true });
    };

    return (
        <AppSidebarLayout breadcrumbs={[{ title: 'Course Details', href: '/course-details' }]}>
            <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                <h4 className="mb-0 fw-semibold">Course Details</h4>
                <Link href="/course-details/create" className="btn btn-primary">
                    + New course details
                </Link>
            </div>

            <div className="card mb-4">
                <div className="card-body">
                    <form onSubmit={handleSearch} className="d-flex gap-2">
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Search by university, college, or course name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button type="submit" className="btn btn-outline-primary">
                            Search
                        </button>
                    </form>
                </div>
            </div>

            <div className="card">
                <div className="table-responsive">
                    <table className="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th>Course</th>
                                <th>College</th>
                                <th>University</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {courseDetails.data.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center text-body-secondary py-6">
                                        No course details found.
                                    </td>
                                </tr>
                            )}
                            {courseDetails.data.map((row) => (
                                <tr key={row.uuid}>
                                    <td className="fw-medium">{row.course_name}</td>
                                    <td>{row.college_name}</td>
                                    <td>{row.university_name}</td>
                                    <td>
                                        {row.university_id ? (
                                            <span className="badge text-bg-success-subtle text-success">Linked</span>
                                        ) : (
                                            <span className="badge text-bg-warning-subtle text-warning">Not linked</span>
                                        )}
                                    </td>
                                    <td className="text-end">
                                        <Link href={`/course-details/${row.uuid}`} className="btn btn-sm btn-outline-primary">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {courseDetails.last_page > 1 && (
                    <div className="card-body d-flex gap-1 flex-wrap">
                        {courseDetails.links.map((link, i) => (
                            <Link
                                key={i}
                                href={link.url ?? '#'}
                                preserveState
                                className={`btn btn-sm ${link.active ? 'btn-primary' : 'btn-outline-secondary'}`}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                                aria-disabled={!link.url}
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppSidebarLayout>
    );
}
