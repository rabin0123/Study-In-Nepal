<?php

namespace App\Http\Controllers;

use App\Models\CourseDetail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

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

        return Inertia::render('course-details/index', [
            'courseDetails' => $courseDetails,
            'filters'       => ['search' => $search],
        ]);
    }

    /**
     * Standalone create form — no university lookup, just free-text
     * University/College/Course fields plus the detail content.
     */
    public function create(): Response
    {
        return Inertia::render('course-details/create');
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validated($request, forCreate: true);

        $courseDetail = CourseDetail::create($validated);
        // Linking to a matching universities row (if one already exists)
        // happens automatically in CourseDetail::booted()'s created hook.

        return response()->json([
            'message'      => 'Course details saved successfully.',
            'courseDetail' => $courseDetail,
        ], 201);
    }

    /**
     * Public detail page — /course-details/{courseDetail:uuid}.
     * Works whether or not this row has been linked to a universities row.
     */
    public function show(CourseDetail $courseDetail): Response
    {
        $courseDetail->load('university');

        return Inertia::render('course-details/show', [
            'courseDetail' => $courseDetail,
        ]);
    }

    public function edit(CourseDetail $courseDetail): Response
    {
        return Inertia::render('course-details/edit', [
            'courseDetail' => $courseDetail,
        ]);
    }

    public function update(Request $request, CourseDetail $courseDetail): JsonResponse
    {
        $validated = $this->validated($request, forCreate: false);

        $courseDetail->update($validated);

        return response()->json([
            'message'      => 'Course details updated successfully.',
            'courseDetail' => $courseDetail->fresh(),
        ]);
    }

    public function destroy(CourseDetail $courseDetail): JsonResponse
    {
        $courseDetail->delete();

        return response()->json([
            'success' => true,
            'message' => 'Course details deleted successfully.',
        ]);
    }

    private function validated(Request $request, bool $forCreate): array
    {
        $nameRules = $forCreate ? 'required|string|max:255' : 'sometimes|required|string|max:255';

        return $request->validate([
            'university_name'                   => $nameRules,
            'college_name'                       => $nameRules,
            'course_name'                         => $nameRules,

            'summary'                          => 'nullable|string',

            'year_wise_modules'                 => 'nullable|array',
            'year_wise_modules.*.year'           => 'required_with:year_wise_modules|integer|min:1',
            'year_wise_modules.*.title'          => 'nullable|string|max:255',
            'year_wise_modules.*.modules'        => 'nullable|array',
            'year_wise_modules.*.modules.*'      => 'string|max:255',

            'fees'                              => 'nullable|array',
            'fees.*.year'                        => 'required_with:fees|integer|min:1',
            'fees.*.amount'                      => 'nullable|string|max:100',
            'fees.*.currency'                    => 'nullable|string|max:10',
            'fees.*.note'                        => 'nullable|string|max:255',

            'careers'                           => 'nullable|array',
            'careers.*'                          => 'string|max:255',
        ]);
    }
}
