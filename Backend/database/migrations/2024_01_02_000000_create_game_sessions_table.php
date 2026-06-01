<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('match_id')->unique();
            $table->foreignId('player1_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('player2_id')->constrained('users')->onDelete('cascade');
            $table->json('player1_state')->nullable();
            $table->json('player2_state')->nullable();
            $table->string('status')->default('active'); // 'active', 'completed', 'abandoned'
            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'match_id']);
            $table->index('player1_id');
            $table->index('player2_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
