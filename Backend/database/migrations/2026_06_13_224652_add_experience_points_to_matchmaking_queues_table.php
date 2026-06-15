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
        Schema::table('matchmaking_queues', function (Blueprint $table) {
            $table->integer('experience_points')->default(0)->after('skill_rating');
            $table->index('experience_points');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matchmaking_queues', function (Blueprint $table) {
            $table->dropIndex(['experience_points']);
            $table->dropColumn('experience_points');
        });
    }
};
