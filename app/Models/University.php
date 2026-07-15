<?php

namespace App\Models;

use App\Models\CourseDetail;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class University extends Model
{
    use HasFactory;

    

    protected $fillable = [
        'University',
        'university_logo_url',
        'college_logo_url',
        'College',
        'Location',
        'Course',
        'Intake',
        'Scholarship',
        'Amount',
        'ug_requirement',
        'pg_requirement',
        'stream',
        'level',
        'requireddocuments',
      
        
    ];

    
public function linkMatchingCourseDetail(): ?CourseDetail
{
    $match = CourseDetail::query()
        ->whereNull('university_id')
        ->whereRaw('LOWER(TRIM(university_name)) = ?', [mb_strtolower(trim($this->University))])
        ->whereRaw('LOWER(TRIM(college_name)) = ?', [mb_strtolower(trim($this->College))])
        ->whereRaw('LOWER(TRIM(course_name)) = ?', [mb_strtolower(trim($this->Course))])
        ->first();

    if (! $match) {
        return null;
    }

    $match->university_id = $this->id;
    $match->save();

    return $match;
}

    

}
