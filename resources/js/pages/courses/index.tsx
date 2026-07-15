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
    const isFirstRender = useRef(true);

    useEffect(() => {
        // Skip the initial render so we don't trigger an unnecessary request on page load
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        // Debounce the search input to prevent firing a request on every keystroke
        const debounceTimer = setTimeout(() => {
            router.get(
                '/course-details',
                { search: search || undefined },
                { 
                    preserveState: true, 
                    preserveScroll: true, // Keeps the user's scroll position intact
                    replace: true         // Prevents filling the browser history with search states
                }
            );
        }, 300); // 300ms delay

        // Cleanup the timer if the user types again before the 300ms is up
        return () => clearTimeout(debounceTimer);
    }, [search]);

    return (
        <div className="min-h-screen bg-[#fafafa] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-10">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <h1 className="text-3xl sm:text-4xl font-serif text-gray-900 tracking-wide">
                        Course Details
                    </h1>
                    <Link 
                        href="/course/create" 
                        className="inline-flex items-center justify-center px-6 py-3 bg-[#008AE6] hover:bg-[#0071bf] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#008AE6]"
                    >
                        + New Course Details
                    </Link>
                </div>

                {/* Search Bar - Auto Search implementation */}
                <div className="bg-white p-6 md:p-8 rounded-none shadow-sm border border-gray-100">
                    <div className="relative max-w-3xl mx-auto">
                        <label className="sr-only" htmlFor="search">Search</label>
                        {/* Search Icon */}
                        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            id="search"
                            type="text"
                            className="block w-full pl-12 pr-6 py-4 border border-gray-200 bg-gray-50 rounded-full focus:ring-[#008AE6] focus:border-[#008AE6] sm:text-sm outline-none transition-colors"
                            placeholder="Search by university, college, or course name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white rounded-none shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-[#fafafa]">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Course</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">College</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">University</th>
                                    <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                    <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {courseDetails.data.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-400 tracking-wide">
                                            No course details found.
                                        </td>
                                    </tr>
                                )}
                                {courseDetails.data.map((row) => (
                                    <tr key={row.uuid} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {row.course_name}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                            {row.college_name}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                            {row.university_name}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm">
                                            {row.university_id ? (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-200">
                                                    Linked
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-yellow-50 text-yellow-700 border border-yellow-200">
                                                    Not linked
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <Link 
                                                href={`/course-details/${row.uuid}`} 
                                                className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#008AE6] transition-colors"
                                            >
                                                View <span className="text-sm leading-none group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">↗</span>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {courseDetails.last_page > 1 && (
                        <div className="bg-[#fafafa] px-6 py-5 border-t border-gray-100 flex items-center justify-center gap-2 flex-wrap">
                            {courseDetails.links.map((link, i) => (
                                <Link
                                    key={i}
                                    href={link.url ?? ''}
                                    preserveState
                                    className={`inline-flex items-center justify-center min-w-[36px] px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${
                                        link.active 
                                            ? 'bg-[#008AE6] text-white border-[#008AE6]' 
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-[#008AE6] hover:text-[#008AE6]'
                                    } ${
                                        !link.url ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                    aria-disabled={!link.url}
                                />
                            ))}
                        </div>
                    )}
                </div>
                
            </div>
        </div>
    );
}