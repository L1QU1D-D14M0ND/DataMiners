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
        // Drop the old set_cosmetic table
        Schema::dropIfExists('set_cosmetic');

        // Create new set_cosmetic table with updated foreign key structure
        Schema::create('set_cosmetic', function (Blueprint $table) {
            $table->foreignId('cosmetics_id')->constrained('cosmetics')->onDelete('cascade');
            $table->string('sets_name');
            $table->foreignId('sets_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();
            $table->primary(['cosmetics_id', 'sets_name', 'sets_id']);
            $table->foreign(['sets_name', 'sets_id'])->references(['name', 'id'])->on('sets')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('set_cosmetic');

        Schema::create('set_cosmetic', function (Blueprint $table) {
            $table->foreignId('cosmetics_id')->constrained('cosmetics')->onDelete('cascade');
            $table->string('sets_name');
            $table->unsignedBigInteger('sets_user_id');
            $table->timestamps();
            $table->primary(['cosmetics_id', 'sets_name']);
            $table->foreign(['sets_name', 'sets_user_id'])->references(['name', 'user_id'])->on('sets')->onDelete('cascade');
        });
    }
};
