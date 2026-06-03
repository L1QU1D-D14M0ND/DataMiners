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

        $user->load(['sets.cosmetics.cosmeticType', 'cosmetics.cosmeticType']);

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'experience_points' => $user->experience_points ?? 0,
                'credits' => $user->credits ?? 0,
                'rank_score' => $user->rank_score ?? 0,
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
}
