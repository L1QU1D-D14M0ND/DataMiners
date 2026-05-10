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
        Schema::create('card_game_log', function (Blueprint $table) {
            $table->unsignedBigInteger('game_log_id');
            $table->unsignedBigInteger('cards_card_id');
            $table->unsignedBigInteger('user_id');
            
            // Composite primary key
            $table->primary(['game_log_id', 'cards_card_id', 'user_id']);
            
            // Foreign keys
            $table->foreign('game_log_id')
                ->references('id')
                ->on('game_logs')
                ->onDelete('cascade');
            $table->foreign('cards_card_id')
                ->references('id')
                ->on('cards')
                ->onDelete('cascade');
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_game_log');
    }
};
