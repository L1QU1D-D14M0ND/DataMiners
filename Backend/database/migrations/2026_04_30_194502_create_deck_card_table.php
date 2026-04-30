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
        Schema::create('deck_card', function (Blueprint $table) {
            $table->unsignedBigInteger('decks_id');
            $table->string('decks_name');
            $table->foreignId('cards_id')->constrained('cards')->onDelete('cascade');
            $table->timestamps();
            $table->primary(['decks_id', 'decks_name', 'cards_id']);
            $table->foreign(['decks_id', 'decks_name'])->references(['user_id', 'name'])->on('decks')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deck_card');
    }
};
