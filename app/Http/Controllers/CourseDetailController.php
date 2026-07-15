<?php

namespace App\Http\Controllers;

use App\Models\CourseDetail;
use App\Models\University;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CourseDetailController extends Controller
{
    /**
     * Inertia page for /courses/{university}.
     * `university` binds on its normal primary key — no uuid needed there.
     * course_details.uuid is only relevant once a details row exists, and
     * is passed down as data (courseDetail.uuid), not used for routing.
     * Data is loaded server-side and passed as props — no client fetch.
     */
    public function show(University $university): Response
    {
        $university->load('courseDetail');

        return Inertia::render('courses/show', [
            'university' => [
                'id'       => $university->id,
                'name'     => $university->University,
                'college'  => $university->College,
                'course'   => $university->Course,
                'stream'   => $university->stream,
                'level'    => $university->level,
                'intake'   => $university->Intake,
                'location' => $university->Location,
                'logoUrl'  => $university->university_logo_url,
            ],
            'courseDetail' => $university->courseDetail,
        ]);
    }

    /**
     * Inertia edit-form page (courses/edit.tsx). The form itself saves via
     * a plain fetch() POST to `store` below, not another Inertia visit —
     * see the edit.tsx component.
     */
    public function editPage(University $university): Response
    {
        $university->load('courseDetail');

        return Inertia::render('courses/edit', [
            'university'   => $university,
            'courseDetail' => $university->courseDetail,
        ]);
    }

    /**
     * Upsert — handles both first-time creation and subsequent edits, since
     * course_details.university_id is unique (1:1). Called from the edit
     * form's fetch(), not a full Inertia page visit. A fresh CourseDetail
     * gets its own uuid automatically (see CourseDetail::booted()).
     */
    public function store(Request $request, University $university): JsonResponse
    {
        $validated = $this->validated($request);

        $courseDetail = CourseDetail::updateOrCreate(
            ['university_id' => $university->id],
            $validated
        );

        return response()->json([
            'message'      => 'Course details saved successfully.',
            'courseDetail' => $courseDetail,
        ], 201);
    }

    public function destroy(University $university): JsonResponse
    {
        $deleted = CourseDetail::where('university_id', $university->id)->delete();

        if (! $deleted) {
            return response()->json([
                'success' => false,
                'message' => 'No course details found for this course.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Course details deleted successfully.',
        ]);
    }

    private function validated(Request $request): array
    {
        return $request->validate([
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
