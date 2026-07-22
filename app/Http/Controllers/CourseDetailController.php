<?php

namespace App\Http\Controllers;

use App\Models\CourseDetail;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class CourseDetailController extends Controller
{
    /**
     * Listing page — /course-details. Useful for browsing/managing entries
     * regardless of whether they've been linked to a universities row yet.
     */
    public function index(Request $request): Response
    {
        $search = $request->query('search');

        $courseDetails = CourseDetail::query()
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('university_name', 'like', "%{$search}%")
                        ->orWhere('college_name', 'like', "%{$search}%")
                        ->orWhere('course_name', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('university/course/index', [
            'courseDetails' => $courseDetails,
            'filters'       => ['search' => $search],
        ]);
    }

    /**
     * Standalone create form.
     */
    public function create(): Response
    {
        return Inertia::render('university/course/create');
    }

    /**
     * Store a newly created resource in storage.
     * Handles multiple institutions sharing the same course mapping, each
     * with its OWN modules and OWN fees (fees are no longer shared across
     * institutions — different colleges under the same course can charge
     * different tuition).
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validate the multi-institution payload. `fees` now lives under
        //    each institution instead of at the top level.
        $validated = $request->validate([
            'course_name' => 'required|string|max:255',
            'summary'     => 'nullable|string',
            'careers'     => 'nullable|string',

            'institutions'                                                           => 'required|array|min:1',
            'institutions.*.university_name'                                         => 'required|string|max:255',
            'institutions.*.college_name'                                            => 'required|string|max:255',

            // Year -> Semester -> Module Validation
            'institutions.*.year_wise_modules'                                       => 'nullable|array',
            'institutions.*.year_wise_modules.*.year'                                => 'required_with:institutions.*.year_wise_modules|integer|min:1',
            'institutions.*.year_wise_modules.*.title'                               => 'nullable|string|max:255',

            'institutions.*.year_wise_modules.*.semesters'                           => 'nullable|array',
            'institutions.*.year_wise_modules.*.semesters.*.title'                   => 'nullable|string|max:255',

            'institutions.*.year_wise_modules.*.semesters.*.modules'                 => 'nullable|array',
            'institutions.*.year_wise_modules.*.semesters.*.modules.*.name'         => 'required|string|max:255',
            'institutions.*.year_wise_modules.*.semesters.*.modules.*.info'         => 'nullable|string|max:500',
            'institutions.*.year_wise_modules.*.semesters.*.modules.*.credit_hours' => 'nullable|string|max:100',

            // Fees — now per institution.
            'institutions.*.fees'                                                    => 'nullable|array',
            'institutions.*.fees.*.year'                                             => 'required_with:institutions.*.fees|integer|min:1',
            'institutions.*.fees.*.amount'                                           => 'nullable|string|max:100',
            'institutions.*.fees.*.currency'                                         => 'nullable|string|max:10',
            'institutions.*.fees.*.note'                                             => 'nullable|string|max:255',
        ]);

        // 2. Check for duplicate entries (same course, university, and college) in the database
        $duplicates = [];
        foreach ($validated['institutions'] as $inst) {
            $exists = CourseDetail::where('course_name', $validated['course_name'])
                ->where('university_name', $inst['university_name'])
                ->where('college_name', $inst['college_name'])
                ->exists();

            if ($exists) {
                $duplicates[] = "{$inst['college_name']} ({$inst['university_name']})";
            }
        }

        // 3. Return standard 422 validation response if duplicates exist
        if (!empty($duplicates)) {
            return response()->json([
                'message' => 'The selected course details already exist for one or more institutions.',
                'errors' => [
                    'institutions' => [
                        'An entry already exists for "' . $validated['course_name'] . '" at: ' . implode(', ', $duplicates) . '.'
                    ]
                ]
            ], 422);
        }

        $firstCreated = null;

        // 4. Loop through each selected institution and create a CourseDetail
        //    record with its own modules AND its own fees.
        DB::transaction(function () use ($validated, &$firstCreated) {
            foreach ($validated['institutions'] as $inst) {
                $courseDetail = CourseDetail::create([
                    'course_name'       => $validated['course_name'],
                    'summary'           => $validated['summary'] ?? null,
                    'careers'           => $validated['careers'] ?? null,

                    'university_name'   => $inst['university_name'],
                    'college_name'      => $inst['college_name'],
                    'year_wise_modules' => $inst['year_wise_modules'] ?? null,
                    'fees'              => $inst['fees'] ?? null,
                ]);

                // Store the first one to return in the JSON response
                if (!$firstCreated) {
                    $firstCreated = $courseDetail;
                }
            }
        });

        return response()->json([
            'message'      => 'Course details saved successfully for selected institutions.',
            'courseDetail' => $firstCreated,
        ], 201);
    }

    /**
     * Public detail page.
     */
    public function show($uuid): Response
    {
        // 1. Find the CourseDetail using the UUID (throws 404 if not found)
        $courseDetail = CourseDetail::where('uuid', $uuid)->firstOrFail();

        // 2. Find the matching University record for context
        // Notice we are matching the capitalized column names from the `universities` table
        // against the snake_case column names from the `course_details` table.
        $university = University::where('Course', $courseDetail->course_name)
            ->where('College', $courseDetail->college_name)
            ->where('University', $courseDetail->university_name)
            ->first();

        return Inertia::render('university/course/show', [
            'university'   => $university,
            'courseDetail' => $courseDetail,
        ]);
    }

    /**
     * Show edit form for a single Course Detail.
     */
    public function edit(CourseDetail $courseDetail): Response
    {
        return Inertia::render('university/course/create', [
            'courseDetail' => $courseDetail,
        ]);
    }

    /**
     * Update a SINGLE existing resource in storage. `fees` here still
     * belongs to just this one (university, college) row — that's already
     * correct at the DB level since each CourseDetail row is one institution.
     */
    public function update(Request $request, CourseDetail $courseDetail): JsonResponse
    {
        $validated = $request->validate([
            'university_name'                                         => 'sometimes|required|string|max:255',
            'college_name'                                            => 'sometimes|required|string|max:255',
            'course_name'                                             => 'sometimes|required|string|max:255',

            'summary'                                                 => 'nullable|string',
            'careers'                                                 => 'nullable|string',

            // Year -> Semester -> Module Validation
            'year_wise_modules'                                       => 'nullable|array',
            'year_wise_modules.*.year'                                => 'required_with:year_wise_modules|integer|min:1',
            'year_wise_modules.*.title'                               => 'nullable|string|max:255',

            'year_wise_modules.*.semesters'                           => 'nullable|array',
            'year_wise_modules.*.semesters.*.title'                   => 'nullable|string|max:255',

            'year_wise_modules.*.semesters.*.modules'                 => 'nullable|array',
            'year_wise_modules.*.semesters.*.modules.*.name'          => 'required|string|max:255',
            'year_wise_modules.*.semesters.*.modules.*.info'          => 'nullable|string|max:500',
            'year_wise_modules.*.semesters.*.modules.*.credit_hours'  => 'nullable|string|max:100',

            'fees'                                                    => 'nullable|array',
            'fees.*.year'                                             => 'required_with:fees|integer|min:1',
            'fees.*.amount'                                           => 'nullable|string|max:100',
            'fees.*.currency'                                         => 'nullable|string|max:10',
            'fees.*.note'                                             => 'nullable|string|max:255',
        ]);

        $courseDetail->update($validated);

        return response()->json([
            'message'      => 'Course details updated successfully.',
            'courseDetail' => $courseDetail->fresh(),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CourseDetail $courseDetail)
    {
        $courseDetail->delete();

        return redirect()->back()->with('success', 'Course details deleted successfully.');
    }
}