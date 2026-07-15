import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';

type UserRow = {
    id: number;
    name: string;
    email: string;
    contact_number: string;
    agency_name: string;
    role: string;
    is_active: boolean;
    last_login: string | null;
    avatar_url?: string | null;
};

type PaginatedUsers = {
    data: UserRow[];
    links: { url: string | null; label: string; active: boolean }[];
    from: number | null;
    to: number | null;
    total: number;
};

type Props = {
    users: PaginatedUsers;
    agenciesList?: string[];
    isAdmin?: boolean;
    filters: {
        search?: string;
        agency?: string;
        status?: string;
    };
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

export default function AgencyUserIndex({ users, agenciesList = [], isAdmin = false, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [selectedAgency, setSelectedAgency] = useState(filters.agency ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status ?? '');

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

    function applyFilters(updatedFilters: { search?: string; agency?: string; status?: string }) {
        const queryParams = {
            search: updatedFilters.search ?? searchQuery,
            agency: updatedFilters.agency ?? selectedAgency,
            status: updatedFilters.status ?? selectedStatus,
        };
        router.get('/users', queryParams, { preserveState: true, replace: true });
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        applyFilters({ search: searchQuery });
    }

    function triggerToggleStatus(user: UserRow) {
        const verb = user.is_active ? 'deactivate' : 'activate';
        const actionLabel = user.is_active ? 'deactivated' : 'activated';

        setConfirmConfig({
            title: `${verb.charAt(0).toUpperCase() + verb.slice(1)} User`,
            message: `Are you sure you want to ${verb} the user profile of "${user.name}"? Deactivated users will immediately lose access to the platform.`,
            confirmText: 'Yes, Proceed',
            cancelText: 'Cancel',
            onConfirm: () => {
                router.patch(`/users/${user.id}/toggle-status`, {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`User "${user.name}" has been successfully ${actionLabel}.`, 'success');
                    },
                    onError: () => {
                        showToast(`Failed to update status for "${user.name}".`, 'error');
                    }
                });
            }
        });
    }

    return (
        <>
            <Head title="Partner Users" />

            <style>
                {`
                    /* Interactive Row Action CSS */
                    .user-row .action-trigger {
                        opacity: 0;
                        transition: opacity 0.15s ease-in-out;
                    }
                    .user-row:hover .action-trigger,
                    .user-row .show .action-trigger {
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

                    /* Users table sizing and scroll wrap */
                    .users-table-scroll {
                        height: 520px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        width: 100%;
                    }
                    .users-table {
                        min-width: 100%;
                    }
                    .users-table thead th {
                        padding-top: 0.85rem;
                        padding-bottom: 0.85rem;
                        white-space: nowrap;
                    }
                    .users-table tbody td {
                        padding-top: 0.65rem;
                        padding-bottom: 0.65rem;
                    }

                    @media (max-width: 991.98px) {
                        .users-table-scroll {
                            overflow-x: auto;
                        }
                        .users-table {
                            min-width: 900px;
                        }
                    }
                    @media (max-width: 575.98px) {
                        .users-table {
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
                            <iconify-icon icon="solar:users-group-two-rounded-line-duotone" className="fs-6"></iconify-icon>
                        </span>
                        <div>
                            <span className="d-block fs-2 fw-semibold text-uppercase tracking-wider text-primary mb-1">
                                Partner Directory
                            </span>
                            <h3 className="mb-0 fw-semibold text-uppercase">
                                Registered Users
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                        <form onSubmit={handleSearchSubmit} className="position-relative">
                            <iconify-icon
                                icon="solar:magnifer-line-duotone"
                                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                                style={{ left: '0.9rem' }}
                            ></iconify-icon>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search users..."
                                className="form-control ps-11"
                            />
                        </form>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="position-relative">
                            <iconify-icon
                                icon="solar:buildings-line-duotone"
                                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                                style={{ left: '0.9rem' }}
                            ></iconify-icon>
                            <select
                                value={selectedAgency}
                                onChange={(e) => {
                                    setSelectedAgency(e.target.value);
                                    applyFilters({ agency: e.target.value });
                                }}
                                className="form-select ps-11"
                            >
                                <option value="">All Agencies</option>
                                {agenciesList.map((name) => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="col-12 col-md-4">
                        <div className="position-relative">
                            <iconify-icon
                                icon="solar:filter-line-duotone"
                                className="position-absolute top-50 translate-middle-y text-body-secondary fs-5"
                                style={{ left: '0.9rem' }}
                            ></iconify-icon>
                            <select
                                value={selectedStatus}
                                onChange={(e) => {
                                    setSelectedStatus(e.target.value);
                                    applyFilters({ status: e.target.value });
                                }}
                                className="form-select ps-11"
                            >
                                <option value="">All Statuses</option>
                                <option value="active">Active Profiles</option>
                                <option value="inactive">Inactive Profiles</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Container Card */}
                <div className="card">
                    <div className="card-body p-0">
                        {/* Scroll container with slim scrollbar styling */}
                        <div className="table-responsive slim-scroll users-table-scroll">
                            <table className="table users-table mb-0 align-middle" style={{ tableLayout: 'auto', width: '100%' }}>
                                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                                    <tr>
                                        <th style={{ paddingLeft: '2rem' }}>User Information</th>
                                        <th>Email Address</th>
                                        <th>Partner Agency</th>
                                        <th className="pe-6">Account Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-16 text-body-secondary fw-semibold">
                                                No partner users matching those filters were found.
                                            </td>
                                        </tr>
                                    )}
                                    {users.data.map((user) => {
                                        return (
                                            <tr 
                                                key={user.id}
                                                className="user-row"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => router.get(`/users/${user.id}`)}
                                                title={`View Profile of ${user.name || 'Unnamed User'}`}
                                            >
                                                {/* Column 1: Profile image/badge, Name details, Row Action dropdown */}
                                                <td style={{ paddingLeft: '2rem' }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="shrink-0">
                                                            {user.avatar_url ? (
                                                                <img 
                                                                    src={user.avatar_url} 
                                                                    alt={user.name || 'User'} 
                                                                    width={40}
                                                                    height={40}
                                                                    style={{
                                                                        width: 40,
                                                                        height: 40,
                                                                        borderRadius: '50%',
                                                                        objectFit: 'cover'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <div 
                                                                    className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary font-bold text-uppercase"
                                                                    style={{ width: 40, height: 40, borderRadius: '50%', fontSize: '1rem' }}
                                                                >
                                                                    {user.name ? user.name.trim().charAt(0) : '?'}
                                                                </div>
                                                            )}
                                                        </span>
                                                        <div className="ms-3 text-truncate grow">
                                                            <h6 className="fs-4 fw-semibold mb-0 text-truncate">
                                                                {user.name || 'Unnamed User'}
                                                            </h6>
                                                            <span className="fw-normal text-body-secondary text-truncate d-block mt-1">
                                                                {user.contact_number || '—'}
                                                            </span>
                                                        </div>

                                                        {/* Actions Dropdown inside table cell */}
                                                        <div className="dropdown shrink-0 ms-auto ps-2" onClick={(e) => e.stopPropagation()}>
                                                            <a
                                                                href="javascript:void(0)"
                                                                className="text-muted action-trigger d-flex align-items-center justify-content-center rounded-2"
                                                                id={`user-actions-${user.id}`}
                                                                data-bs-toggle="dropdown"
                                                                aria-expanded="false"
                                                                style={{ width: 24, height: 24 }}
                                                            >
                                                                <iconify-icon icon="solar:menu-dots-bold" className="fs-6" style={{ transform: 'rotate(90deg)' }} />
                                                            </a>
                                                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`user-actions-${user.id}`}>
                                                                <li>
                                                                    <button
                                                                        onClick={() => triggerToggleStatus(user)}
                                                                        className="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2 text-uppercase fw-bold fs-2 text-body-secondary"
                                                                    >
                                                                        <span>{user.is_active ? 'Deactivate' : 'Activate'}</span>
                                                                        {user.is_active ? (
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

                                                {/* Column 2: Email Address */}
                                                <td className="text-body-secondary select-all text-truncate">
                                                    {user.email}
                                                </td>

                                                {/* Column 3: Partner Agency */}
                                                <td 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        applyFilters({ agency: user.agency_name });
                                                    }}
                                                    title={`Filter by ${user.agency_name}`}
                                                >
                                                    <div className="d-flex align-items-center gap-2 text-body-secondary fw-semibold text-truncate hover-primary" style={{ cursor: 'pointer' }}>
                                                        <iconify-icon icon="solar:buildings-line-duotone" className="text-muted fs-4" />
                                                        <span>{user.agency_name}</span>
                                                    </div>
                                                </td>

                                                {/* Column 4: Account Status */}
                                                <td className="pe-6">
                                                    <span className={`badge ${
                                                        user.is_active ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'
                                                    } fw-semibold fs-2 gap-1 d-inline-flex align-items-center`}>
                                                        <iconify-icon icon={user.is_active ? "solar:check-circle-line-duotone" : "solar:close-circle-line-duotone"} className="fs-3"></iconify-icon>
                                                        {user.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Record count footer */}
                        {users.data.length > 0 && (
                            <div className="d-flex align-items-center justify-content-between border-top px-6 py-3">
                                <div className="text-body-secondary fs-3">
                                    Showing <strong className="text-dark">{users.total}</strong> record{users.total === 1 ? '' : 's'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

AgencyUserIndex.layout = { title: 'Partner Directory', description: 'Partner Registered Users' };