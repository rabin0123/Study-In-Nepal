<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InstitutionalReadinessSurvey extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        // Institutional Information
        'institution_name',
        'university_affiliation',
        'institution_email',
        'institution_phone',

        // Institutional Readiness
        'has_international_office',
        'currently_enrolling_international',
        'international_students_enrolled',
        'has_internationalization_strategy',
        'has_active_partnerships',
        'overall_readiness',
        'faculty_prepared',
        'infrastructure_adequacy',

        // Challenges & Policy Environment
        'barriers',
        'barriers_other_text',
        'policy_support_level',

        // Future Priorities
        'support_types',
        'support_types_other_text',
        'academic_disciplines',
        'academic_disciplines_other_text',
        'interested_in_study_nepal',
        'policy_reform_recommendation',

        'accepted_confidentiality',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'barriers' => 'array',
        'support_types' => 'array',
        'academic_disciplines' => 'array',
        'international_students_enrolled' => 'integer',
        'accepted_confidentiality' => 'boolean',
    ];
}