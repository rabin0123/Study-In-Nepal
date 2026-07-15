import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

type AgencyRow = {
    agency_name: string;
    total_users: number;
    active_users: number;
    latest_activity: string;
    is_active: boolean;
};

type PaginatedAgencies = {
    data: AgencyRow[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    agencies: PaginatedAgencies;
    search: string;
};

type ToastType = 'success' | 'error' | 'info';

type Toast = {
    id: number;
    message: string;
    type: ToastType;
};

type ConfirmConfig = {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
} | null;

export default function AgencyIndex({ agencies, search }: Props) {
    const [query, setQuery] = useState(search ?? '');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>(null);

    const { props } = usePage();

    function showToast(message: string, type: ToastType = 'success') {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            removeToast(id);
        }, 4000);
    }

    function removeToast(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    useEffect(() => {
        const flash = (props as any).flash;
        if (flash?.success) {
            showToast(flash.success, 'success');
        } else if (flash?.error) {
            showToast(flash.error, 'error');
        }
    }, [props]);

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.get('/agencies', { search: query }, { preserveState: true, replace: true });
    }

    function triggerToggleStatus(agency: AgencyRow) {
        const verb = agency.is_active ? 'deactivate' : 'activate';
        const actionLabel = agency.is_active ? 'deactivated' : 'activated';

        setConfirmConfig({
            title: `${verb.charAt(0).toUpperCase() + verb.slice(1)} Agency`,
            message: `Are you sure you want to ${verb} the entire agency "${agency.agency_name}"? This action will update the active status of all users registered under this agency.`,
            confirmText: 'Yes, Proceed',
            cancelText: 'Cancel',
            onConfirm: () => {
                router.patch(`/agencies/${encodeURIComponent(agency.agency_name)}/toggle-status`, {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Agency "${agency.agency_name}" has been successfully ${actionLabel}.`, 'success');
                    },
                    onError: () => {
                        showToast(`Failed to update status for "${agency.agency_name}".`, 'error');
                    }
                });
            }
        });
    }

    return (
        <>
            <Head title="Agencies" />

            <style>
                {`
                    /* Interactive Row Action CSS */
                    .agency-row .action-trigger {
                        opacity: 0;
                        transition: opacity 0.15s ease-in-out;
                    }
                    .agency-row:hover .action-trigger,
                    .agency-row .show .action-trigger {
                        opacity: 1;
                    }

                    /* Custom Slim Scrollbar styling - Firefox */
                    .slim-scroll {
                        scrollbar-width: thin;
                        scrollbar-color: rgba(0, 0, 0, 0.18) transparent;
                    }
                    /* Custom Slim Scrollbar styling - WebKit */
                    .slim-scroll::-webkit-scrollbar {
                        width: 5px;
                        height: 5px;
                    }
                    .slim-scroll::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .slim-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(0, 0, 0, 0.18);
                        border-radius: 10px;
                    }
                    .slim-scroll::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(0, 0, 0, 0.32);
                    }
                    [data-bs-theme="dark"] .slim-scroll::-webkit-scrollbar-thumb {
                        background-color: rgba(255, 255, 255, 0.18);
                    }
                    [data-bs-theme="dark"] .slim-scroll::-webkit-scrollbar-thumb:hover {
                        background-color: rgba(255, 255, 255, 0.3);
                    }

                    /* Agencies table sizing */
                    .agencies-table-scroll {
                        height: 520px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        width: 100%;
                    }
                    .agencies-table {
                        min-width: 100%;
                    }
                    .agencies-table thead th {
                        padding-top: 0.85rem;
                        padding-bottom: 0.85rem;
                        white-space: nowrap;
                    }
                    .agencies-table tbody td {
                        padding-top: 0.65rem;
                        padding-bottom: 0.65rem;
                    }

                    @media (max-width: 991.98px) {
                        .agencies-table-scroll {
                            overflow-x: auto;
                        }
                        .agencies-table {
                            min-width: 900px;
                        }
                    }
                    @media (max-width: 575.98px) {
                        .agencies-table {
                            min-width: 760px;
                        }
                    }
                `}
            </style>

            {/* Custom Bootstrapped Toast Container */}
            <div className="position-fixed bottom-0 end-0 p-3" style={{ zIndex: 10090, maxWidth: '380px', width: '100%' }}>
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="toast show align-items-center mb-2 shadow border-0"
                        role="alert"
                        style={{ background: 'var(--bs-card-bg, #fff)' }}
                    >
                        <div className="d-flex p-3">
                            <div className="toast-body p-0 d-flex align-items-center gap-2 grow text-dark">
                                {toast.type === 'success' && (
                                    <iconify-icon icon="solar:check-circle-line-duotone" className="text-success fs-5 shrink-0" />
                                )}
                                {toast.type === 'error' && (
                                    <iconify-icon icon="solar:danger-line-duotone" className="text-danger fs-5 shrink-0" />
                                )}
                                {toast.type === 'info' && (
                                    <iconify-icon icon="solar:info-circle-line-duotone" className="text-info fs-5 shrink-0" />
                                )}
                                <span className="fs-3 fw-semibold text-wrap">{toast.message}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => removeToast(toast.id)}
                                className="btn-close ms-2 m-auto shadow-none"
                                aria-label="Close"
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Confirmation Modal */}
            {confirmConfig && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header border-0 pb-0">
                                <h5 className="modal-title fw-bold text-uppercase tracking-wider">{confirmConfig.title}</h5>
                                <button type="button" className="btn-close shadow-none" onClick={() => setConfirmConfig(null)} aria-label="Close"></button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="text-body-secondary fs-3 mb-0 leading-relaxed">{confirmConfig.message}</p>
                            </div>
                            <div className="modal-footer border-0 pt-0">
                                <button
                                    type="button"
                                    className="btn btn-light"
                                    onClick={() => setConfirmConfig(null)}
                                >
                                    {confirmConfig.cancelText || 'Cancel'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        confirmConfig.onConfirm();
                                        setConfirmConfig(null);
                                    }}
                                    className="btn btn-primary"
                                >
                                    {confirmConfig.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="container-fluid py-4">

                {/* Page Header */}
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48" style={{ width: 48, height: 48 }}>
                            <iconify-icon icon="solar:buildings-line-duotone" className="fs-6"></iconify-icon>
                        </span>
                        <div>
                            <span className="d-block fs-2 fw-semibold text-uppercase tracking-wider text-primary mb-1">
                                Directory
                            </span>
                            <h3 className="mb-0 fw-semibold text-uppercase">
                                Partner Agencies
                            </h3>
                        </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 flex-wrap">
                        <form onSubmit={handleSearchSubmit} className="position-relative grow" style={{ minWidth: 260 }}>
                            <iconify-icon
                                icon="solar:magnifer-line-duotone"
                                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                                style={{ left: '0.9rem' }}
                            ></iconify-icon>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search agency..."
                                className="form-control ps-11"
                            />
                        </form>
                    </div>
                </div>

                {/* Table Container Card */}
                <div className="card">
                    <div className="card-body p-0">
                        <div className="table-responsive slim-scroll agencies-table-scroll">
                            <table className="table agencies-table mb-0 align-middle" style={{ tableLayout: 'auto', width: '100%' }}>
                                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                                    <tr>
                                        <th style={{ paddingLeft: '2rem' }}>Agency Name</th>
                                        <th>Registered Users</th>
                                        <th className="pe-6">Agency Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {agencies.data.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="text-center py-16 text-body-secondary fw-semibold">
                                                No partner agencies found.
                                            </td>
                                        </tr>
                                    )}
                                    {agencies.data.map((agency) => {
                                        const total = agency.total_users;
                                        const active = agency.active_users;

                                        let statusLabel = 'Inactive';
                                        let statusBadgeStyle = 'bg-danger-subtle text-danger';

                                        if (active === total && total > 0) {
                                            statusLabel = 'Active';
                                            statusBadgeStyle = 'bg-success-subtle text-success';
                                        } else if (active > 0) {
                                            statusLabel = `Partially Active (${active}/${total})`;
                                            statusBadgeStyle = 'bg-warning-subtle text-warning';
                                        }

                                        return (
                                            <tr 
                                                key={agency.agency_name}
                                                className="agency-row"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => router.get('/agency-users', { agency: agency.agency_name })}
                                            >
                                                {/* Column 1: Logo Icon, Name, Row Actions */}
                                                <td style={{ paddingLeft: '2rem' }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="shrink-0 d-flex align-items-center justify-content-center bg-light rounded-3" style={{ width: 40, height: 40 }}>
                                                            <iconify-icon icon="solar:buildings-line-duotone" className="text-primary fs-5" />
                                                        </span>
                                                        <div className="ms-3 text-truncate grow">
                                                            <h6 className="fs-4 fw-semibold mb-0 text-truncate">
                                                                {agency.agency_name || '—'}
                                                            </h6>
                                                        </div>

                                                        {/* Dropdown Menu */}
                                                        <div className="dropdown shrink-0 ms-auto ps-2" onClick={(e) => e.stopPropagation()}>
                                                            <a
                                                                href="javascript:void(0)"
                                                                className="text-muted action-trigger d-flex align-items-center justify-content-center rounded-2"
                                                                id={`agency-actions-${agency.agency_name}`}
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                                style={{ width: 24, height: 24 }}
                                                            >
                                                                <iconify-icon icon="solar:menu-dots-bold" className="fs-6" style={{ transform: 'rotate(90deg)' }} />
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`agency-actions-${agency.agency_name}`}>
                                                                <li>
                                                                    <button
                                                                        onClick={() => triggerToggleStatus(agency)}
                                                                        className="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2 text-uppercase fw-bold fs-2 text-body-secondary"
                                                                    >
                                                                        <span>{agency.is_active ? 'Deactivate' : 'Activate'}</span>
                                                                        {agency.is_active ? (
                                                                            <iconify-icon icon="solar:forbidden-line-duotone" className="text-danger fs-4" />
                                                                        ) : (
                                                                            <iconify-icon icon="solar:power-line-duotone" className="text-success fs-4" />
                                                                        )}
                                                                    </button>
                                                                </li>
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Column 2: Registered Users */}
                                                <td>
                                                    <div className="d-flex align-items-center gap-1.5 text-body-secondary fw-medium">
                                                        <iconify-icon icon="solar:users-group-two-rounded-line-duotone" className="fs-4 text-muted" />
                                                        <span>{total} {total === 1 ? 'User' : 'Users'}</span>
                                                    </div>
                                                </td>

                                                {/* Column 3: Status Badge */}
                                                <td className="pe-6">
                                                    <span className={`badge ${statusBadgeStyle} fw-semibold fs-2 gap-1 d-inline-flex align-items-center`}>
                                                        <iconify-icon icon={active === total && total > 0 ? "solar:check-circle-line-duotone" : "solar:clock-circle-line-duotone"} className="fs-3"></iconify-icon>
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer */}
                        {agencies.total > 0 && (
                            <div className="d-flex flex-column flex-sm-row align-items-center justify-content-between border-top px-6 py-3 gap-3">
                                <div className="text-body-secondary fs-3">
                                    Showing <strong className="text-dark">{agencies.from}</strong>–<strong className="text-dark">{agencies.to}</strong> of <strong className="text-dark">{agencies.total}</strong> agencies
                                </div>
                                <div className="d-flex align-items-center gap-1 flex-wrap">
                                    {agencies.links.map((link, i) => {
                                        const isPrevious = link.label.includes('Previous');
                                        const isNext = link.label.includes('Next');
                                        return (
                                            <button
                                                key={i}
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                                className={`btn btn-sm d-flex align-items-center justify-content-center font-bold px-3 ${
                                                    link.active ? 'btn-primary' : 'btn-outline-secondary'
                                                }`}
                                                style={{
                                                    minWidth: 38,
                                                    height: 38,
                                                    borderRadius: '0.375rem',
                                                    opacity: link.url ? 1 : 0.5,
                                                    pointerEvents: link.url ? 'auto' : 'none',
                                                }}
                                            >
                                                {isPrevious ? (
                                                    <iconify-icon icon="solar:alt-arrow-left-line-duotone" className="fs-4" />
                                                ) : isNext ? (
                                                    <iconify-icon icon="solar:alt-arrow-right-line-duotone" className="fs-4" />
                                                ) : (
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AgencyIndex.layout = { title: 'Agencies', description: 'Agencies Directory' };