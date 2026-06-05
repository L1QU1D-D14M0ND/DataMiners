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
            $table->unsignedBigInteger('equipped_profile_picture_id')->nullable()->after('sets_set_id');
            $table->unsignedBigInteger('equipped_frame_id')->nullable()->after('equipped_profile_picture_id');
            $table->unsignedBigInteger('equipped_card_id')->nullable()->after('equipped_frame_id');
            $table->unsignedBigInteger('equipped_title_id')->nullable()->after('equipped_card_id');

            $table->foreign('equipped_profile_picture_id')
                ->references('id')
                ->on('cosmetics')
                ->onDelete('set null');
            $table->foreign('equipped_frame_id')
                ->references('id')
                ->on('cosmetics')
                ->onDelete('set null');
            $table->foreign('equipped_card_id')
                ->references('id')
                ->on('cosmetics')
                ->onDelete('set null');
            $table->foreign('equipped_title_id')
                ->references('id')
                ->on('cosmetics')
                ->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['equipped_profile_picture_id']);
            $table->dropForeign(['equipped_frame_id']);
            $table->dropForeign(['equipped_card_id']);
            $table->dropForeign(['equipped_title_id']);
            $table->dropColumn(['equipped_profile_picture_id', 'equipped_frame_id', 'equipped_card_id', 'equipped_title_id']);
        });
    }
};
