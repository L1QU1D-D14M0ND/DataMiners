<?php

namespace Tests\Unit\Middleware;

use App\Http\Middleware\IsAdministrator;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class IsAdministratorTest extends TestCase
{
    use RefreshDatabase;

    private IsAdministrator $middleware;

    protected function setUp(): void
    {
        parent::setUp();
        $this->middleware = new IsAdministrator;
    }

    public function test_denies_access_when_no_user(): void
    {
        $request = Request::create('/admin', 'GET');

        $this->expectException(HttpException::class);

        $this->middleware->handle($request, function () {
            return response('OK');
        });
    }

    public function test_denies_access_when_user_has_non_admin_role(): void
    {
        $role = Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        $this->expectException(HttpException::class);

        $this->middleware->handle($request, function () {
            return response('OK');
        });
    }

    public function test_allows_access_for_administrator(): void
    {
        Role::forceCreate(['name' => 'Player']);
        $adminRole = Role::forceCreate(['name' => 'Administrator']);
        $user = User::factory()->create(['role_id' => $adminRole->id]);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        $response = $this->middleware->handle($request, function () {
            return response('OK');
        });

        $this->assertEquals('OK', $response->getContent());
    }

    public function test_returns_403_status_code(): void
    {
        $role = Role::forceCreate(['name' => 'Player']);
        $user = User::factory()->create(['role_id' => $role->id]);

        $request = Request::create('/admin', 'GET');
        $request->setUserResolver(fn () => $user);

        try {
            $this->middleware->handle($request, function () {
                return response('OK');
            });
            $this->fail('Expected HttpException was not thrown');
        } catch (HttpException $e) {
            $this->assertEquals(403, $e->getStatusCode());
            $this->assertStringContainsString('Administrator role required', $e->getMessage());
        }
    }
}
