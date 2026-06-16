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
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('deck_id')->references('id')->on('decks')->onDelete('set null');
            $table->foreign('set_id')->references('id')->on('sets')->onDelete('set null');
        });

        Schema::table('decks', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
        });

        Schema::table('sets', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['deck_id']);
            $table->dropForeign(['set_id']);
        });

        Schema::table('decks', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('sets', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });
    }
};
