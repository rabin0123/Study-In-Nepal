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
        // Removed custom JSON casts for 'careers' - it should just act as standard HTML string.
    ];

    protected static function booted(): void
    {
        static::creating(function (CourseDetail $courseDetail) {
            if (empty($courseDetail->uuid)) {
                $courseDetail->uuid = (string) Str::uuid();
            }
        });

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

    /**
     * Look for a universities row whose University/College/Course text
     * matches this detail's own name fields, and attach it if found.
     * Uses REPLACE() to ensure strings with brackets and multiple spaces matches.
     */
    public function attemptLink(): bool
    {
        if ($this->isLinked()) {
            return true;
        }

        $normalize = function ($value) {
            $decoded = html_entity_decode((string) $value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
            return mb_strtolower(preg_replace('/\s+/', '', $decoded));
        };

        $match = \App\Models\University::query()
            ->whereRaw("REPLACE(LOWER(`University`), ' ', '') = ?", [$normalize($this->university_name)])
            ->whereRaw("REPLACE(LOWER(`College`), ' ', '') = ?", [$normalize($this->college_name)])
            ->whereRaw("REPLACE(LOWER(`Course`), ' ', '') = ?", [$normalize($this->course_name)])
            ->first();

        if (! $match) {
            return false;
        }

        $this->university_id = $match->id;
        $this->saveQuietly(); // Use saveQuietly() to avoid infinitely triggering saved events 

        return true;
    }
}