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
        Schema::create('user_card', function (Blueprint $table) {
            $table->unsignedBigInteger('users_user_id');
            $table->unsignedBigInteger('cards_card_id');
            $table->char('unlocked', 1);
            
            // Composite primary key
            $table->primary(['users_user_id', 'cards_card_id']);
            
            // Foreign keys
            $table->foreign('users_user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
            $table->foreign('cards_card_id')
                ->references('id')
                ->on('cards')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_card');
    }
};
