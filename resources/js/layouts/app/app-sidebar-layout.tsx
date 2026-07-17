import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

type NavLeaf = { title: string; href: string; icon: string };
type NavGroup = { id: string; label: string; icon: string; items: NavLeaf[] };

const flatTopItems: NavLeaf[] = [
    { title: 'Dashboard', href: '/dashboard', icon: 'solar:widget-add-line-duotone' },
    { title: 'Applications', href: '/applications', icon: 'solar:layers-line-duotone' },
    { title: 'Search Courses', href: '/courses', icon: 'solar:layers-line-duotone' },
];

const navGroups: NavGroup[] = [
    {
        id: 'institution',
        label: 'Institution',
        icon: 'solar:home-angle-line-duotone',
        items: [
            { title: 'University', href: '/university', icon: 'solar:card-search-line-duotone' },
            { title: 'Course Search', href: '/explorecourses', icon: 'solar:mask-happly-line-duotone' },
            { title: 'Courses', href: '/course-details', icon: 'solar:layers-line-duotone' },
        ],
    },
    {
        id: 'surveys',
        label: 'Surveys',
        icon: 'solar:cardholder-line-duotone',
        items: [
            { title: 'Survey', href: '/survey', icon: 'solar:widget-4-line-duotone' },
            { title: 'Survey Form', href: '/online/survey', icon: 'solar:text-selection-line-duotone' },
            { title: 'AgencySurvey Form', href: '/agency/survey', icon: 'solar:archive-line-duotone' },
            { title: 'Agency Survey', href: '/agency/survey/online', icon: 'solar:archive-line-duotone' },
            { title: 'Institutional Survey', href: '/institutional-survey', icon: 'solar:cardholder-line-duotone' },
        ],
    },
];

type Props = PropsWithChildren<{ breadcrumbs?: BreadcrumbItemType[] }>;

function useIsCurrentUrl() {
    const { url } = usePage();
    return (href: string) => url === href || url.startsWith(href + '/');
}

type NotificationRecord = {
    id: string;
    data: {
        message: string;
        student_name?: string;
        application_id?: number;
        university_name?: string;
        avatar_url?: string;
    };
    read_at: string | null;
    created_at: string;
};

interface SearchResult {
    id: number;
    student_name: string;
    app_id: string;
    course_name?: string;
}

