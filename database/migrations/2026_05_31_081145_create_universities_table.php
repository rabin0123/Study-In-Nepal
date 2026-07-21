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
            $table->index('level');
            $table->index('stream');
            $table->index('Course');
            $table->index('University');
            $table->index('College');
            $table->index('Location');
            $table->fullText(['University', 'Course', 'College', 'Location', 'stream']);
        });

        
    }

    public function down(): void
    {
       
        Schema::dropIfExists('universities');
    }
};