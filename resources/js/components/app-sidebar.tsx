import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import {
    BookOpen,
    ChevronRight,
    FolderGit2,
    LayoutGrid,
    UniversityIcon,
    SearchCheckIcon,
    FormInputIcon,
    OrigamiIcon,
    Settings,
    Search,
    Bell,
    Moon,
    Sun,
    LogOut,
    PanelLeftClose,
    PanelLeftOpen,
} from 'lucide-react';
import { NavFooter } from '@/components/nav-footer';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarFooter,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarTrigger,
    useSidebar,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

// ---------------------------------------------------------------------------
// Theme tokens — Phoenix's clean, white, blue-accent admin look.
// ---------------------------------------------------------------------------
const PRIMARY = '#3762fa';
const AMBER = '#f5a524';
const INK = '#1e293b';
const MUTED = '#64748b';
const FAINT = '#94a3b8';
const BORDER = '#e6e8ec';
const SURFACE = '#ffffff';

// ---------------------------------------------------------------------------
// Nav data
// ---------------------------------------------------------------------------
type NavLeaf = { title: string; href: string; icon: LucideIcon };
type NavGroup = { id: string; label: string; icon: LucideIcon; items: NavLeaf[] };

const homeItem: NavLeaf = { title: 'Overview', href: '/dashboard', icon: LayoutGrid };

const navGroups: NavGroup[] = [
    {
        id: 'institution',
        label: 'Institution',
        icon: UniversityIcon,
        items: [
            { title: 'University', href: '/university', icon: UniversityIcon },
            { title: 'Courses', href: '/explorecourses', icon: BookOpen },
        ],
    },
    {
        id: 'surveys',
        label: 'Surveys',
        icon: SearchCheckIcon,
        items: [
            { title: 'Survey', href: '/survey', icon: SearchCheckIcon },
            { title: 'Survey Form', href: '/online/survey', icon: FormInputIcon },
            { title: 'AgencySurvey Form', href: '/agency/survey', icon: OrigamiIcon },
            { title: 'Agency Survey', href: '/agency/survey/online', icon: OrigamiIcon },
        ],
    },
];

const footerNavItems: NavItem[] = [
    { title: 'Repository', href: 'https://github.com/laravel/react-starter-kit', icon: FolderGit2 },
    { title: 'Documentation', href: 'https://laravel.com/docs/starter-kits#react', icon: BookOpen },
    { title: 'Settings', href: '#', icon: Settings },
];

function isActive(href: string, currentUrl: string) {
    return currentUrl === href || (href !== '/' && currentUrl.startsWith(href));
}

