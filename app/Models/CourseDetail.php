<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class CourseDetail extends Model
{
    use HasFactory;

    protected $fillable = [
        'university_id',
        'summary',
        'year_wise_modules',
        'fees',
        'careers',
    ];

    protected $casts = [
        'year_wise_modules' => 'array',
        'fees'              => 'array',
        'careers'           => 'array',
    ];

    protected static function booted(): void
    {
        static::creating(function (CourseDetail $courseDetail) {
            if (empty($courseDetail->uuid)) {
                $courseDetail->uuid = (string) Str::uuid();
            }
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
}
