<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('institutional_surveys', function (Blueprint $table) {
            $table->id();

            // Institutional Information
            $table->string('institution_name');
            $table->string('university_affiliation');
            $table->string('institution_email');
            $table->string('institution_phone', 50);

            // Institutional Readiness
            $table->string('has_international_office', 50);
            $table->string('currently_enrolling_international', 10);
            $table->integer('international_students_enrolled')->nullable();
            $table->string('has_internationalization_strategy', 50);
            $table->string('has_active_partnerships', 10);
            $table->string('overall_readiness', 100);
            $table->string('faculty_prepared', 50);
            $table->string('infrastructure_adequacy', 100);

            // Challenges & Policy Environment
            $table->json('barriers')->nullable();
            $table->text('barriers_other_text')->nullable();
            $table->string('policy_support_level', 100);

            // Future Priorities
            $table->json('support_types')->nullable();
            $table->text('support_types_other_text')->nullable();
            $table->json('academic_disciplines')->nullable();
            $table->text('academic_disciplines_other_text')->nullable();
            $table->string('interested_in_study_nepal', 10);
            $table->text('policy_reform_recommendation')->nullable();

            $table->boolean('accepted_confidentiality')->default(false);

            $table->timestamps();

            $table->index('institution_name');
            $table->index('overall_readiness');
            $table->index('interested_in_study_nepal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('institutional_readiness_surveys');
    }
};