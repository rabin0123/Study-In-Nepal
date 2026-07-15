<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('agency_surveys', function (Blueprint $table) {
            $table->id();

            // ── Section A: Agency Profile ──
            $table->string('agency_name');
            $table->string('agency_email')->nullable(false)->default('');
            $table->string('agency_phone', 30)->nullable(false)->default('');
            $table->string('province');
            $table->string('years_in_operation');

            // ── Section B: Recruitment Experience ──
            $table->string('recruitment_type');
            $table->unsignedInteger('local_students_recruited')->nullable();
            $table->unsignedInteger('international_students_recruited')->nullable();
            $table->string('aware_of_commissions');
            $table->string('interested_in_partnering');
            $table->string('currently_represents_institution');
            $table->string('represented_institutions')->nullable();

            // ── Section C: Agency Readiness (Q9 Likert table) ──
            // Stored as { "<statement text>": "<Likert option>", ... }
            $table->json('readiness_ratings')->nullable();

            // ── Section D: Challenges & Training ──
            $table->json('challenges')->nullable();
            $table->string('challenges_other_text')->nullable();
            $table->string('interested_in_training');

            // ── Section E: Academic Programs ──
            $table->json('academic_programs')->nullable();
            $table->string('academic_programs_other_text')->nullable();

            // ── Section F: Promotion & Support ──
            $table->string('b2b_portal_useful');
            $table->json('encouraging_factors')->nullable();
            $table->string('encouraging_factors_other_text')->nullable();
            $table->string('interested_in_events');

            // ── Section G: Market Focus ──
            $table->json('priority_markets')->nullable();
            $table->string('priority_markets_other_text')->nullable();

            // ── Section H: Commission & Partnership ──
            $table->string('minimum_commission');
            $table->string('annual_recruitment_capacity');
            $table->string('likelihood_official_partner');

            // ── Section I: Recommendations ──
            $table->text('top_recommendations')->nullable();
            $table->string('willing_future_participation');
            $table->string('contact_details')->nullable();

            // ── Request metadata (captured server-side, not client input) ──
            $table->string('ip_address', 64)->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamps();

            // Useful filters for the admin dashboard
            $table->index('province');
            $table->index('recruitment_type');
            $table->index('likelihood_official_partner');
            $table->index('interested_in_partnering');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('agency_surveys');
    }
};