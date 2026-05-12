<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LeaderboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_leaderboard_in_descending_order(): void
    {
        $low = User::factory()->create(['reward_points_balance' => 10]);
        $mid = User::factory()->create(['reward_points_balance' => 50]);
        $high = User::factory()->create(['reward_points_balance' => 120]);

        $response = $this->getJson('/api/leaderboard');

        $response->assertOk()
            ->assertJsonStructure([
                'success',
                'data' => [
                    ['id', 'name', 'eco_credits', 'score'],
                ],
            ]);

        $data = $response->json('data');

        $this->assertSame($high->id, $data[0]['id']);
        $this->assertSame($mid->id, $data[1]['id']);
        $this->assertSame($low->id, $data[2]['id']);
    }
}
