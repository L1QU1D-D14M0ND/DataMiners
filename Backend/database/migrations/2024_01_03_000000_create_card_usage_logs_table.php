<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('card_usage_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_session_id')->constrained('game_sessions')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('card_id');
            $table->string('card_name');
            $table->timestamp('used_at')->nullable();
            $table->timestamps();

            $table->index(['game_session_id', 'user_id']);
            $table->index('used_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_usage_logs');
    }
};
