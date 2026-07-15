import { useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useEchoNotification } from '@laravel/echo-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { useInitials } from '@/hooks/use-initials';
import { dashboard } from '@/routes';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

// ---------------------------------------------------------------------------
// Nav data — same items as before, now rendered with MaterialM markup
// ---------------------------------------------------------------------------
type NavLeaf = { title: string; href: string; icon: string };
type NavGroup = { id: string; label: string; icon: string; items: NavLeaf[] };

const flatTopItems: NavLeaf[] = [
    { title: 'Overview', href: '/dashboard', icon: 'solar:widget-add-line-duotone' },
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
            { title: 'Courses', href: '/explorecourses', icon: 'solar:mask-happly-line-duotone' },
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

// ---------------------------------------------------------------------------
// Active-route helpers
//
// MaterialM's sidebarmenu-default.js sets `.active`/`.in` (expanded) classes
// once, on the initial full page load, by comparing `window.location.href`
// against each `<a>` at DOMContentLoaded time. Inertia navigates the SPA way
// afterward, so that script never re-runs its active-state pass — the menu
// would silently go stale after the first client-side navigation.
//
// So: click-to-expand / mobile-drawer toggling stays owned by the theme's
// own JS (confirmed delegated on document/body — safe across DOM swaps),
// but *which* item/group is marked active is computed here in React from
// Inertia's current URL, on every navigation.
// ---------------------------------------------------------------------------
function useIsCurrentUrl() {
    const { url } = usePage();
    return (href: string) => url === href || url.startsWith(href + '/');
}

// ---------------------------------------------------------------------------
// Notifications — data logic + lazy-loaded pagination, MaterialM dropdown markup
//
// The dropdown fetches page 1 on mount. As the user scrolls the dropdown
// body near its bottom, subsequent pages are fetched and appended, with a
// small spinner shown while each page loads. This assumes the backend
// endpoint accepts a `page` query param and returns `has_more` (or an empty
// `data` array) to signal there's nothing left to load — adjust `fetchPage`
// below if your API's pagination shape differs (e.g. Laravel's default
// paginator fields like `current_page` / `last_page`).
// ---------------------------------------------------------------------------
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
    const [loading, setLoading] = useState(true); // initial page load
    const [loadingMore, setLoadingMore] = useState(false); // subsequent page loads
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

// ---------------------------------------------------------------------------
// Dark / light — MaterialM's own theme.js toggles `data-bs-theme` on <html>
// and reacts to clicks on `.moon`/`.sun` triggers itself (delegated), so we
// don't need to reimplement toggle logic here.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Sidebar nav group (collapsible submenu) — MaterialM markup + classes
// ---------------------------------------------------------------------------
function NavGroupSection({ group }: { group: NavGroup }) {
    const isCurrentUrl = useIsCurrentUrl();
    const isActiveGroup = group.items.some((item) => isCurrentUrl(item.href));

    return (
        <li className={`sidebar-item ${isActiveGroup ? 'selected' : ''}`}>
            <a
                className="sidebar-link has-arrow"
                href="javascript:void(0)"
                aria-expanded={isActiveGroup}
            >
                <iconify-icon icon={group.icon} />
                <span className="hide-menu">{group.label}</span>
            </a>
            <ul aria-expanded={isActiveGroup} className={`collapse first-level ${isActiveGroup ? 'in' : ''}`}>
                {group.items.map((item) => (
                    <li key={item.title} className={`sidebar-item ${isCurrentUrl(item.href) ? 'selected' : ''}`}>
                        <Link href={item.href} prefetch className={`sidebar-link ${isCurrentUrl(item.href) ? 'active' : ''}`}>
                            <span className="icon-small"></span>
                            <span className="hide-menu">{item.title}</span>
                        </Link>
                    </li>
                ))}
            </ul>
        </li>
    );
}

// ---------------------------------------------------------------------------
// Layout
//
// Vertical-only. MaterialM's CSS gates `.app-header.with-horizontal` /
// `.left-sidebar.with-horizontal` behind `data-layout="horizontal"` on
// <html>, and expects them to be used *as a pair* replacing the vertical
// sidebar entirely (see MaterialM's own horizontal example: the "sidebar"
// in that mode is a horizontal strip under the header, not a left rail).
// Mixing that pair with a standalone vertical <aside> — which is what this
// file previously did — leaves the header controls with no matching CSS
// path to render against, so they silently collapse to nothing.
//
// Fix: single layout mode. Vertical sidebar + vertical topbar. Every
// control (search, theme toggle, notifications, profile, breadcrumb) now
// lives inside <header class="topbar"><div class="with-vertical"> exactly
// as in MaterialM's own vertical-layout reference markup.
// ---------------------------------------------------------------------------
export default function AppSidebarLayout({ children, breadcrumbs = [] }: Props) {
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

    const [searchOpen, setSearchOpen] = useState(false);
    const [mobileNavOpen, setMobileNavOpen] = useState(false);
    useEffect(() => {
        if (!searchOpen) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSearchOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [searchOpen]);

    // Scroll handler for the notifications dropdown body — fires loadMore()
    // once the user scrolls within 40px of the bottom of the list.
    const handleNotifScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const el = e.currentTarget;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) {
            loadMore();
        }
    };

    return (
        <div id="main-wrapper" className="materialm-scope">
            {/* Plain-CSS scroll styling to replace SimpleBar.
                SimpleBar rewraps whatever node it's attached to with extra
                wrapper <div>s at runtime, outside of React's control. Since
                React also renders into those same nodes on every update
                (sidebar nav, dropdown bodies), the two were fighting over
                the same subtree — SimpleBar's injected wrappers didn't
                match what React expected to find there, and React's
                reconciler threw removeChild errors trying to unmount/patch
                nodes it no longer recognized. This class gives the same
                slim-scrollbar look with zero DOM ownership conflicts. */}
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

                /* Notification message: wrap onto its own lines instead of
                   forcing the dropdown wider, clamp to 3 lines with an
                   ellipsis if longer, render at normal weight (not bold),
                   and use a smaller font size so it doesn't dominate the
                   row. min-width: 0 is needed because this sits inside a
                   flex row (d-flex) — flex items default to min-width: auto,
                   which lets long unbroken text overflow instead of wrap. */
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

                /* Topbar controls (search, theme toggle, notifications,
                   profile) — always visible on desktop, and driven by
                   React state (mobileNavOpen) below the lg breakpoint
                   instead of Bootstrap's collapse JS. This avoids the
                   same DOM-ownership conflict SimpleBar had: nothing
                   here depends on Bootstrap toggling display for us. */
                .topbar-controls {
                    display: none;
                }
                .topbar-controls-open {
                    display: block;
                }
                @media (min-width: 992px) {
                    .topbar-controls {
                        display: block !important;
                    }
                }

                /* MaterialM's styles.css caps .container-fluid at a
                   max-width when the theme's "boxed" container option is
                   active (toggled via the customizer / a body class). We
                   don't expose that customizer, so force true full-width
                   here — otherwise pages render with a large empty gap
                   on the right on wide viewports. !important is needed
                   to beat the theme's own more specific boxed-mode rule. */
                #main-wrapper .body-wrapper .container-fluid {
                    max-width: none !important;
                    width: 100% !important;
                }
            `}</style>

            {/* ── Vertical sidebar ── */}
            <aside className="left-sidebar with-vertical">
                <div>
                    <div className="brand-logo d-flex align-items-center justify-content-between">
                        <Link href={dashboard()} className="text-nowrap logo-img d-flex align-items-center gap-2">
                            <img src="/SIN-logo.png" alt="StudyIn Nepal logo" style={{ height: 32, width: 32, objectFit: 'contain' }} />
                            <span className="fw-bold hide-menu">
                                Study In <span className="text-primary">Nepal</span>
                            </span>
                        </Link>
                    </div>

                    <nav className="sidebar-nav scroll-sidebar sidebar-nav-scroll">
                        <ul className="sidebar-menu" id="sidebarnav">
                            <li className="nav-small-cap">
                                <iconify-icon icon="solar:menu-dots-linear" className="mini-icon" />
                                <span className="hide-menu">Partner Portal</span>
                            </li>

                            {flatTopItems.map((item) => (
                                <li key={item.title} className={`sidebar-item ${isCurrentUrl(item.href) ? 'selected' : ''}`}>
                                    <Link href={item.href} prefetch className={`sidebar-link ${isCurrentUrl(item.href) ? 'active' : ''}`}>
                                        <iconify-icon icon={item.icon} />
                                        <span className="hide-menu">{item.title}</span>
                                    </Link>
                                </li>
                            ))}

                            <li>
                                <span className="sidebar-divider lg"></span>
                            </li>
                            <li className="nav-small-cap">
                                <iconify-icon icon="solar:menu-dots-linear" className="mini-icon" />
                                <span className="hide-menu">Application</span>
                            </li>

                            {navGroups.map((group) => (
                                <NavGroupSection key={group.id} group={group} />
                            ))}
                        </ul>
                    </nav>
                </div>
            </aside>

            <div className="page-wrapper">
                {/* ── Vertical layout header ──
                     Hamburger + logo (mobile) + all controls, merged into
                     one nav. This replaces the old two-header setup
                     (with-vertical topbar + with-horizontal app-header). */}
                <header className="topbar">
                    <div className="with-vertical">
                        <nav className="navbar navbar-expand-lg p-0">
                            <ul className="navbar-nav">
                                <li className="nav-item nav-icon-hover ms-n3">
                                    <a className="nav-link sidebartoggler" id="headerCollapse" href="javascript:void(0)">
                                        <iconify-icon icon="solar:hamburger-menu-line-duotone" className="fs-7" />
                                    </a>
                                </li>
                            </ul>

                            <div className="d-block d-lg-none">
                                <img src="/SIN-logo.png" width={36} alt="StudyIn Nepal" />
                            </div>

                            <a
                                className="navbar-toggler nav-icon-hover p-0 border-0"
                                href="javascript:void(0)"
                                onClick={() => setMobileNavOpen((v) => !v)}
                                aria-controls="navbarNav"
                                aria-expanded={mobileNavOpen}
                                aria-label="Toggle navigation"
                            >
                                <span className="p-2">
                                    <i className="ti ti-dots fs-7"></i>
                                </span>
                            </a>

                            <div
                                className={`navbar-collapse justify-content-end topbar-controls ${mobileNavOpen ? 'topbar-controls-open' : ''}`}
                                id="navbarNav"
                            >
                                <div className="d-flex align-items-center justify-content-between">
                                    <ul className="navbar-nav flex-row mx-auto ms-lg-auto align-items-center justify-content-center">
                                        {/* Breadcrumb */}
                                        <li className="nav-item d-none d-md-flex align-items-center me-3">
                                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                                        </li>

                                        {/* Search */}
                                        <li className="nav-item nav-icon-hover d-none d-lg-block">
                                            <a className="nav-link" href="javascript:void(0)" onClick={() => setSearchOpen(true)}>
                                                <iconify-icon icon="solar:magnifer-line-duotone" className="fs-6" />
                                            </a>
                                        </li>
                                        <li className="nav-item nav-icon-hover d-block d-lg-none">
                                            <a className="nav-link" href="javascript:void(0)" onClick={() => setSearchOpen(true)}>
                                                <iconify-icon icon="solar:magnifer-line-duotone" className="fs-6" />
                                            </a>
                                        </li>

                                        {/* Dark / light toggle — handled by theme.js (delegated on .moon/.sun) */}
                                        <li className="nav-item nav-icon-hover">
                                            <a className="nav-link moon dark-layout" href="javascript:void(0)">
                                                <iconify-icon icon="solar:moon-line-duotone" className="moon fs-6" />
                                            </a>
                                            <a className="nav-link sun light-layout" href="javascript:void(0)">
                                                <iconify-icon icon="solar:sun-2-line-duotone" className="sun fs-6" />
                                            </a>
                                        </li>

                                        {/* Notifications */}
                                        <li className="nav-item nav-icon-hover dropdown">
                                            <a
                                                className="nav-link position-relative"
                                                href="javascript:void(0)"
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
                                                            href="javascript:void(0)"
                                                            onClick={() => handleNotificationClick(n)}
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
                                                <div className="py-6 px-7 mb-1">
                                                    <Link href="/notifications" className="btn btn-outline-primary w-100">
                                                        Notification history
                                                    </Link>
                                                </div>
                                            </div>
                                        </li>

                                        {/* Profile dropdown */}
                                        <li className="nav-item dropdown">
                                            <a className="nav-link" href="javascript:void(0)" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false">
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
                                                        <div className="ms-3">
                                                            <h5 className="mb-0 fs-4">{auth?.user?.name || 'Partner'}</h5>
                                                            <span className="mb-1 d-block">{auth?.user?.role || 'Partner Account'}</span>
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

                                                        {auth?.permissions?.includes('view.commissionindex') && (
                                                            <Link href="/commission" className="py-8 px-7 d-flex align-items-center">
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
                            </div>
                        </nav>
                    </div>
                </header>
                {/* ── /Vertical header ── */}

                {/* ── Search modal ──
                     React-controlled (open/close via state), not Bootstrap's
                     data-bs-toggle="modal" JS lifecycle. Bootstrap's modal.js
                     moves/toggles nodes (backdrop, aria-hidden, focus trap)
                     outside of React's tracked tree; since this same subtree
                     is also rendered by React on every pass, the two fought
                     over ownership and caused a removeChild crash on Inertia
                     navigation. Visual classes are kept so it still looks
                     identical to the MaterialM modal; only the show/hide
                     mechanism changed. */}
                {searchOpen && (
                    <div
                        className="modal fade show d-block"
                        tabIndex={-1}
                        role="dialog"
                        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) setSearchOpen(false);
                        }}
                    >
                        <div className="modal-dialog modal-dialog-scrollable modal-lg modal-dialog-centered">
                            <div className="modal-content rounded">
                                <div className="modal-header border-bottom">
                                    <input type="search" className="form-control fs-3" placeholder="Search here" id="search" autoFocus />
                                    <a href="javascript:void(0)" onClick={() => setSearchOpen(false)} className="lh-1">
                                        <i className="ti ti-x fs-5 ms-3"></i>
                                    </a>
                                </div>
                                <div className="modal-body message-body sidebar-nav-scroll"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Page content ── */}
                <div className="body-wrapper">
                    <div className="container-fluid">{children}</div>
                </div>
            </div>

            <div className="dark-transparent sidebartoggler"></div>
        </div>
    );
}