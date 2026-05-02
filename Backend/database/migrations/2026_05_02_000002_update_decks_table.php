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
        // Drop dependent tables first
        if (Schema::hasTable('deck_card')) {
            Schema::dropIfExists('deck_card');
        }

        // Drop the old decks table
        if (Schema::hasTable('decks')) {
            Schema::dropIfExists('decks');
        }

        // Create new decks table with id column instead of user_id
        Schema::create('decks', function (Blueprint $table) {
            $table->foreignId('id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
            $table->primary(['id', 'name']);
        });

        // Recreate deck_card table
        Schema::create('deck_card', function (Blueprint $table) {
            $table->foreignId('decks_id')->constrained('users', 'id')->onDelete('cascade');
            $table->string('decks_name');
            $table->foreignId('cards_id')->constrained('cards')->onDelete('cascade');
            $table->timestamps();
            $table->primary(['decks_id', 'decks_name', 'cards_id']);
            $table->foreign(['decks_id', 'decks_name'])->references(['id', 'name'])->on('decks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decks');

        Schema::create('decks', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('name');
            $table->timestamps();
            $table->primary(['user_id', 'name']);
        });
    }
};
