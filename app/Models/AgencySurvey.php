<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AgencySurvey extends Model
{
    /**
     * Mass-assignable columns. Matches the field names sent by the
     * AgencyReadinessSurveyForm React component 1:1, so the frontend
     * payload can be passed straight through after validation.
     */
    protected $fillable = [
        // Section A
        'agency_name',
        'agency_email',
        'agency_phone',
        'province',
        'years_in_operation',

        // Section B
        'recruitment_type',
        'local_students_recruited',
        'international_students_recruited',
        'aware_of_commissions',
        'interested_in_partnering',
        'currently_represents_institution',
        'represented_institutions',

        // Section C
        'readiness_ratings',

        // Section D
        'challenges',
        'challenges_other_text',
        'interested_in_training',

        // Section E
        'academic_programs',
        'academic_programs_other_text',

        // Section F
        'b2b_portal_useful',
        'encouraging_factors',
        'encouraging_factors_other_text',
        'interested_in_events',

        // Section G
        'priority_markets',
        'priority_markets_other_text',

        // Section H
        'minimum_commission',
        'annual_recruitment_capacity',
        'likelihood_official_partner',

        // Section I
        'top_recommendations',
        'willing_future_participation',
        'contact_details',

        // Metadata (set server-side in the controller, but listed here so
        // create() can fill them in one call)
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'readiness_ratings' => 'array',
        'challenges' => 'array',
        'academic_programs' => 'array',
        'encouraging_factors' => 'array',
        'priority_markets' => 'array',
        'local_students_recruited' => 'integer',
        'international_students_recruited' => 'integer',
    ];

    /**
     * Numeric weight for each Likert label, used to compute averages
     * for Section C (Agency Readiness) in the stats endpoint.
     */
    public const LIKERT_SCORES = [
        'Strongly Disagree' => 1,
        'Disagree' => 2,
        'Neutral' => 3,
        'Agree' => 4,
        'Strongly Agree' => 5,
    ];
}