<?php

namespace App\Http\Controllers;

use App\Models\CitizenWallet;
use App\Models\CreditPool;
use App\Models\Ticket;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EcoCreditController extends Controller
{
    public function awardCredits(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|uuid|exists:users,id',
            'ticket_id' => 'required|uuid|exists:tickets,id',
            'credit_amount' => 'required|integer|min:1',
        ]);

        $userId = $validated['user_id'];
        $ticketId = $validated['ticket_id'];
        $creditAmount = $validated['credit_amount'];

        // Verify ticket belongs to the user
        $ticket = Ticket::where('id', $ticketId)
            ->where('reporter_user_id', $userId)
            ->first();

        if (! $ticket) {
            return response()->json(['error' => 'Ticket not found or does not belong to this user.'], 403);
        }

        try {
            $result = DB::transaction(function () use ($userId, $creditAmount) {
                $wallet = CitizenWallet::where('user_id', $userId)->lockForUpdate()->first();

                if (! $wallet) {
                    return response()->json(['error' => 'Citizen wallet not found. Ensure the user is registered.'], 404);
                }

                $pool = CreditPool::where('is_active', true)
                    ->where('remaining_credits', '>=', $creditAmount)
                    ->where(function ($q) {
                        $q->whereNull('valid_until')->orWhere('valid_until', '>', now());
                    })
                    ->orderBy('created_at', 'asc')
                    ->first();

                if (! $pool) {
                    return response()->json(['error' => 'Corporate ESG Credit Pools are currently depleted.'], 503);
                }

                $pool->decrement('remaining_credits', $creditAmount);

                $wallet->increment('available_credits', $creditAmount);
                $wallet->increment('lifetime_earned', $creditAmount);

                return response()->json([
                    'success' => true,
                    'message' => "Successfully awarded {$creditAmount} Eco-Credits.",
                    'data' => [
                        'user_id' => $userId,
                        'awarded' => $creditAmount,
                        'new_balance' => $wallet->fresh()->available_credits,
                        'sponsored_by' => $pool->sponsor_name,
                    ],
                ], 200);
            });

            return $result;
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Transaction failed',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
