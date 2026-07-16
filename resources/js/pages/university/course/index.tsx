import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';

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
    const [collegeLogos, setCollegeLogos] = useState<Record<string, string>>({});
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const isFirstRender = useRef(true);

    // Tracks which row's action menu is currently open (by uuid)
    const [openMenuUuid, setOpenMenuUuid] = useState<string | null>(null);
    // Tracks the row pending delete confirmation (by uuid)
    const [pendingDeleteUuid, setPendingDeleteUuid] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Self-contained toast notifications using MaterialM-style structures
    type Toast = { id: number; type: 'success' | 'error'; message: string };
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastIdRef = useRef(0);

    const dismissToast = (id: number) => {
        setToasts((current) => current.filter((t) => t.id !== id));
    };

    const showToast = (type: Toast['type'], message: string) => {
        const id = ++toastIdRef.current;
        setToasts((current) => [...current, { id, type, message }]);
        window.setTimeout(() => dismissToast(id), 4000);
    };

    // Fetch logos from the external API on mount
    useEffect(() => {
        const fetchLogos = async () => {
            try {
                const response = await fetch('https://admin.studyinnepal.com/api/university');
                const result = await response.json();
                
                let dataList = [];
                if (Array.isArray(result)) {
                    dataList = result;
                } else if (result.data && Array.isArray(result.data)) {
                    dataList = result.data;
                }

                // Map 'College' name to 'college_logo_url'
                const logosMap: Record<string, string> = {};
                dataList.forEach((item: any) => {
                    if (item.College && item.college_logo_url) {
                        logosMap[item.College.trim()] = item.college_logo_url;
                    }
                });
                
                setCollegeLogos(logosMap);
            } catch (error) {
                console.error('Failed to fetch college logos:', error);
            }
        };

        fetchLogos();
    }, []);

    // Debounced search effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const debounceTimer = setTimeout(() => {
            router.get(
                '/course-details',
                { search: search || undefined },
                { 
                    preserveState: true, 
                    preserveScroll: true, 
                    replace: true         
                }
            );
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [search]);

    // Close the open row menu when clicking anywhere outside of it
    useEffect(() => {
        if (!openMenuUuid) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuUuid(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuUuid]);

    const handleRowClick = (uuid: string) => {
        router.visit(`/course-details/${uuid}/edit`);
    };

    const handleImageError = (collegeName: string) => {
        setImageErrors(prev => ({ ...prev, [collegeName]: true }));
    };

    const handleMenuToggle = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        setOpenMenuUuid((current) => (current === uuid ? null : uuid));
    };

    const handleDeleteClick = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        setOpenMenuUuid(null);
        setPendingDeleteUuid(uuid);
    };

    const confirmDelete = () => {
        if (!pendingDeleteUuid) return;
        const targetRow = courseDetails.data.find((r) => r.uuid === pendingDeleteUuid);
        const label = targetRow ? `${targetRow.course_name} at ${targetRow.college_name}` : 'Course';

        setIsDeleting(true);
        router.delete(`/course-details/${pendingDeleteUuid}`, {
            preserveScroll: true,
            onSuccess: () => {
                showToast('success', `${label} was deleted successfully.`);
            },
            onError: () => {
                showToast('error', `Failed to delete ${label}. Please try again.`);
            },
            onFinish: () => {
                setIsDeleting(false);
                setPendingDeleteUuid(null);
            },
        });
    };

    const cancelDelete = () => {
        if (isDeleting) return;
        setPendingDeleteUuid(null);
    };

    const rowPendingDelete = courseDetails.data.find((r) => r.uuid === pendingDeleteUuid) ?? null;

    return (
        <>
            {/* ── Page header ── */}
            <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-6">
                <div className="d-flex align-items-center gap-3">
                    <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48">
                        <iconify-icon icon="solar:square-academic-cap-line-duotone" className="fs-6"></iconify-icon>
                    </span>
                    <div>
                        <h3 className="mb-0 fw-semibold">Course Details</h3>
                        <p className="text-body-secondary mb-0">Manage and view all registered courses, colleges, and university affiliations.</p>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    <Link href="/course/create" className="btn btn-primary d-inline-flex align-items-center gap-2">
                        <iconify-icon icon="solar:add-circle-line-duotone" className="fs-5"></iconify-icon>
                        <span>Add New Course</span>
                    </Link>
                </div>
            </div>

            {/* ── Filters card (Search Input) ── */}
            <div className="card mb-6">
                <div className="card-body d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-4">
                    <div className="position-relative flex-grow-1" style={{ maxWidth: 460 }}>
                        <iconify-icon
                            icon="solar:magnifer-line-duotone"
                            className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                            style={{ left: '0.9rem' }}
                        ></iconify-icon>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by university, college, or course..."
                            className="form-control ps-11"
                        />
                    </div>
                </div>
            </div>

            {/* ── Main Data Table Card ── */}
            <div className="card">
                <div className="card-body p-0">
                    {courseDetails.data.length === 0 ? (
                        <div className="text-center py-16 text-body-secondary fw-semibold">
                            <iconify-icon icon="solar:notes-line-duotone" className="fs-8 text-body-secondary mb-3 d-block"></iconify-icon>
                            No course details found. Try adjusting your search.
                        </div>
                    ) : (
                        <>
                            {/* Adjusted table-responsive wrapper with min-height to prevent clipping dropdown menus */}
                            <div className="table-responsive sidebar-nav-scroll" style={{ maxHeight: 520, minHeight: 200, overflowY: 'auto', width: '100%' }}>
                                <table className="table mb-0 align-middle" style={{ minWidth: 800 }}>
                                    <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                                        <tr>
                                            <th className="ps-6"><h6 className="fs-4 fw-semibold mb-0">College</h6></th>
                                            <th><h6 className="fs-4 fw-semibold mb-0">University</h6></th>
                                            <th className="pe-6"><h6 className="fs-4 fw-semibold mb-0">Course</h6></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {courseDetails.data.map((row) => {
                                            const cleanCollegeName = row.college_name.trim();
                                            const logoUrl = collegeLogos[cleanCollegeName];
                                            const hasValidLogo = logoUrl && !imageErrors[cleanCollegeName];
                                            const isMenuOpen = openMenuUuid === row.uuid;

                                            return (
                                                <tr
                                                    key={row.uuid}
                                                    role="button"
                                                    onClick={() => handleRowClick(row.uuid)}
                                                    className="position-relative"
                                                >
                                                    <td className="ps-6">
                                                        <div className="d-flex align-items-center justify-content-between">
                                                            <div className="d-flex align-items-center">
                                                                <div className="rounded bg-light border d-flex align-items-center justify-content-center overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                                                                    {hasValidLogo ? (
                                                                        <img
                                                                            src={logoUrl}
                                                                            alt={`${row.college_name} logo`}
                                                                            className="w-100 h-100 p-1"
                                                                            style={{ objectFit: 'contain' }}
                                                                            onError={() => handleImageError(cleanCollegeName)}
                                                                        />
                                                                    ) : (
                                                                        <span className="fw-bold text-muted text-uppercase">
                                                                            {row.college_name.charAt(0)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="ms-3 text-truncate" style={{ maxWidth: 220 }}>
                                                                    <h6 className="fs-4 fw-semibold mb-0 text-dark-hover text-truncate">{row.college_name}</h6>
                                                                </div>
                                                            </div>

                                                            {/* Dropdown triggers in clean action menu */}
                                                            <div className="position-relative" onClick={(e) => e.stopPropagation()} ref={isMenuOpen ? menuRef : undefined}>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => handleMenuToggle(e, row.uuid)}
                                                                    className="btn btn-link p-0 text-muted d-flex align-items-center justify-content-center"
                                                                    style={{ width: 32, height: 32 }}
                                                                >
                                                                    <iconify-icon icon="solar:menu-dots-bold-duotone" className="fs-5"></iconify-icon>
                                                                </button>

                                                                {isMenuOpen && (
                                                                    <div className="dropdown-menu show dropdown-menu-end position-absolute shadow-lg border m-0" style={{ right: 0, top: '100%', zIndex: 100, minWidth: 120 }}>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => handleDeleteClick(e, row.uuid)}
                                                                            className="dropdown-item text-danger d-flex align-items-center gap-2"
                                                                        >
                                                                            <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="fs-4"></iconify-icon>
                                                                            <span>Delete</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        <div className="d-flex align-items-center gap-2 fw-normal">
                                                            <iconify-icon icon="solar:map-point-line-duotone" className="text-body-secondary fs-5 flex-shrink-0"></iconify-icon>
                                                            <span className="text-truncate">{row.university_name}</span>
                                                        </div>
                                                    </td>

                                                    <td className="pe-6">
                                                        <span className="badge bg-primary-subtle text-primary fw-semibold fs-2">
                                                            {row.course_name}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* ── Table Pagination Section ── */}
                            {courseDetails.last_page > 1 && (
                                <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-md-between gap-3 border-top px-6 py-4">
                                    <div className="text-body-secondary fs-3">
                                        Showing page <strong className="text-dark">{courseDetails.current_page}</strong> of <strong className="text-dark">{courseDetails.last_page}</strong>
                                    </div>
                                    <nav aria-label="Course details navigation">
                                        <ul className="pagination pagination-sm mb-0 flex-wrap">
                                            {courseDetails.links.map((link, i) => (
                                                <li key={i} className={`page-item ${link.active ? 'active' : ''} ${!link.url ? 'disabled' : ''}`}>
                                                    <Link
                                                        href={link.url ?? '#'}
                                                        preserveState
                                                        className="page-link"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                </li>
                                            ))}
                                        </ul>
                                    </nav>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* ── Modal (Standard Bootstrap Confirmation overlay) ── */}
            {rowPendingDelete && (
                <div className="modal fade show d-block" tabIndex={-1} role="dialog" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
                        <div className="modal-content rounded border shadow">
                            <div className="modal-header border-bottom-0 pb-0 justify-content-between">
                                <h5 className="modal-title fw-semibold">Delete course?</h5>
                                <button type="button" className="btn-close shadow-none" onClick={cancelDelete} disabled={isDeleting}></button>
                            </div>
                            <div className="modal-body py-3">
                                <p className="mb-0 text-body-secondary fs-3">
                                    Permanently remove <strong className="text-dark">{rowPendingDelete.course_name}</strong> at <strong className="text-dark">{rowPendingDelete.college_name}</strong>?
                                </p>
                            </div>
                            <div className="modal-footer border-top-0 pt-0 gap-2 justify-content-end">
                                <button type="button" className="btn btn-outline-secondary" onClick={cancelDelete} disabled={isDeleting}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={isDeleting}>
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Toast notifications container ── */}
            <div className="toast-container position-fixed bottom-0 end-0 p-3" style={{ zIndex: 1060 }}>
                {toasts.map((toast) => (
                    <div key={toast.id} className="toast show align-items-center text-white border-0 bg-dark mb-2" role="alert" aria-live="assertive" aria-atomic="true">
                        <div className="d-flex">
                            <div className="toast-body d-flex align-items-center gap-2">
                                <iconify-icon icon={toast.type === 'success' ? 'solar:check-circle-line-duotone' : 'solar:danger-triangle-line-duotone'} className={`fs-5 ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}></iconify-icon>
                                <span>{toast.message}</span>
                            </div>
                            <button type="button" className="btn-close btn-close-white me-2 m-auto" onClick={() => dismissToast(toast.id)} aria-label="Close"></button>
                        </div>
                    </div>
                ))}
            </div>
        </>
    );
}