<?php

namespace App\Http\Controllers;

use App\Models\InstitutionalSurvey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class InstitutionalSurveyController extends Controller
{
    /**
     * Display a listing of institutional readiness (HEI) survey submissions.
     */
    public function index(Request $request)
    {
        try {
            $query = InstitutionalSurvey::query();

            // Dynamic search
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    if (Schema::hasColumn('institutional_readiness_surveys', 'institution_name')) {
                        $q->where('institution_name', 'like', '%' . $search . '%')
                          ->orWhere('institution_email', 'like', '%' . $search . '%')
                          ->orWhere('university_affiliation', 'like', '%' . $search . '%');
                    }
                });
            }

            // Optional filter for overall readiness or other fields
            if ($request->has('overall_readiness') && !empty($request->overall_readiness) && Schema::hasColumn('institutional_readiness_surveys', 'overall_readiness')) {
                $query->where('overall_readiness', $request->overall_readiness);
            }

            // Determine if we show everything or paginate
            $perPage = $request->input('per_page');

            if ($perPage === 'all' || $request->has('all')) {
                $surveys = $query->orderBy('created_at', 'desc')->get();
            } elseif (is_numeric($perPage)) {
                $surveys = $query->orderBy('created_at', 'desc')->paginate((int) $perPage);
            } else {
                $surveys = $query->orderBy('created_at', 'desc')->paginate(15);
            }

            // Safely assemble metrics depending on column availability
            $metrics = [
                'total_submissions' => InstitutionalSurvey::count(),
            ];

            if (Schema::hasColumn('institutional_readiness_surveys', 'overall_readiness')) {
                $metrics['highly_ready'] = InstitutionalSurvey::where('overall_readiness', 'Highly Ready')->count();
            }
            if (Schema::hasColumn('institutional_readiness_surveys', 'interested_in_study_nepal')) {
                $metrics['interested_in_study_nepal'] = InstitutionalSurvey::where('interested_in_study_nepal', 'Yes')->count();
            }

            return response()->json([
                'success' => true,
                'metrics' => $metrics,
                'data' => $surveys
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load survey data.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created survey in storage.
     */
    public function store(Request $request)
    {
        // Simple helper array-to-string format for Laravel text storage
        $input = $request->all();

        // Convert array inputs to strings if database schema expects string storage
        foreach (['barriers', 'support_types', 'academic_disciplines'] as $field) {
            if (isset($input[$field]) && is_array($input[$field])) {
                $input[$field] = json_encode($input[$field]);
            }
        }

        $validator = Validator::make($input, [
            // Institutional Information
            'institution_name' => 'required|string|max:255',
            'university_affiliation' => 'required|string|max:255',
            'institution_email' => 'required|email|max:255',
            'institution_phone' => 'required|string|max:50',

            // Institutional Readiness
            'has_international_office' => 'required|string|in:Yes,No,Under Development',
            'currently_enrolling_international' => 'required|string|in:Yes,No',
            'international_students_enrolled' => 'nullable|integer|min:0',
            'has_internationalization_strategy' => 'required|string|in:Yes,Under Development,No',
            'has_active_partnerships' => 'required|string|in:Yes,No',
            'overall_readiness' => 'required|string|in:Highly Ready,Moderately Ready,Needs Improvement,Not Ready',
            'faculty_prepared' => 'required|string|in:Yes,Somewhat,No',
            'infrastructure_adequacy' => 'required|string|in:Fully Adequate,Partially Adequate,Inadequate,Not Available',

            // Challenges & Policy Environment
            'barriers' => 'nullable',
            'barriers_other_text' => 'nullable|string|max:1000',
            'policy_support_level' => 'required|string|in:Adequately Supportive,Partially Supportive,Not Supportive',

            // Future Priorities
            'support_types' => 'nullable',
            'support_types_other_text' => 'nullable|string|max:1000',
            'academic_disciplines' => 'nullable',
            'academic_disciplines_other_text' => 'nullable|string|max:1000',
            'interested_in_study_nepal' => 'required|string|in:Yes,Maybe,No',
            'policy_reform_recommendation' => 'nullable|string|max:2000',

            'accepted_confidentiality' => 'required|accepted',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error has occurred.',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $survey = InstitutionalSurvey::create($validator->validated());

            return response()->json([
                'success' => true,
                'message' => 'Survey submitted successfully.',
                'data' => $survey
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to persist details on backend.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Provide statistics data required by the React components tab view.
     */
    public function stats()
    {
        try {
            $stats = [];

            $aggregate = function ($column) {
                if (!Schema::hasColumn('institutional_readiness_surveys', $column)) {
                    return [];
                }
                return InstitutionalSurvey::select($column, DB::raw('count(*) as count'))
                    ->whereNotNull($column)
                    ->groupBy($column)
                    ->get();
            };

            $stats['total'] = InstitutionalSurvey::count();

            $stats['by_readiness'] = $aggregate('overall_readiness');
            $stats['by_office'] = $aggregate('has_international_office');
            $stats['by_enrolling'] = $aggregate('currently_enrolling_international');
            $stats['by_interest'] = $aggregate('interested_in_study_nepal');
            $stats['by_infrastructure'] = $aggregate('infrastructure_adequacy');
            $stats['by_policy_support'] = $aggregate('policy_support_level');

            return response()->json([
                'success' => true,
                'data' => $stats
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate stats.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified survey from storage.
     */
    public function destroy($id)
    {
        try {
            $survey = InstitutionalSurvey::findOrFail($id);
            $survey->delete();

            return response()->json([
                'success' => true,
                'message' => 'Survey record deleted successfully.'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete entry.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}