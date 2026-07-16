<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'university_name',
        'college_name',
        'course_name',
        'university_id',
        'summary',
        'year_wise_modules',
        'fees',
        'careers',
    ];

    protected $casts = [
        'year_wise_modules' => 'array',
        'fees'              => 'array',
      
    ];

    protected static function booted(): void
    {
        static::creating(function (CourseDetail $courseDetail) {
            if (empty($courseDetail->uuid)) {
                $courseDetail->uuid = (string) Str::uuid();
            }
        });

        // Try to link immediately on creation too, in case a matching
        // universities row already exists at the moment the standalone
        // form is submitted. The reverse direction — universities being
        // imported/created after this row already exists — is handled by
        // whatever fires University::matchCourseDetails() (see the
        // University model addition / import controller hook).
        static::created(function (CourseDetail $courseDetail) {
            $courseDetail->attemptLink();
        });
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function university()
    {
        return $this->belongsTo(University::class);
    }

    public function isLinked(): bool
    {
        return ! is_null($this->university_id);
    }
    protected function careers(): \Illuminate\Database\Eloquent\Casts\Attribute
{
    return \Illuminate\Database\Eloquent\Casts\Attribute::make(
        get: function ($value) {
            if (!is_string($value)) {
                return $value;
            }
            $decoded = json_decode($value, true);
            if (is_string($decoded)) {
                return $decoded; // correctly-stored plain JSON string
            }
            if (is_array($decoded) && isset($decoded['html']) && is_string($decoded['html'])) {
                return $decoded['html']; // legacy rows saved as {"html": "..."}
            }
            return $value; // fallback: return raw value as-is
        },
        set: fn ($value) => is_string($value) ? json_encode($value) : $value,
    );
}

    /**
     * Look for a universities row whose University/College/Course text
     * matches this detail's own name fields, and attach it if found.
     * Case-insensitive, trimmed exact match — deliberately not fuzzy, so a
     * bad auto-link never silently attaches the wrong course.
     */
    public function attemptLink(): bool
    {
        if ($this->isLinked()) {
            return true;
        }

        $match = University::query()
            ->whereRaw('LOWER(TRIM(University)) = ?', [mb_strtolower(trim($this->university_name))])
            ->whereRaw('LOWER(TRIM(College)) = ?', [mb_strtolower(trim($this->college_name))])
            ->whereRaw('LOWER(TRIM(Course)) = ?', [mb_strtolower(trim($this->course_name))])
            ->first();

        if (! $match) {
            return false;
        }

        $this->university_id = $match->id;
        $this->save();

        return true;
    }
}
