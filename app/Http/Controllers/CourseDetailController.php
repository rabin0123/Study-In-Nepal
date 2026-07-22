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

    public function universityindex()
    {
        $rows = DB::connection('studyinnepal')
            ->table('universities') // <-- replace with the real table name from Step 5
            ->get();

        return response()->json(['data' => $rows]);
    }

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
     * Updated to handle multiple institutions sharing the same course mapping and prevent duplicate entries.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validate the new multi-institution payload
        $validated = $request->validate([
            'course_name'                                  => 'required|string|max:255',
            'summary'                                      => 'nullable|string',
            'careers'                                      => 'nullable|string', // Replaced careers array with HTML string
            
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

        // 4. Loop through each selected institution and create a CourseDetail record
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
 public function show(CourseDetail $courseDetail): Response
{
    $university = $this->matchUniversityRow($courseDetail);

    return Inertia::render('courses/show', [
        'courseDetail' => array_merge($courseDetail->toArray(), [
            'university' => $university ? (array) $university : null,
        ]),
    ]);
}
/**
 * Match a CourseDetail against a row in the remote `studyinnepal`
 * universities table by university + college + course name, with
 * progressively looser fallbacks if an exact match isn't found.
 */
private function matchUniversityRow(CourseDetail $courseDetail)
{
    $normalize = function ($string) {
        if (!$string) return '';
        return preg_replace('/[^a-z0-9]/', '', strtolower(trim($string)));
    };

    $normUni = $normalize($courseDetail->university_name);
    $normCol = $normalize($courseDetail->college_name);
    $normCourse = $normalize($courseDetail->course_name);

    // 1. Exact match — fast path, done in SQL
    $university = DB::connection('studyinnepal')
        ->table('universities')
        ->where('University', $courseDetail->university_name)
        ->where('College', $courseDetail->college_name)
        ->where('Course', $courseDetail->course_name)
        ->first();

    if ($university) {
        return $university;
    }

    // Fetch all rows once, reuse for both fuzzy passes below
    $allRows = DB::connection('studyinnepal')->table('universities')->get();

    // 2. Fuzzy match on all three fields
    $university = $allRows->first(function ($row) use ($normalize, $normUni, $normCol, $normCourse) {
        $rowUni = $normalize($row->University);
        $rowCol = $normalize($row->College);
        $rowCourse = $normalize($row->Course);

        $uniMatches = $rowUni === $normUni || str_contains($rowUni, $normUni) || str_contains($normUni, $rowUni);
        $colMatches = $rowCol === $normCol || str_contains($rowCol, $normCol) || str_contains($normCol, $rowCol);
        $courseMatches = $rowCourse === $normCourse || str_contains($rowCourse, $normCourse) || str_contains($normCourse, $rowCourse);

        return $uniMatches && $colMatches && $courseMatches;
    });

    if ($university) {
        return $university;
    }

    // 3. Last resort — university + college only
    return $allRows->first(function ($row) use ($normalize, $normUni, $normCol) {
        $rowUni = $normalize($row->University);
        $rowCol = $normalize($row->College);

        return ($rowUni === $normUni || str_contains($rowUni, $normUni) || str_contains($normUni, $rowUni))
            && ($rowCol === $normCol || str_contains($rowCol, $normCol) || str_contains($normCol, $rowCol));
    });
}
    
    public function coursedetails(CourseDetail $courseDetail): Response
{
    $university = $this->matchUniversityRow($courseDetail);

    return Inertia::render('university/course/show', [
        'courseDetail' => array_merge($courseDetail->toArray(), [
            'university' => $university ? (array) $university : null,
        ]),
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
     * Update a SINGLE existing resource in storage.
     */
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(CourseDetail $courseDetail)
    {
        $courseDetail->delete();

        return redirect()->back()->with('success', 'Course details deleted successfully.');
    }
    
  public function resolve(Request $request)
{
    $university = $request->query('university');
    $college = $request->query('college');
    $course = $request->query('course');

    // 1. Attempt exact database match first
    $courseDetail = CourseDetail::where('university_name', $university)
        ->where('college_name', $college)
        ->where('course_name', $course)
        ->first();

    // Helper to normalize strings
    $normalize = function ($string) {
        if (!$string) return '';
        return preg_replace('/[^a-z0-9]/', '', strtolower(trim($string)));
    };

    $normUniReq = $normalize($university);
    $normColReq = $normalize($college);
    $normCourseReq = $normalize($course);

    // 2. Fallback: Fuzzy substring match
    if (!$courseDetail) {
        $courseDetail = CourseDetail::all()->first(function ($detail) use ($normalize, $normUniReq, $normColReq, $normCourseReq) {
            $normUniDb = $normalize($detail->university_name);
            $normColDb = $normalize($detail->college_name);
            $normCourseDb = $normalize($detail->course_name);

            $uniMatches = ($normUniDb === $normUniReq || str_contains($normUniDb, $normUniReq) || str_contains($normUniReq, $normUniDb));
            $colMatches = ($normColDb === $normColReq || str_contains($normColDb, $normColReq) || str_contains($normColReq, $normColDb));
            $courseMatches = ($normCourseDb === $normCourseReq || str_contains($normCourseDb, $normCourseReq) || str_contains($normCourseReq, $normCourseDb));

            return $uniMatches && $colMatches && $courseMatches;
        });
    }

    // 3. If a match is found, redirect to the course show page
    if ($courseDetail) {
        return redirect('/course/' . $courseDetail->uuid);
    }

    // 4. Debug output when accessed directly in the browser address bar
    if (!$request->header('X-Inertia')) {
        return response()->json([
            'success' => false,
            'message' => 'No course details found',
            'your_request' => [
                'university' => $university,
                'college' => $college,
                'course' => $course,
            ],
            'normalized_request_values' => [
                'university' => $normUniReq,
                'college' => $normColReq,
                'course' => $normCourseReq,
            ],
            'available_courses_currently_in_database' => CourseDetail::select('id', 'uuid', 'university_name', 'college_name', 'course_name')->get(),
        ], 404);
    }

    // 5. Safe fallback redirect back to explore page carrying the error and toast parameters
    return redirect()->back()->with([
        'error' => 'No course details found',
        'toast' => 'No course details found'
    ]);
}
}