<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Checking deck-card assignments..." . PHP_EOL . PHP_EOL;

$totalDecks = \App\Models\Deck::count();
$totalDeckCards = DB::table('card_deck')->count();

echo "Total decks: " . $totalDecks . PHP_EOL;
echo "Total deck-card relations: " . $totalDeckCards . PHP_EOL . PHP_EOL;

if ($totalDeckCards == 0) {
    echo "NO CARDS ASSIGNED TO ANY DECKS!" . PHP_EOL . PHP_EOL;
    
    // Check a few specific decks
    $decks = \App\Models\Deck::with('cards')->limit(5)->get();
    echo "Sample decks:" . PHP_EOL;
    foreach ($decks as $deck) {
        echo "Deck ID " . $deck->id . " (" . $deck->deck_name . "): " . $deck->cards->count() . " cards" . PHP_EOL;
    }
} else {
    echo "Decks with cards:" . PHP_EOL;
    $decksWithCards = DB::table('card_deck')
        ->select('deck_id')
        ->distinct()
        ->pluck('deck_id');
    
    echo "Count: " . $decksWithCards->count() . " out of " . $totalDecks . PHP_EOL;
}
