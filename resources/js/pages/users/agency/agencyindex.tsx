import { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { 
    Search, 
    Building, 
    Users, 
    ChevronLeft, 
    ChevronRight, 
    Power, 
    Ban, 
    MoreVertical, 
    X, 
    CheckCircle, 
    AlertTriangle 
} from 'lucide-react';

const PRIMARY = "#0ea5e9";

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

export default function AgencyIndex({ agencies, search }: Props) {
    const [query, setQuery] = useState(search ?? '');
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [dropdownCoords, setDropdownCoords] = useState<{ top: number; left: number } | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; agencyName: string; isActive: boolean } | null>(null);

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

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        router.get('/agencies', { search: query }, { preserveState: true, replace: true });
    }

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => {
            setToast(null);
        }, 4000);
    };

    function handleDropdownToggle(e: React.MouseEvent<HTMLButtonElement>, agencyName: string) {
        e.stopPropagation();
        if (activeDropdown === agencyName) {
            setActiveDropdown(null);
            setDropdownCoords(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const dropdownHeight = 38; // Single action item height inside the absolute menu
            const spaceBelow = viewportHeight - rect.bottom;

            let top = 0;
            if (spaceBelow < dropdownHeight + 16) {
                // Not enough space below, render upward
                top = rect.top - dropdownHeight - 6;
            } else {
                // Render downward
                top = rect.bottom + 6;
            }

            // Align the right edge of the 176px wide dropdown with the right edge of the trigger button
            const dropdownWidth = 176;
            const left = rect.right - dropdownWidth;

            setDropdownCoords({ top, left });
            setActiveDropdown(agencyName);
        }
    }

    function handleToggleAgencyStatusClick(e: React.MouseEvent, agencyName: string, isActive: boolean) {
        e.stopPropagation();
        setActiveDropdown(null);
        setDropdownCoords(null);
        setConfirmModal({
            isOpen: true,
            agencyName,
            isActive
        });
    }

    function executeStatusToggle() {
        if (!confirmModal) return;
        const { agencyName, isActive } = confirmModal;
        const action = isActive ? 'deactivated' : 'activated';

        router.patch(`/agencies/${encodeURIComponent(agencyName)}/toggle-status`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                showToast(`Agency "${agencyName}" has been successfully ${action}.`, 'success');
                setConfirmModal(null);
            },
            onError: () => {
                showToast(`Failed to update status for "${agencyName}".`, 'error');
                setConfirmModal(null);
            }
        });
    }

    return (
        <div className="min-h-screen font-['Rajdhani'] bg-[var(--surface-bg)] relative">
            <Head title="Agency Directory" />

            {/* Custom Toast Notification (Positioned Bottom Right) */}
            {toast && (
                <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[var(--surface-card)] border border-[var(--border-color)] shadow-2xl rounded-xl p-4 flex items-start gap-3 transition-all duration-300 animate-slide-up">
                    {toast.type === 'success' ? (
                        <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                        <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                        <p className="text-sm font-bold text-[var(--text-strong)]">
                            {toast.type === 'success' ? 'Success' : 'Error'}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] font-medium mt-0.5">{toast.message}</p>
                    </div>
                    <button onClick={() => setToast(null)} className="text-[var(--text-faint)] hover:text-[var(--text-strong)]">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Confirmation Dialog Modal */}
            {confirmModal?.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0a0a0a]/60 backdrop-blur-xs">
                    <div className="bg-[var(--surface-card)] border border-[var(--border-color)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-3.5 mb-4">
                            <div className={`p-3 rounded-xl ${confirmModal.isActive ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500' : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500'}`}>
                                <AlertTriangle className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-['Castoro_Titling'] text-lg text-[var(--text-strong)] uppercase tracking-wide">
                                    {confirmModal.isActive ? 'Deactivate Agency' : 'Activate Agency'}
                                </h3>
                                <p className="text-xs text-[var(--text-faint)] tracking-wider uppercase font-bold">Please Confirm Action</p>
                            </div>
                        </div>

                        <p className="text-sm text-[var(--text-muted)] font-medium leading-relaxed mb-6">
                            Are you sure you want to <span className="font-bold text-[var(--text-strong)]">{confirmModal.isActive ? 'deactivate' : 'activate'}</span> the entire agency 
                            <span className="font-bold text-[var(--text-strong)]"> "{confirmModal.agencyName}"</span>? This action will update the active status of all users registered under this agency.
                        </p>

                        <div className="flex items-center justify-end gap-3 font-bold text-sm">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-muted)] hover:bg-[var(--surface-hover)] transition-colors"
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

                    .agencies-search {
                        border: 1.5px solid var(--border-color) !important;
                        border-radius: 0.75rem !important;
                        padding: 0.65rem 1rem 0.65rem 2.75rem !important;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-size: 0.9rem !important;
                        font-weight: 600 !important;
                        color: var(--text-strong) !important;
                        background: var(--surface-card) !important;
                        outline: none !important;
                        transition: all 0.2s ease !important;
                        width: 100%;
                    }
                    .agencies-search:focus {
                        border-color: ${PRIMARY} !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.08) !important;
                    }

                    .agencies-table th {
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
                    .agencies-table td {
                        padding: 1.1rem 1.5rem !important;
                        font-size: 0.95rem !important;
                        font-weight: 600 !important;
                        color: var(--text-strong);
                        border-bottom: 1.5px solid var(--border-color-soft);
                        vertical-align: middle;
                    }

                    @media (min-width: 1280px) {
                        .agencies-table th {
                            padding: 1.35rem 1.75rem !important;
                            font-size: 0.82rem !important;
                        }
                        .agencies-table td {
                            padding: 1.35rem 1.75rem !important;
                            font-size: 1rem !important;
                        }
                    }

                    .agencies-table tr:last-child td {
                        border-bottom: none;
                    }
                    .agencies-table tbody tr {
                        transition: background 0.15s ease;
                        cursor: pointer;
                    }
                    .agencies-table tbody tr:hover {
                        background: var(--surface-hover);
                    }
                `}
            </style>

            <div className="w-full max-w-[1720px] mx-auto px-6 lg:px-12 xl:px-16 2xl:px-24 py-10 xl:py-16">
                
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl text-[#0ea5e9] hidden sm:block">
                            <Building className="h-6 w-6" />
                        </div>
                        <div>
                            <span className="block text-[0.72rem] font-bold tracking-[0.25em] uppercase text-[#0ea5e9] mb-1">
                                Directory
                            </span>
                            <h1 className="font-['Castoro_Titling'] text-2xl xl:text-3xl text-[var(--text-strong)] uppercase tracking-wide">
                                Partner Agencies
                            </h1>
                        </div>
                    </div>

                    <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[var(--text-faint)]">
                            <Search className="h-4.5 w-4.5" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search agency..."
                            className="agencies-search"
                        />
                    </form>
                </div>

                <div className="bg-[var(--surface-card)] rounded-2xl border border-[var(--border-color-soft)] shadow-[var(--shadow-card)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="agencies-table w-full border-collapse">
                            <thead>
                                <tr>
                                    <th>Agency Name</th>
                                    <th>Registered Users</th>
                                    <th>Agency Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agencies.data.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="text-center" style={{ color: 'var(--text-faint)', fontWeight: 600, padding: '4rem 1.25rem' }}>
                                            No partner agencies found.
                                        </td>
                                    </tr>
                                )}
                                {agencies.data.map((agency) => {
                                    const total = agency.total_users;
                                    const active = agency.active_users;

                                    let statusLabel = 'Inactive';
                                    let statusBadgeStyle = 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900';

                                    if (active === total && total > 0) {
                                        statusLabel = 'Active';
                                        statusBadgeStyle = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900';
                                    } else if (active > 0) {
                                        statusLabel = `Partially Active (${active}/${total})`;
                                        statusBadgeStyle = 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900';
                                    }

                                    const isDropdownOpen = activeDropdown === agency.agency_name;

                                    return (
                                        <tr 
                                            key={agency.agency_name}
                                            onClick={() => router.get('/agency-users', { agency: agency.agency_name })}
                                            className="group/row"
                                        >
                                            <td>
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="p-2.5 bg-[var(--surface-bg)] border border-[var(--border-color-soft)] rounded-lg text-[#0ea5e9]">
                                                            <Building className="h-5 w-5" />
                                                        </div>
                                                        <span className="font-bold text-[var(--text-strong)]">{agency.agency_name || '—'}</span>
                                                    </div>

                                                    {/* Three Dots Button (Hover Triggered) */}
                                                    <div onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={(e) => handleDropdownToggle(e, agency.agency_name)}
                                                            className={`p-1 rounded-md border border-[var(--border-color-soft)] bg-[var(--surface-card)] hover:bg-[var(--surface-hover)] text-[var(--text-faint)] hover:text-[var(--text-strong)] transition-all duration-150 focus:outline-none ${
                                                                isDropdownOpen ? 'opacity-100' : 'opacity-0 group-hover/row:opacity-100'
                                                            }`}
                                                        >
                                                            <MoreVertical className="h-4.5 w-4.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-1.5 text-[var(--text-muted)] font-medium">
                                                    <Users className="h-4.5 w-4.5 text-[var(--text-faint)]" />
                                                    <span>{total} {total === 1 ? 'User' : 'Users'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border ${statusBadgeStyle}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {agencies.data.length > 0 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8 text-sm font-semibold text-[var(--text-muted)]">
                        <span>
                            Showing <span className="text-[var(--text-strong)]">{agencies.from}</span>&ndash;<span className="text-[var(--text-strong)]">{agencies.to}</span> of <span className="text-[var(--text-strong)]">{agencies.total}</span> agencies
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            {agencies.links.map((link, i) => {
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
                                            link.url ? 'hover:bg-[var(--surface-hover)] hover:border-[var(--border-color)]' : ''
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

            {/* Viewport-Fixed Dropdown Menu (Prevents row-height stretching) */}
            {activeDropdown && dropdownCoords && (() => {
                const agency = agencies.data.find(a => a.agency_name === activeDropdown);
                if (!agency) return null;

                return (
                    <div 
                        style={{
                            position: 'fixed',
                            top: `${dropdownCoords.top}px`,
                            left: `${dropdownCoords.left}px`,
                        }}
                        className="w-44 bg-[var(--surface-card)] border border-[var(--border-color)] rounded-xl shadow-xl z-[9999] py-1 text-left animate-slide-in pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={(e) => handleToggleAgencyStatusClick(e, agency.agency_name, agency.is_active)}
                            className="w-full px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-hover)] flex items-center gap-2 transition-colors"
                        >
                            {agency.is_active ? (
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

AgencyIndex.layout = { title: 'Agencies', description: 'Agencies Directory' };