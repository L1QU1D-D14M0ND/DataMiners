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
            $table->foreign('decks_deck_id')
                ->references('id')
                ->on('decks')
                ->onDelete('set null');
            $table->foreign('sets_set_id')
                ->references('id')
                ->on('sets')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['decks_deck_id']);
            $table->dropForeign(['sets_set_id']);
        });
    }
};
