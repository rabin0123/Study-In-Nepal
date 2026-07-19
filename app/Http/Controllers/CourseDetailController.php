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
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_name'                                  => 'required|string|max:255',
            'summary'                                      => 'nullable|string',
            'careers'                                      => 'nullable|string', 
            
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
            'institutions.*.year_wise_modules.*.modules.*.name' => 'required|string|max:255',
            'institutions.*.year_wise_modules.*.modules.*.info' => 'nullable|string|max:500',
        ]);

        // Helper to normalize strings so brackets and spaces don't trigger false duplicate checks
        $normalize = function ($value) {
            $decoded = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return mb_strtolower(preg_replace('/\s+/', '', $decoded));
        };

        // 2. Check for duplicate entries (ignores exact spacing issues for safety)
        $duplicates = [];
        foreach ($validated['institutions'] as $inst) {
            $exists = CourseDetail::query()
                ->whereRaw("REPLACE(LOWER(`course_name`), ' ', '') = ?", [$normalize($validated['course_name'])])
                ->whereRaw("REPLACE(LOWER(`university_name`), ' ', '') = ?", [$normalize($inst['university_name'])])
                ->whereRaw("REPLACE(LOWER(`college_name`), ' ', '') = ?", [$normalize($inst['college_name'])])
                ->exists();

            if ($exists) {
                $duplicates[] = "{$inst['college_name']} ({$inst['university_name']})";
            }
        }

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

        DB::transaction(function () use ($validated, &$firstCreated) {
            foreach ($validated['institutions'] as $inst) {
                $courseDetail = CourseDetail::create([
                    'course_name'       => $validated['course_name'],
                    'summary'           => $validated['summary'] ?? null,
                    'careers'           => $validated['careers'] ?? null,
                    'fees'              => $validated['fees'] ?? null,
                    
                    'university_name'   => $inst['university_name'],
                    'college_name'      => $inst['college_name'],
                    'year_wise_modules' => $inst['year_wise_modules'] ?? null,
                ]);

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
        $courseDetail = CourseDetail::where('uuid', $uuid)->firstOrFail();

        // 2. Find the matching University record for context.
        // First, check if the link relationship was successfully established natively.
        $university = null;
        if ($courseDetail->university_id) {
            $university = University::find($courseDetail->university_id);
        }

        // If not natively linked, perform robust text search stripping spaces.
        if (!$university) {
            $normalize = function ($value) {
                $decoded = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
                return mb_strtolower(preg_replace('/\s+/', '', $decoded));
            };

            $university = University::query()
                ->whereRaw("REPLACE(LOWER(`Course`), ' ', '') = ?", [$normalize($courseDetail->course_name)])
                ->whereRaw("REPLACE(LOWER(`College`), ' ', '') = ?", [$normalize($courseDetail->college_name)])
                ->whereRaw("REPLACE(LOWER(`University`), ' ', '') = ?", [$normalize($courseDetail->university_name)])
                ->first();
        }

        return Inertia::render('university/course/show', [
            'university'   => $university, 
            'courseDetail' => $courseDetail,
        ]);
    }
   
    public function edit(CourseDetail $courseDetail): Response
    {
        return Inertia::render('university/course/create', [
            'courseDetail' => $courseDetail,
        ]);
    }

    public function update(Request $request, CourseDetail $courseDetail): JsonResponse
    {
        $validated = $request->validate([
            'university_name'                   => 'sometimes|required|string|max:255',
            'college_name'                      => 'sometimes|required|string|max:255',
            'course_name'                       => 'sometimes|required|string|max:255',

            'summary'                           => 'nullable|string',
            'careers'                           => 'nullable|string',

            'year_wise_modules'                 => 'nullable|array',
            'year_wise_modules.*.year'          => 'required_with:year_wise_modules|integer|min:1',
            'year_wise_modules.*.title'         => 'nullable|string|max:255',
            'year_wise_modules.*.modules'       => 'nullable|array',
            'year_wise_modules.*.modules.*.name'=> 'required|string|max:255',
            'year_wise_modules.*.modules.*.info'=> 'nullable|string|max:500',

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

    public function destroy(CourseDetail $courseDetail)
    {
        $courseDetail->delete();

        return redirect()->back()->with('success', 'Course details deleted successfully.');
    }
}