<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_game_log', function (Blueprint $table) {
            // Modern, clean naming conventions
            $table->foreignId('card_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_log_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Tracks who played it
            
            // Composite primary key to prevent absolute duplicate entries
            $table->primary(['card_id', 'game_log_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_game_log');
    }
};