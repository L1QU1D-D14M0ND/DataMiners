<?php

namespace App\Services;

use App\Models\Card;
use App\Models\GameLog;
use App\Models\CardGameLog;
use Illuminate\Support\Facades\DB;

class CardStatisticsService
{
    /**
     * Get statistics for all cards.
     *
     * @return array
     */
    public function getCardStatistics(): array
    {
        $totalGames = GameLog::count();
        $totalDecks = DB::table('deck_card')
            ->select('user_id', 'deck_name')
            ->distinct()
            ->count();

        $cards = Card::all();
        $statistics = [];

        foreach ($cards as $card) {
            $statistics[] = $this->getCardStats($card, $totalGames, $totalDecks);
        }

        return $statistics;
    }

    /**
     * Get statistics for a specific card.
     *
     * @param Card $card
     * @param int $totalGames
     * @param int $totalDecks
     * @return array
     */
    private function getCardStats(Card $card, int $totalGames, int $totalDecks): array
    {
        // Games where this card was played
        $gamesWithCard = CardGameLog::where('card_id', $card->id)->count();

        // Wins with this card
        $winsWithCard = 0;
        if ($gamesWithCard > 0) {
            $winsWithCard = DB::table('card_game_log')
                ->join('game_logs', 'card_game_log.game_log_id', '=', 'game_logs.id')
                ->where('card_game_log.card_id', $card->id)
                ->whereRaw('(card_game_log.user = game_logs.winner OR card_game_log.user = game_logs.user_a AND game_logs.winner = game_logs.user_a OR card_game_log.user = game_logs.user_b AND game_logs.winner = game_logs.user_b)')
                ->count();
        }

        // Decks containing this card
        $decksWithCard = DB::table('deck_card')
            ->where('card_id', $card->id)
            ->select('user_id', 'deck_name')
            ->distinct()
            ->count();

        // Calculate percentages
        $winrate = $gamesWithCard > 0 ? round(($winsWithCard / $gamesWithCard) * 100, 2) : 0;
        $gamePresenceRate = $totalGames > 0 ? round(($gamesWithCard / $totalGames) * 100, 2) : 0;
        $deckPresenceRate = $totalDecks > 0 ? round(($decksWithCard / $totalDecks) * 100, 2) : 0;

        return [
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
}
