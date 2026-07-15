<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStudentApplicationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     * Enforces that the request comes from an authenticated login session.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    public function rules(): array
    {
        return [
            'student_name' => ['required', 'string', 'max:255'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:255'],
            'country' => ['required', 'string', 'max:100'],
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'passport_number' => ['nullable', 'string', 'max:50'],
            
            // Address Validation
            'address_line_1' => ['required', 'string', 'max:255'],
            'address_line_2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:150'],
            'state_province_region' => ['required', 'string', 'max:150'],
            'postal_code' => ['nullable', 'string', 'max:30'],

            'university_name' => ['required', 'string', 'max:255'],
            'course_name' => ['nullable', 'string', 'max:255'],
            'college_name' => ['nullable', 'string', 'max:255'],
    
            'agency_reference_notes' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.email' => 'Please provide a valid email address for the student.',
            'date_of_birth.before' => 'Date of birth must be a date in the past.',
        ];
    }
}