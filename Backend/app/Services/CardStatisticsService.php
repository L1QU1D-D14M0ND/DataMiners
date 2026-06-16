<?php

namespace App\Services;

use App\Models\Card;
use App\Models\GameLog;
use Illuminate\Support\Facades\DB;

class CardStatisticsService
{
    public function getCardStatistics(): array
    {
        $totalGames = GameLog::count();
        $totalDecks = DB::table('card_deck')->distinct()->count('deck_id');

        // Fetch game records & wins grouped by card
        $gameStats = DB::table('card_game_log')
            ->join('game_logs', 'card_game_log.game_log_id', '=', 'game_logs.id')
            ->select('card_game_log.card_id')
            ->selectRaw('COUNT(card_game_log.game_log_id) as games_played')
            ->selectRaw('SUM(CASE WHEN card_game_log.user_id = game_logs.winner THEN 1 ELSE 0 END) as wins')
            ->groupBy('card_game_log.card_id')
            ->get()
            ->keyBy('card_id');

        // Fetch deck containment counts grouped by card
        $deckStats = DB::table('card_deck')
            ->select('card_id')
            ->selectRaw('COUNT(DISTINCT deck_id) as decks_containing')
            ->groupBy('card_id')
            ->get()
            ->keyBy('card_id');

        $cards = Card::all();
        $statistics = [];

        foreach ($cards as $card) {
            $cardGames = $gameStats->get($card->id);
            $cardDecks = $deckStats->get($card->id);

            $gamesWithCard = $cardGames ? $cardGames->games_played : 0;
            $winsWithCard = $cardGames ? (int)$cardGames->wins : 0;
            $decksWithCard = $cardDecks ? $cardDecks->decks_containing : 0;

            $winrate = $gamesWithCard > 0 ? round(($winsWithCard / $gamesWithCard) * 100, 2) : 0;
            $gamePresenceRate = $totalGames > 0 ? round(($gamesWithCard / $totalGames) * 100, 2) : 0;
            $deckPresenceRate = $totalDecks > 0 ? round(($decksWithCard / $totalDecks) * 100, 2) : 0;

            $statistics[] = [
                'card_id' => $card->id,
                'card_name' => $card->name,
                'winrate' => $winrate,
                'game_presence_rate' => $gamePresenceRate,
                'deck_presence_rate' => $deckPresenceRate,
                'games_played' => $gamesWithCard,
                'wins' => $winsWithCard,
                'decks_containing' => $decksWithCard,
            ];
        }

        return $statistics;
    }
}