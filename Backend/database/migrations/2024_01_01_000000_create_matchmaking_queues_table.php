<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('matchmaking_queues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('queue_name'); // e.g., 'ranked', 'casual', 'tournament'
            $table->integer('skill_rating')->default(1000);
            $table->json('preferences')->nullable(); // Additional matchmaking preferences
            $table->string('status')->default('waiting'); // 'waiting', 'matched', 'cancelled', 'expired'
            $table->timestamp('matched_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['status', 'queue_name']);
            $table->index(['skill_rating']);
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('matchmaking_queues');
    }
};
