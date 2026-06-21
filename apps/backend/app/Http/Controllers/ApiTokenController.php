<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiTokenController extends Controller
{
    /**
     * List all active API tokens for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $tokens = $request->user()->tokens()->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $tokens,
        ]);
    }

    /**
     * Create a new API token for the authenticated user.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'token_name' => 'required|string|max:255',
        ]);

        $token = $request->user()->createToken($request->token_name);

        return response()->json([
            'success' => true,
            'message' => 'API token created successfully.',
            'data' => [
                'id' => $token->accessToken->id,
                'name' => $token->accessToken->name,
                'token' => $token->plainTextToken,
                'created_at' => $token->accessToken->created_at,
            ],
        ], 201);
    }

    /**
     * Revoke (delete) an API token.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->tokens()->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'API token revoked successfully.',
        ]);
    }
}
