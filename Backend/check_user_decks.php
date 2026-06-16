<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Total users: " . \App\Models\User::count() . PHP_EOL;
echo "Total decks: " . \App\Models\Deck::count() . PHP_EOL . PHP_EOL;

echo "Users with deck counts:" . PHP_EOL;
$users = \App\Models\User::with('decks')->get();

foreach($users as $user) {
    $deckCount = $user->decks->count();
    echo $user->name . ' (ID: ' . $user->id . '): ' . $deckCount . ' deck(s)' . PHP_EOL;
}

echo PHP_EOL . "Users without decks:" . PHP_EOL;
$usersWithoutDecks = \App\Models\User::whereDoesntHave('decks')->get();
echo "Count: " . $usersWithoutDecks->count() . PHP_EOL;
foreach($usersWithoutDecks as $user) {
    echo "- " . $user->name . ' (ID: ' . $user->id . ')' . PHP_EOL;
}
