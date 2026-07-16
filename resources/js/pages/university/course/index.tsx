import { useState, useEffect, useRef } from 'react';
import { Link, router } from '@inertiajs/react';

type CourseDetailRow = {
    uuid: string;
    university_name: string;
    college_name: string;
    course_name: string;
    university_id: number | null;
    created_at: string;
};

type Paginated<T> = {
    data: T[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
};

type Props = {
    courseDetails: Paginated<CourseDetailRow>;
    filters: { search: string | null };
};

export default function CourseDetailsIndex({ courseDetails, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [collegeLogos, setCollegeLogos] = useState<Record<string, string>>({});
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
    const isFirstRender = useRef(true);

    // Tracks which row's three-dot menu is currently open (by uuid)
    const [openMenuUuid, setOpenMenuUuid] = useState<string | null>(null);
    // Tracks the row pending delete confirmation (by uuid)
    const [pendingDeleteUuid, setPendingDeleteUuid] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);

    // Fetch logos from the external API on mount
    useEffect(() => {
        const fetchLogos = async () => {
            try {
                const response = await fetch('https://admin.studyinnepal.com/api/university');
                const result = await response.json();
                
                let dataList = [];
                if (Array.isArray(result)) {
                    dataList = result;
                } else if (result.data && Array.isArray(result.data)) {
                    dataList = result.data;
                }

                // Map 'College' name to 'college_logo_url'
                const logosMap: Record<string, string> = {};
                dataList.forEach((item: any) => {
                    if (item.College && item.college_logo_url) {
                        // Using trim() to prevent mismatch due to trailing spaces
                        logosMap[item.College.trim()] = item.college_logo_url;
                    }
                });
                
                setCollegeLogos(logosMap);
            } catch (error) {
                console.error('Failed to fetch college logos:', error);
            }
        };

        fetchLogos();
    }, []);

    // Debounced search effect
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const debounceTimer = setTimeout(() => {
            router.get(
                '/course-details',
                { search: search || undefined },
                { 
                    preserveState: true, 
                    preserveScroll: true, 
                    replace: true         
                }
            );
        }, 300);

        return () => clearTimeout(debounceTimer);
    }, [search]);

    // Close the open row menu when clicking anywhere outside of it
    useEffect(() => {
        if (!openMenuUuid) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setOpenMenuUuid(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openMenuUuid]);

    const handleRowClick = (uuid: string) => {
        router.visit(`/course-details/${uuid}/edit`);
    };

    const handleImageError = (collegeName: string) => {
        setImageErrors(prev => ({ ...prev, [collegeName]: true }));
    };

    const handleMenuToggle = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation(); // prevent the row click (navigate-to-edit) from firing
        setOpenMenuUuid((current) => (current === uuid ? null : uuid));
    };

    const handleDeleteClick = (e: React.MouseEvent, uuid: string) => {
        e.stopPropagation();
        setOpenMenuUuid(null);
        setPendingDeleteUuid(uuid);
    };

    const confirmDelete = () => {
        if (!pendingDeleteUuid) return;
        setIsDeleting(true);
        router.delete(`/course-details/${pendingDeleteUuid}`, {
            preserveScroll: true,
            onFinish: () => {
                setIsDeleting(false);
                setPendingDeleteUuid(null);
            },
        });
    };

    const cancelDelete = () => {
        if (isDeleting) return;
        setPendingDeleteUuid(null);
    };

    const rowPendingDelete = courseDetails.data.find((r) => r.uuid === pendingDeleteUuid) ?? null;

    return (
        <main className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Page Header */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                            Course Details
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage and view all registered courses, colleges, and university affiliations.
                        </p>
                    </div>
                    <Link 
                        href="/course/create" 
                        className="inline-flex items-center justify-center px-5 py-2.5 bg-[#008AE6] hover:bg-[#0071bf] text-white text-sm font-medium rounded-lg shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008AE6]"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Course
                    </Link>
                </header>

                {/* Main Data Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    
                    {/* Toolbar / Search Bar */}
                    <div className="p-4 border-b border-gray-200 bg-white sm:flex sm:items-center sm:justify-between">
                        <div className="relative max-w-md w-full">
                            <label className="sr-only" htmlFor="search">Search</label>
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                id="search"
                                type="text"
                                className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#008AE6]/20 focus:border-[#008AE6] sm:text-sm transition-all outline-none placeholder-gray-400"
                                placeholder="Search by university, college, or course..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Data Table */}
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50/70">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">College</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">University</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Course</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {courseDetails.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-500">
                                                <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                                <p className="text-base font-medium text-gray-900">No course details found</p>
                                                <p className="text-sm mt-1">Try adjusting your search or add a new course.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    courseDetails.data.map((row) => {
                                        const cleanCollegeName = row.college_name.trim();
                                        const logoUrl = collegeLogos[cleanCollegeName];
                                        const hasValidLogo = logoUrl && !imageErrors[cleanCollegeName];
                                        const isMenuOpen = openMenuUuid === row.uuid;

                                        return (
                                            <tr 
                                                key={row.uuid} 
                                                onClick={() => handleRowClick(row.uuid)}
                                                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                            >
                                                {/* College (First Column) */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center justify-between gap-3.5">
                                                        <div className="flex items-center gap-3.5 min-w-0">
                                                            <div className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                                                {hasValidLogo ? (
                                                                    <img 
                                                                        src={logoUrl} 
                                                                        alt={`${row.college_name} logo`}
                                                                        className="h-full w-full object-contain p-1.5"
                                                                        onError={() => handleImageError(cleanCollegeName)}
                                                                    />
                                                                ) : (
                                                                    <span className="text-gray-400 font-bold text-sm bg-gray-50 w-full h-full flex items-center justify-center">
                                                                        {row.college_name.charAt(0).toUpperCase()}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-semibold text-gray-900 group-hover:text-[#008AE6] transition-colors truncate">
                                                                {row.college_name}
                                                            </div>
                                                        </div>

                                                        {/* Three-dot row menu — hidden until the row is hovered
                                                            (or while its own menu is open, so it doesn't vanish
                                                            out from under an active click) */}
                                                        <div
                                                            className={`relative flex-shrink-0 ${
                                                                isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                            } transition-opacity`}
                                                            ref={isMenuOpen ? menuRef : undefined}
                                                        >
                                                            <button
                                                                type="button"
                                                                onClick={(e) => handleMenuToggle(e, row.uuid)}
                                                                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#008AE6]/30 transition-colors"
                                                                aria-haspopup="true"
                                                                aria-expanded={isMenuOpen}
                                                                aria-label={`More actions for ${row.college_name}`}
                                                            >
                                                                <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                                                                </svg>
                                                            </button>

                                                            {isMenuOpen && (
                                                                <div className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                                    <button
                                                                        type="button"
                                                                        onClick={(e) => handleDeleteClick(e, row.uuid)}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Delete
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                
                                                {/* University */}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {row.university_name}
                                                </td>

                                                {/* Course */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-[#008AE6]/10 text-[#008AE6] border border-[#008AE6]/20">
                                                        {row.course_name}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Options */}
                    {courseDetails.last_page > 1 && (
                        <div className="bg-gray-50/50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                            <div className="hidden sm:block text-sm text-gray-500">
                                Showing page <span className="font-medium text-gray-900">{courseDetails.current_page}</span> of <span className="font-medium text-gray-900">{courseDetails.last_page}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-end w-full sm:w-auto">
                                {courseDetails.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url ?? ''}
                                        preserveState
                                        className={`inline-flex items-center justify-center min-w-[32px] px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                            link.active 
                                                ? 'bg-[#008AE6] text-white shadow-sm' 
                                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                                        } ${
                                            !link.url ? 'opacity-50 cursor-not-allowed pointer-events-none bg-transparent border-transparent' : ''
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        aria-disabled={!link.url}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
            </div>

            {/* Delete confirmation modal */}
            {rowPendingDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-gray-900/40"
                        onClick={cancelDelete}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-sm p-6">
                        <h2 className="text-base font-semibold text-gray-900">Delete this course?</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            This will permanently remove{' '}
                            <span className="font-medium text-gray-700">{rowPendingDelete.course_name}</span> at{' '}
                            <span className="font-medium text-gray-700">{rowPendingDelete.college_name}</span>. This
                            action cannot be undone.
                        </p>
                        <div className="mt-5 flex justify-end gap-2.5">
                            <button
                                type="button"
                                onClick={cancelDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting…' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}