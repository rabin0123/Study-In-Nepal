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
    const [universityLogos, setUniversityLogos] = useState<Record<number, string>>({});
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const isFirstRender = useRef(true);

    // Fetch logos from the external API on mount
    useEffect(() => {
        const fetchLogos = async () => {
            try {
                const response = await fetch('https://admin.studyinnepal.com/api/university');
                const result = await response.json();
                
                // Accommodate potential API structures (direct array or paginated object)
                let uniList = [];
                if (Array.isArray(result)) {
                    uniList = result;
                } else if (result.data && Array.isArray(result.data)) {
                    uniList = result.data;
                } else if (result.data?.data && Array.isArray(result.data.data)) {
                    uniList = result.data.data;
                }

                // Map university ID to its logo
                const logosMap: Record<number, string> = {};
                uniList.forEach((uni: any) => {
                    if (uni.id && (uni.logo || uni.image || uni.logo_url)) {
                        logosMap[uni.id] = uni.logo || uni.image || uni.logo_url;
                    }
                });
                
                setUniversityLogos(logosMap);
            } catch (error) {
                console.error('Failed to fetch university logos:', error);
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

    const handleRowClick = (uuid: string) => {
        router.visit(`/course-details/${uuid}/edit`);
    };

    const handleImageError = (universityId: number) => {
        setImageErrors(prev => ({ ...prev, [universityId]: true }));
    };

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
                                        const hasValidLogo = row.university_id && universityLogos[row.university_id] && !imageErrors[row.university_id];

                                        return (
                                            <tr 
                                                key={row.uuid} 
                                                onClick={() => handleRowClick(row.uuid)}
                                                className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                                            >
                                                {/* College (First Column) */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-3.5">
                                                        <div className="h-10 w-10 flex-shrink-0 rounded-lg border border-gray-200 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                                                            {hasValidLogo ? (
                                                                <img 
                                                                    src={universityLogos[row.university_id!]} 
                                                                    alt={`${row.college_name} logo`}
                                                                    className="h-full w-full object-contain p-1.5"
                                                                    onError={() => handleImageError(row.university_id!)}
                                                                />
                                                            ) : (
                                                                <span className="text-gray-400 font-bold text-sm bg-gray-50 w-full h-full flex items-center justify-center">
                                                                    {row.college_name.charAt(0).toUpperCase()}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-semibold text-gray-900 group-hover:text-[#008AE6] transition-colors">
                                                            {row.college_name}
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
        </main>
    );
}