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
        Schema::create('cosmetic_set', function (Blueprint $table) {
            $table->foreignId('cosmetic_id')->constrained()->onDelete('restrict');
            $table->foreignId('set_id')->constrained()->onDelete('restrict');
            
            // Composite primary key
            $table->primary(['cosmetic_id', 'set_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cosmetic_set');
    }
};
