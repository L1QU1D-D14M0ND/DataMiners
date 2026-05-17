<?php

namespace App\Http\Controllers;

use App\Models\Deck;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DeckController extends Controller
{
    /**
     * Display a listing of the user's decks.
     */
    public function index(Request $request): JsonResponse
    {
        $decks = $request->user()
            ->decks()
            ->with('cards')
            ->get()
            ->map(function ($deck) {
                return [
                    'id' => $deck->id,
                    'name' => $deck->deck_name,
                    'card_ids' => $deck->cards->pluck('id')->toArray(),
                ];
            });

        return response()->json($decks);
    }

    /**
     * Store a newly created deck in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'card_ids' => 'nullable|array',
            'card_ids.*' => 'exists:cards,id',
        ]);

        $deck = $request->user()->decks()->create([
            'deck_name' => $validated['name'],
        ]);

        // Attach cards to the deck if provided
        if (!empty($validated['card_ids'])) {
            $deck->cards()->attach($validated['card_ids']);
        }

        $deck->load('cards');

        return response()->json([
            'id' => $deck->id,
            'name' => $deck->deck_name,
            'card_ids' => $deck->cards->pluck('id')->toArray(),
        ], 201);
    }

    /**
     * Display the specified deck.
     */
    public function show(Request $request, Deck $deck): JsonResponse
    {
        // Ensure the user owns this deck
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $deck->load('cards');

        return response()->json([
            'id' => $deck->id,
            'name' => $deck->deck_name,
            'card_ids' => $deck->cards->pluck('id')->toArray(),
        ]);
    }

    /**
     * Update the specified deck in storage.
     */
    public function update(Request $request, Deck $deck): JsonResponse
    {
        // Ensure the user owns this deck
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'card_ids' => 'nullable|array',
            'card_ids.*' => 'exists:cards,id',
        ]);

        if (isset($validated['name'])) {
            $deck->update(['deck_name' => $validated['name']]);
        }

        if (isset($validated['card_ids'])) {
            $deck->cards()->sync($validated['card_ids']);
        }

        $deck->load('cards');

        return response()->json([
            'id' => $deck->id,
            'name' => $deck->deck_name,
            'card_ids' => $deck->cards->pluck('id')->toArray(),
        ]);
    }

    /**
     * Remove the specified deck from storage.
     */
    public function destroy(Request $request, Deck $deck): JsonResponse
    {
        // Ensure the user owns this deck
        if ($deck->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $deck->delete();

        return response()->json(null, 204);
    }
}
