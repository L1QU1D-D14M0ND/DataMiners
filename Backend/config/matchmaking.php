<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Matchmaking Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the matchmaking system including Redis settings,
    | skill rating ranges, and Colosseum integration.
    |
    */

    // Queue time-to-live in seconds (default: 5 minutes)
    'queue_ttl' => env('MATCHMAKING_QUEUE_TTL', 300),

    // Maximum wait time before expanding skill range (default: 60 seconds)
    'max_wait_time' => env('MATCHMAKING_MAX_WAIT_TIME', 60),

    // Initial skill rating range for matching (default: ±100)
    'skill_range' => env('MATCHMAKING_SKILL_RANGE', 100),

    // Skill range expansion per 30 seconds of waiting
    'skill_range_expansion' => env('MATCHMAKING_SKILL_RANGE_EXPANSION', 50),

    // Maximum skill range (prevents matching with vastly different players)
    'max_skill_range' => env('MATCHMAKING_MAX_SKILL_RANGE', 500),

    // Default skill rating for new players (uses rank_score from users table)
    'default_skill_rating' => env('MATCHMAKING_DEFAULT_SKILL_RATING', 1000),

    /*
    |--------------------------------------------------------------------------
    | Colosseum Integration
    |--------------------------------------------------------------------------
    |
    | Configuration for Colosseum matchmaking service integration.
    | Set to false to use local Redis-based matchmaking only.
    |
    */
    'colosseum' => [
        'enabled' => env('COLOSSEUM_ENABLED', false),
        'api_key' => env('COLOSSEUM_API_KEY'),
        'api_url' => env('COLOSSEUM_API_URL', 'https://api.colosseum.gg'),
        'timeout' => env('COLOSSEUM_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | Queue Configuration
    |--------------------------------------------------------------------------
    |
    | Available matchmaking queues and their specific settings.
    |
    */
    'queues' => [
        'ranked' => [
            'name' => 'Ranked',
            'skill_range' => 100,
            'max_wait_time' => 120,
            'min_players' => 2,
            'max_players' => 2,
        ],
        'casual' => [
            'name' => 'Casual',
            'skill_range' => 200,
            'max_wait_time' => 60,
            'min_players' => 2,
            'max_players' => 2,
        ],
        'tournament' => [
            'name' => 'Tournament',
            'skill_range' => 50,
            'max_wait_time' => 300,
            'min_players' => 4,
            'max_players' => 8,
        ],
    ],
];
