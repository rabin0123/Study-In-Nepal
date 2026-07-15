<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAgencySurveyRequest;
use App\Models\AgencySurvey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgencySurveyApiController extends Controller
{
    /**
     * GET /api/survey
     * Paginated list, newest first. The dashboard calls this with
     * ?per_page=500 to pull everything in one request.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = (int) $request->query('per_page', 15);
        $perPage = max(1, min($perPage, 500));

        $surveys = AgencySurvey::query()
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $surveys,
        ]);
    }

    /**
     * GET /api/survey/{survey}
     */
    public function show(AgencySurvey $survey): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $survey,
        ]);
    }

    /**
     * POST /api/survey
     * Handles submissions from AgencyReadinessSurveyForm.
     */
    public function store(StoreAgencySurveyRequest $request): JsonResponse
    {
        $survey = AgencySurvey::create($request->validated() + [
            'ip_address' => $request->ip(),
            'user_agent' => (string) $request->userAgent(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Survey submitted successfully.',
            'data' => $survey,
        ], 201);
    }

    /**
     * DELETE /api/survey/{survey}
     */
    public function destroy(AgencySurvey $survey): JsonResponse
    {
        $survey->delete();

        return response()->json([
            'success' => true,
            'message' => 'Survey response deleted.',
        ]);
    }

    /**
     * GET /api/survey/stats
     * Aggregates consumed by the dashboard's "Stats & Analytics" tab.
     *
     * Note: this loads every row into memory to aggregate the JSON
     * (array) columns in PHP, since aggregating JSON columns in SQL
     * isn't portable across MySQL/SQLite/Postgres. Fine for survey-scale
     * datasets (hundreds to low thousands of rows); if this table grows
     * very large, consider caching the result or moving the multi-select
     * aggregates into a normalized pivot table.
     */
    public function stats(): JsonResponse
    {
        $surveys = AgencySurvey::all();
        $total = $surveys->count();

        $pct = fn (int $count) => $total ? round(($count / $total) * 100) : 0;

        $frequency = function (string $field) use ($surveys) {
            return $surveys->pluck($field)
                ->filter(fn ($v) => filled($v))
                ->countBy()
                ->map(fn ($count, $label) => ['label' => $label, 'count' => $count])
                ->values()
                ->sortByDesc('count')
                ->values();
        };

        $frequencyMulti = function (string $field) use ($surveys) {
            return $surveys->pluck($field)
                ->filter()
                ->flatten()
                ->filter(fn ($v) => filled($v))
                ->countBy()
                ->map(fn ($count, $label) => ['label' => $label, 'count' => $count])
                ->values()
                ->sortByDesc('count')
                ->values();
        };

        // Average Likert score per readiness statement (Section C, Q9)
        $statementTotals = [];
        $statementCounts = [];
        foreach ($surveys as $survey) {
            foreach ((array) $survey->readiness_ratings as $statement => $rating) {
                $score = AgencySurvey::LIKERT_SCORES[$rating] ?? null;
                if ($score === null) {
                    continue;
                }
                $statementTotals[$statement] = ($statementTotals[$statement] ?? 0) + $score;
                $statementCounts[$statement] = ($statementCounts[$statement] ?? 0) + 1;
            }
        }

        $readinessStatementAverages = collect($statementTotals)
            ->map(fn ($total, $statement) => [
                'statement' => $statement,
                'average' => round($total / $statementCounts[$statement], 2),
            ])
            ->values();

        $overallReadinessAvg = (array_sum($statementCounts) > 0)
            ? round(array_sum($statementTotals) / array_sum($statementCounts), 2)
            : null;

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'provinces_represented' => $surveys->pluck('province')->filter()->unique()->count(),
                'partnering_yes_pct' => $pct($surveys->where('interested_in_partnering', 'Yes')->count()),
                'likely_partner_pct' => $pct(
                    $surveys->whereIn('likelihood_official_partner', ['Likely', 'Very Likely'])->count()
                ),
                'avg_readiness_score' => $overallReadinessAvg,

                'by_province' => $frequency('province'),
                'by_years_in_operation' => $frequency('years_in_operation'),
                'by_recruitment_type' => $frequency('recruitment_type'),
                'interested_in_partnering' => $frequency('interested_in_partnering'),
                'likelihood_official_partner' => $frequency('likelihood_official_partner'),
                'b2b_portal_useful' => $frequency('b2b_portal_useful'),
                'interested_in_training' => $frequency('interested_in_training'),
                'interested_in_events' => $frequency('interested_in_events'),

                'top_challenges' => $frequencyMulti('challenges'),
                'top_academic_programs' => $frequencyMulti('academic_programs'),
                'top_encouraging_factors' => $frequencyMulti('encouraging_factors'),
                'top_priority_markets' => $frequencyMulti('priority_markets'),

                'readiness_statement_averages' => $readinessStatementAverages,
            ],
        ]);
    }
}