<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInstitutionalSurveysTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('institutional_surveys', function (Blueprint $table) {
            $table->id();
            
            // Section 1: Agency Profile
            $table->string('agency_name');
            $table->string('agency_email');
            $table->string('agency_phone');
            $table->string('province');
            $table->string('years_in_operation');

            // Section 2: Recruitment Experience
            $table->string('recruitment_type');
            $table->integer('local_students_recruited')->nullable();
            $table->integer('international_students_recruited')->nullable();
            $table->string('aware_of_commissions');
            $table->string('interested_in_partnering');
            $table->string('currently_represents_institution');
            $table->text('represented_institutions')->nullable();

            // Section 3: Agency Readiness
            $table->json('readiness_ratings')->nullable();

            // Section 4: Challenges & Training
            $table->json('challenges')->nullable();
            $table->string('challenges_other_text')->nullable();
            $table->string('interested_in_training');

            // Section 5: Academic Programs
            $table->json('academic_programs')->nullable();
            $table->string('academic_programs_other_text')->nullable();

            // Section 6: Promotion & Support
            $table->string('b2b_portal_useful');
            $table->json('encouraging_factors')->nullable();
            $table->string('encouraging_factors_other_text')->nullable();
            $table->string('interested_in_events');

            // Section 7: Market Focus
            $table->json('priority_markets')->nullable();
            $table->string('priority_markets_other_text')->nullable();

            // Section 8: Commission & Partnership
            $table->string('minimum_commission');
            $table->string('annual_recruitment_capacity');
            $table->string('likelihood_official_partner');

            // Section 9: Recommendations
            $table->text('top_recommendations')->nullable();
            $table->string('willing_future_participation');
            $table->string('contact_details')->nullable();

            // Compliance
            $table->boolean('accepted_confidentiality')->default(false);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('institutional_surveys');
    }
}