<?php

namespace App\Http\Controllers;

use App\Models\Card;
use Illuminate\Http\Request;

class CardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cards = Card::paginate(15);
        return view('cards.index', compact('cards'));
    }

    /**
     * API: Get all cards for frontend mapping.
     */
    public function indexApi()
    {
        $cards = Card::select('id', 'name', 'experience_unlock', 'credits_unlock')->get();
        return response()->json($cards);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return view('cards.create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:cards',
            'experience_unlock' => 'nullable|integer|min:0',
            'credits_unlock' => 'nullable|integer|min:0',
        ]);

        Card::create($validated);

        return redirect()->route('cards.index')
                       ->with('success', 'Card created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Card $card)
    {
        return view('cards.show', compact('card'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Card $card)
    {
        return view('cards.edit', compact('card'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Card $card)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:cards,name,' . $card->id,
            'experience_unlock' => 'nullable|integer|min:0',
            'credits_unlock' => 'nullable|integer|min:0',
        ]);

        $card->update($validated);

        return redirect()->route('cards.show', $card)
                       ->with('success', 'Card updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Card $card)
    {
        $card->delete();

        return redirect()->route('cards.index')
                       ->with('success', 'Card deleted successfully.');
    }
}
