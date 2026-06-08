<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportSubmissionTest extends TestCase
{
    use RefreshDatabase;

    private function dummyBase64Image(): string
    {
        return 'R0lGODlhAQABAIAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';
    }

    public function test_it_submits_a_report_successfully(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 14.5833,
            'longitude' => 120.9667,
            'user_id' => $user->supabase_auth_user_id,
        ]);

        $response->assertCreated()
            ->assertJsonStructure([
                'success',
                'data' => ['ticket_id', 'evidence_id', 'latitude', 'longitude', 'checksum'],
            ]);

        $this->assertDatabaseHas('tickets', [
            'latitude' => 14.5833,
            'longitude' => 120.9667,
        ]);

        $this->assertDatabaseHas('ticket_evidence', [
            'checksum_sha256' => $response->json('data.checksum'),
        ]);
    }

    public function test_it_handles_ghost_mode_submission(): void
    {
        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 10.3157,
            'longitude' => 123.8854,
            'user_id' => 'ANONYMOUS_GHOST',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['role' => 'ghost']);
    }

    public function test_it_validates_required_fields(): void
    {
        $response = $this->postJson('/api/reports', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['base64Image', 'latitude', 'longitude']);
    }
}
