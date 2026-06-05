<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = \App\Models\User::where('email', 'player1@test.local')->first();
if ($user) {
    $token = $user->createToken('test-token')->plainTextToken;
    echo 'User: ' . $user->email . PHP_EOL;
    echo 'Token: ' . $token . PHP_EOL;
} else {
    echo 'Test user not found. Run: php artisan db:seed' . PHP_EOL;
}
