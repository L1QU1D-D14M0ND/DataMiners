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
        // Add composite index for common query pattern: match_id + status + player lookup
        Schema::table('game_sessions', function (Blueprint $table) {
            // Index for: WHERE match_id = ? AND status = 'active' AND (player1_id = ? OR player2_id = ?)
            $table->index(['match_id', 'status', 'player1_id'], 'idx_match_status_player1');
            $table->index(['match_id', 'status', 'player2_id'], 'idx_match_status_player2');
            
            // Index for: WHERE player1_id = ? OR player2_id = ? (forPlayer scope)
            $table->index(['player1_id', 'status'], 'idx_player1_status');
            $table->index(['player2_id', 'status'], 'idx_player2_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('game_sessions', function (Blueprint $table) {
            $table->dropIndex('idx_match_status_player1');
            $table->dropIndex('idx_match_status_player2');
            $table->dropIndex('idx_player1_status');
            $table->dropIndex('idx_player2_status');
        });
    }
};
