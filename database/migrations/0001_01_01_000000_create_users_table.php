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
        Schema::create('users', function (Blueprint $table) {
        $table->id();
        $table->string('agency_name')->nullable();     // <-- Added
        $table->string('name');  
        $table->string('country');          // Used for "Person Name"
        $table->string('contact_number');  // <-- Added
        $table->string('email')->unique();
        $table->timestamp('email_verified_at')->nullable();
        $table->boolean('is_active')->default(true);
        $table->string('account_type')->default('internal');
        $table->string('avatar')->nullable();
        $table->boolean('is_protected')->default(false);
        $table->boolean('is_manually_verified')->default(false);
        $table->boolean('can_verify_users')->default(false);
        $table->timestamp('manually_verified_at')->nullable();
        $table->foreignId('manually_verified_by')->nullable()
                ->constrained('users')->nullOnDelete();
        $table->string('password');
        $table->rememberToken();
        $table->timestamps();
    });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
