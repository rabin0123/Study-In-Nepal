<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_applications', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('app_id')->unique(); 
    $table->foreignId('created_by')
        ->constrained('users')
        ->cascadeOnDelete();
    $table->string('avatar')->nullable();
    $table->string('student_name');
    $table->string('country');
    $table->string('university_name');

    $table->string('phone_number', 30)->nullable();
    $table->string('email')->nullable();
    $table->date('date_of_birth')->nullable();
    $table->string('passport_number')->nullable();

    $table->string('address_line_1')->nullable();
    $table->string('address_line_2')->nullable();
    $table->string('city')->nullable();
    $table->string('state_province_region')->nullable();
    $table->string('postal_code')->nullable();

    $table->string('status', 50)->default('pending');
    $table->string('course_name')->nullable();
    $table->string('college_name')->nullable();
    
    $table->text('agency_reference_notes')->nullable();

    $table->string('ip_address')->nullable();
    $table->string('user_agent')->nullable();

    $table->timestamps();

    $table->index('status');
    $table->index('country');
    $table->index('created_by');
    $table->foreignId('assigned_to')->nullable()
        ->constrained('users')->nullOnDelete();
    $table->index('passport_number');
});
    }

    public function down(): void
    {
        Schema::dropIfExists('student_applications');
    }
};