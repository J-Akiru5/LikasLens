<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class AdminRbacEndpointTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app['router']->get('/admin/users', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/ngos', function () {
            return ['success' => true, 'data' => []];
        });

        $this->app['router']->post('/admin/ngos', function () {
            return ['success' => true];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/laws', function () {
            return ['success' => true, 'data' => []];
        });

        $this->app['router']->post('/admin/laws', function () {
            return ['success' => true];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/rewards', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/audit-logs', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/triage', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/predictions', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->post('/admin/tickets/bulk-status', function () {
            return ['success' => true];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/tenants', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/contact-messages', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/lgu-performance', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/currency-settings', function () {
            return ['success' => true, 'data' => []];
        })->middleware('role:super_admin');

        $this->app['router']->get('/admin/pattern-escalation/detect', function () {
            return ['success' => true];
        })->middleware('role:super_admin');

        $this->app['router']->patch('/tickets/fake-id/status', function () {
            return ['success' => true];
        })->middleware('role:analyst,super_admin');

        $this->app['router']->post('/reports/verify', function () {
            return ['success' => true];
        })->middleware('role:analyst,super_admin');
    }

    #[Test]
    public function super_admin_can_access_all_super_admin_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $endpoints = [
            ['GET', '/admin/users'],
            ['POST', '/admin/ngos'],
            ['POST', '/admin/laws'],
            ['GET', '/admin/rewards'],
            ['GET', '/admin/audit-logs'],
            ['GET', '/admin/triage'],
            ['GET', '/admin/predictions'],
            ['GET', '/admin/tenants'],
            ['GET', '/admin/contact-messages'],
            ['GET', '/admin/lgu-performance'],
            ['GET', '/admin/currency-settings'],
            ['GET', '/admin/pattern-escalation/detect'],
            ['POST', '/admin/tickets/bulk-status'],
            ['PATCH', '/tickets/fake-id/status'],
            ['POST', '/reports/verify'],
        ];

        foreach ($endpoints as [$method, $uri]) {
            $response = $this->actingAs($user)->json($method, $uri);
            $response->assertOk("super_admin should access {$method} {$uri}");
        }
    }

    #[Test]
    public function analyst_is_forbidden_on_super_admin_only_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'analyst']);

        $restricted = [
            ['GET', '/admin/users'],
            ['POST', '/admin/ngos'],
            ['POST', '/admin/laws'],
            ['GET', '/admin/rewards'],
            ['GET', '/admin/audit-logs'],
            ['GET', '/admin/triage'],
            ['GET', '/admin/predictions'],
            ['POST', '/admin/tickets/bulk-status'],
            ['GET', '/admin/tenants'],
            ['GET', '/admin/contact-messages'],
            ['GET', '/admin/lgu-performance'],
            ['GET', '/admin/currency-settings'],
            ['GET', '/admin/pattern-escalation/detect'],
        ];

        foreach ($restricted as [$method, $uri]) {
            $response = $this->actingAs($user)->json($method, $uri);
            $response->assertForbidden("analyst should be forbidden on {$method} {$uri}");
        }
    }

    #[Test]
    public function analyst_can_access_analyst_or_super_admin_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'analyst']);

        $accessible = [
            ['PATCH', '/tickets/fake-id/status'],
            ['POST', '/reports/verify'],
        ];

        foreach ($accessible as [$method, $uri]) {
            $response = $this->actingAs($user)->json($method, $uri);
            $response->assertOk("analyst should access {$method} {$uri}");
        }
    }

    #[Test]
    public function super_admin_can_access_analyst_or_super_admin_endpoints(): void
    {
        $user = User::factory()->create(['role' => 'super_admin']);

        $accessible = [
            ['PATCH', '/tickets/fake-id/status'],
            ['POST', '/reports/verify'],
        ];

        foreach ($accessible as [$method, $uri]) {
            $response = $this->actingAs($user)->json($method, $uri);
            $response->assertOk("super_admin should access {$method} {$uri}");
        }
    }

    #[Test]
    public function citizen_cannot_access_any_admin_endpoint(): void
    {
        $user = User::factory()->create(['role' => 'citizen']);

        $allAdmin = [
            ['GET', '/admin/users'],
            ['GET', '/admin/audit-logs'],
            ['GET', '/admin/tenants'],
            ['PATCH', '/tickets/fake-id/status'],
            ['POST', '/reports/verify'],
        ];

        foreach ($allAdmin as [$method, $uri]) {
            $response = $this->actingAs($user)->json($method, $uri);
            $response->assertForbidden("citizen should be forbidden on {$method} {$uri}");
        }
    }

    #[Test]
    public function public_read_endpoints_accessible_without_auth(): void
    {
        $response = $this->getJson('/admin/ngos');
        $response->assertOk();

        $response = $this->getJson('/admin/laws');
        $response->assertOk();
    }

    #[Test]
    public function rbac_denials_are_logged_in_audit_table(): void
    {
        $user = User::factory()->create(['role' => 'analyst']);

        $this->actingAs($user)->getJson('/admin/users')->assertForbidden();

        $this->assertDatabaseHas('audit_logs', [
            'actor_user_id' => $user->id,
            'action' => 'rbac_denied',
            'entity_type' => 'route',
        ]);
    }
}
