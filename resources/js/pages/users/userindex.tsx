import { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';

type UserRow = {
    id: number;
    role: string;
    name: string;
    country: string;
    contact_number: string;
    email: string;
    email_verified_at: string | null;
    created_at: string;
    is_active: boolean;
    is_protected: boolean;
    avatar_url?: string;
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
    search: string;
    selectedPartnerId?: number | null;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    currentUserRole?: string;
    availableRoles?: string[];
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

type AddUserForm = {
    name: string;
    email: string;
};

const ROLE_LABELS: Record<string, string> = {
    developer: 'Developer',
    'main-agent': 'Main Agent',
    main_agent: 'Main Agent',
    'main-agent-staff': 'Main Agent Staff',
    main_agent_staff: 'Main Agent Staff',
    'b2b-partner': 'B2B Partner',
    b2b_partner: 'B2B Partner',
    'b2b-partner-staff': 'B2B Partner Staff',
    b2b_partner_staff: 'B2B Partner Staff',
};

function roleLabel(role: string): string {
    return ROLE_LABELS[role] ?? role;
}

const EMPTY_ADD_USER_FORM: AddUserForm = { name: '', email: '' };

export default function UsersIndex({ 
    users, 
    search, 
    selectedPartnerId, 
    isAdmin, 
    isSuperAdmin, 
    currentUserRole, 
    availableRoles = [] 
}: Props) {
    const [query, setQuery] = useState(search ?? '');
    const [updatingRoleId, setUpdatingRoleId] = useState<number | null>(null);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmConfig, setConfirmConfig] = useState<ConfirmConfig>(null);

    // Add User modal state
    const [showAddUser, setShowAddUser] = useState(false);
    const [addUserForm, setAddUserForm] = useState<AddUserForm>(EMPTY_ADD_USER_FORM);
    const [addUserPhone, setAddUserPhone] = useState<string | undefined>(undefined);
    const [addUserErrors, setAddUserErrors] = useState<Record<string, string>>({});
    const [addingUser, setAddingUser] = useState(false);

    const { props } = usePage();
    const { auth } = props as any; // Retrieve user auth & permissions

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

    function triggerConfirm(title: string, message: string, onConfirm: () => void, confirmText = "Confirm", cancelText = "Cancel") {
        setConfirmConfig({ title, message, onConfirm, confirmText, cancelText });
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        const data: Record<string, string> = { search: query };
        if (selectedPartnerId) {
            data.partner_id = String(selectedPartnerId);
        }
        router.get('/users', data, { preserveState: true, replace: true });
    }

    function handleRoleChange(user: UserRow, newRole: string) {
        if (user.is_protected && !isSuperAdmin) return;
        
        triggerConfirm(
            'Change User Role',
            `Are you sure you want to change this user's role to ${roleLabel(newRole)}?`,
            () => {
                setUpdatingRoleId(user.id);
                router.patch(`/users/${user.id}/update-role`, { role: newRole }, {
                    preserveScroll: true,
                    onFinish: () => setUpdatingRoleId(null),
                    onSuccess: () => {
                        showToast(`Updated ${user.name}'s role to ${roleLabel(newRole)}`, 'success');
                    },
                    onError: (errors) => {
                        const message = Object.values(errors).join(', ') || 'Failed to update user role';
                        showToast(message, 'error');
                    }
                });
            }
        );
    }

    function toggleUserStatus(user: UserRow) {
        if (user.is_protected) return;
        const verb = user.is_active ? 'deactivate' : 'activate';
        const actionLabel = user.is_active ? 'deactivated' : 'activated';
        
        triggerConfirm(
            `${verb.charAt(0).toUpperCase() + verb.slice(1)} User`,
            `Are you sure you want to ${verb} ${user.name}?`,
            () => {
                router.patch(`/users/${user.id}/toggle-status`, {}, { 
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Successfully ${actionLabel} ${user.name}`, 'success');
                    },
                    onError: () => {
                        showToast(`Failed to ${verb} user`, 'error');
                    }
                });
            }
        );
    }

    function deleteUser(user: UserRow) {
        if (user.is_protected) return;

        triggerConfirm(
            'Delete User',
            `Are you sure you want to delete ${user.name}? This action cannot be undone.`,
            () => {
                router.delete(`/users/${user.id}`, { 
                    preserveScroll: true,
                    onSuccess: () => {
                        showToast(`Successfully deleted ${user.name}`, 'success');
                    },
                    onError: () => {
                        showToast('Failed to delete user', 'error');
                    }
                });
            },
            "Delete"
        );
    }

    function openAddUserModal() {
        setAddUserForm(EMPTY_ADD_USER_FORM);
        setAddUserPhone(undefined);
        setAddUserErrors({});
        setShowAddUser(true);
    }

    function closeAddUserModal() {
        if (addingUser) return;
        setShowAddUser(false);
        setAddUserForm(EMPTY_ADD_USER_FORM);
        setAddUserPhone(undefined);
        setAddUserErrors({});
    }

    function handleAddUser(e: React.FormEvent) {
        e.preventDefault();
        setAddingUser(true);
        setAddUserErrors({});

        router.post('/users', { ...addUserForm, contact_number: addUserPhone ?? '' }, {
            preserveScroll: true,
            onSuccess: () => {
                setShowAddUser(false);
                setAddUserForm(EMPTY_ADD_USER_FORM);
                setAddUserPhone(undefined);
                showToast('Invitation sent successfully', 'success');
            },
            onError: (errors) => {
                setAddUserErrors(errors as Record<string, string>);
                showToast(Object.values(errors)[0] as string || 'Failed to add user', 'error');
            },
            onFinish: () => setAddingUser(false),
        });
    }

    return (
        <>
            <Head title="Users" />

            <style>
                {`
                    .add-user-phone {
                        display: flex;
                        align-items: center;
                        width: 100%;
                        background: transparent !important;
                        border: 1px solid var(--bs-border-color);
                        border-radius: 0.375rem;
                        padding: 0.375rem 0.75rem;
                    }
                    .add-user-phone .PhoneInputCountry {
                        margin-right: 0.5rem;
                    }
                    .add-user-phone .PhoneInputInput {
                        flex: 1;
                        border: none !important;
                        outline: none !important;
                        background: transparent !important;
                        font-family: inherit !important;
                        font-size: 0.875rem !important;
                        color: var(--bs-body-color) !important;
                        padding: 0.375rem 0 !important;
                    }

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

                    /* Users table sizing */
                    .users-table-scroll {
                        height: 520px;
                        overflow-y: auto;
                        overflow-x: hidden;
                        width: 100%;
                    }
                    .users-table thead th {
                        padding-top: 0.85rem;
                        padding-bottom: 0.85rem;
                    }
                    .users-table tbody td {
                        padding-top: 0.65rem;
                        padding-bottom: 0.65rem;
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
                                    className={`btn ${
                                        confirmConfig.title.toLowerCase().includes('delete') 
                                            ? 'btn-danger' 
                                            : 'btn-primary'
                                    }`}
                                >
                                    {confirmConfig.confirmText || 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add User Modal */}
            {showAddUser && (
                <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 10050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header">
                                <div className="d-flex align-items-center gap-2">
                                    <span className="bg-primary-subtle text-primary rounded-3 d-flex align-items-center justify-content-center p-2">
                                        <iconify-icon icon="solar:user-plus-line-duotone" className="fs-5" />
                                    </span>
                                    <h5 className="modal-title fw-bold text-uppercase mb-0">Add User</h5>
                                </div>
                                <button type="button" className="btn-close shadow-none" disabled={addingUser} onClick={closeAddUserModal} aria-label="Close"></button>
                            </div>
                            <div className="modal-body py-4">
                                <p className="text-body-secondary fs-3 mb-4">
                                    They'll be added to your agency as B2B Partner Staff and emailed a link to set their password.
                                </p>

                                <form onSubmit={handleAddUser} className="d-flex flex-column gap-3">
                                    <div className="mb-3">
                                        <label htmlFor="add-user-name" className="form-label text-uppercase fw-bold fs-2 text-body-secondary">Name</label>
                                        <input
                                            id="add-user-name"
                                            type="text"
                                            value={addUserForm.name}
                                            onChange={(e) => setAddUserForm((f) => ({ ...f, name: e.target.value }))}
                                            placeholder="Full name"
                                            className="form-control"
                                            disabled={addingUser}
                                            autoFocus
                                        />
                                        {addUserErrors.name && <p className="text-danger fs-2 fw-semibold mt-1 mb-0">{addUserErrors.name}</p>}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="add-user-email" className="form-label text-uppercase fw-bold fs-2 text-body-secondary">Email</label>
                                        <input
                                            id="add-user-email"
                                            type="email"
                                            value={addUserForm.email}
                                            onChange={(e) => setAddUserForm((f) => ({ ...f, email: e.target.value }))}
                                            placeholder="name@example.com"
                                            className="form-control"
                                            disabled={addingUser}
                                        />
                                        {addUserErrors.email && <p className="text-danger fs-2 fw-semibold mt-1 mb-0">{addUserErrors.email}</p>}
                                    </div>

                                    <div className="mb-3">
                                        <label htmlFor="add-user-phone" className="form-label text-uppercase fw-bold fs-2 text-body-secondary">Phone Number</label>
                                        <div className="add-user-phone">
                                            <PhoneInput
                                                international
                                                defaultCountry="NP"
                                                placeholder="Phone Number"
                                                value={addUserPhone}
                                                onChange={setAddUserPhone}
                                                disabled={addingUser}
                                                numberInputProps={{ id: 'add-user-phone', autoComplete: 'tel' }}
                                            />
                                        </div>
                                        {addUserErrors.contact_number && <p className="text-danger fs-2 fw-semibold mt-1 mb-0">{addUserErrors.contact_number}</p>}
                                    </div>

                                    <div className="d-flex align-items-center justify-content-end gap-2 mt-2">
                                        <button
                                            type="button"
                                            onClick={closeAddUserModal}
                                            disabled={addingUser}
                                            className="btn btn-light"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={addingUser}
                                            className="btn btn-primary"
                                        >
                                            {addingUser ? 'Sending Invite...' : 'Send Invite'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="container-fluid py-4">

                {/* Page header */}
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 mb-4">
                    <div className="d-flex align-items-center gap-3">
                        {isAdmin && selectedPartnerId && (
                            <button
                                onClick={() => router.get('/users', {}, { preserveState: true })}
                                className="btn btn-outline-secondary d-inline-flex align-items-center justify-content-center p-2"
                                title="Clear partner filter"
                            >
                                <iconify-icon icon="solar:arrow-left-line-duotone" className="fs-5"></iconify-icon>
                            </button>
                        )}
                        <span className="d-none d-sm-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded-3 round-48">
                            <iconify-icon icon="solar:users-group-two-rounded-line-duotone" className="fs-6"></iconify-icon>
                        </span>
                        <div>
                            <span className="d-block fs-2 fw-semibold text-uppercase tracking-wider text-primary mb-1">
                                {isAdmin ? 'User Portal' : 'My Team'}
                            </span>
                            <h3 className="mb-0 fw-semibold text-uppercase">
                                {selectedPartnerId && isAdmin ? 'Partner Members' : (isAdmin ? 'All Users' : 'Manage Users')}
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
                                placeholder="Search user, name, email..."
                                className="form-control ps-11"
                            />
                        </form>

                        {/* Permission Check wrapper for the Add User button */}
                        {auth?.permissions?.includes('create.user') && (
                            <button
                                onClick={openAddUserModal}
                                className="btn btn-primary d-inline-flex align-items-center gap-2"
                            >
                                <iconify-icon icon="solar:user-plus-line-duotone" className="fs-5"></iconify-icon>
                                <span>Add User</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Container Card */}
                <div className="card">
                    <div className="card-body p-0">
                        {/* Fixed-height scroll container with slim scrollbar styling */}
                        <div className="table-responsive slim-scroll users-table-scroll">
                            <table className="table users-table mb-0 align-middle" style={{ tableLayout: 'fixed', width: '100%' }}>
                                <colgroup>
                                    <col style={{ width: '24%' }} />
                                    <col style={{ width: '26%' }} />
                                    <col style={{ width: '16%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '16%' }} />
                                </colgroup>
                                <thead className="text-dark fs-4" style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--bs-card-bg, #fff)' }}>
                                    <tr>
                                        <th className="ps-6">User Details</th>
                                        <th>Email</th>
                                        <th>Country</th>
                                        <th>Role</th>
                                        <th className="pe-6">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center py-16 text-body-secondary fw-semibold">
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                    {users.data.map((user) => {
                                        const verified = !!user.email_verified_at;
                                        const active = user.is_active;

                                        // Checks if the user's role is Developer or Main Agent (immutable roles)
                                        const isImmutableRole = 
                                            user.role === 'developer' || 
                                            user.role === 'main-agent' || 
                                            user.role === 'main_agent';

                                        // If the user currently has an immutable role, prevent modification
                                        const canChangeRole = 
                                            (isAdmin || currentUserRole === 'developer') && 
                                            (!user.is_protected || isSuperAdmin) &&
                                            !isImmutableRole;

                                        return (
                                            <tr 
                                                key={user.id} 
                                                className="user-row"
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => router.get(`/users/${user.id}`)}
                                            >
                                                {/* Column 1: Avatar, Name, Contact details, row actions at end */}
                                                <td className="ps-6">
                                                    <div className="d-flex align-items-center">
                                                        <span className="shrink-0 ps-1">
                                                            <img
    src={user.avatar_url}
    alt={user.name}
    width={40}
    height={40}
    style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        objectFit: 'cover'
    }}
/>
                                                        </span>
                                                        <div className="ms-3 text-truncate grow">
                                                            <h6 className="fs-4 fw-semibold mb-0 text-truncate d-flex align-items-center gap-1.5">
                                                                {user.name}
                                                                {user.is_protected && (
                                                                    <span title="Protected system account">
                                                                        <iconify-icon icon="solar:lock-password-line-duotone" className="text-warning fs-3 shrink-0"></iconify-icon>
                                                                    </span>
                                                                )}
                                                            </h6>
                                                            <span className="fw-normal text-body-secondary text-truncate d-block mt-1">
                                                                {user.contact_number || '—'}
                                                            </span>
                                                        </div>

                                                        {/* Row actions: fixed at end of User Details column, hover-revealed */}
                                                        {auth?.permissions?.includes('delete.user') && !user.is_protected && (
                                                            <div
                                                                className="dropdown shrink-0 ms-auto ps-2"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
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
                                                                        <Link
                                                                            href={`/users/${user.id}`}
                                                                            className="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2 text-uppercase fw-bold fs-2 text-body-secondary"
                                                                        >
                                                                            <span>View</span>
                                                                            <iconify-icon icon="solar:arrow-right-line-duotone" className="fs-4" />
                                                                        </Link>
                                                                    </li>
                                                                    <li>
                                                                        <button
                                                                            onClick={() => toggleUserStatus(user)}
                                                                            className="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2 text-uppercase fw-bold fs-2 text-body-secondary"
                                                                        >
                                                                            <span>{active ? 'Deactivate' : 'Activate'}</span>
                                                                            {active ? (
                                                                                <iconify-icon icon="solar:forbidden-line-duotone" className="text-warning fs-4" />
                                                                            ) : (
                                                                                <iconify-icon icon="solar:power-line-duotone" className="text-success fs-4" />
                                                                            )}
                                                                        </button>
                                                                    </li>
                                                                    <li><hr className="dropdown-divider" /></li>
                                                                    <li>
                                                                        <button
                                                                            onClick={() => deleteUser(user)}
                                                                            className="dropdown-item d-flex align-items-center justify-content-between gap-3 py-2 text-uppercase fw-bold fs-2 text-danger"
                                                                        >
                                                                            <span>Delete</span>
                                                                            <iconify-icon icon="solar:trash-bin-trash-line-duotone" className="fs-4" />
                                                                        </button>
                                                                    </li>
                                                                </ul>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Column 2: Email */}
                                                <td className="text-body-secondary select-all text-truncate">
                                                    {user.email}
                                                </td>

                                                {/* Column 3: Country */}
                                                <td className="text-body-secondary text-truncate">
                                                    {user.country || '—'}
                                                </td>

                                                {/* Column 4: Role Selection Dropdown */}
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    {canChangeRole ? (
                                                        <div className="d-inline-flex align-items-center position-relative">
                                                            <select
                                                                value={user.role || ''}
                                                                disabled={updatingRoleId === user.id}
                                                                onChange={(e) => handleRoleChange(user, e.target.value)}
                                                                onClick={(e) => e.stopPropagation()}
                                                                className="form-select form-select-sm border-0 bg-transparent text-uppercase fw-bold fs-2 text-body-secondary p-0 pe-4 shadow-none"
                                                                style={{ cursor: 'pointer', width: 'auto' }}
                                                            >
                                                                {availableRoles.map((roleName) => {
                                                                    if (
                                                                        roleName === 'developer' || 
                                                                        roleName === 'main-agent' || 
                                                                        roleName === 'main_agent'
                                                                    ) {
                                                                        return null;
                                                                    }
                                                                    return (
                                                                        <option key={roleName} value={roleName}>
                                                                            {roleLabel(roleName)}
                                                                        </option>
                                                                    );
                                                                })}
                                                            </select>
                                                        </div>
                                                    ) : (
                                                        <span className="text-uppercase fw-bold fs-2 text-body-secondary">
                                                            {roleLabel(user.role)}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Column 5: Status Badges (now last column, gets right padding) */}
                                                <td className="pe-6">
                                                    <div className="d-flex flex-column gap-1 align-items-start text-nowrap">
                                                        <span className={`badge ${
                                                            verified ? 'bg-success-subtle text-success' : 'bg-warning-subtle text-warning'
                                                        } fw-semibold fs-2 gap-1 d-inline-flex align-items-center`}>
                                                            <iconify-icon icon={verified ? "solar:shield-check-line-duotone" : "solar:clock-circle-line-duotone"} className="fs-3"></iconify-icon>
                                                            {verified ? 'Verified' : 'Pending'}
                                                        </span>

                                                        <span className={`badge ${
                                                            active ? 'bg-primary-subtle text-primary' : 'bg-danger-subtle text-danger'
                                                        } fw-semibold fs-2 gap-1 d-inline-flex align-items-center`}>
                                                            <iconify-icon icon={active ? "solar:check-circle-line-duotone" : "solar:close-circle-line-duotone"} className="fs-3"></iconify-icon>
                                                            {active ? 'Active' : 'Deactivated'}
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Record count footer (pagination removed - scroll handles navigation) */}
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

UsersIndex.layout = { title: 'Users', description: 'Manage Users' };