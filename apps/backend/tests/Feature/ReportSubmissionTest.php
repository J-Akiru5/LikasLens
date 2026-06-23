<?php

namespace Tests\Feature;

use App\Models\Ticket;
use App\Models\TicketEvidence;
use App\Models\TicketTimeline;
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
            ->assertJsonValidationErrors(['base64Image']);
    }

    public function test_it_sets_exif_removed_at_on_submission(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 14.5833,
            'longitude' => 120.9667,
            'user_id' => $user->supabase_auth_user_id,
        ]);

        $response->assertCreated();

        $this->assertDatabaseHas('ticket_evidence', [
            'ticket_id' => $response->json('data.ticket_id'),
        ]);

        $evidence = TicketEvidence::where('ticket_id', $response->json('data.ticket_id'))->first();
        $this->assertNotNull($evidence->exif_removed_at, 'exif_removed_at should be set');
    }

    public function test_ghost_mode_timeline_actor_is_null(): void
    {
        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 10.6581,
            'longitude' => 122.1928,
            'user_id' => 'ANONYMOUS_GHOST',
        ]);

        $response->assertCreated();

        $ticketId = $response->json('data.ticket_id');
        $this->assertDatabaseHas('ticket_timeline', [
            'ticket_id' => $ticketId,
            'actor_type' => 'system',
        ]);

        $entry = TicketTimeline::where('ticket_id', $ticketId)->first();
        $this->assertNull($entry->actor_id, 'Ghost mode timeline actor_id should be null');
    }

    public function test_ghost_mode_location_fuzzed_field(): void
    {
        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 10.6581,
            'longitude' => 122.1928,
            'user_id' => 'ANONYMOUS_GHOST',
        ]);

        $response->assertCreated();

        $ticketId = $response->json('data.ticket_id');
        $ticket = Ticket::find($ticketId);

        $this->assertNotNull($ticket, 'Ticket should exist');
        $this->assertTrue($ticket->location_fuzzed, 'Ghost mode tickets should have location_fuzzed = true');
    }

    public function test_normal_mode_location_not_fuzzed(): void
    {
        $user = User::factory()->create();

        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'latitude' => 14.5833,
            'longitude' => 120.9667,
            'user_id' => $user->supabase_auth_user_id,
        ]);

        $response->assertCreated();

        $ticketId = $response->json('data.ticket_id');
        $ticket = Ticket::find($ticketId);

        $this->assertNotNull($ticket, 'Ticket should exist');
        $this->assertFalse($ticket->location_fuzzed, 'Normal mode tickets should have location_fuzzed = false');
    }

    public function test_ghost_mode_without_gps_succeeds(): void
    {
        $response = $this->postJson('/api/reports', [
            'base64Image' => $this->dummyBase64Image(),
            'user_id' => 'ANONYMOUS_GHOST',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['role' => 'ghost']);
    }
}
