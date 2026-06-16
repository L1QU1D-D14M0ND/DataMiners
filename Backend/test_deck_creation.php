<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Testing deck creation..." . PHP_EOL;

// Get a user to assign the deck to
$user = \App\Models\User::first();
if (!$user) {
    echo "No users found!" . PHP_EOL;
    exit;
}

echo "Creating deck for user: " . $user->name . " (ID: " . $user->id . ")" . PHP_EOL;

// Create a deck
$deck = \App\Models\Deck::create([
    'user_id' => $user->id,
    'deck_name' => 'Test Deck',
]);

echo "Deck created with ID: " . $deck->id . PHP_EOL;

// Check if cards were assigned
$cardCount = $deck->cards()->count();
echo "Cards assigned to deck: " . $cardCount . PHP_EOL;

if ($cardCount > 0) {
    echo "Cards:" . PHP_EOL;
    foreach ($deck->cards as $card) {
        echo "  - " . $card->name . " (ID: " . $card->id . ")" . PHP_EOL;
    }
} else {
    echo "NO CARDS WERE ASSIGNED - Event did not fire!" . PHP_EOL;
}
