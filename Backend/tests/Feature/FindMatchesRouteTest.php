<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FindMatchesRouteTest extends TestCase
{
    use RefreshDatabase;

    public function test_find_matches_with_valid_queue_name_returns_200(): void
    {
        Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson('/api/matchmaking/find-matches', [
                'queue_name' => 'ranked',
            ]);

        // Before fix: 500 BindingResolutionException
        // After fix: 200 with empty matches array
        $response
            ->assertOk()
            ->assertJsonStructure(['matches'])
            ->assertJsonPath('matches', []);
    }

    public function test_find_matches_without_queue_name_returns_422(): void
    {
        Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson('/api/matchmaking/find-matches', []);

        // Before fix: 500 BindingResolutionException
        // After fix: 422 validation error
        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['queue_name']);
    }

    public function test_find_matches_unauthenticated_returns_redirect(): void
    {
        $response = $this->post('/api/matchmaking/find-matches', [
            'queue_name' => 'ranked',
        ]);

        // Auth middleware should redirect unauthenticated users
        $response->assertRedirect();
    }
}
