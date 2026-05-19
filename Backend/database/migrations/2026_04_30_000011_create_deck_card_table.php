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
            $table->unsignedBigInteger('decks_deck_id');
            $table->unsignedBigInteger('cards_card_id');
            
            // Composite primary key
            $table->primary(['decks_deck_id', 'cards_card_id']);
            
            // Foreign keys
            $table->foreign('decks_deck_id')
                ->references('id')
                ->on('decks')
                ->onDelete('cascade');
            $table->foreign('cards_card_id')
                ->references('id')
                ->on('cards')
                ->onDelete('cascade');
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
