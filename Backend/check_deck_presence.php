<?php

require __DIR__.'/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Total decks: " . DB::table('card_deck')->select('deck_id')->distinct()->count() . PHP_EOL . PHP_EOL;

echo "Cards with deck counts:" . PHP_EOL;
$cards = \App\Models\Card::all();
$totalDecks = DB::table('card_deck')->select('deck_id')->distinct()->count();

foreach($cards as $card) {
    $count = DB::table('card_deck')->where('card_id', $card->id)->select('deck_id')->distinct()->count();
    if($count > 0) {
        $percentage = $totalDecks > 0 ? round(($count / $totalDecks) * 100, 2) : 0;
        echo $card->name . ': ' . $count . ' decks (' . $percentage . '%)' . PHP_EOL;
    }
}
