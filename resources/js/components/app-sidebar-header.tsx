import { usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const page = usePage();
    const { auth } = page.props as any; // Cast as any or map to your page props type
    const getInitials = useInitials();

    return (
        <>
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@500;600;700&display=swap');
                    
                    .partner-sidebar-header {
                        background: rgba(255, 255, 255, 0.9) !important;
                        backdrop-filter: blur(12px);
                        border-bottom: 1.5px solid #e5e7eb !important;
                    }
                    
                    .partner-typography * {
                        font-family: 'Rajdhani', sans-serif !important;
                    }
                `}
            </style>
            
            <header className="partner-sidebar-header flex h-16 shrink-0 items-center justify-between gap-2 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-14 md:px-6 relative z-20 w-full">
                
                {/* ── Left Side: Trigger & Breadcrumbs ── */}
                <div className="flex items-center gap-3 partner-typography">
                    <SidebarTrigger className="-ml-1 text-slate-500 hover:text-[#0ea5e9] transition-colors duration-200 hover:bg-[#0ea5e9]/10 rounded-full h-9 w-9" />
                    
                    <div className="h-4 w-[1.5px] bg-slate-200 mx-1 hidden md:block"></div>
                    
                    <div className="text-[0.95rem] font-semibold tracking-[0.05em] text-[#1a1a1a]">
                        <Breadcrumbs breadcrumbs={breadcrumbs} />
                    </div>
                </div>

                {/* ── Right Side: User Profile Dropdown ── */}
                <div className="flex items-center gap-4 partner-typography">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-2.5 p-1 pr-3 rounded-full border-[1.5px] border-transparent hover:border-[#e5e7eb] hover:bg-slate-50 transition-all outline-none focus:ring-2 focus:ring-[#0ea5e9]/20">
                                <Avatar className="h-8 w-8 border-[1.5px] border-[#e5e7eb]">
                                    <AvatarImage src={auth?.user?.avatar} alt={auth?.user?.name} />
                                    <AvatarFallback className="bg-[#0ea5e9]/10 text-[#0ea5e9] text-xs font-bold">
                                        {getInitials(auth?.user?.name ?? 'User')}
                                    </AvatarFallback>
                                </Avatar>
                                
                                <div className="hidden sm:flex flex-col items-start mr-1">
                                    <span className="text-[0.85rem] font-bold text-slate-800 leading-tight tracking-wide">
                                        {auth?.user?.name || "Partner"}
                                    </span>
                                </div>
                                
                                <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 font-['Rajdhani'] font-semibold rounded-xl border-[#e5e7eb] shadow-[0_8px_30px_rgba(0,0,0,0.04)] mt-1" align="end" forceMount>
                            {auth?.user && <UserMenuContent user={auth.user} />}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </header>
        </>
    );
}