<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'supabase' => [
        'url' => env('NEXT_PUBLIC_SUPABASE_URL', ''),
        'jwt_secret' => env('SUPABASE_JWT_SECRET', ''),
    ],

    'ai' => [
        'url' => env('AI_SERVICE_URL', 'http://127.0.0.1:8001'),
        'api_key' => env('AI_SERVICE_API_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'blockchain' => [
        'network' => env('BLOCKCHAIN_NETWORK', 'sepolia'),
        'rpc_url' => env('BLOCKCHAIN_RPC_URL', 'https://rpc.sepolia.org'),
        'private_key' => env('BLOCKCHAIN_PRIVATE_KEY'),
        'wallet_address' => env('BLOCKCHAIN_WALLET_ADDRESS'),
    ],

];
