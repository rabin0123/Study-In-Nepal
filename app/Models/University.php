<?php

namespace App\Models;

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

    

    

}