// ---------------------------------------------------------------------------
// Sidebar: collapsible groups with Phoenix's dropdown-indicator caret
// ---------------------------------------------------------------------------
function NavGroupSection({ group, currentUrl }: { group: NavGroup; currentUrl: string }) {
    const hasActiveChild = group.items.some((item) => isActive(item.href, currentUrl));
    const [open, setOpen] = useState(hasActiveChild);
    const Icon = group.icon;

    return (
        <div className="nav-item-wrapper">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="nav-link dropdown-indicator"
                data-active={hasActiveChild}
            >
                <span className="dropdown-indicator-icon-wrapper">
                    <ChevronRight className={`dropdown-indicator-icon ${open ? 'is-open' : ''}`} size={13} strokeWidth={2.5} />
                </span>
                <Icon className="nav-link-icon" size={17} strokeWidth={1.75} />
                <span className="nav-link-text group-data-[collapsible=icon]:hidden">{group.label}</span>
            </button>

            <div className={`parent-wrapper group-data-[collapsible=icon]:hidden ${open ? 'is-open' : ''}`}>
                <ul className="parent">
                    {group.items.map((item) => {
                        const active = isActive(item.href, currentUrl);
                        const ItemIcon = item.icon;
                        return (
                            <li key={item.title} className="nav-item">
                                <Link href={item.href} prefetch className="nav-link" data-active={active}>
                                    <ItemIcon className="nav-link-icon" size={15} strokeWidth={1.75} />
                                    <span className="nav-link-text">{item.title}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}

function SidebarCollapseToggle() {
    const { toggleSidebar, state } = useSidebar();
    const collapsed = state === 'collapsed';
    return (
        <button type="button" onClick={toggleSidebar} className="navbar-vertical-toggle">
            {collapsed ? <PanelLeftOpen size={16} strokeWidth={1.75} /> : <PanelLeftClose size={16} strokeWidth={1.75} />}
            <span className="group-data-[collapsible=icon]:hidden">Collapsed view</span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// Top navbar bits: search, theme toggle, notifications, user menu
// ---------------------------------------------------------------------------
function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
    const ref = useRef<T>(null);
    useEffect(() => {
        function handler(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) onOutside();
        }
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onOutside]);
    return ref;
}

type Notification = {
    id: string;
    name: string;
    message: string;
    time: string;
    unread: boolean;
    initials: string;
};

const sampleNotifications: Notification[] = [
    { id: '1', name: 'Jessie Samson', message: 'Mentioned you in a comment.', time: '10m', unread: false, initials: 'JS' },
    { id: '2', name: 'Jane Foster', message: 'Created an event.', time: '20m', unread: true, initials: 'JF' },
    { id: '3', name: 'Jessie Samson', message: 'Liked your comment.', time: '1h', unread: true, initials: 'JS' },
];

function NotificationsMenu() {
    const [open, setOpen] = useState(false);
    const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
    const unread = sampleNotifications.filter((n) => n.unread).length;

    return (
        <div className="topnav-menu" ref={ref}>
            <button type="button" className="topnav-icon-btn" aria-label="Notifications" onClick={() => setOpen((v) => !v)}>
                <Bell size={19} strokeWidth={1.75} />
                {unread > 0 && <span className="unread-dot" />}
            </button>

            {open && (
                <div className="topnav-card notification-card">
                    <div className="card-header">
                        <h5>Notifications</h5>
                        <button type="button" className="link-btn">Mark all as read</button>
                    </div>
                    <div className="card-body">
                        {sampleNotifications.map((n) => (
                            <div key={n.id} className={`notification-row ${n.unread ? 'unread' : ''}`}>
                                <div className="avatar">{n.initials}</div>
                                <div className="flex-1 min-w-0">
                                    <p className="notification-name">{n.name}</p>
                                    <p className="notification-message">{n.message}</p>
                                    <p className="notification-time">{n.time} ago</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card-footer">
                        <Link href="/notifications">Notification history</Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function UserMenu({ user }: { user?: { name: string; email?: string } }) {
    const [open, setOpen] = useState(false);
    const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
    const name = user?.name ?? 'Guest User';
    const initials = name.charAt(0).toUpperCase();

    return (
        <div className="topnav-menu" ref={ref}>
            <button type="button" className="user-avatar-btn" aria-label="Account menu" onClick={() => setOpen((v) => !v)}>
                <div className="avatar avatar-l">{initials}</div>
            </button>

            {open && (
                <div className="topnav-card user-card">
                    <div className="user-card-body">
                        <div className="avatar avatar-xl">{initials}</div>
                        <h6>{name}</h6>
                        {user?.email && <p>{user.email}</p>}
                    </div>
                    <div className="card-footer">
                        <Link href="/logout" method="post" as="button" className="btn-signout">
                            <LogOut size={15} strokeWidth={1.75} />
                            Sign out
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}

function ThemeToggle() {
    const [dark, setDark] = useState(false);
    return (
        <button
            type="button"
            className="topnav-icon-btn"
            aria-label="Switch theme"
            onClick={() => setDark((v) => !v)}
        >
            {dark ? <Sun size={18} strokeWidth={1.75} /> : <Moon size={18} strokeWidth={1.75} />}
        </button>
    );
}

// ---------------------------------------------------------------------------
// Combined export: sidebar + top navbar, styled after the Phoenix template
// ---------------------------------------------------------------------------
export function AppSidebar({ user }: { user?: { name: string; email?: string } }) {
    const { url } = usePage();

    return (
        <>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap');

                    .partner-sidebar, .partner-topnav, .topnav-card {
                        font-family: 'Nunito Sans', sans-serif;
                    }

                    /* ---------- Sidebar ---------- */
                    .partner-sidebar { border-right: 1px solid ${BORDER} !important; }
                    .partner-sidebar [data-sidebar="sidebar"] { background: ${SURFACE} !important; color: ${INK} !important; }

                    .sidebar-section-label {
                        font-size: 0.68rem;
                        font-weight: 800;
                        letter-spacing: 0.12em;
                        text-transform: uppercase;
                        color: ${FAINT};
                        padding: 0 0.5rem;
                        margin-top: 0.25rem;
                    }
                    .sidebar-section-line { border: none; border-top: 1px solid ${BORDER}; margin: 0.5rem 0 0.75rem; }

                    .nav-item-wrapper { display: flex; flex-direction: column; }
                    .nav-link {
                        display: flex;
                        align-items: center;
                        gap: 0.6rem;
                        width: 100%;
                        padding: 0.55rem 0.6rem;
                        border-radius: 0.5rem;
                        font-size: 0.85rem;
                        font-weight: 600;
                        color: ${MUTED};
                        background: transparent;
                        border: none;
                        text-align: left;
                        cursor: pointer;
                        transition: background 0.15s ease, color 0.15s ease;
                    }
                    .nav-link:hover { background: ${PRIMARY}0d; color: ${INK}; }
                    .nav-link[data-active="true"] { background: ${PRIMARY}12; color: ${PRIMARY}; font-weight: 700; }
                    .nav-link-icon { opacity: 0.8; flex-shrink: 0; }
                    .nav-link[data-active="true"] .nav-link-icon, .nav-link:hover .nav-link-icon { opacity: 1; }
                    .nav-link-text { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

                    .dropdown-indicator-icon-wrapper { display: flex; align-items: center; justify-content: center; width: 1rem; }
                    .dropdown-indicator-icon { transition: transform 0.2s ease; opacity: 0.55; }
                    .dropdown-indicator-icon.is-open { transform: rotate(90deg); }

                    .parent-wrapper {
                        display: grid;
                        grid-template-rows: 0fr;
                        opacity: 0;
                        transition: grid-template-rows 0.2s ease, opacity 0.2s ease;
                    }
                    .parent-wrapper.is-open { grid-template-rows: 1fr; opacity: 1; }
                    .parent-wrapper > .parent { overflow: hidden; list-style: none; margin: 0.15rem 0 0 1.7rem; padding-left: 0.6rem; border-left: 1px solid ${BORDER}; display: flex; flex-direction: column; gap: 0.1rem; }
                    .parent-wrapper .nav-link { padding: 0.4rem 0.6rem; font-size: 0.82rem; }

                    .navbar-vertical-toggle {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        width: 100%;
                        padding: 0.5rem 0.75rem;
                        border-radius: 0.5rem;
                        border: 1px solid ${BORDER};
                        background: ${SURFACE};
                        color: ${MUTED};
                        font-size: 0.78rem;
                        font-weight: 700;
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .navbar-vertical-toggle:hover { color: ${PRIMARY}; border-color: ${PRIMARY}55; }

                    /* ---------- Top navbar ---------- */
                    .partner-topnav {
                        position: sticky;
                        top: 0;
                        z-index: 20;
                        height: 4rem;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        padding: 0 1.25rem;
                        background: ${SURFACE};
                        border-bottom: 1px solid ${BORDER};
                    }
                    .search-box {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        width: 100%;
                        max-width: 22rem;
                        padding: 0.5rem 1rem;
                        border-radius: 999px;
                        border: 1px solid ${BORDER};
                        background: #f8fafc;
                        transition: all 0.15s ease;
                    }
                    .search-box:focus-within { background: ${SURFACE}; border-color: ${PRIMARY}55; box-shadow: 0 0 0 3px ${PRIMARY}14; }
                    .search-box input { flex: 1; background: transparent; border: none; outline: none; font-size: 0.85rem; color: ${INK}; }
                    .search-box input::placeholder { color: ${FAINT}; }

                    .topnav-icon-btn {
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 2.25rem;
                        height: 2.25rem;
                        border-radius: 999px;
                        border: none;
                        background: transparent;
                        color: ${MUTED};
                        cursor: pointer;
                        transition: all 0.15s ease;
                    }
                    .topnav-icon-btn:hover { background: ${PRIMARY}0d; color: ${PRIMARY}; }
                    .unread-dot { position: absolute; top: 5px; right: 5px; width: 7px; height: 7px; border-radius: 999px; background: #f43f5e; border: 1.5px solid ${SURFACE}; }

                    .topnav-menu { position: relative; }
                    .topnav-card {
                        position: absolute;
                        top: calc(100% + 0.6rem);
                        right: 0;
                        width: 20rem;
                        background: ${SURFACE};
                        border: 1px solid ${BORDER};
                        border-radius: 0.75rem;
                        box-shadow: 0 12px 32px rgba(15, 23, 42, 0.1);
                        overflow: hidden;
                    }
                    .topnav-card .card-header { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-bottom: 1px solid ${BORDER}; }
                    .topnav-card .card-header h5 { font-size: 0.9rem; font-weight: 800; color: ${INK}; margin: 0; }
                    .topnav-card .link-btn { border: none; background: none; font-size: 0.75rem; font-weight: 700; color: ${PRIMARY}; cursor: pointer; }
                    .topnav-card .card-body { max-height: 22rem; overflow-y: auto; }
                    .topnav-card .card-footer { padding: 0.65rem; text-align: center; border-top: 1px solid ${BORDER}; }
                    .topnav-card .card-footer a { font-size: 0.75rem; font-weight: 700; color: ${PRIMARY}; text-decoration: none; }

                    .notification-row { display: flex; gap: 0.7rem; padding: 0.75rem 1rem; border-bottom: 1px solid #f1f5f9; }
                    .notification-row:last-child { border-bottom: none; }
                    .notification-row.unread { background: ${PRIMARY}08; }
                    .notification-name { font-size: 0.82rem; font-weight: 700; color: ${INK}; margin: 0; }
                    .notification-message { font-size: 0.76rem; color: ${MUTED}; margin: 0.1rem 0; }
                    .notification-time { font-size: 0.68rem; color: ${FAINT}; margin: 0; }

                    .avatar {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 999px;
                        background: ${PRIMARY}15;
                        color: ${PRIMARY};
                        font-weight: 800;
                        flex-shrink: 0;
                    }
                    .notification-row .avatar { width: 2.25rem; height: 2.25rem; font-size: 0.75rem; }
                    .avatar-l { width: 2.25rem; height: 2.25rem; font-size: 0.85rem; border: 1.5px solid ${BORDER}; }
                    .avatar-xl { width: 3.5rem; height: 3.5rem; font-size: 1.25rem; margin: 0 auto; }
                    .user-avatar-btn { border: none; background: none; cursor: pointer; padding: 0; border-radius: 999px; }
                    .user-card-body { text-align: center; padding: 1.25rem 1rem 1rem; }
                    .user-card-body h6 { margin: 0.6rem 0 0.1rem; font-size: 0.9rem; font-weight: 800; color: ${INK}; }
                    .user-card-body p { margin: 0; font-size: 0.75rem; color: ${MUTED}; }
                    .btn-signout {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.4rem;
                        width: 100%;
                        padding: 0.55rem;
                        border-radius: 0.5rem;
                        border: 1px solid ${BORDER};
                        background: ${SURFACE};
                        color: ${INK};
                        font-size: 0.8rem;
                        font-weight: 700;
                        cursor: pointer;
                        text-decoration: none;
                    }
                    .btn-signout:hover { border-color: #f43f5e55; color: #e11d48; }
                `}
            </style>

            {/* -------------------------------------------------- Sidebar -- */}
            <Sidebar collapsible="icon" variant="sidebar" className="partner-sidebar">
                <div
                    style={{
                        position: 'absolute',
                        top: -80,
                        right: -80,
                        width: 280,
                        height: 280,
                        borderRadius: '50%',
                        background: `${PRIMARY}08`,
                        filter: 'blur(70px)',
                        pointerEvents: 'none',
                    }}
                />

                <div className="relative z-10 flex flex-col h-full w-full">
                    <SidebarHeader className="h-16 border-b px-4 py-0 flex items-center justify-center bg-white" style={{ borderColor: BORDER }}>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    asChild
                                    className="hover:bg-transparent hover:shadow-none p-0 flex justify-center group h-auto border-none! shadow-none! bg-transparent!"
                                >
                                    <Link href={dashboard()} prefetch className="flex items-center gap-3 w-full justify-center">
                                        <div className="bg-white p-1 rounded-full border shrink-0" style={{ borderColor: BORDER }}>
                                            <div className="bg-white rounded-full w-8 h-8 flex items-center justify-center overflow-hidden">
                                                <img
                                                    src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png"
                                                    alt="Logo"
                                                    className="h-full w-full object-cover scale-[1.79]"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start overflow-hidden group-data-[collapsible=icon]:hidden whitespace-nowrap">
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: AMBER }}>
                                                Partner Portal
                                            </span>
                                            <span style={{ fontSize: '0.95rem', fontWeight: 800, color: INK, lineHeight: 1.1 }}>
                                                StudyIn <span style={{ color: PRIMARY }}>Nepal</span>
                                            </span>
                                        </div>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-5 gap-5 scrollbar-none">
                        {/* Home — flat link, no group */}
                        <div className="flex flex-col gap-1">
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <Link href={homeItem.href} prefetch className="nav-link" data-active={isActive(homeItem.href, url)}>
                                        <homeItem.icon className="nav-link-icon" size={17} strokeWidth={1.75} />
                                        <span className="nav-link-text group-data-[collapsible=icon]:hidden">{homeItem.title}</span>
                                    </Link>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </div>

                        {/* Application — labeled section with hr, like Phoenix's "Apps" */}
                        <div className="flex flex-col gap-1">
                            <p className="sidebar-section-label group-data-[collapsible=icon]:hidden">Application</p>
                            <hr className="sidebar-section-line group-data-[collapsible=icon]:hidden" />
                            <div className="flex flex-col gap-1">
                                {navGroups.map((group) => (
                                    <NavGroupSection key={group.id} group={group} currentUrl={url} />
                                ))}
                            </div>
                        </div>
                    </SidebarContent>

                    <SidebarFooter className="border-t p-3 gap-3 bg-white" style={{ borderColor: BORDER }}>
                        <div className="flex flex-col gap-1">
                            <p className="sidebar-section-label group-data-[collapsible=icon]:hidden">System Settings</p>
                            <NavFooter items={footerNavItems} />
                        </div>
                        <div className="group-data-[collapsible=icon]:hidden">
                            <SidebarCollapseToggle />
                        </div>
                    </SidebarFooter>
                </div>
            </Sidebar>

            {/* ---------------------------------------------- Top navbar -- */}
            <header className="partner-topnav">
                <SidebarTrigger className="topnav-icon-btn md:hidden" />

                <div className="search-box hidden md:flex">
                    <Search size={16} strokeWidth={1.75} color={FAINT} />
                    <input type="search" placeholder="Search..." aria-label="Search" />
                </div>

                <div className="flex-1" />

                <div className="flex items-center gap-1">
                    <ThemeToggle />
                    <NotificationsMenu />
                    <UserMenu user={user} />
                </div>
            </header>
        </>
    );
}