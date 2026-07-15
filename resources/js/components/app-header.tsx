import { Link, usePage } from '@inertiajs/react';
import { Bell, BookOpen, Folder, LayoutGrid, Menu, Search, Settings } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { UserMenuContent } from '@/components/user-menu-content';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { BreadcrumbItem, NavItem } from '@/types';

// Theme Tokens
const PRIMARY = "#0ea5e9";
const AMBER = "#fbbf24";
const DARK = "#0a0a0a";

type Props = {
    breadcrumbs?: BreadcrumbItem[];
};

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const rightNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: Folder,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppHeader({ breadcrumbs = [] }: Props) {
    const page = usePage();
    const { auth } = page.props;
    const getInitials = useInitials();
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Castoro+Titling&family=Rajdhani:wght@500;600;700&display=swap');
                    
                    .partner-top-header {
                        background: rgba(255, 255, 255, 0.85);
                        backdrop-filter: blur(16px);
                        border-bottom: 1px solid rgba(14, 165, 233, 0.15);
                        box-shadow: 0 4px 30px rgba(14, 165, 233, 0.03);
                    }

                    .partner-typography {
                        font-family: 'Rajdhani', sans-serif !important;
                        letter-spacing: 0.05em;
                        font-weight: 600 !important;
                    }

                    /* Search Pill styling matches Auth Inputs */
                    .search-pill {
                        border-radius: 999px !important;
                        border: 1.5px solid #e5e7eb !important;
                        font-family: 'Rajdhani', sans-serif !important;
                        font-weight: 600 !important;
                        transition: all 0.3s ease !important;
                        color: #64748b !important;
                    }
                    .search-pill:hover {
                        border-color: ${PRIMARY} !important;
                        box-shadow: 0 0 0 4px rgba(14, 165, 233, 0.1) !important;
                        color: #0f172a !important;
                    }

                    /* Mobile Menu Sheet - Dark Luxury Theme */
                    .mobile-nav-sheet {
                        background: linear-gradient(135deg, ${DARK} 0%, #0f172a 60%, #0c2d48 100%) !important;
                        color: white !important;
                        border-right: 1px solid rgba(255, 255, 255, 0.08) !important;
                    }
                    .mobile-nav-link {
                        font-family: 'Rajdhani', sans-serif !important;
                        font-weight: 600 !important;
                        font-size: 0.95rem !important;
                        letter-spacing: 0.05em !important;
                        color: rgba(255, 255, 255, 0.65) !important;
                        transition: all 0.3s ease !important;
                    }
                    .mobile-nav-link:hover {
                        color: white !important;
                        background: rgba(14, 165, 233, 0.15) !important;
                    }
                    .mobile-nav-link[data-active="true"] {
                        color: white !important;
                        background: linear-gradient(90deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.05) 100%) !important;
                        border-left: 3px solid ${PRIMARY} !important;
                        border-radius: 0 0.5rem 0.5rem 0 !important;
                    }
                `}
            </style>
            
            <header className="partner-top-header sticky top-0 z-50 w-full">
                <div className="flex h-16 items-center px-4 md:px-6">
                    
                    {/* Mobile Menu & Logo */}
                    <div className="flex items-center gap-2 md:hidden">
                        <Sheet>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="left" className="w-[300px] p-0 mobile-nav-sheet relative overflow-hidden">
                                
                                {/* Ambient Background Glow for mobile sheet */}
                                <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `${PRIMARY}20`, filter: "blur(60px)", pointerEvents: "none" }} />
                                
                                <SheetTitle className="sr-only">Navigation</SheetTitle>
                                
                                {/* Mobile Header matches Sidebar branding */}
                                <SheetHeader className="border-b border-white/10 p-6 text-left bg-black/20 relative z-10">
                                    <Link href={dashboard()} className="flex items-center gap-4">
                                        <div className="bg-white/5 p-1.5 rounded-full border border-white/10 shadow-[0_0_15px_rgba(14,165,233,0.1)] shrink-0">
                                            <div className="bg-white rounded-full w-10 h-10 flex items-center justify-center overflow-hidden">
                                                <img 
                                                    src="https://admin.studyinnepal.com/storage/settings/JhagqBcT0B9QQkFcQkSplV50L2nwBTdMc7DJB0DM.png" 
                                                    alt="Study in Nepal" 
                                                    className="h-full w-full object-cover scale-[1.79]" 
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "0.6rem", fontWeight: "700", letterSpacing: "0.3em", textTransform: "uppercase", color: AMBER, marginBottom: "0.1rem" }}>
                                                Portal Access
                                            </span>
                                            <span style={{ fontFamily: "'Castoro Titling', serif", fontSize: "1.15rem", color: "white", lineHeight: 1, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                                                Partner <span style={{ color: PRIMARY }}>Hub</span>
                                            </span>
                                        </div>
                                    </Link>
                                </SheetHeader>

                                <div className="flex flex-col gap-6 p-4 relative z-10">
                                    <div className="flex flex-col space-y-1">
                                        <span className="px-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#0ea5e9] mb-2 font-['Rajdhani']">Menu</span>
                                        {mainNavItems.map((item) => (
                                            <Link
                                                key={item.title}
                                                href={item.href}
                                                data-active={isCurrentUrl(item.href)}
                                                className="mobile-nav-link flex items-center gap-3 rounded-md px-3 py-2.5"
                                            >
                                                {item.icon && <item.icon className="h-4 w-4 opacity-70 group-hover:opacity-100" />}
                                                {item.title}
                                            </Link>
                                        ))}
                                    </div>
                                    <div className="flex flex-col space-y-1">
                                        <span className="px-3 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-[#0ea5e9] mb-2 font-['Rajdhani']">Links</span>
                                        {rightNavItems.map((item) => (
                                            <a
                                                key={item.title}
                                                href={toUrl(item.href)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="mobile-nav-link flex items-center gap-3 rounded-md px-3 py-2.5"
                                            >
                                                {item.icon && <item.icon className="h-4 w-4 opacity-70" />}
                                                {item.title}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* Desktop Breadcrumbs */}
                    <div className="hidden md:flex items-center gap-4 partner-typography">
                        {breadcrumbs.length > 0 ? (
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        ) : (
                            <span className="text-[0.95rem] text-slate-800">Dashboard</span>
                        )}
                    </div>

                    {/* Right Side Actions */}
                    <div className="flex flex-1 items-center justify-end gap-3 sm:gap-4">
                        
                        {/* Upgraded Command Palette Search Button */}
                        <div className="w-full max-w-sm hidden sm:flex">
                            <Button
                                variant="outline"
                                className="search-pill relative h-10 w-full justify-start bg-white sm:pr-12"
                            >
                                <Search className="mr-2 h-4 w-4 text-[#0ea5e9]" />
                                <span className="hidden lg:inline-flex mt-0.5">Search resources...</span>
                                <span className="inline-flex lg:hidden mt-0.5">Search...</span>
                                <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-6 select-none items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 font-mono text-[10px] font-bold text-slate-500 opacity-100 sm:flex">
                                    <span className="text-xs">⌘</span>K
                                </kbd>
                            </Button>
                        </div>

                        {/* Action Icons */}
                        <nav className="flex items-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10 transition-all hidden sm:flex">
                                <Bell className="h-[18px] w-[18px]" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-slate-500 hover:text-[#0ea5e9] hover:bg-[#0ea5e9]/10 transition-all hidden sm:flex">
                                <Settings className="h-[18px] w-[18px]" />
                            </Button>

                            <div className="mx-2 h-5 w-[1px] bg-slate-200 hidden sm:block" />

                            {/* User Dropdown Profile Picture */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                                        <Avatar className="h-9 w-9 border-2 border-transparent transition-all duration-300 hover:border-[#0ea5e9] hover:shadow-[0_0_12px_rgba(14,165,233,0.3)]">
                                            <AvatarImage src={auth.user?.avatar} alt={auth.user?.name} />
                                            <AvatarFallback className="bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-bold font-['Rajdhani']">
                                                {getInitials(auth.user?.name ?? '')}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 font-['Rajdhani'] font-semibold" align="end" forceMount>
                                    {auth.user && <UserMenuContent user={auth.user} />}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
}