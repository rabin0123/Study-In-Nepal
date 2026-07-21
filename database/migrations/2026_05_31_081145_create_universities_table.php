<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('universities', function (Blueprint $table) {
            $table->id();
            $table->string('University');
            $table->string('university_logo_url')->nullable();
            $table->string('college_logo_url')->nullable();
            $table->string('College')->nullable();
            $table->string('Location')->nullable();
            $table->string('Course');
            $table->string('Intake');
            $table->string('Scholarship')->nullable();
            $table->string('Amount')->nullable();
            $table->text('ug_requirement')->nullable();
            $table->text('pg_requirement')->nullable();
            $table->string('stream');
            $table->string('level');
            $table->text('requireddocuments')->nullable();
            $table->timestamps();

            // Filter-column indexes for UniversityApiControler@index (level,
            // stream, course, university, college, location filters) and
            // for filterOptions() distinct-value lookups.
            $table->index('level');
            $table->index('stream');
            $table->index('Course');
            $table->index('University');
            $table->index('College');
            $table->index('Location');

            // Powers whereFullText() in UniversityApiControler@index.
            // Without this, LIKE '%term%' can't use any index and forces
            // a full table scan on every search keystroke.
            $table->fullText(['University', 'Course', 'College', 'Location', 'stream']);
        });

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
            // whenever a universities row is created/imported, and also
            // powers the leftJoin in UniversityApiControler@index.
            $table->index(['university_name', 'college_name', 'course_name'], 'course_details_match_idx');
        });
    }

    public function down(): void
    {
        // course_details has a FK to universities, so it must drop first.
        Schema::dropIfExists('course_details');
        Schema::dropIfExists('universities');
    }
};