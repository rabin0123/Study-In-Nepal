<?php

namespace App\Concerns;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProfileValidationRules
{
    /**
     * Get the validation rules used to validate user profiles.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function profileRules(?int $userId = null): array
    {
        return [
            'agency_name' => $this->agencyNameRules(),
            'name' => $this->nameRules(),
            'country' => $this->countryRules(),
            'contact_number' => $this->contactNumberRules(),
            'email' => $this->emailRules($userId),
        ];
    }

    /**
     * Get the validation rules used to validate agency names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function agencyNameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate user names.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function nameRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate the selected country.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function countryRules(): array
    {
        return ['required', 'string', 'max:255'];
    }

    /**
     * Get the validation rules used to validate contact numbers.
     *
     * Numbers are submitted already formatted in E.164 international
     * format, e.g. +923001234567 (see the country-aware phone input on
     * the registration and profile forms).
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function contactNumberRules(): array
    {
        return ['required', 'string', 'max:32', 'regex:/^\+[1-9]\d{6,14}$/'];
    }

    /**
     * Get the validation rules used to validate user emails.
     *
     * @return array<int, ValidationRule|array<mixed>|string>
     */
    protected function emailRules(?int $userId = null): array
    {
        return [
            'required',
            'string',
            'email',
            'max:255',
            $userId === null
                ? Rule::unique(User::class)
                : Rule::unique(User::class)->ignore($userId),
        ];
    }
}