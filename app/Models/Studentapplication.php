<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids; // or HasUuids
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class StudentApplication extends Model
{
    use HasUuids; // Laravel 11+ (recommended)

    /**
     * The primary key type.
     */
    protected $keyType = 'string';

    /**
     * IDs are not auto-incrementing.
     */
    public $incrementing = false;

    /**
     * Mass-assignable columns.
     */
    protected $fillable = [
        'created_by',
'app_id',
        // Student details
        'student_name',
        'phone_number',
        'email',
        'country',
        'date_of_birth',
        'passport_number',

        // Address details
        'address_line_1',
        'address_line_2',
        'city',
        'state_province_region',
        'postal_code',

        // Study plan
        'university_name',
        'college_name',
        'course_name',

        // Agency details
        'agency_reference_notes',
        'status', 
        'assigned_to',
        // Metadata
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'date_of_birth' => 'date',
    ];

    protected $appends = [
        'address',
        'agency_name',
        'avatar_url',
    ];
    protected static function booted(): void
{
    static::creating(function (StudentApplication $application) {
        if (empty($application->avatar)) {
            $application->avatar = static::generateRandomAvatar();
        }
    });
}

protected static function generateRandomAvatar(): string
{
    $type = random_int(0, 1) ? 'Male' : 'Female';
    $number = random_int(1, 10);

    return "{$type}{$number}.jpg"; // match your actual extension (.png / .jpg)
}
protected function avatarUrl(): Attribute
{
    return Attribute::make(
        get: fn () => $this->avatar
            ? asset('assets/avatar/' . $this->avatar)
            : asset('assets/avatar/default.jpg'),
    );
}

    /**
     * User who created the application.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Application remarks.
     */
    public function remarks(): HasMany
    {
        return $this->hasMany(Comments::class)->latest();
    }

    /**
     * Agency name from creator.
     */
    public function getAgencyNameAttribute(): ?string
    {
        return $this->creator?->agency_name;
    }

    /**
     * Age in years.
     */
    public function getAgeAttribute(): ?int
    {
        return $this->date_of_birth?->age;
    }

    /**
     * Full address.
     */
    public function getAddressAttribute(): string
    {
        return implode(', ', array_filter([
            $this->address_line_1,
            $this->address_line_2,
            $this->city,
            $this->state_province_region,
            $this->postal_code,
        ]));
    }
    public const STATUSES = [
    'PENDING REVIEW',
    'APPROVED',
    'REJECTED',
];

protected static function boot()
{
    parent::boot();

    static::creating(function ($application) {

        do {
            $appId = 'SIN' . random_int(10000, 99999);
        } while (self::where('app_id', $appId)->exists());

        $application->app_id = $appId;

        if (empty($application->id)) {
            $application->id = (string) Str::uuid();
        }
    });
}
public function assignedAgent()
{
    return $this->belongsTo(User::class, 'assigned_to');
}
}