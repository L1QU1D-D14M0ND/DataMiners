<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Foreign keys are now defined in the users table creation migration
        // This migration is no longer needed
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Foreign keys are now defined in the users table creation migration
        // This migration is no longer needed
    }
};
