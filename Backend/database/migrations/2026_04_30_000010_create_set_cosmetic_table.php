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
        Schema::create('set_cosmetic', function (Blueprint $table) {
            $table->unsignedBigInteger('cosmetics_cosmetic_id');
            $table->unsignedBigInteger('sets_set_id');
            
            // Composite primary key
            $table->primary(['cosmetics_cosmetic_id', 'sets_set_id']);
            
            // Foreign keys
            $table->foreign('cosmetics_cosmetic_id')
                ->references('id')
                ->on('cosmetics')
                ->onDelete('cascade');
            $table->foreign('sets_set_id')
                ->references('id')
                ->on('sets')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_cosmetic');
    }
};
