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

            // 1:1 — each row in `universities` represents one (college, course)
            // pairing, so a course detail belongs to exactly one of those rows.
            $table->foreignId('university_id')
                ->unique()
                ->constrained('universities')
                ->cascadeOnDelete();

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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_details');
    }
};