function timeAgo(iso: string): string {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function useNotifications(userId?: number) {
    const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const fetchPage = (pageNum: number, isInitial = false) => {
        if (isInitial) setLoading(true);
        else setLoadingMore(true);

        fetch(`/api/notifications?page=${pageNum}`, { headers: { Accept: 'application/json' } })
            .then((res) => res.json())
            .then((res) => {
                if (res.success) {
                    setNotifications((prev) => (isInitial ? res.data : [...prev, ...res.data]));
                    if (isInitial) setUnreadCount(res.unread_count);
                    setHasMore(Boolean(res.has_more ?? (res.data && res.data.length > 0)));
                }
            })
            .catch((err) => console.error('Failed to load notifications', err))
            .finally(() => {
                setLoading(false);
                setLoadingMore(false);
            });
    };

    useEffect(() => {
        if (!userId) return;
        fetchPage(1, true);
    }, [userId]);

    useEchoNotification(
        userId ? `App.Models.User.${userId}` : '',
        (notification: NotificationRecord['data'] & { id?: string }) => {
            setNotifications((prev) => [
                {
                    id: notification.id ?? crypto.randomUUID(),
                    data: notification,
                    read_at: null,
                    created_at: new Date().toISOString(),
                },
                ...prev,
            ]);
            setUnreadCount((c) => c + 1);
        },
    );

    const loadMore = () => {
        if (loadingMore || loading || !hasMore) return;
        const nextPage = page + 1;
        setPage(nextPage);
        fetchPage(nextPage);
    };

    const markAllAsRead = () => {
        if (unreadCount === 0) return;

        fetch('/api/notifications/read-all', {
            method: 'POST',
            headers: { Accept: 'application/json' },
        })
            .then(() => {
                setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
                setUnreadCount(0);
            })
            .catch((err) => console.error('Failed to mark notifications read', err));
    };

    const handleNotificationClick = (n: NotificationRecord) => {
        if (!n.read_at) {
            fetch(`/api/notifications/${n.id}/read`, {
                method: 'POST',
                headers: { Accept: 'application/json' },
            }).catch((err) => console.error('Failed to mark notification read', err));

            setNotifications((prev) =>
                prev.map((item) => (item.id === n.id ? { ...item, read_at: new Date().toISOString() } : item)),
            );
            setUnreadCount((c) => Math.max(0, c - 1));
        }

        if (n.data.application_id) {
            router.visit(`/applications/${n.data.application_id}`);
        }
    };

    return {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        markAllAsRead,
        handleNotificationClick,
    };
}

function NavGroupSection({ group }: { group: NavGroup }) {
    const isCurrentUrl = useIsCurrentUrl();
    const isActiveGroup = group.items.some((item) => isCurrentUrl(item.href));
    const [isOpen, setIsOpen] = useState(isActiveGroup);

    useEffect(() => {
        setIsOpen(isActiveGroup);
    }, [isActiveGroup]);

    const toggleOpen = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsOpen(!isOpen);
    };

    return (
        <li className={`sidebar-item ${isOpen ? 'active' : ''}`}>
            <a
                className={`sidebar-link has-arrow ${isOpen ? 'active' : ''}`}
                href="#"
                onClick={toggleOpen}
                aria-expanded={isOpen}
            >
                <iconify-icon icon={group.icon}></iconify-icon>
                <span className="hide-menu">{group.label}</span>
            </a>

            <ul
                aria-expanded={isOpen}
                className={`collapse first-level ${isOpen ? 'show in' : ''}`}
            >
                {group.items.map((item) => (
                    <li
                        key={item.title}
                        className={`sidebar-item ${
                            isCurrentUrl(item.href) ? 'selected' : ''
                        }`}
                    >
                        <Link
                            href={item.href}
                            prefetch
                            className={`sidebar-link ${
                                isCurrentUrl(item.href) ? 'active' : ''
                            }`}
                        >
                            <span className="icon-small"></span>
                            <span className="hide-menu">{item.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </li>
    );
}

export default function AppSidebarLayout({ children }: Props) {
    const page = usePage();
    const { auth } = page.props as any;
    const getInitials = useInitials();
    const isCurrentUrl = useIsCurrentUrl();
    const {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        markAllAsRead,
        handleNotificationClick,
    } = useNotifications(auth?.user?.id);

    const userInitials = useMemo(() => getInitials(auth?.user?.name ?? 'User'), [auth?.user?.name, getInitials]);

    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Dynamic Search States
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounced search logic for querying applications
    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        const debounceTimer = setTimeout(() => {
            fetch(`/api/applications/search?query=${encodeURIComponent(searchQuery)}`, {
                headers: { Accept: 'application/json' },
            })
                .then((res) => res.json())
                .then((res) => {
                    if (res.success && Array.isArray(res.data)) {
                        setSearchResults(res.data);
                    } else {
                        setSearchResults([]);
                    }
                })
                .catch((err) => {
                    console.error('Failed to search applications', err);
                    setSearchResults([]);
                })
                .finally(() => {
                    setIsSearching(false);
                });
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [searchQuery]);

    const handleSearchClick = (id: number) => {
        router.visit(`/applications/${id}`);
        setSearchQuery('');
        setShowResults(false);
    };

    const handleNotifScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
            loadMore();
        }
    };

    return (
        <div id="main-wrapper" className="materialm-scope">
            <style>{`
                .sidebar-nav-scroll {
                    overflow-y: auto;
                    scrollbar-width: thin;
                }
                .sidebar-nav-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .sidebar-nav-scroll::-webkit-scrollbar-thumb {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 999px;
                }

                /* ── Viewport-height containment for the dashboard shell ──
                   #main-wrapper / .page-wrapper / .body-wrapper are plain
                   block elements by default with no height limit, so they
                   grow to fit whatever a page renders and the browser ends
                   up scrolling <html>/<body> instead of the page's own
                   internal scroll area. This locks the shell to the
                   viewport and makes .body-wrapper (and anything inside it
                   with its own overflow, like a data table) the thing that
                   actually scrolls. */
                html, body {
                    height: 100%;
                }

                #main-wrapper {
                    height: 100vh;
                    overflow: hidden;
                }

                #main-wrapper .page-wrapper {
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    min-width: 0;
                }

                #main-wrapper .page-wrapper .topbar {
                    flex-shrink: 0;
                }

                #main-wrapper .page-wrapper .body-wrapper {
                    flex: 1 1 auto;
                    overflow-y: auto;
                    display: flex;
                    flex-direction: column;
                    padding-bottom: 0;
                }

                #main-wrapper .page-wrapper .body-wrapper .container-fluid {
                    flex: 1 1 auto;
                    min-height: 0;
                    display: flex;
                    flex-direction: column;
                }

                .notif-message {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    white-space: normal;
                    word-break: break-word;
                    min-width: 0;
                    font-size: 0.75rem;
                    line-height: 1.3;
                }

                .topbar-controls {
                    display: none;
                }
                .topbar-controls-open {
                    display: block;
                }
                @media (min-width: 992px) {
                    .topbar-controls {
                        display: flex !important;
                    }
                }

                #main-wrapper .body-wrapper .container-fluid {
                    max-width: none !important;
                    width: 100% !important;
                }

                #sidebarnav .sidebar-item.active > .first-level,
                #sidebarnav .first-level.show,
                #sidebarnav .first-level.in {
                    display: block !important;
                    height: auto !important;
                    opacity: 1 !important;
                    visibility: visible !important;
                    overflow: visible !important;
                }

                #sidebarnav .first-level:not(.show):not(.in) {
                    display: none !important;
                    height: 0 !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                }

                .dark-layout {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                }
                .light-layout {
                    display: none !important;
                }

                html[data-bs-theme="dark"] .dark-layout,
                html[data-theme="dark"] .dark-layout,
                body[data-bs-theme="dark"] .dark-layout {
                    display: none !important;
                }
                html[data-bs-theme="dark"] .light-layout,
                html[data-theme="dark"] .light-layout,
                body[data-bs-theme="dark"] .light-layout {
                    display: flex !important;
                    align-items: center;
                    justify-content: center;
                }

                /* Custom Search Bar Styles */
                .nav-search-bar {
                    background-color: #f2f4f7;
                    border: 1px solid #dcdfe3;
                    border-radius: 50px;
                    transition: all 0.2s ease-in-out;
                }
                .nav-search-bar:focus-within {
                    background-color: #ffffff;
                    border-color: var(--bs-primary, #5d87ff);
                    box-shadow: 0 0 0 3px rgba(93, 135, 255, 0.15);
                }

                /* Support for Dark Mode */
                html[data-bs-theme="dark"] .nav-search-bar,
                html[data-theme="dark"] .nav-search-bar,
                body[data-bs-theme="dark"] .nav-search-bar {
                    background-color: rgba(255, 255, 255, 0.05);
                    border-color: rgba(255, 255, 255, 0.1);
                }
                html[data-bs-theme="dark"] .nav-search-bar:focus-within,
                html[data-theme="dark"] .nav-search-bar:focus-within,
                body[data-bs-theme="dark"] .nav-search-bar:focus-within {
                    background-color: transparent;
                }

                /* Sidebar Profile Card Styles */
                .sidebar-profile-card {
                    background-color: #eef5fc;
                    border-radius: 20px;
                    padding: 12px 16px;
                    margin: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .sidebar-profile-avatar {
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    object-fit: cover;
                    background-color: #dbeafe;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 700;
                    color: #1e3a8a;
                    flex-shrink: 0;
                }
                .sidebar-profile-info {
                    flex-grow: 1;
                    margin-left: 12px;
                    min-width: 0;
                }
                .sidebar-profile-name {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #0f172a;
                    margin-bottom: 0;
                    line-height: 1.2;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .sidebar-profile-role {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 0;
                    line-height: 1.2;
                }
                .sidebar-profile-logout {
                    background: transparent;
                    border: none;
                    color: #0f172a;
                    padding: 4px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: color 0.2s, transform 0.1s;
                    cursor: pointer;
                    flex-shrink: 0;
                }
                .sidebar-profile-logout:hover {
                    color: #ef4444;
                    transform: scale(1.05);
                }

                /* Sidebar Profile Card Dark Mode overrides */
                html[data-bs-theme="dark"] .sidebar-profile-card,
                html[data-theme="dark"] .sidebar-profile-card,
                body[data-bs-theme="dark"] .sidebar-profile-card {
                    background-color: rgba(255, 255, 255, 0.05);
                }
                html[data-bs-theme="dark"] .sidebar-profile-avatar,
                html[data-theme="dark"] .sidebar-profile-avatar,
                body[data-bs-theme="dark"] .sidebar-profile-avatar {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #f8fafc;
                }
                html[data-bs-theme="dark"] .sidebar-profile-name,
                html[data-theme="dark"] .sidebar-profile-name,
                body[data-bs-theme="dark"] .sidebar-profile-name {
                    color: #f8fafc;
                }
                html[data-bs-theme="dark"] .sidebar-profile-role,
                html[data-theme="dark"] .sidebar-profile-role,
                body[data-bs-theme="dark"] .sidebar-profile-role {
                    color: #94a3b8;
                }
                html[data-bs-theme="dark"] .sidebar-profile-logout,
                html[data-theme="dark"] .sidebar-profile-logout,
                body[data-bs-theme="dark"] .sidebar-profile-logout {
                    color: #f8fafc;
                }
            `}</style>

            {/* ── Vertical sidebar ── */}
            <aside className="left-sidebar with-vertical" data-sidebar-theme="light">
                <div className="d-flex flex-column h-100 justify-content-between">

                    {/* Top menu section */}
                    <div className="d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                        <div className="brand-logo d-flex align-items-center justify-content-between">
                            <Link href={dashboard()} className="text-nowrap logo-img d-flex align-items-center gap-2">
                                <img src="/SIN-logo.png" alt="StudyIn Nepal logo" style={{ height: 32, width: 32, objectFit: 'contain' }} />
                                <span className="fw-bold hide-menu">
                                    Study In <span className="text-primary">Nepal</span>
                                </span>
                            </Link>
                        </div>

                        <nav className="sidebar-nav scroll-sidebar sidebar-nav-scroll flex-grow-1">

                            <ul className="sidebar-menu" id="sidebarnav">
                                <li className="nav-small-cap">
                                    <iconify-icon icon="solar:menu-dots-linear" className="mini-icon" />
                                    {/* <span className="hide-menu">Partner Portal</span> */}
                                </li>

                                {flatTopItems.map((item) => (
                                    <li key={item.title} className={`sidebar-item ${isCurrentUrl(item.href) ? 'selected' : ''}`}>
                                        <Link href={item.href} prefetch className={`sidebar-link ${isCurrentUrl(item.href) ? 'active' : ''}`}>
                                            <iconify-icon icon={item.icon} />
                                            <span className="hide-menu">{item.title}</span>
                                        </Link>
                                    </li>
                                ))}

                            {/* <li>
                                <span className="sidebar-divider lg"></span>
                            </li>
                            <li className="nav-small-cap">
                                <iconify-icon icon="solar:menu-dots-linear" className="mini-icon" />
                                <span className="hide-menu">Application</span>
                            </li>

                            {navGroups.map((group) => (
                                <NavGroupSection key={group.id} group={group} />
                            ))} */}
                            </ul>
                        </nav>
                    </div>

                    {/* Bottom Profile Section matching image structure */}
                    <div className="sidebar-profile-card">
                        {auth?.user?.avatar_url ? (
                            <img src={auth.user.avatar_url} className="sidebar-profile-avatar" alt={auth?.user?.name} />
                        ) : (
                            <span className="sidebar-profile-avatar" style={{ fontSize: '0.85rem' }}>
                                {userInitials}
                            </span>
                        )}
                        <div className="sidebar-profile-info">
                            <h6 className="sidebar-profile-name">{auth?.user?.name || 'User'}</h6>
                            <p className="sidebar-profile-role">{auth?.user?.role || 'Admin'}</p>
                        </div>
                        <Link href="/logout" method="post" as="button" className="sidebar-profile-logout" title="Log Out">
                            <iconify-icon icon="solar:logout-line-duotone" width="24" height="24" />
                        </Link>
                    </div>

                </div>
            </aside>

            <div className="page-wrapper">
                {/* ── Vertical layout header ── */}
                <header className="topbar">
                    <div className="with-vertical">
                        <nav className="navbar navbar-expand-lg p-0">
                            <ul className="navbar-nav">
                                <li className="nav-item nav-icon-hover ms-n3">
                                    <a className="nav-link sidebartoggler" id="headerCollapse" href="#" onClick={(e) => e.preventDefault()}>
                                        <iconify-icon icon="solar:hamburger-menu-line-duotone" className="fs-7" />
                                    </a>
                                </li>
                            </ul>

                            <div className="d-block d-lg-none">
                                <img src="/SIN-logo.png" width={36} alt="StudyIn Nepal" />
                            </div>

                            <a
                                className="navbar-toggler nav-icon-hover p-0 border-0"
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setMobileNavOpen((v) => !v);
                                }}
                                aria-controls="navbarNav"
                                aria-expanded={mobileNavOpen}
                                aria-label="Toggle navigation"
                            >
                                <span className="p-2">
                                    <iconify-icon icon="solar:menu-dots-bold-duotone" className="fs-6"></iconify-icon>
                                </span>
                            </a>

                            <div
                                className={`navbar-collapse justify-content-between topbar-controls ${mobileNavOpen ? 'topbar-controls-open' : ''}`}
                                id="navbarNav"
                            >
                                {/* Center Area: Centered Search Bar */}
                                <div className="d-flex align-items-center justify-content-center mx-lg-auto my-3 my-lg-0 w-100" style={{ maxWidth: '400px' }}>
                                    <div className="position-relative w-100 px-3 px-lg-0">
                                        <div className="nav-search-bar d-flex align-items-center w-100 px-3 py-1" style={{ minHeight: '42px' }}>
                                            <iconify-icon
                                                icon="solar:magnifer-line-duotone"
                                                width="22"
                                                height="22"
                                                className="text-muted flex-shrink-0"
                                            />
                                            <input
                                                type="search"
                                                className="form-control form-control-sm border-0 bg-transparent shadow-none ps-2 pe-0 flex-grow-1"
                                                placeholder="Search Name or App ID..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                onFocus={() => setShowResults(true)}
                                                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                                style={{ outline: 'none' }}
                                            />
                                        </div>

                                        {/* Results Dropdown Overlay */}
                                        {showResults && searchQuery.trim().length >= 2 && (
                                            <div
                                                className="dropdown-menu show position-absolute w-100 shadow mt-2 p-0 overflow-hidden"
                                                style={{ zIndex: 1050, maxHeight: '280px', overflowY: 'auto', top: '100%', left: 0 }}
                                            >
                                                {isSearching ? (
                                                    <div className="p-3 text-center text-muted small">
                                                        <div className="spinner-border spinner-border-sm text-secondary me-2" role="status"></div>
                                                        Searching...
                                                    </div>
                                                ) : searchResults.length === 0 ? (
                                                    <div className="p-3 text-center text-muted small">No applications found</div>
                                                ) : (
                                                    <div className="list-group list-group-flush">
                                                        {searchResults.map((app) => (
                                                            <button
                                                                key={app.id}
                                                                type="button"
                                                                onClick={() => handleSearchClick(app.id)}
                                                                className="list-group-item list-group-item-action py-2 px-3 border-0 text-start"
                                                            >
                                                                <div className="d-flex justify-content-between align-items-center">
                                                                    <span className="fw-semibold text-body small d-inline-block text-truncate" style={{ maxWidth: '160px' }}>
                                                                        {app.student_name}
                                                                    </span>
                                                                    <span className="badge bg-light text-secondary font-monospace small" style={{ fontSize: '0.7rem' }}>
                                                                        {app.app_id}
                                                                    </span>
                                                                </div>
                                                                {app.course_name && (
                                                                    <div className="text-muted small text-truncate mt-1" style={{ fontSize: '0.72rem' }}>
                                                                        {app.course_name}
                                                                    </div>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Right Area: Icons and User Profile */}
                                <ul className="navbar-nav flex-row ms-lg-auto align-items-center justify-content-center pb-3 pb-lg-0">
                                    <li className="nav-item nav-icon-hover dropdown">
                                        <a
                                            className="nav-link position-relative"
                                            href="/commission"
                                            onClick={(e) => e.preventDefault()}
                                           
                                        >
                                            <iconify-icon icon="solar:dollar-bing-line-duotone" className="fs-6" />
                                            
                                        </a>
                                        
                                    </li>
                                    {/* Dark / light toggle */}
                                    <li className="nav-item nav-icon-hover">
                                        <a
                                            className="nav-link moon dark-layout"
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            suppressHydrationWarning={true}
                                        >
                                            <iconify-icon
                                                icon="solar:moon-line-duotone"
                                                className="moon fs-6"
                                                suppressHydrationWarning={true}
                                            />
                                        </a>
                                        <a
                                            className="nav-link sun light-layout"
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            suppressHydrationWarning={true}
                                        >
                                            <iconify-icon
                                                icon="solar:sun-2-line-duotone"
                                                className="sun fs-6"
                                                suppressHydrationWarning={true}
                                            />
                                        </a>
                                    </li>

                                    {/* Notifications */}
                                    <li className="nav-item nav-icon-hover dropdown">
                                        <a
                                            className="nav-link position-relative"
                                            href="#"
                                            onClick={(e) => e.preventDefault()}
                                            id="notifDropdown"
                                            data-bs-toggle="dropdown"
                                            aria-expanded="false"
                                        >
                                            <iconify-icon icon="solar:bell-bing-line-duotone" className="fs-6" />
                                            {unreadCount > 0 && (
                                                <div className="notification text-bg-danger rounded-circle fs-1">{unreadCount}</div>
                                            )}
                                        </a>
                                        <div className="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="notifDropdown">
                                            <div className="d-flex align-items-center justify-content-between py-3 px-7">
                                                <h5 className="mb-0 fs-5 fw-semibold">Notifications</h5>
                                                {unreadCount > 0 && (
                                                    <button type="button" className="badge text-bg-primary rounded-4 px-3 py-1 lh-sm border-0" onClick={markAllAsRead}>
                                                        Mark all read
                                                    </button>
                                                )}
                                            </div>
                                            <div className="message-body sidebar-nav-scroll" onScroll={handleNotifScroll}>
                                                {loading && (
                                                    <div className="py-6 px-7">
                                                        <span className="fs-3">Loading…</span>
                                                    </div>
                                                )}
                                                {!loading && notifications.length === 0 && (
                                                    <div className="py-6 px-7">
                                                        <span className="fs-3">No notifications yet.</span>
                                                    </div>
                                                )}
                                                {notifications.map((n) => (
                                                    <a
                                                        key={n.id}
                                                        href="#"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleNotificationClick(n);
                                                        }}
                                                        className="py-6 px-7 d-flex align-items-center dropdown-item gap-3"
                                                    >
                                                        <span className="flex-shrink-0 bg-primary-subtle rounded-circle round d-flex align-items-center justify-content-center fs-6 text-primary overflow-hidden">
                                                            {n.data.avatar_url ? (
                                                                <img src={n.data.avatar_url} alt={n.data.student_name ?? 'Avatar'} className="w-100 h-100 object-fit-cover" />
                                                            ) : (
                                                                (n.data.student_name ?? 'A').slice(0, 2).toUpperCase()
                                                            )}
                                                        </span>
                                                        <div className="w-75 d-inline-block v-middle" style={{ minWidth: 0 }}>
                                                            <div className="d-flex align-items-center justify-content-between" style={{ minWidth: 0 }}>
                                                                <h6 className="mb-1 notif-message fw-normal">{n.data.message}</h6>
                                                            </div>
                                                            <span className="d-block fs-2">{timeAgo(n.created_at)}</span>
                                                        </div>
                                                    </a>
                                                ))}

                                                {loadingMore && (
                                                    <div className="py-4 px-7 d-flex justify-content-center">
                                                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                                                            <span className="visually-hidden">Loading more…</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {!loading && !hasMore && notifications.length > 0 && (
                                                    <div className="py-3 px-7 text-center">
                                                        <span className="fs-2 text-body-secondary">No more notifications</span>
                                                    </div>
                                                )}
                                            </div>
                                            {/* <div className="py-6 px-7 mb-1">
                                                <Link href="/notifications" className="btn btn-outline-primary w-100">
                                                    Notification history
                                                </Link>
                                            </div> */}
                                        </div>
                                    </li>

                                    {/* Profile dropdown */}
                                    <li className="nav-item dropdown">
                                        <a className="nav-link" href="#" onClick={(e) => e.preventDefault()} id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                                            <div className="d-flex align-items-center gap-2 lh-base">
                                                {auth?.user?.avatar_url ? (
                                                    <img src={auth.user.avatar_url} className="rounded-circle" width={35} height={35} alt={auth?.user?.name} />
                                                ) : (
                                                    <span
                                                        className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold"
                                                        style={{ width: 35, height: 35, fontSize: '0.75rem' }}
                                                    >
                                                        {userInitials}
                                                    </span>
                                                )}
                                            </div>
                                        </a>
                                        <div className="dropdown-menu content-dd dropdown-menu-end dropdown-menu-animate-up" aria-labelledby="profileDropdown">
                                            <div className="profile-dropdown position-relative sidebar-nav-scroll">
                                                <div className="py-3 px-7 pb-0">
                                                    <h5 className="mb-0 fs-5 fw-semibold">User Profile</h5>
                                                </div>
                                                <div className="d-flex align-items-center py-9 mx-7 border-bottom">
                                                    {auth?.user?.avatar_url ? (
                                                        <img src={auth.user.avatar_url} className="rounded-circle" width={80} height={80} alt={auth?.user?.name} />
                                                    ) : (
                                                        <span
                                                            className="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center fw-bold fs-4"
                                                            style={{ width: 80, height: 80 }}
                                                        >
                                                            {userInitials}
                                                        </span>
                                                    )}
                                                    <div className="ms-3 d-flex flex-column">
                                                        <h5 className="mb-1 fs-4">
                                                            {auth?.user?.name || 'User'}
                                                        </h5>
                                                        <span className="text-muted small">
                                                            {auth?.user?.email || 'user@email.com'}
                                                        </span>
                                                        <span className="text-muted small">
                                                            {auth?.user?.role || 'User Account'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="message-body">
                                                    <Link href={`/users/${auth?.user?.id}`} className="py-8 px-7 mt-8 d-flex align-items-center">
                                                        <span className="d-flex align-items-center justify-content-center bg-primary-subtle text-primary rounded round">
                                                            <iconify-icon icon="solar:settings-minimalistic-line-duotone" className="fs-7" />
                                                        </span>
                                                        <div className="w-75 v-middle ps-3">
                                                            <h5 className="mb-1 fs-3 fw-medium">Manage Profile</h5>
                                                            <span className="fs-2 d-block text-body-secondary">Account Settings</span>
                                                        </div>
                                                    </Link>

                                                    {auth?.permissions?.includes('view.user') && (
                                                        <Link href="/users" className="py-8 px-7 d-flex align-items-center">
                                                            <span className="d-flex align-items-center justify-content-center bg-success-subtle text-success rounded round">
                                                                <iconify-icon icon="solar:shield-user-line-duotone" className="fs-7" />
                                                            </span>
                                                            <div className="w-75 v-middle ps-3">
                                                                <h5 className="mb-1 fs-3 fw-medium">Manage User</h5>
                                                                <span className="fs-2 d-block text-body-secondary">Users & roles</span>
                                                            </div>
                                                        </Link>
                                                    )}

                                                    {auth?.permissions?.includes('view.agency') && (
                                                        <Link href="/agencies" className="py-8 px-7 d-flex align-items-center">
                                                            <span className="d-flex align-items-center justify-content-center bg-danger-subtle text-danger rounded round">
                                                                <iconify-icon icon="solar:course-up-line-duotone" className="fs-7" />
                                                            </span>
                                                            <div className="w-75 v-middle ps-3">
                                                                <h5 className="mb-1 fs-3 fw-medium">Manage Agency</h5>
                                                                <span className="fs-2 d-block text-body-secondary">Partner agencies</span>
                                                            </div>
                                                        </Link>
                                                    )}

                                                    {auth?.permissions?.includes('view.commission') && (
                                                        <Link href="/commissions" className="py-8 px-7 d-flex align-items-center">
                                                            <span className="d-flex align-items-center justify-content-center bg-warning-subtle text-warning rounded round">
                                                                <iconify-icon icon="solar:dollar-line-duotone" className="fs-7" />
                                                            </span>
                                                            <div className="w-75 v-middle ps-3">
                                                                <h5 className="mb-1 fs-3 fw-medium">Commission</h5>
                                                                <span className="fs-2 d-block text-body-secondary">Payouts & earnings</span>
                                                            </div>
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="d-grid py-4 px-7 pt-8">
                                                    <Link href="/logout" method="post" as="button" className="btn btn-primary">
                                                        Log Out
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                </ul>
                            </div>
                        </nav>
                    </div>
                </header>

                {/* ── Page content ── */}
                <div className="body-wrapper">
                    <div className="container-fluid">{children}</div>
                </div>
            </div>

            <div className="dark-transparent sidebartoggler"></div>
        </div>
    );
}