<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SurveyResponse extends Model
{
    use HasFactory;

    /**
     * The database table used by the model.
     */
    protected $table = 'survey_responses';

    /**
     * All fields that may be mass-assigned via ::create() or ->fill().
     */
    protected $fillable = [
        // Section A
        'name',
        'country',
        'age_group',
        'gender',
        'study_level',
        'faculty_program',
        'financing',
        'scholarship_sources',
        'scholarship_other_text',
        'scholarship_percentage',
        'scholarship_percentage_other_text',
        'financing_remarks',
        'duration_with_ku',
        'duration_before_ku',

        // Section B
        'how_knew_nepal',
        'reasons_selecting_nepal',
        'perception_before',
        'why_kathmandu_university',
        'ease_of_finding_info',

        // Section C
        'admission_process_start',
        'admission_process_rating',
        'admission_duration',

        // Section D
        'university_ratings',
        'accommodation_arrangement',
        'accommodation_other_text',
        'living_ratings',
        'other_ratings',
        'inclusion_ratings',

        // Section E
        'visa_status',
        'visa_status_other_text',
        'visa_overall_rating',
        'visa_detailed_ratings',
        'visa_challenge_ratings',
        'visa_change_suggestion',

        // Section F
        'overall_satisfaction',
        'recommend_nepal',
        'positive_aspects',
        'biggest_challenges',
        'improvements',
        'additional_comments',

        // Declaration
        'consent_acknowledged',

        // Meta
        'ip_address',
        'user_agent',
    ];

    /**
     * Columns that should be automatically cast.
     *
     * JSON columns are cast to/from PHP arrays so callers never have to
     * call json_decode() / json_encode() manually. Without these casts,
     * passing an array straight to ::create() throws an
     * "Array to string conversion" QueryException.
     */
    protected $casts = [
        'financing'               => 'array',
        'scholarship_sources'     => 'array',
        'reasons_selecting_nepal' => 'array',
        'university_ratings'      => 'array',
        'living_ratings'          => 'array',
        'other_ratings'           => 'array',
        'inclusion_ratings'       => 'array',
        'visa_detailed_ratings'   => 'array',
        'visa_challenge_ratings'  => 'array',
        'consent_acknowledged'    => 'boolean',
        'created_at'              => 'datetime',
        'updated_at'              => 'datetime',
    ];

    // ── Accessors / Helpers ──────────────────────────────────────────────

    /**
     * Return the respondent's first name only (useful for display).
     */
    public function getFirstNameAttribute(): string
    {
        return explode(' ', trim($this->name))[0];
    }

    /**
     * Convenience: did the student say they would recommend Nepal?
     */
    public function wouldRecommend(): bool
    {
        return in_array($this->recommend_nepal, ['Yes', 'Maybe']);
    }

    // ── Scopes ──────────────────────────────────────────────────────────

    /**
     * Filter responses by country.
     */
    public function scopeFromCountry($query, string $country)
    {
        return $query->where('country', $country);
    }

    /**
     * Filter by study level.
     */
    public function scopeAtLevel($query, string $level)
    {
        return $query->where('study_level', $level);
    }

    /**
     * Return only responses submitted within the last N days.
     */
    public function scopeRecent($query, int $days = 30)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }
}