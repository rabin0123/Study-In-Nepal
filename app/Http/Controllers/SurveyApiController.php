<?php

namespace App\Http\Controllers;

use App\Models\SurveyResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SurveyApiController extends Controller
{
    // ── Allowed enum values (kept as constants so they're easy to update) ──

    private const AGE_GROUPS  = ['18-22', '18–22', '23-27', '23–27', '28+'];
    private const GENDERS     = ['Male', 'Female', 'Prefer not to say'];
    private const STUDY_LEVELS = ['Undergraduate', 'Postgraduate', 'PhD', 'Exchange/Short Course'];

    // Section A
    private const FINANCING = [
        'Self-funded', 'Family-sponsored', 'Scholarship/Financial Assistance', 'Other',
    ];
    private const SCHOLARSHIP_SOURCES = [
        'Government scholarship (Home Country)',
        'Scholarship from a home-country institution/foundation',
        'International/Global scholarship',
        'Kathmandu University scholarship',
        'Scholarship from another university',
        'Other financial assistance',
    ];
    private const SCHOLARSHIP_PERCENTAGE = ['25%', '50%', '75%', '100%', 'Other'];

    // Section B
    private const HOW_KNEW_NEPAL = [
        'Social Media / Internet', 'University Promotion', 'Friends / Family',
        'Education Consultant', 'Events / Seminars', 'Other',
    ];
    private const REASONS_SELECTING_NEPAL = [
        'Affordable Education', 'Quality Education', 'Unique Courses', 'Cultural Experience',
        'Practical Learning', 'Safe Environment', 'Scholarship Opportunities',
        'Recommendation from Others', 'Other',
    ];
    private const PERCEPTION  = ['Very Positive', 'Positive', 'Neutral', 'Negative'];
    private const WHY_KU = [
        'Course Availability', 'University Reputation', 'Affordable Fees', 'Location',
        'Faculty Recommendation', 'Scholarship Opportunity', 'Other',
    ];
    private const EASE        = ['Very Easy', 'Easy', 'Difficult', 'Very Difficult'];

    // Section C
    private const ADM_START = [
        'Directly through University', 'Through Education Consultant/Agent',
        'Through Friends/Family', 'Online Research', 'Others',
    ];
    private const ADM_RATING  = ['Excellent', 'Good', 'Average', 'Difficult'];
    private const ADM_DURATION = [
        'Less than 1 Month', '1–3 Months', '1-3 Months',
        '3–6 Months', '3-6 Months', 'More than 6 Months',
    ];

    // Section D
    private const ACCOMMODATION_ARRANGEMENT = [
        'On-campus residence/hostel', 'Off-campus rental accommodation',
        'Living with family/relatives', 'Homestay', 'Other',
    ];
    private const BASIC_RATINGS  = ['Poor', 'Average', 'Good', 'Excellent'];
    private const UNIVERSITY_AREAS = [
        'Faculty Experience', 'Curriculum & Learning', 'Educational Infrastructure',
        'Practical Learning', 'Research Opportunities',
    ];
    private const LIVING_AREAS = [
        'Accommodation Availability', 'Accommodation Standards', 'Food & Hygiene', 'Safety & Security',
    ];
    private const OTHER_AREAS = [
        'Transportation Facilities', 'Internet & Communication Services', 'Banking Services',
        'Health/Medical Services', 'Insurance Support', 'Sports & Recreational Facilities',
        'Cultural & Social Activities', 'Outdoor Learning/Field Visit Opportunities',
        'Student Clubs & Extracurricular Activities',
    ];
    private const INCLUSION_AREAS = [
        'Equal Treatment and Respect', 'Freedom from Discrimination',
        'Gender-Friendly and Inclusive Environment',
        'Sense of Belonging within the University Community',
        'Support from Fellow Students and Staff',
    ];

    // Section E
    private const VISA_STATUS = [
        'Student Visa (Non-Tourist Category)',
        'Tourist Visa (Application for Student Visa in Process)',
        'In the Renewal Process',
        'Visa Application/Approval Pending',
        'Other (Please specify)',
        'Prefer not to disclose',
    ];
    private const VISA_DETAILED_AREAS = [
        'Online Information regarding the documents required to obtain the visa',
        'Online Information regarding Visa Obtaining Procedures',
        'Services at the Department of Immigration (at the time of changing visa status/renewing visa)',
        'Ministry of Education (MOE) Approval Process',
        'Maintaining Required Bank Balance/Funds',
        'The overall Visa Process',
    ];
    private const VISA_DETAILED_RATINGS = [
        'Excellent / Very Easy / Very Smooth', 'Good / Easy / Smooth',
        'Average / Difficult', 'Poor / Very Difficult',
    ];
    private const VISA_CHALLENGE_AREAS = [
        'Time taken in Processing Visa', 'Clarity in required Documentation',
        'Office Visits Required', 'Language Access',
        'Coordination Between Offices', 'Availability of Information',
    ];
    private const VISA_CHALLENGE_RATINGS = [
        'No Challenge', 'Minor Challenge', 'Moderate Challenge', 'Major Challenge',
    ];

    // Section F
    private const SATISFACTION   = ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very Dissatisfied'];
    private const RECOMMEND      = ['Yes', 'Maybe', 'No'];

    // ─────────────────────────────────────────────────────────────────────
    // POST /api/survey
    // Store a new survey submission.
    // ─────────────────────────────────────────────────────────────────────
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), $this->rules(), $this->messages());

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // Normalise em-dash variants that come from the React frontend
        $validated['age_group'] = str_replace('–', '-', $validated['age_group'] ?? '');
        $validated['admission_duration'] = str_replace('–', '-', $validated['admission_duration'] ?? '');

        // Multi-select fields → stored as JSON arrays
        $validated['financing'] = $request->input('financing', []);
        $validated['scholarship_sources'] = $request->input('scholarship_sources', []);
        $validated['reasons_selecting_nepal'] = $request->input('reasons_selecting_nepal', []);

        // Attach request meta
        $validated['ip_address'] = $request->ip();
        $validated['user_agent'] = $request->userAgent();

        $response = SurveyResponse::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Survey submitted successfully. Thank you for your participation!',
            'data'    => [
                'id'         => $response->id,
                'created_at' => $response->created_at->toISOString(),
            ],
        ], 201);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/survey  (admin / research team only – protect with auth middleware)
    // List all survey submissions with optional filters.
    // ─────────────────────────────────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = SurveyResponse::query()->latest();

        // Optional filters
        if ($country = $request->query('country')) {
            $query->fromCountry($country);
        }
        if ($level = $request->query('study_level')) {
            $query->atLevel($level);
        }
        if ($days = $request->query('recent_days')) {
            $query->recent((int) $days);
        }

        $responses = $query->paginate($request->query('per_page', 25));

        return response()->json([
            'success' => true,
            'data'    => $responses,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/survey/{id}
    // Show a single survey response.
    // ─────────────────────────────────────────────────────────────────────
    public function show(int $id): JsonResponse
    {
        $response = SurveyResponse::findOrFail($id);

        return response()->json([
            'success' => true,
            'data'    => $response,
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // GET /api/survey/stats
    // Aggregate statistics for the research dashboard.
    // ─────────────────────────────────────────────────────────────────────
    public function stats(): JsonResponse
    {
        $total = SurveyResponse::count();

        if ($total === 0) {
            return response()->json(['success' => true, 'data' => ['total' => 0]]);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'total'               => $total,
                'by_country'          => SurveyResponse::selectRaw('country, count(*) as count')
                                            ->groupBy('country')->orderByDesc('count')->get(),
                'by_study_level'      => SurveyResponse::selectRaw('study_level, count(*) as count')
                                            ->groupBy('study_level')->orderByDesc('count')->get(),
                'by_satisfaction'     => SurveyResponse::selectRaw('overall_satisfaction, count(*) as count')
                                            ->groupBy('overall_satisfaction')->get(),
                'recommend_breakdown' => SurveyResponse::selectRaw('recommend_nepal, count(*) as count')
                                            ->groupBy('recommend_nepal')->get(),
                'by_age_group'        => SurveyResponse::selectRaw('age_group, count(*) as count')
                                            ->groupBy('age_group')->get(),
                'by_visa_status'      => SurveyResponse::selectRaw('visa_status, count(*) as count')
                                            ->groupBy('visa_status')->get(),
                'by_accommodation'    => SurveyResponse::selectRaw('accommodation_arrangement, count(*) as count')
                                            ->groupBy('accommodation_arrangement')->get(),
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // DELETE /api/survey/{id}  (admin only)
    // ─────────────────────────────────────────────────────────────────────
    public function destroy(int $id): JsonResponse
    {
        SurveyResponse::findOrFail($id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Survey response deleted.',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────
    // Validation Rules
    // ─────────────────────────────────────────────────────────────────────
    private function rules(): array
    {
        return [
            // ── Section A: Personal Information ──
            'name'                    => ['required', 'string', 'max:255'],
            'country'                 => ['required', 'string', 'max:100'],
            'age_group'               => ['required', Rule::in(self::AGE_GROUPS)],
            'gender'                  => ['nullable', Rule::in(self::GENDERS)],
            'study_level'             => ['nullable', Rule::in(self::STUDY_LEVELS)],
            'faculty_program'         => ['nullable', 'string', 'max:255'],

            'financing'                          => ['nullable', 'array'],
            'financing.*'                        => ['string', Rule::in(self::FINANCING)],
            'scholarship_sources'                => ['nullable', 'array'],
            'scholarship_sources.*'              => ['string', Rule::in(self::SCHOLARSHIP_SOURCES)],
            'scholarship_other_text'             => ['nullable', 'string', 'max:255'],
            'scholarship_percentage'             => ['nullable', Rule::in(self::SCHOLARSHIP_PERCENTAGE)],
            'scholarship_percentage_other_text'  => ['nullable', 'string', 'max:50'],
            'financing_remarks'                  => ['nullable', 'string', 'max:1000'],

            'duration_with_ku'        => ['nullable', 'string', 'max:100'],
            'duration_before_ku'      => ['nullable', 'string', 'max:100'],

            // ── Section B: Choosing Nepal & University ──
            'how_knew_nepal'          => ['nullable', Rule::in(self::HOW_KNEW_NEPAL)],
            'reasons_selecting_nepal' => ['nullable', 'array'],
            'reasons_selecting_nepal.*' => ['string', Rule::in(self::REASONS_SELECTING_NEPAL)],
            'perception_before'       => ['nullable', Rule::in(self::PERCEPTION)],
            'why_kathmandu_university'=> ['nullable', Rule::in(self::WHY_KU)],
            'ease_of_finding_info'    => ['nullable', Rule::in(self::EASE)],

            // ── Section C: Admission Experience ──
            'admission_process_start' => ['nullable', Rule::in(self::ADM_START)],
            'admission_process_rating'=> ['nullable', Rule::in(self::ADM_RATING)],
            'admission_duration'      => ['nullable', Rule::in(self::ADM_DURATION)],

            // ── Section D: Experience with KU (JSON rating grids) ──
            'university_ratings'        => ['nullable', 'array'],
            'university_ratings.*'      => ['string', Rule::in(self::BASIC_RATINGS)],
            'accommodation_arrangement' => ['nullable', Rule::in(self::ACCOMMODATION_ARRANGEMENT)],
            'accommodation_other_text'  => ['nullable', 'string', 'max:255'],
            'living_ratings'             => ['nullable', 'array'],
            'living_ratings.*'           => ['string', Rule::in(self::BASIC_RATINGS)],
            'other_ratings'              => ['nullable', 'array'],
            'other_ratings.*'            => ['string', Rule::in(self::BASIC_RATINGS)],
            'inclusion_ratings'          => ['nullable', 'array'],
            'inclusion_ratings.*'        => ['string', Rule::in(self::BASIC_RATINGS)],

            // ── Section E: Visa & Immigration ──
            'visa_status'             => ['nullable', Rule::in(self::VISA_STATUS)],
            'visa_status_other_text'  => ['nullable', 'string', 'max:255'],
            'visa_overall_rating'     => ['nullable', Rule::in(self::BASIC_RATINGS)],
            'visa_detailed_ratings'   => ['nullable', 'array'],
            'visa_detailed_ratings.*' => ['string', Rule::in(self::VISA_DETAILED_RATINGS)],
            'visa_challenge_ratings'  => ['nullable', 'array'],
            'visa_challenge_ratings.*'=> ['string', Rule::in(self::VISA_CHALLENGE_RATINGS)],
            'visa_change_suggestion'  => ['nullable', 'string', 'max:2000'],

            // ── Section F: Final Feedback ──
            'overall_satisfaction'    => ['nullable', Rule::in(self::SATISFACTION)],
            'recommend_nepal'         => ['nullable', Rule::in(self::RECOMMEND)],
            'positive_aspects'        => ['nullable', 'string', 'max:3000'],
            'biggest_challenges'      => ['nullable', 'string', 'max:3000'],
            'improvements'            => ['nullable', 'string', 'max:3000'],
            'additional_comments'     => ['nullable', 'string', 'max:3000'],
            'consent_acknowledged' => ['required', 'accepted'],
        ];
    }

    private function messages(): array
    {
        return [
            'name.required'       => 'Please provide your full name.',
            'country.required'    => 'Please provide your country of origin.',
            'age_group.required'  => 'Please select your age group.',
            'age_group.in'        => 'Please select a valid age group.',
            'consent_acknowledged.required' => 'Please confirm the Confidentiality & Ethical Declaration.',
            'consent_acknowledged.accepted'  => 'You must accept the Confidentiality & Ethical Declaration before submitting.',
        ];
    }
}