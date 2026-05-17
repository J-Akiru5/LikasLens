<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    /**
     * Proxy a chat request to the internal AI service.
     * The AI service has --ingress internal on Azure; the browser cannot
     * reach it directly. This backend endpoint bridges that gap.
     */
    public function send(Request $request): JsonResponse
    {
        $aiServiceUrl = rtrim(env('AI_SERVICE_URL', 'http://127.0.0.1:8001'), '/');

        $payload = $request->validate([
            'messages' => 'required|array|min:1',
            'messages.*.role' => 'required|string|in:user,assistant',
            'messages.*.content' => 'required|string',
            'system_prompt' => 'sometimes|string',
            'temperature' => 'sometimes|numeric|min:0|max:2',
            'max_output_tokens' => 'sometimes|integer|min:1|max:8192',
            'top_p' => 'sometimes|numeric|min:0|max:1',
        ]);

        try {
            $response = Http::timeout(60)->post("{$aiServiceUrl}/api/v1/chat", $payload);

            if (! $response->successful()) {
                Log::warning('AI service chat proxy failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'reply' => 'Oops! I couldn\'t reach my brain right now. Please try again later.',
                ], 502);
            }

            return response()->json($response->json());
        } catch (\Throwable $e) {
            Log::error('AI service chat proxy connection failed', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'reply' => 'Oops! I couldn\'t reach my brain right now. Please check your connection or try again later.',
            ], 502);
        }
    }
}
