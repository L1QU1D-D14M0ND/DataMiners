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
        // Drop the old sets table if it exists
        if (Schema::hasTable('sets')) {
            Schema::dropIfExists('sets');
        }

        // Create new sets table with updated structure (name and id as composite PK)
        Schema::create('sets', function (Blueprint $table) {
            $table->string('name');
            $table->foreignId('id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->primary(['name', 'id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sets');

        Schema::create('sets', function (Blueprint $table) {
            $table->string('name');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->primary(['name', 'user_id']);
        });
    }
};
