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
            'institutions.*.year_wise_modules.*.modules'            => 'nullable|array',
'institutions.*.year_wise_modules.*.modules.*.name'     => 'required|string|max:255',
'institutions.*.year_wise_modules.*.modules.*.info'     => 'nullable|string|max:500',
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
    public function coursedetails(CourseDetail $courseDetail): Response
    {
        $courseDetail->load('university');

        return Inertia::render('university/course/show', [
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
            'year_wise_modules.*.modules'          => 'nullable|array',
'year_wise_modules.*.modules.*.name'   => 'required|string|max:255',
'year_wise_modules.*.modules.*.info'   => 'nullable|string|max:500',

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

public function getMatchedCourses(): JsonResponse
{
    // Cache the matched results for 30 minutes to keep page load times fast
    $matchedData = Cache::remember('matched_university_courses', 1800, function () {
        // 1. Fetch from the external API
        $response = Http::get('https://admin.studyinnepal.com/api/university');
        
        if (!$response->successful()) {
            return [];
        }
        
        $externalCourses = $response->json();
        $externalList = $externalCourses['data'] ?? $externalCourses;
        
        if (!is_array($externalList)) {
            return [];
        }

        // 2. Fetch all local CourseDetail records with their UUIDs
        // Only select the required columns for memory efficiency
        $localDetails = CourseDetail::select('uuid', 'university_name', 'college_name', 'course_name')->get();

        // 3. Normalized key generator to avoid mismatch issues with spaces/casing
        $normalize = function ($string) {
            if (!$string) return '';
            $s = trim($string);
            // Remove common duplicate white spaces and normalize punctuation
            $s = preg_replace('/[\x{FFFD}\x{2013}\x{2014}]/u', '-', $s);
            $s = preg_replace('/\s+/', ' ', $s);
            return strtolower($s);
        };

        // 4. Build a fast lookup map: "normalized_university|normalized_college|normalized_course" => uuid
        $lookupMap = [];
        foreach ($localDetails as $detail) {
            $key = $normalize($detail->university_name) . '|' . 
                   $normalize($detail->college_name) . '|' . 
                   $normalize($detail->course_name);
            $lookupMap[$key] = $detail->uuid;
        }

        // 5. Match the external list entries with the lookup map
        return array_map(function ($item) use ($normalize, $lookupMap) {
            $itemArray = (array) $item;

            $key = $normalize($itemArray['University'] ?? null) . '|' . 
                   $normalize($itemArray['College'] ?? null) . '|' . 
                   $normalize($itemArray['Course'] ?? null);

            // Append the matching uuid from our local db if it exists
            $itemArray['uuid'] = $lookupMap[$key] ?? null;

            return $itemArray;
        }, $externalList);
    });

    return response()->json([
        'success' => true,
        'data' => $matchedData
    ]);
}
}