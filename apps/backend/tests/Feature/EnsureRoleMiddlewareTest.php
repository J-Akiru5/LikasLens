<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EnsureRoleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    protected function defineRoutes(): void
    {
        $this->app['router']->get('/_test/role/super_admin', function () {
            return ['success' => true];
        })->middleware('role:super_admin');

        $this->app['router']->get('/_test/role/analyst_or_super_admin', function () {
            return ['success' => true];
        })->middleware('role:analyst,super_admin');
    }

    public function test_unauthenticated_user_gets_401(): void
    {
        $this->defineRoutes();

        $response = $this->getJson('/_test/role/super_admin');

        $response->assertUnauthorized()
            ->assertJson(['success' => false, 'message' => 'Unauthenticated.']);
    }

    public function test_citizen_cannot_access_super_admin_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'citizen']);

        $response = $this->actingAs($user)->getJson('/_test/role/super_admin');

        $response->assertForbidden()
            ->assertJson(['success' => false]);
    }

    public function test_analyst_cannot_access_super_admin_only_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'analyst']);

        $response = $this->actingAs($user)->getJson('/_test/role/super_admin');

        $response->assertForbidden();
    }

    public function test_super_admin_can_access_super_admin_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($user)->getJson('/_test/role/super_admin');

        $response->assertOk()
            ->assertJson(['success' => true]);
    }

    public function test_analyst_can_access_analyst_or_super_admin_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'analyst']);

        $response = $this->actingAs($user)->getJson('/_test/role/analyst_or_super_admin');

        $response->assertOk();
    }

    public function test_super_admin_can_access_analyst_or_super_admin_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'super_admin']);

        $response = $this->actingAs($user)->getJson('/_test/role/analyst_or_super_admin');

        $response->assertOk();
    }

    public function test_citizen_cannot_access_analyst_or_super_admin_route(): void
    {
        $this->defineRoutes();
        $user = User::factory()->create(['role' => 'citizen']);

        $response = $this->actingAs($user)->getJson('/_test/role/analyst_or_super_admin');

        $response->assertForbidden();
    }
}
