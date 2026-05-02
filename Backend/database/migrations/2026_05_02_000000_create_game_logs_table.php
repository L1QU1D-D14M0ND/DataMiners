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
        Schema::create('game_logs', function (Blueprint $table) {
            $table->unsignedBigInteger('user_a');
            $table->unsignedBigInteger('user_b');
            $table->unsignedBigInteger('id');
            $table->string('winner')->nullable();
            $table->timestamps();
            $table->primary(['user_a', 'user_b', 'id']);
            $table->foreign('user_a')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('user_b')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_logs');
    }
};
