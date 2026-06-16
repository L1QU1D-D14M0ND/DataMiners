<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Table name is alphabetical (C before D)
        Schema::create('card_deck', function (Blueprint $table) {
            
            // 2. Modern Laravel syntax creates the column and foreign key in one line
            $table->foreignId('deck_id')->constrained()->onDelete('restrict');
            $table->foreignId('card_id')->constrained()->onDelete('restrict');
            
            // 3. Keep the composite primary key
            $table->primary(['deck_id', 'card_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('card_deck');
    }
};