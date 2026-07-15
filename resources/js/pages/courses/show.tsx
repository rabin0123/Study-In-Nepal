import { Head, Link } from '@inertiajs/react';
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';

type YearModule = {
    year: number;
    title?: string | null;
    modules?: string[] | null;
};

type YearFee = {
    year: number;
    amount?: string | null;
    currency?: string | null;
    note?: string | null;
};

type CourseDetailData = {
    id: number;
    uuid: string;
    summary: string | null;
    year_wise_modules: YearModule[] | null;
    fees: YearFee[] | null;
    careers: string[] | null;
} | null;

type UniversitySummary = {
    id: number;
    name: string;
    college: string;
    course: string;
    stream: string;
    level: string;
    intake: string;
    location: string;
    logoUrl: string | null;
};

type Props = {
    university: UniversitySummary;
    courseDetail: CourseDetailData;
};

function sortByYear<T extends { year: number }>(items: T[] | null | undefined): T[] {
    if (!items) return [];
    return [...items].sort((a, b) => a.year - b.year);
}

export default function CourseDetailsShow({ university, courseDetail }: Props) {
    const modules = sortByYear(courseDetail?.year_wise_modules);
    const fees = sortByYear(courseDetail?.fees);
    const careers = courseDetail?.careers ?? [];

    return (
        <AppSidebarLayout
            breadcrumbs={[
                { title: 'Courses', href: '/explorecourses' },
                { title: university.course, href: `/courses/${university.id}` },
            ]}
        >
            <Head title={`${university.course} — ${university.name}`} />

            {/* Header */}
            <div className="card mb-4">
                <div className="card-body d-flex align-items-center gap-3 flex-wrap">
                    {university.logoUrl ? (
                        <img
                            src={university.logoUrl}
                            alt={university.name}
                            style={{ width: 64, height: 64, objectFit: 'contain' }}
                            className="rounded"
                        />
                    ) : (
                        <span
                            className="rounded bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold fs-3"
                            style={{ width: 64, height: 64 }}
                        >
                            {university.name.slice(0, 2).toUpperCase()}
                        </span>
                    )}
                    <div className="flex-grow-1">
                        <h3 className="mb-1 fw-semibold">{university.course}</h3>
                        <p className="mb-0 text-body-secondary">
                            {university.college} · {university.name}
                        </p>
                        <div className="d-flex flex-wrap gap-2 mt-2">
                            <span className="badge text-bg-primary-subtle text-primary">{university.stream}</span>
                            <span className="badge text-bg-secondary-subtle text-secondary">{university.level}</span>
                            <span className="badge text-bg-info-subtle text-info">Intake: {university.intake}</span>
                            <span className="badge text-bg-light text-body-secondary">{university.location}</span>
                        </div>
                    </div>
                </div>
            </div>

            {!courseDetail ? (
                <div className="card">
                    <div className="card-body text-center py-10">
                        <h5 className="mb-2">No details added yet</h5>
                        <p className="text-body-secondary mb-4">
                            This course doesn't have a summary, modules, fees, or career info yet.
                        </p>
                        <Link href={`/courses/${university.id}/edit`} className="btn btn-primary">
                            Add course details
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="row">
                    <div className="col-lg-8">
                        {/* Course Summary */}
                        {courseDetail.summary && (
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h5 className="fw-semibold mb-3">Course Summary</h5>
                                    <p className="mb-0" style={{ whiteSpace: 'pre-line' }}>
                                        {courseDetail.summary}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Year-wise Modules */}
                        {modules.length > 0 && (
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h5 className="fw-semibold mb-3">Course Modules</h5>
                                    <div className="accordion" id="modulesAccordion">
                                        {modules.map((yearBlock, idx) => (
                                            <div className="accordion-item" key={yearBlock.year}>
                                                <h2 className="accordion-header">
                                                    <button
                                                        className={`accordion-button ${idx === 0 ? '' : 'collapsed'}`}
                                                        type="button"
                                                        data-bs-toggle="collapse"
                                                        data-bs-target={`#year-${yearBlock.year}`}
                                                    >
                                                        {yearBlock.title || `Year ${yearBlock.year}`}
                                                    </button>
                                                </h2>
                                                <div
                                                    id={`year-${yearBlock.year}`}
                                                    className={`accordion-collapse collapse ${idx === 0 ? 'show' : ''}`}
                                                    data-bs-parent="#modulesAccordion"
                                                >
                                                    <div className="accordion-body">
                                                        {yearBlock.modules && yearBlock.modules.length > 0 ? (
                                                            <ul className="mb-0 ps-3">
                                                                {yearBlock.modules.map((m, i) => (
                                                                    <li key={i}>{m}</li>
                                                                ))}
                                                            </ul>
                                                        ) : (
                                                            <span className="text-body-secondary">No modules listed for this year.</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Careers */}
                        {careers.length > 0 && (
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h5 className="fw-semibold mb-3">Careers After This Course</h5>
                                    <div className="d-flex flex-wrap gap-2">
                                        {careers.map((career, i) => (
                                            <span key={i} className="badge text-bg-success-subtle text-success px-3 py-2">
                                                {career}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="col-lg-4">
                        {/* Fees */}
                        {fees.length > 0 && (
                            <div className="card mb-4">
                                <div className="card-body">
                                    <h5 className="fw-semibold mb-3">Fee Summary</h5>
                                    <div className="table-responsive">
                                        <table className="table table-borderless mb-0">
                                            <thead>
                                                <tr className="text-body-secondary">
                                                    <th className="fw-medium">Year</th>
                                                    <th className="fw-medium">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fees.map((fee) => (
                                                    <tr key={fee.year} className="border-top">
                                                        <td className="py-2">Year {fee.year}</td>
                                                        <td className="py-2 fw-semibold">
                                                            {fee.amount ? `${fee.currency ?? ''} ${fee.amount}`.trim() : '—'}
                                                            {fee.note && (
                                                                <div className="fs-2 text-body-secondary fw-normal">{fee.note}</div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="card">
                            <div className="card-body">
                                <Link href={`/courses/${university.id}/edit`} className="btn btn-outline-primary w-100">
                                    Edit course details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppSidebarLayout>
    );
}
