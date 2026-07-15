<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the `survey_responses` table that stores every submission
     * from the KU & Study In Nepal – Visa Policy Gap Dialogue Research form.
     */
    public function up(): void
    {
        Schema::create('survey_responses', function (Blueprint $table) {
            $table->id();

            // ── Section A: Personal Information ──────────────────────────
            $table->string('name');
            $table->string('country');
            $table->enum('age_group', ['18-22', '23-27', '28+']);
            $table->enum('gender', ['Male', 'Female', 'Prefer not to say'])->nullable();
            $table->enum('study_level', [
                'Undergraduate',
                'Postgraduate',
                'PhD',
                'Exchange/Short Course',
            ])->nullable();
            $table->string('faculty_program')->nullable();

            $table->json('financing')->nullable();                      // multi-select → JSON array
            $table->json('scholarship_sources')->nullable();            // multi-select → JSON array
            $table->string('scholarship_other_text')->nullable();
            $table->string('scholarship_percentage')->nullable();
            $table->string('scholarship_percentage_other_text')->nullable();
            $table->text('financing_remarks')->nullable();

            $table->string('duration_with_ku')->nullable();             // Q8
            $table->string('duration_before_ku')->nullable();           // Q8

            // ── Section B: Choosing Nepal & University ───────────────────
            $table->string('how_knew_nepal')->nullable();                // single choice
            $table->json('reasons_selecting_nepal')->nullable();         // multi-select → JSON array
            $table->string('perception_before')->nullable();
            $table->string('why_kathmandu_university')->nullable();
            $table->string('ease_of_finding_info')->nullable();

            // ── Section C: Admission Experience ──────────────────────────
            $table->string('admission_process_start')->nullable();
            $table->string('admission_process_rating')->nullable();
            $table->string('admission_duration')->nullable();

            // ── Section D: Experience with KU (rating grids) ─────────────
            // Each stored as JSON: { "Faculty Experience": "Good", ... }
            $table->json('university_ratings')->nullable();             // Q17
            $table->string('accommodation_arrangement')->nullable();    // Q18
            $table->string('accommodation_other_text')->nullable();     // Q18
            $table->json('living_ratings')->nullable();                 // Q19
            $table->json('other_ratings')->nullable();                  // Q20
            $table->json('inclusion_ratings')->nullable();              // Q21

            // ── Section E: Visa & Immigration ────────────────────────────
            $table->string('visa_status')->nullable();                  // Q22 (single select)
            $table->string('visa_status_other_text')->nullable();       // Q22
            $table->string('visa_overall_rating')->nullable();          // Q23
            $table->json('visa_detailed_ratings')->nullable();          // Q24 grid
            $table->json('visa_challenge_ratings')->nullable();         // Q25 grid
            $table->text('visa_change_suggestion')->nullable();         // Q26 open text

            // ── Section F: Final Feedback ─────────────────────────────────
            $table->string('overall_satisfaction')->nullable();
            $table->string('recommend_nepal')->nullable();
            $table->text('positive_aspects')->nullable();
            $table->text('biggest_challenges')->nullable();
            $table->text('improvements')->nullable();
            $table->text('additional_comments')->nullable();
            $table->boolean('consent_acknowledged')->default(false);

            // ── Meta ──────────────────────────────────────────────────────
            $table->string('ip_address', 45)->nullable();  // supports IPv6
            $table->string('user_agent')->nullable();
            $table->timestamps();                           // created_at, updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('survey_responses');
    }
};