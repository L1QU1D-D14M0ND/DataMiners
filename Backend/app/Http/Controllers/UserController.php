<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $users = User::with('role')->paginate(15);
        return view('users.index', compact('users'));
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $roles = Role::all();
        return view('users.create', compact('roles'));
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'rank_number' => 'nullable|integer|min:0',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $validated['password'] = bcrypt($validated['password']);
        User::create($validated);

        return redirect()->route('users.index')
                       ->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        $user->load('role');
        return view('users.show', compact('user'));
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user)
    {
        $roles = Role::all();
        return view('users.edit', compact('user', 'roles'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email,' . $user->id,
            'rank_number' => 'nullable|integer|min:0',
            'role_id' => 'nullable|exists:roles,id',
        ]);

        $user->update($validated);

        return redirect()->route('users.index')
                       ->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return redirect()->route('users.index')
                       ->with('success', 'User deleted successfully.');
    }

    /**
     * API: Get profile data for authenticated user.
     */
    public function profileApi(Request $request)
    {
        $user = $request->user();

        $user->load(['sets.cosmetics.cosmeticType', 'cosmetics.cosmeticType', 'equippedProfilePicture', 'equippedFrame', 'equippedCard', 'equippedTitle']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'experience_points' => $user->experience_points ?? 0,
                'credits' => $user->credits ?? 0,
                'rank_score' => $user->rank_score ?? 0,
                'equipped_profile_picture' => $user->equippedProfilePicture ? [
                    'id' => $user->equippedProfilePicture->id,
                    'name' => $user->equippedProfilePicture->name,
                    'cosmetic_type' => $user->equippedProfilePicture->cosmeticType?->name,
                ] : null,
                'equipped_frame' => $user->equippedFrame ? [
                    'id' => $user->equippedFrame->id,
                    'name' => $user->equippedFrame->name,
                    'cosmetic_type' => $user->equippedFrame->cosmeticType?->name,
                ] : null,
                'equipped_card' => $user->equippedCard ? [
                    'id' => $user->equippedCard->id,
                    'name' => $user->equippedCard->name,
                    'cosmetic_type' => $user->equippedCard->cosmeticType?->name,
                ] : null,
                'equipped_title' => $user->equippedTitle ? [
                    'id' => $user->equippedTitle->id,
                    'name' => $user->equippedTitle->name,
                    'cosmetic_type' => $user->equippedTitle->cosmeticType?->name,
                ] : null,
            ],
            'sets' => $user->sets->map(function ($set) {
                return [
                    'id' => $set->id,
                    'set_name' => $set->set_name,
                    'cosmetics' => $set->cosmetics->map(function ($cosmetic) {
                        return [
                            'id' => $cosmetic->id,
                            'name' => $cosmetic->name,
                            'experience_unlock' => $cosmetic->experience_unlock,
                            'credits_unlock' => $cosmetic->credits_unlock,
                            'unlocked' => $cosmetic->pivot->unlocked ?? false,
                            'cosmetic_type' => [
                                'id' => $cosmetic->cosmeticType?->id,
                                'name' => $cosmetic->cosmeticType?->name,
                            ],
                        ];
                    }),
                ];
            }),
            'user_cosmetics' => $user->cosmetics->map(function ($cosmetic) {
                return [
                    'id' => $cosmetic->id,
                    'name' => $cosmetic->name,
                    'experience_unlock' => $cosmetic->experience_unlock,
                    'credits_unlock' => $cosmetic->credits_unlock,
                    'unlocked' => $cosmetic->pivot->unlocked ?? false,
                    'cosmetic_type' => [
                        'id' => $cosmetic->cosmeticType?->id,
                        'name' => $cosmetic->cosmeticType?->name,
                    ],
                ];
            }),
        ]);
    }

    /**
     * API: Update equipped cosmetics for authenticated user.
     */
    public function updateEquippedCosmetics(Request $request)
    {
        $validated = $request->validate([
            'equipped_profile_picture_id' => 'nullable|exists:cosmetics,id',
            'equipped_frame_id' => 'nullable|exists:cosmetics,id',
            'equipped_card_id' => 'nullable|exists:cosmetics,id',
            'equipped_title_id' => 'nullable|exists:cosmetics,id',
        ]);

        $user = $request->user();

        // Verify that the user owns the cosmetics they're trying to equip
        $userCosmeticIds = $user->cosmetics->pluck('id')->toArray();

        if ($validated['equipped_profile_picture_id'] && !in_array($validated['equipped_profile_picture_id'], $userCosmeticIds)) {
            return response()->json(['error' => 'You do not own this profile picture'], 403);
        }
        if ($validated['equipped_frame_id'] && !in_array($validated['equipped_frame_id'], $userCosmeticIds)) {
            return response()->json(['error' => 'You do not own this frame'], 403);
        }
        if ($validated['equipped_card_id'] && !in_array($validated['equipped_card_id'], $userCosmeticIds)) {
            return response()->json(['error' => 'You do not own this card'], 403);
        }
        if ($validated['equipped_title_id'] && !in_array($validated['equipped_title_id'], $userCosmeticIds)) {
            return response()->json(['error' => 'You do not own this title'], 403);
        }

        $user->update($validated);

        return response()->json(['message' => 'Equipped cosmetics updated successfully']);
    }
}
