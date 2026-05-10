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
        Schema::create('cosmetics', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('experience_unlock')->default(0);
            $table->unsignedBigInteger('credits_unlock')->default(0);
            $table->unsignedBigInteger('cosmetic_type_id');
            $table->foreign('cosmetic_type_id')
                ->references('id')
                ->on('cosmetic_types')
                ->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cosmetics');
    }
};
