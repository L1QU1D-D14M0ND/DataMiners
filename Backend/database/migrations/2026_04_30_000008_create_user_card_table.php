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
        Schema::create('card_user', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->onDelete('restrict');
            $table->foreignId('card_id')->constrained()->onDelete('restrict');
            $table->char('unlocked', 1);
            
            // Composite primary key
            $table->primary(['user_id', 'card_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('card_user');
    }
};
