<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Set;
use App\Models\Cosmetic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

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

        $validated['password'] = Hash::make($validated['password']);
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

        // Ensure user has an equipped set
        if (!$user->equipped_set_id) {
            $sets = $user->sets;
            
            if ($sets->isEmpty()) {
                // Create default set if no sets exist
                $defaultSet = $user->sets()->create(['set_name' => 'Default']);
                
                // Attach default cosmetics to the default set
                $defaultCosmetics = \App\Models\Cosmetic::where('experience_unlock', 0)
                    ->where('credits_unlock', 0)
                    ->pluck('id');
                
                if ($defaultCosmetics->count() > 0) {
                    foreach ($defaultCosmetics as $cosmeticId) {
                        $defaultSet->cosmetics()->attach($cosmeticId);
                    }
                }
                
                $user->equipped_set_id = $defaultSet->id;
                $user->save();
            } else {
                // Find default set first
                $defaultSet = $sets->firstWhere('set_name', 'Default');
                if ($defaultSet) {
                    $user->equipped_set_id = $defaultSet->id;
                    $user->save();
                } else {
                    // Equip first set alphabetically
                    $sortedSets = $sets->sortBy('set_name');
                    $user->equipped_set_id = $sortedSets->first()->id;
                    $user->save();
                }
            }
        }

        $user->load(['sets.cosmetics.cosmeticType', 'cosmetics.cosmeticType', 'equippedProfilePicture', 'equippedFrame', 'equippedCard', 'equippedTitle', 'equippedSet', 'cards']);

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
                'equipped_set_id' => $user->equipped_set_id,
            ],
            'cards' => $user->cards->map(function ($card) {
                return [
                    'id' => $card->id,
                    'name' => $card->name,
                    'is_default' => $card->is_default,
                    'unlocked' => $card->pivot->unlocked ?? false,
                ];
            }),
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

    /**
     * API: Create a new cosmetic set for the authenticated user.
     */
    public function createSet(Request $request)
    {
        $validated = $request->validate([
            'set_name' => 'required|string|max:255',
            'cosmetic_ids' => 'required|array|min:4',
            'cosmetic_ids.*' => 'exists:cosmetics,id',
        ]);

        $user = $request->user();

        // Verify user owns all cosmetics
        $userCosmeticIds = $user->cosmetics->pluck('id')->toArray();
        foreach ($validated['cosmetic_ids'] as $cosmeticId) {
            if (!in_array($cosmeticId, $userCosmeticIds)) {
                return response()->json(['error' => 'You do not own one or more of these cosmetics'], 403);
            }
        }

        // Verify set has exactly one of each cosmetic type
        $cosmetics = Cosmetic::whereIn('id', $validated['cosmetic_ids'])->get();
        $cosmeticTypes = $cosmetics->pluck('cosmetic_type_id')->unique();
        $requiredTypes = ['Profile Picture', 'Profile Frame', 'Profile Card', 'Profile Title'];

        $typeNames = [];
        foreach ($cosmetics as $cosmetic) {
            $typeNames[] = $cosmetic->cosmeticType->name;
        }

        $uniqueTypeNames = array_unique($typeNames);
        if (count($uniqueTypeNames) !== 4) {
            return response()->json([
                'error' => 'Set must contain exactly one of each cosmetic type: ' . implode(', ', $requiredTypes),
                'missing' => array_diff($requiredTypes, $uniqueTypeNames)
            ], 400);
        }

        $set = $user->sets()->create([
            'set_name' => $validated['set_name'],
        ]);

        // Attach cosmetics to set
        $set->cosmetics()->attach($validated['cosmetic_ids']);

        $set->load('cosmetics.cosmeticType');

        return response()->json([
            'message' => 'Set created successfully',
            'set' => [
                'id' => $set->id,
                'set_name' => $set->set_name,
                'cosmetics' => $set->cosmetics->map(function ($cosmetic) {
                    return [
                        'id' => $cosmetic->id,
                        'name' => $cosmetic->name,
                        'cosmetic_type' => [
                            'id' => $cosmetic->cosmeticType->id,
                            'name' => $cosmetic->cosmeticType->name,
                        ],
                    ];
                }),
            ],
        ], 201);
    }

    /**
     * API: Switch the equipped set for the authenticated user.
     */
    public function switchEquippedSet(Request $request)
    {
        $validated = $request->validate([
            'equipped_set_id' => 'nullable|exists:sets,id',
        ]);

        $user = $request->user();

        // Verify that the user owns the set they're trying to equip
        if ($validated['equipped_set_id']) {
            $set = Set::find($validated['equipped_set_id']);
            if (!$set || $set->user_id !== $user->id) {
                return response()->json(['error' => 'You do not own this set'], 403);
            }

            // When equipping a set, also equip all cosmetics from that set
            $cosmetics = $set->cosmetics;
            foreach ($cosmetics as $cosmetic) {
                $cosmeticTypeName = $cosmetic->cosmeticType->name;
                $cosmeticFieldMap = [
                    'Profile Picture' => 'equipped_profile_picture_id',
                    'Profile Frame' => 'equipped_frame_id',
                    'Profile Card' => 'equipped_card_id',
                    'Profile Title' => 'equipped_title_id',
                ];

                if (isset($cosmeticFieldMap[$cosmeticTypeName])) {
                    $user->{$cosmeticFieldMap[$cosmeticTypeName]} = $cosmetic->id;
                }
            }
        }

        $user->equipped_set_id = $validated['equipped_set_id'];
        $user->save();

        return response()->json(['message' => 'Equipped set updated successfully']);
    }

    /**
     * API: Add a cosmetic to a set.
     */
    public function addCosmeticToSet(Request $request)
    {
        $validated = $request->validate([
            'set_id' => 'required|exists:sets,id',
            'cosmetic_id' => 'required|exists:cosmetics,id',
        ]);

        $user = $request->user();

        // Verify that the user owns the set
        $set = Set::find($validated['set_id']);
        if (!$set || $set->user_id !== $user->id) {
            return response()->json(['error' => 'You do not own this set'], 403);
        }

        // Verify that the user owns the cosmetic
        if (!$user->cosmetics()->where('cosmetics.id', $validated['cosmetic_id'])->exists()) {
            return response()->json(['error' => 'You do not own this cosmetic'], 403);
        }

        // Check if this would create a duplicate type in the set
        $cosmetic = Cosmetic::find($validated['cosmetic_id']);
        $existingCosmetics = $set->cosmetics;
        $hasDuplicateType = $existingCosmetics->contains(function ($existing) use ($cosmetic) {
            return $existing->cosmetic_type_id === $cosmetic->cosmetic_type_id;
        });

        if ($hasDuplicateType) {
            return response()->json([
                'error' => 'Set already contains a cosmetic of this type. Remove the existing one first.',
                'type' => $cosmetic->cosmeticType->name
            ], 400);
        }

        // Add the cosmetic to the set
        $set->cosmetics()->attach($validated['cosmetic_id']);

        return response()->json(['message' => 'Cosmetic added to set successfully']);
    }

    /**
     * API: Remove a cosmetic from a set.
     */
    public function removeCosmeticFromSet(Request $request)
    {
        $validated = $request->validate([
            'set_id' => 'required|exists:sets,id',
            'cosmetic_id' => 'required|exists:cosmetics,id',
        ]);

        $user = $request->user();

        // Verify that the user owns the set
        $set = Set::find($validated['set_id']);
        if (!$set || $set->user_id !== $user->id) {
            return response()->json(['error' => 'You do not own this set'], 403);
        }

        // Check if this is the only cosmetic of its type in the set
        $cosmetic = Cosmetic::find($validated['cosmetic_id']);
        $existingCosmetics = $set->cosmetics;
        $sameTypeCount = $existingCosmetics->where('cosmetic_type_id', $cosmetic->cosmetic_type_id)->count();

        if ($sameTypeCount === 1) {
            return response()->json([
                'error' => 'Cannot remove the only cosmetic of this type. Sets must have one of each type.',
                'type' => $cosmetic->cosmeticType->name
            ], 400);
        }

        // Remove the cosmetic from the set
        $set->cosmetics()->detach($validated['cosmetic_id']);

        return response()->json(['message' => 'Cosmetic removed from set successfully']);
    }

    /**
     * API: Delete a set.
     */
    public function deleteSet(Request $request, Set $set)
    {
        $user = $request->user();

        // Verify that the user owns the set
        if ($set->user_id !== $user->id) {
            return response()->json(['error' => 'You do not own this set'], 403);
        }

        // If this set is equipped, unequip it first
        if ($user->equipped_set_id === $set->id) {
            $user->equipped_set_id = null;
            $user->save();
        }

        // Delete the set (this will also remove all cosmetic associations via cascade)
        $set->delete();

        return response()->json(['message' => 'Set deleted successfully']);
    }
}
