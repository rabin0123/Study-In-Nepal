<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_details', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            // Entered directly on the standalone form — not pulled from an
            // existing universities row. These are what get matched against
            // universities.University / .College / .Course later on.
            $table->string('university_name');
            $table->string('college_name');
            $table->string('course_name');

            // Nullable and filled in automatically once a matching row shows
            // up in `universities` (see LinkCourseDetailsToUniversities).
            // Left null means "not linked yet" — the details still display
            // fine on their own, they just won't be reachable from a
            // university/course search result until linked.
            $table->foreignId('university_id')
                ->nullable()
                ->constrained('universities')
                ->nullOnDelete();

            $table->longText('summary')->nullable();

            // Dynamic year-wise modules, e.g.:
            // [ { "year": 1, "title": "Year 1", "modules": ["Intro to X", "Y Fundamentals"] }, ... ]
            $table->json('year_wise_modules')->nullable();

            // Standalone annual fee summary, e.g.:
            // [ { "year": 1, "amount": "12000", "currency": "USD", "note": "Tuition only" }, ... ]
            $table->json('fees')->nullable();

            // Careers after this course, e.g.: ["Software Engineer", "Data Analyst"]
            $table->json('careers')->nullable();

            $table->timestamps();

            // Speeds up the matching job/listener that looks up
            // course_details by (university_name, college_name, course_name)
            // whenever a universities row is created/imported.
            $table->index(['university_name', 'college_name', 'course_name'], 'course_details_match_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_details');
    }
};
