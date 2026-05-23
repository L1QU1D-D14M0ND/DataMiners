<?php

namespace App\Http\Controllers;

use App\Models\Cosmetic;
use App\Models\CosmeticType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CosmeticController extends Controller
{
    /**
     * API: Get all cosmetics with their types for the frontend.
     */
    public function indexApi(): JsonResponse
    {
        $cosmetics = Cosmetic::with('cosmeticType')
            ->get()
            ->map(fn ($cosmetic) => [
                'id' => $cosmetic->id,
                'name' => $cosmetic->name,
                'type' => $cosmetic->cosmeticType->name ?? null,
                'experience_unlock' => $cosmetic->experience_unlock,
                'credits_unlock' => $cosmetic->credits_unlock,
            ]);

        return response()->json($cosmetics);
    }

    /**
     * API: Get the authenticated user's cosmetics with unlock status.
     */
    public function userCosmetics(Request $request): JsonResponse
    {
        $user = $request->user();

        $allCosmetics = Cosmetic::with('cosmeticType')->get();
        $userCosmeticIds = $user->cosmetics()->pluck('cosmetics.id')->toArray();

        $cosmetics = $allCosmetics->map(fn ($cosmetic) => [
            'id' => $cosmetic->id,
            'name' => $cosmetic->name,
            'type' => $cosmetic->cosmeticType->name ?? null,
            'experience_unlock' => $cosmetic->experience_unlock,
            'credits_unlock' => $cosmetic->credits_unlock,
            'unlocked' => in_array($cosmetic->id, $userCosmeticIds),
        ]);

        return response()->json([
            'cosmetics' => $cosmetics,
            'stats' => [
                'experience_points' => $user->experience_points,
                'credits' => $user->credits,
                'rank_score' => $user->rank_score,
            ],
        ]);
    }

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $cosmetics = Cosmetic::with('cosmeticType')->paginate(15);
        return view('cosmetics.index', compact('cosmetics'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $types = CosmeticType::all();
        return view('cosmetics.create', compact('types'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cosmetic_type_id' => 'required|exists:cosmetic_types,id',
            'experience_unlock' => 'nullable|integer|min:0',
            'currency_a_unlock' => 'nullable|integer|min:0',
        ]);

        Cosmetic::create($validated);

        return redirect()->route('cosmetics.index')
                       ->with('success', 'Cosmetic created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Cosmetic $cosmetic)
    {
        $cosmetic->load('cosmeticType');
        return view('cosmetics.show', compact('cosmetic'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cosmetic $cosmetic)
    {
        $types = CosmeticType::all();
        return view('cosmetics.edit', compact('cosmetic', 'types'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Cosmetic $cosmetic)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'cosmetic_type_id' => 'required|exists:cosmetic_types,id',
            'experience_unlock' => 'nullable|integer|min:0',
            'currency_a_unlock' => 'nullable|integer|min:0',
        ]);

        $cosmetic->update($validated);

        return redirect()->route('cosmetics.show', $cosmetic)
                       ->with('success', 'Cosmetic updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cosmetic $cosmetic)
    {
        $cosmetic->delete();

        return redirect()->route('cosmetics.index')
                       ->with('success', 'Cosmetic deleted successfully.');
    }
}
