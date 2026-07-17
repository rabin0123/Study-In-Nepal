<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * NOTE: This file was not provided in the original conversation — it has
 * been reconstructed from the field names, types, and conditional-required
 * logic visible in AgencyReadinessSurveyForm.tsx and AgencySurveyApiController.
 * Please diff this against your real StoreAgencySurveyRequest before deploying;
 * rule names/messages may not match 1:1.
 */
class StoreAgencySurveyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Section A
            'agency_name' => ['required', 'string', 'max:255'],
            'agency_email' => ['required', 'email', 'max:255'],
            'agency_phone' => ['required', 'string', 'max:30'],
            'province' => ['required', Rule::in([
                'Koshi', 'Madhesh', 'Bagmati', 'Gandaki', 'Lumbini', 'Karnali', 'Sudurpashchim',
            ])],
            'years_in_operation' => ['required', Rule::in([
                'Less than 1 year', '1–3 years', '4–7 years', '8–10 years', 'More than 10 years',
            ])],

            // Section B
            'recruitment_type' => ['required', Rule::in([
                'Local (Domestic Students)', 'International Students',
                'Both Local and International Students', 'No',
            ])],
            'local_students_recruited' => ['nullable', 'integer', 'min:0'],
            'international_students_recruited' => ['nullable', 'integer', 'min:0'],
            'aware_of_commissions' => ['required', Rule::in(['Yes', 'No', 'Not Sure'])],
            'interested_in_partnering' => ['required', Rule::in(['Yes', 'No', 'Maybe'])],
            'currently_represents_institution' => ['required', Rule::in(['Yes', 'No'])],
            'represented_institutions' => [
                Rule::requiredIf(fn () => $this->input('currently_represents_institution') === 'Yes'),
                'nullable', 'string', 'max:1000',
            ],

            // Section C
            'readiness_ratings' => ['nullable', 'array'],
            'readiness_ratings.*' => [Rule::in([
                'Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree',
            ])],

            // Section D
            'challenges' => ['nullable', 'array', 'max:3'],
            'challenges.*' => [Rule::in([
                'Limited international awareness', 'Visa and immigration procedures',
                'Lack of institutional marketing', 'Other',
            ])],
            'challenges_other_text' => [
                Rule::requiredIf(fn () => in_array('Other', (array) $this->input('challenges', []), true)),
                'nullable', 'string', 'max:500',
            ],
            'interested_in_training' => ['required', Rule::in(['Yes', 'No', 'Maybe'])],

            // Section E
            'academic_programs' => ['nullable', 'array'],
            'academic_programs.*' => [Rule::in([
                'Medical Education (MBBS, BDS, Nursing, Public Health, Allied Health Sciences)',
                'Tourism & Hospitality',
                'Buddhist & Himalayan Studies',
                'Mountaineering Studies',
                'Agriculture & Natural Sciences',
                'Volunteering with Studies',
                'Short-term / Exchange Programs',
                'Other',
            ])],
            'academic_programs_other_text' => [
                Rule::requiredIf(fn () => in_array('Other', (array) $this->input('academic_programs', []), true)),
                'nullable', 'string', 'max:500',
            ],

            // Section F
            'b2b_portal_useful' => ['required', Rule::in(['Yes', 'No', 'Not Sure'])],
            'encouraging_factors' => ['nullable', 'array'],
            'encouraging_factors.*' => [Rule::in([
                'MoU/Direct Partnership with Nepalese Higher Education Institutions',
                'Access to the Study Nepal B2B Portal',
                'Attractive Commission Structure',
                'Faster Admission and Visa Support',
                'Joint Education Fairs & B2B Meetings',
                'Other',
            ])],
            'encouraging_factors_other_text' => [
                Rule::requiredIf(fn () => in_array('Other', (array) $this->input('encouraging_factors', []), true)),
                'nullable', 'string', 'max:500',
            ],
            'interested_in_events' => ['required', Rule::in(['Yes', 'No', 'Maybe'])],

            // Section G
            'priority_markets' => ['nullable', 'array'],
            'priority_markets.*' => [Rule::in([
                'India', 'Bangladesh', 'Sri Lanka', 'Pakistan', 'Bhutan', 'Maldives',
                'Myanmar', 'Thailand', 'Vietnam', 'Indonesia', 'African Countries',
                'Central Asia', 'Middle East', 'Europe', 'North America', 'Other',
            ])],
            'priority_markets_other_text' => [
                Rule::requiredIf(fn () => in_array('Other', (array) $this->input('priority_markets', []), true)),
                'nullable', 'string', 'max:500',
            ],

            // Section H
            'minimum_commission' => ['required', Rule::in([
                'Less than NPR 50,000', 'NPR 50,000 – 75,000', 'NPR 75,000 – 100,000',
                'More than NPR 100,000', 'Depends on the institution/program',
            ])],
            'annual_recruitment_capacity' => ['required', Rule::in([
                '1–10', '11–25', '26–50', '51–100', 'More than 100',
            ])],
            'likelihood_official_partner' => ['required', Rule::in([
                'Very Unlikely', 'Unlikely', 'Neutral', 'Likely', 'Very Likely',
            ])],

            // Section I
            'top_recommendations' => ['nullable', 'string', 'max:2000'],
            'willing_future_participation' => ['required', Rule::in(['Yes', 'No'])],
            'contact_details' => [
                Rule::requiredIf(fn () => $this->input('willing_future_participation') === 'Yes'),
                'nullable', 'string', 'max:255',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'agency_email.email' => 'Please provide a valid email address for the agency.',
            'represented_institutions.required' => 'Please specify which institution(s) your agency represents.',
            'challenges_other_text.required' => 'Please specify your "Other" challenge.',
            'academic_programs_other_text.required' => 'Please specify your "Other" academic program.',
            'encouraging_factors_other_text.required' => 'Please specify your "Other" encouraging factor.',
            'priority_markets_other_text.required' => 'Please specify your "Other" market.',
            'contact_details.required' => 'Please provide your contact details so we can follow up.',
        ];
    }
}