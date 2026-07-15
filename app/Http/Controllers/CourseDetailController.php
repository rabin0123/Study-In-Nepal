<?php

namespace App\Http\Controllers;

use App\Models\CourseDetail;
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

        return Inertia::render('courses/index', [
            'courseDetails' => $courseDetails,
            'filters'       => ['search' => $search],
        ]);
    }

    /**
     * Standalone create form.
     */
    public function create(): Response
    {
        return Inertia::render('courses/create');
    }

    /**
     * Store a newly created resource in storage.
     * Updated to handle multiple institutions sharing the same course mapping.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validate the new multi-institution payload
        $validated = $request->validate([
            'course_name'                                  => 'required|string|max:255',
            'summary'                                      => 'nullable|string',
            'careers'                              => 'nullable|string', // Replaced careers array with HTML string
            
            'fees'                                         => 'nullable|array',
            'fees.*.year'                                  => 'required_with:fees|integer|min:1',
            'fees.*.amount'                                => 'nullable|string|max:100',
            'fees.*.currency'                              => 'nullable|string|max:10',
            'fees.*.note'                                  => 'nullable|string|max:255',
            
            'institutions'                                 => 'required|array|min:1',
            'institutions.*.university_name'               => 'required|string|max:255',
            'institutions.*.college_name'                  => 'required|string|max:255',
            'institutions.*.year_wise_modules'             => 'nullable|array',
            'institutions.*.year_wise_modules.*.year'      => 'required_with:institutions.*.year_wise_modules|integer|min:1',
            'institutions.*.year_wise_modules.*.title'     => 'nullable|string|max:255',
            'institutions.*.year_wise_modules.*.modules'   => 'nullable|array',
            'institutions.*.year_wise_modules.*.modules.*' => 'string|max:255',
        ]);

        $firstCreated = null;

        // 2. Loop through each selected institution and create a CourseDetail record
        DB::transaction(function () use ($validated, &$firstCreated) {
            foreach ($validated['institutions'] as $inst) {
                $courseDetail = CourseDetail::create([
                    'course_name'       => $validated['course_name'],
                    'summary'           => $validated['summary'] ?? null,
                    'careers'   => $validated['careers'] ?? null,
                    'fees'              => $validated['fees'] ?? null,
                    
                    'university_name'   => $inst['university_name'],
                    'college_name'      => $inst['college_name'],
                    'year_wise_modules' => $inst['year_wise_modules'] ?? null,
                ]);

                // Store the first one to return in the JSON response so the frontend can redirect to it
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
    public function show(CourseDetail $courseDetail): Response
    {
        $courseDetail->load('university');

        return Inertia::render('courses/show', [
            'courseDetail' => $courseDetail,
        ]);
    }

    /**
     * Show edit form for a single Course Detail.
     */
    public function edit(CourseDetail $courseDetail): Response
    {
        return Inertia::render('courses/edit', [
            'courseDetail' => $courseDetail,
        ]);
    }

    /**
     * Update a SINGLE existing resource in storage.
     * Since edit usually modifies one specific row, it uses a flat validation structure.
     */
    public function update(Request $request, CourseDetail $courseDetail): JsonResponse
    {
        // For individual updates, we expect the flat structure
        $validated = $request->validate([
            'university_name'                   => 'sometimes|required|string|max:255',
            'college_name'                      => 'sometimes|required|string|max:255',
            'course_name'                       => 'sometimes|required|string|max:255',

            'summary'                           => 'nullable|string',
            'careers'                   => 'nullable|string', // Note the switch from 'careers' to 'careers_summary'

            'year_wise_modules'                 => 'nullable|array',
            'year_wise_modules.*.year'          => 'required_with:year_wise_modules|integer|min:1',
            'year_wise_modules.*.title'         => 'nullable|string|max:255',
            'year_wise_modules.*.modules'       => 'nullable|array',
            'year_wise_modules.*.modules.*'     => 'string|max:255',

            'fees'                              => 'nullable|array',
            'fees.*.year'                       => 'required_with:fees|integer|min:1',
            'fees.*.amount'                     => 'nullable|string|max:100',
            'fees.*.currency'                   => 'nullable|string|max:10',
            'fees.*.note'                       => 'nullable|string|max:255',
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
    public function destroy(CourseDetail $courseDetail): JsonResponse
    {
        $courseDetail->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course details deleted successfully.',
        ]);
    }
}