<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstitutionalSurvey extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'agency_name',
        'agency_email',
        'agency_phone',
        'province',
        'years_in_operation',
        'recruitment_type',
        'local_students_recruited',
        'international_students_recruited',
        'aware_of_commissions',
        'interested_in_partnering',
        'currently_represents_institution',
        'represented_institutions',
        'readiness_ratings',
        'challenges',
        'challenges_other_text',
        'interested_in_training',
        'academic_programs',
        'academic_programs_other_text',
        'b2b_portal_useful',
        'encouraging_factors',
        'encouraging_factors_other_text',
        'interested_in_events',
        'priority_markets',
        'priority_markets_other_text',
        'minimum_commission',
        'annual_recruitment_capacity',
        'likelihood_official_partner',
        'top_recommendations',
        'willing_future_participation',
        'contact_details',
        'accepted_confidentiality',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'readiness_ratings' => 'array',
        'challenges' => 'array',
        'academic_programs' => 'array',
        'encouraging_factors' => 'array',
        'priority_markets' => 'array',
        'accepted_confidentiality' => 'boolean',
    ];
}