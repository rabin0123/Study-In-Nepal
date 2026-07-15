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
     * Display a listing of institutional survey submissions.
     * Modified to allow returning all entries or dynamically paginating based on the request.
     */

/**my name is rabin */
    public function index(Request $request)
    {
        try {
            $query = InstitutionalSurvey::query();

            // Dynamic search compatible with both schemas (HEI or Agency)
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    if (Schema::hasColumn('institutional_surveys', 'institution_name')) {
                        $q->where('institution_name', 'like', '%' . $search . '%')
                          ->orWhere('email', 'like', '%' . $search . '%');
                    }
                    if (Schema::hasColumn('institutional_surveys', 'agency_name')) {
                        $q->orWhere('agency_name', 'like', '%' . $search . '%')
                          ->orWhere('agency_email', 'like', '%' . $search . '%');
                    }
                });
            }

            // Optional filter for Province or other fields
            if ($request->has('province') && !empty($request->province) && Schema::hasColumn('institutional_surveys', 'province')) {
                $query->where('province', 'like', '%' . $request->province . '%');
            }

            // Determine if we show everything or paginate
            $perPage = $request->input('per_page');

            if ($perPage === 'all' || $request->has('all')) {
                // Return everything from the database
                $surveys = $query->orderBy('created_at', 'desc')->get();
            } elseif (is_numeric($perPage)) {
                // Paginate based on the frontend request (e.g. per_page=500)
                $surveys = $query->orderBy('created_at', 'desc')->paginate((int) $perPage);
            } else {
                // Fallback to standard pagination
                $surveys = $query->orderBy('created_at', 'desc')->paginate(15);
            }

            // Safely assemble metrics depending on column availability
            $metrics = [
                'total_submissions' => InstitutionalSurvey::count(),
            ];

            if (Schema::hasColumn('institutional_surveys', 'likelihood_official_partner')) {
                $metrics['very_likely_partners'] = InstitutionalSurvey::where('likelihood_official_partner', 'Very Likely')->count();
            }
            if (Schema::hasColumn('institutional_surveys', 'interested_in_partnering')) {
                $metrics['interested_in_partnering'] = InstitutionalSurvey::where('interested_in_partnering', 'Yes')->count();
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
        foreach (['challenges', 'academic_programs', 'encouraging_factors', 'priority_markets', 'readiness_ratings'] as $field) {
            if (isset($input[$field]) && is_array($input[$field])) {
                $input[$field] = json_encode($input[$field]);
            }
        }

        $validator = Validator::make($input, [
            // Agency Profile
            'agency_name' => 'required|string|max:255',
            'agency_email' => 'required|email|max:255',
            'agency_phone' => 'required|string|max:50',
            'province' => 'required|string|max:255',
            'years_in_operation' => 'required|string|max:100',

            // Recruitment Experience
            'recruitment_type' => 'required|string|max:150',
            'local_students_recruited' => 'nullable|integer|min:0',
            'international_students_recruited' => 'nullable|integer|min:0',
            'aware_of_commissions' => 'required|string|in:Yes,No,Not Sure',
            'interested_in_partnering' => 'required|string|in:Yes,No,Maybe',
            'currently_represents_institution' => 'required|string|in:Yes,No',
            'represented_institutions' => 'nullable|string|max:1000',

            // Agency Readiness
            'readiness_ratings' => 'nullable',

            // Challenges & Training
            'challenges' => 'nullable',
            'challenges_other_text' => 'nullable|string|max:1000',
            'interested_in_training' => 'required|string|in:Yes,No,Maybe',

            // Academic Programs
            'academic_programs' => 'nullable',
            'academic_programs_other_text' => 'nullable|string|max:1000',

            // Promotion & Support
            'b2b_portal_useful' => 'required|string|in:Yes,No,Not Sure',
            'encouraging_factors' => 'nullable',
            'encouraging_factors_other_text' => 'nullable|string|max:1000',
            'interested_in_events' => 'required|string|in:Yes,No,Maybe',

            // Market Focus
            'priority_markets' => 'nullable',
            'priority_markets_other_text' => 'nullable|string|max:1000',

            // Commission & Partnership
            'minimum_commission' => 'required|string|max:255',
            'annual_recruitment_capacity' => 'required|string|max:100',
            'likelihood_official_partner' => 'required|string|in:Very Unlikely,Unlikely,Neutral,Likely,Very Likely',

            // Recommendations
            'top_recommendations' => 'nullable|string|max:2000',
            'willing_future_participation' => 'required|string|in:Yes,No',
            'contact_details' => 'nullable|string|max:255',

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

            // Helper to safely fetch grouped counts if columns exist
            $aggregate = function ($column) {
                if (!Schema::hasColumn('institutional_surveys', $column)) {
                    return [];
                }
                return InstitutionalSurvey::select($column, DB::raw('count(*) as count'))
                    ->whereNotNull($column)
                    ->groupBy($column)
                    ->get();
            };

            $stats['total'] = InstitutionalSurvey::count();
            
            // Checks columns for both potential database configurations
            $stats['by_readiness'] = $aggregate('overall_readiness');
            $stats['by_enrolling'] = $aggregate('enrolling_intl_students');
            $stats['by_office'] = $aggregate('has_intl_office');
            $stats['by_interest'] = $aggregate('interest_to_associate');

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