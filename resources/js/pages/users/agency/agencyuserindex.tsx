import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Search, 
    Users, 
    Building, 
    ChevronLeft, 
    ChevronRight, 
    Power, 
    Ban, 
    MoreVertical, 
    X, 
    CheckCircle, 
    AlertTriangle,
    Filter
} from 'lucide-react';

const PRIMARY = "#0ea5e9";

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

export default function AgencyUserIndex({ users, agenciesList = [], isAdmin = false, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search ?? '');
    const [selectedAgency, setSelectedAgency] = useState(filters.agency ?? '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status ?? '');

    const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
    const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; userId: number; userName: string; isActive: boolean } | null>(null);

    // Close action dropdowns when clicking outside or scrolling
    useEffect(() => {
        const closeDropdown = () => {
            setActiveDropdown(null);
            setDropdownCoords(null);
        };
        window.addEventListener('click', closeDropdown);
        window.addEventListener('scroll', closeDropdown, true);
        return () => {
            window.removeEventListener('click', closeDropdown);
            window.removeEventListener('scroll', closeDropdown, true);
        };
    }, []);

    // Perform search/filter queries
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

    function handleClearFilters() {
        setSearchQuery('');
        setSelectedAgency('');
        setSelectedStatus('');
        router.get('/users', {}, { preserveState: true, replace: true });
    }

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    function handleDropdownToggle(e: React.MouseEvent<HTMLButtonElement>, userId: number) {
        e.stopPropagation();
        if (activeDropdown === userId) {
            setActiveDropdown(null);
            setDropdownCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 38; 
            const spaceBelow = viewportHeight - rect.bottom;

            let top = 0;
            if (spaceBelow < dropdownHeight + 16) {
                top = rect.top - dropdownHeight - 6;
            } else {
                top = rect.bottom + 6;
            }

            const dropdownWidth = 176;
            const left = rect.right - dropdownWidth;

            setDropdownCoords({ top, left });
            setActiveDropdown(userId);
        }
    }

    function handleToggleUserStatusClick(e: React.MouseEvent, userId: number, userName: string, isActive: boolean) {
        e.stopPropagation();
        setActiveDropdown(null);
        setDropdownCoords(null);
        setConfirmModal({
            isOpen: true,
            userId,
            userName,
            isActive
        });
    }

    function executeStatusToggle() {
        if (!confirmModal) return;
        const { userId, userName, isActive } = confirmModal;
        const action = isActive ? 'deactivated' : 'activated';

        router.patch(`/users/${userId}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                showToast(`User "${userName}" has been successfully ${action}.`, 'success');
                setConfirmModal(null);
            },
            onError: () => {
                showToast(`Failed to update status for "${userName}".`, 'error');
                setConfirmModal(null);
            }
        });
    }

    return (
        <div className="min-h-screen font-['Rajdhani'] bg-(--surface-bg) relative">
            <Head title="Partner Users" />

            {/* Custom Toast Notification (Bottom Right) */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-(--surface-card) border border-(--border-color) shadow-2xl rounded-xl p-4 flex items-start gap-3 transition-all duration-300 animate-slide-up">
                    {toast.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-bold text-(--text-strong)">
                            {toast.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className="text-xs text-(--text-muted) font-medium mt-0.5">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="text-(--text-faint) hover:text-(--text-strong)">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Confirmation Dialog Modal */}
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/60 backdrop-blur-xs">
                    <div className="bg-(--surface-card) border border-(--border-color) rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className={`p-3 rounded-xl ${confirmModal.isActive ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'}`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-['Castoro_Titling'] text-lg text-(--text-strong) uppercase tracking-wide">
                                    {confirmModal.isActive ? 'Deactivate User' : 'Activate User'}
                                </h3>
                                <p className="text-xs text-(--text-faint) tracking-wider uppercase font-bold">Please Confirm Action</p>
                            </div>
                        </div>

                        <p className="text-sm text-(--text-muted) font-medium leading-relaxed mb-6">
                            Are you sure you want to <span className="font-bold text-(--text-strong)">{confirmModal.isActive ? 'deactivate' : 'activate'}</span> the user profile of 
                            <span className="font-bold text-(--text-strong)"> "{confirmModal.userName}"</span>? Deactivated users will immediately lose access to the platform.
                        </p>

                        <div className="flex items-center justify-end gap-3 font-bold text-sm">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2.5 rounded-xl border border-(--border-color) text-(--text-muted) hover:bg-(--surface-hover) transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeStatusToggle}
                                className={`px-5 py-2.5 rounded-xl text-white transition-colors ${
                                    confirmModal.isActive 
                                        ? 'bg-rose-600 hover:bg-rose-500' 
                                        : 'bg-emerald-600 hover:bg-emerald-500'
                                }`}
                            >
                                Yes, Proceed
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@400;500;600;700&display=swap');
                    
                    @keyframes slideIn {
                        from { transform: translateY(-4px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-in {
                        animation: slideIn 0.1s ease forwards;
                    }

                    @keyframes slideUp {
                        from { transform: translateY(12px); opacity: 0; }
                        to { transform: translateY(0); opacity: 1; }
                    }
                    .animate-slide-up {
                        animation: slideUp 0.2s ease forwards;
                    }

                    .users-search, .users-select {
                        border: 1.5px solid var(--border-color) !important;
                        border-radius: 0.75rem !important;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.9rem !important;
                        font-weight: 600 !important;
                        color: var(--text-strong) !important;
                        background: var(--surface-card) !important;
                        outline: none !important;
                        transition: all 0.2s ease !important;
                    }
                    .users-search:focus, .users-select:focus {
                        border-color: ${PRIMARY} !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08) !important;
                    }

                    .users-table th {
                        text-align: left;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.78rem !important;
                        font-weight: 700 !important;
                        letter-spacing: 0.1em !important;
                        text-transform: uppercase;
                        color: var(--text-faint);
                        padding: 1.1rem 1.5rem !important;
                        background: var(--surface-sidebar);
                        border-bottom: 1.5px solid var(--border-color);
                    }
                    .users-table td {
                        padding: 1.1rem 1.5rem !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: var(--text-strong);
                        border-bottom: 1.5px solid var(--border-color-soft);
                        vertical-align: middle;
                    }

                    @media (min-width: 1280px) {
                        .users-table th {
                            padding: 1.35rem 1.75rem !important;
                            font-size: 0.82rem !important;
                        }
                        .users-table td {
                            padding: 1.35rem 1.75rem !important;
                            font-size: 1rem !important;
                        }
                    }

                    .users-table tr:last-child td {
                        border-bottom: none;
                    }
                    .users-table tbody tr {
                        transition: background 0.15s ease;
                        cursor: pointer;
                    }
                    .users-table tbody tr:hover {
                        background: var(--surface-hover);
                    }
                `}
            </style>

            <div className="w-full max-w-[1720px] mx-auto px-6 lg:px-12 xl:px-16 2xl:px-24 py-10 xl:py-16">
                
                {/* Header Info */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-[#0ea5e9] hidden sm:block">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="block text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-1">
                                Partner Directory
                            </span>
                            <h1 className="font-['Castoro_Titling'] text-2xl xl:text-3xl text-(--text-strong) uppercase tracking-wide">
                                Registered Users
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-faint)">
                            <Search className="h-4.5 w-4.5" />
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="users-search w-full py-[0.65rem] pr-4 pl-10"
                        />
                    </form>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-faint)">
                            <Building className="h-4.5 w-4.5" />
                        </div>
                        <select
                            value={selectedAgency}
                            onChange={(e) => {
                                setSelectedAgency(e.target.value);
                                applyFilters({ agency: e.target.value });
                            }}
                            className="users-select w-full py-[0.65rem] pr-4 pl-10 appearance-none"
                        >
                            <option value="">All Agencies</option>
                            {agenciesList.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--text-faint)">
                            <Filter className="h-4.5 w-4.5" />
                        </div>
                        <select
                            value={selectedStatus}
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                applyFilters({ status: e.target.value });
                            }}
                            className="users-select w-full py-[0.65rem] pr-4 pl-10 appearance-none"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active Profiles</option>
                            <option value="inactive">Inactive Profiles</option>
                        </select>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-(--surface-card) rounded-2xl border border-(--border-color-soft) shadow-(--shadow-card) overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="users-table w-full border-collapse">
                            <thead>
                                <tr>
                                    <th>User Information</th>
                                    <th>Email Address</th>
                                    <th>Partner Agency</th>
                                    <th>Account Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.data.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center" style={{ color: 'var(--text-faint)', fontWeight: 600, padding: '4rem 1.25rem' }}>
                                            No partner users matching those filters were found.
                                        </td>
                                    </tr>
                                )}
                                {users.data.map((user) => {
                                    const isDropdownOpen = activeDropdown === user.id;

                                    return (
                                        <tr 
                                            key={user.id}
                                            className="group/row animate-fade-in"
                                            onClick={() => router.get(`/users/${user.id}`)}
                                            title={`View Profile of ${user.name || 'Unnamed User'}`}
                                        >
                                            {/* 1. User Information Column with Avatar Fallback Setup */}
                                            <td>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="p-0.5 rounded-full bg-(--surface-bg) border border-(--border-color-soft) shadow-sm shrink-0">
                                                            {user.avatar_url ? (
                                                                <img 
                                                                    src={user.avatar_url} 
                                                                    alt={user.name || 'User'} 
                                                                    className="h-10 w-10 rounded-full object-cover shrink-0 animate-fade-in"
                                                                />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-full bg-sky-50 dark:bg-sky-950/40 text-[#0ea5e9] flex items-center justify-center font-bold text-base shrink-0 uppercase select-none">
                                                                    {user.name ? user.name.trim().charAt(0) : '?'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-(--text-strong) block">
                                                                {user.name || 'Unnamed User'}
                                                            </span>
                                                            <span className="text-xs text-(--text-muted) font-medium">
                                                                {user.contact_number}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Hover-Triggered Menu Trigger */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleDropdownToggle(e, user.id)}
                                                            className={`p-1 rounded-md border border-(--border-color-soft) bg-(--surface-card) hover:bg-(--surface-hover) text-(--text-faint) hover:text-(--text-strong) transition-all duration-150 focus:outline-none ${
                                                                isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
                                                            }`}
                                                        >
                                                            <MoreVertical className="h-4.5 w-4.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 2. Email Address */}
                                            <td>
                                                <div className="flex items-center gap-2 text-(--text-strong) font-semibold">
                                                    <span>{user.email}</span>
                                                </div>
                                            </td>

                                            {/* 3. Partner Agency (Click filters, stops propagation) */}
                                            <td 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    applyFilters({ agency: user.agency_name });
                                                }}
                                                title={`Filter layout by ${user.agency_name}`}
                                            >
                                                <div className="flex items-center gap-2 text-(--text-strong) font-semibold hover:text-[#0ea5e9] transition-colors">
                                                    <Building className="h-4 w-4 text-(--text-faint)" />
                                                    <span>{user.agency_name}</span>
                                                </div>
                                            </td>

                                            {/* 4. Account Status */}
                                            <td>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${
                                                    user.is_active 
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900' 
                                                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900'
                                                }`}>
                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {users.data.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 text-sm font-semibold text-(--text-muted)">
                        <span>
                            Showing <span className="text-(--text-strong)">{users.from}</span>&ndash;<span className="text-(--text-strong)">{users.to}</span> of <span className="text-(--text-strong)">{users.total}</span> users
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {users.links.map((link, i) => {
                                const isPrevious = link.label.includes('Previous');
                                const isNext = link.label.includes('Next');
                                return (
                                    <button
                                        key={i}
                                        disabled={!link.url}
                                        onClick={() => link.url && router.get(link.url, {}, { preserveState: true })}
                                        style={{
                                            minWidth: 38,
                                            height: 38,
                                            borderRadius: '0.75rem',
                                            border: '1.5px solid var(--border-color)',
                                            background: link.active ? PRIMARY : 'var(--surface-card)',
                                            color: link.active ? 'white' : 'var(--text-muted)',
                                            cursor: link.url ? 'pointer' : 'not-allowed',
                                            opacity: link.url ? 1 : 0.45,
                                            transition: 'all 0.15s ease',
                                        }}
                                        className={`flex items-center justify-center font-bold text-[0.8rem] tracking-wider px-3 ${
                                            link.url ? 'hover:bg-(--surface-hover) hover:border-(--border-color)' : ''
                                        }`}
                                    >
                                        {isPrevious ? (
                                            <ChevronLeft className="h-4 w-4" />
                                        ) : isNext ? (
                                            <ChevronRight className="h-4 w-4" />
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

            {/* Viewport-Fixed Dropdown Menu */}
            {activeDropdown && dropdownCoords && (() => {
                const user = users.data.find(u => u.id === activeDropdown);
                if (!user) return null;

                return (
                    <div 
                        style={{
                            position: 'fixed',
                            top: `${dropdownCoords.top}px`,
                            left: `${dropdownCoords.left}px`,
                        }}
                        className="w-44 bg-(--surface-card) border border-(--border-color) rounded-xl shadow-xl z-9999 py-1 text-left animate-slide-in pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => handleToggleUserStatusClick(e, user.id, user.name, user.is_active)}
                            className="w-full px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-(--text-muted) hover:text-(--text-strong) hover:bg-(--surface-hover) flex items-center gap-2 transition-colors"
                        >
                            {user.is_active ? (
                                <>
                                    <Ban className="h-4 w-4 text-rose-500 shrink-0" />
                                    <span>Deactivate</span>
                                </>
                            ) : (
                                <>
                                    <Power className="h-4 w-4 text-emerald-500 shrink-0" />
                                    <span>Activate</span>
                                </>
                            )}
                        </button>
                    </div>
                );
            })()}
        </div>
    );
}

AgencyUserIndex.layout = { title: 'Partner Directory', description: 'Partner Registered Users' };