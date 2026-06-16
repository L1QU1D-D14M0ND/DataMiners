<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Default cards (is_default = true):" . PHP_EOL;
$defaultCards = \App\Models\Card::where('is_default', true)->get(['id', 'name']);
foreach($defaultCards as $card) {
    echo $card->id . ': ' . $card->name . PHP_EOL;
}

echo PHP_EOL . "Total cards: " . \App\Models\Card::count() . PHP_EOL;
echo "Default cards count: " . $defaultCards->count() . PHP_EOL;
