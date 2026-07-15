<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('commission_lists', function (Blueprint $table) {
        $table->id();
        $table->string('university');
        $table->string('college');
        $table->string('location');
        $table->string('college_logo_url')->nullable();
        $table->decimal('commission_percentage', 5, 2); // e.g., 100.00
        $table->timestamps();
    });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('commission_lists');
    }
};
