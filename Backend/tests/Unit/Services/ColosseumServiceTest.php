<?php

namespace Tests\Unit\Services;

use App\Services\ColosseumService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class ColosseumServiceTest extends TestCase
{
    private ColosseumService $service;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'matchmaking.colosseum.enabled' => true,
            'matchmaking.colosseum.api_key' => 'test-api-key',
            'matchmaking.colosseum.api_url' => 'https://api.colosseum.gg',
            'matchmaking.colosseum.timeout' => 30,
        ]);

        $this->service = new ColosseumService;
    }

    public function test_is_enabled_returns_true_when_configured(): void
    {
        $this->assertTrue($this->service->isEnabled());
    }

    public function test_is_enabled_returns_false_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $this->assertFalse($service->isEnabled());
    }

    public function test_is_enabled_returns_false_when_api_key_empty(): void
    {
        config(['matchmaking.colosseum.api_key' => '']);
        $service = new ColosseumService;

        $this->assertFalse($service->isEnabled());
    }

    public function test_add_to_queue_returns_null_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->addToQueue('ranked', 1, 1500);

        $this->assertNull($result);
    }

    public function test_add_to_queue_returns_response_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players' => Http::response([
                'player_id' => '1',
                'queue' => 'ranked',
                'status' => 'waiting',
            ], 200),
        ]);

        $result = $this->service->addToQueue('ranked', 1, 1500, ['region' => 'us-east']);

        $this->assertIsArray($result);
        $this->assertEquals('1', $result['player_id']);
        $this->assertEquals('ranked', $result['queue']);
    }

    public function test_add_to_queue_returns_null_on_api_error(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players' => Http::response('Server Error', 500),
        ]);

        Log::shouldReceive('error')->once();

        $result = $this->service->addToQueue('ranked', 1, 1500);

        $this->assertNull($result);
    }

    public function test_add_to_queue_returns_null_on_exception(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players' => function () {
                throw new \Exception('Connection timeout');
            },
        ]);

        Log::shouldReceive('error')->once();

        $result = $this->service->addToQueue('ranked', 1, 1500);

        $this->assertNull($result);
    }

    public function test_remove_from_queue_returns_false_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->removeFromQueue('ranked', 1);

        $this->assertFalse($result);
    }

    public function test_remove_from_queue_returns_true_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players/1' => Http::response(null, 204),
        ]);

        $result = $this->service->removeFromQueue('ranked', 1);

        $this->assertTrue($result);
    }

    public function test_remove_from_queue_returns_false_on_failure(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players/1' => Http::response('Not Found', 404),
        ]);

        $result = $this->service->removeFromQueue('ranked', 1);

        $this->assertFalse($result);
    }

    public function test_get_player_status_returns_null_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->getPlayerStatus('ranked', 1);

        $this->assertNull($result);
    }

    public function test_get_player_status_returns_data_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players/1' => Http::response([
                'player_id' => '1',
                'status' => 'waiting',
                'time_in_queue' => 45,
            ], 200),
        ]);

        $result = $this->service->getPlayerStatus('ranked', 1);

        $this->assertIsArray($result);
        $this->assertEquals('waiting', $result['status']);
    }

    public function test_get_player_status_returns_null_on_failure(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked/players/1' => Http::response('Not Found', 404),
        ]);

        $result = $this->service->getPlayerStatus('ranked', 1);

        $this->assertNull($result);
    }

    public function test_get_queue_info_returns_null_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->getQueueInfo('ranked');

        $this->assertNull($result);
    }

    public function test_get_queue_info_returns_data_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues/ranked' => Http::response([
                'name' => 'ranked',
                'players_in_queue' => 12,
                'average_wait_time' => 30,
            ], 200),
        ]);

        $result = $this->service->getQueueInfo('ranked');

        $this->assertIsArray($result);
        $this->assertEquals('ranked', $result['name']);
        $this->assertEquals(12, $result['players_in_queue']);
    }

    public function test_create_queue_returns_null_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->createQueue('new-queue', ['min_players' => 2]);

        $this->assertNull($result);
    }

    public function test_create_queue_returns_data_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/queues' => Http::response([
                'name' => 'new-queue',
                'status' => 'active',
            ], 200),
        ]);

        $result = $this->service->createQueue('new-queue', ['min_players' => 2]);

        $this->assertIsArray($result);
        $this->assertEquals('new-queue', $result['name']);
    }

    public function test_submit_match_result_returns_false_when_disabled(): void
    {
        config(['matchmaking.colosseum.enabled' => false]);
        $service = new ColosseumService;

        $result = $service->submitMatchResult('match_123', ['winner' => 1]);

        $this->assertFalse($result);
    }

    public function test_submit_match_result_returns_true_on_success(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/matches/match_123/results' => Http::response(null, 200),
        ]);

        $result = $this->service->submitMatchResult('match_123', ['winner' => 1]);

        $this->assertTrue($result);
    }

    public function test_submit_match_result_returns_false_on_failure(): void
    {
        Http::fake([
            'https://api.colosseum.gg/v1/matches/match_123/results' => Http::response('Error', 500),
        ]);

        $result = $this->service->submitMatchResult('match_123', ['winner' => 1]);

        $this->assertFalse($result);
    }

    public function test_handle_webhook_returns_true(): void
    {
        Log::shouldReceive('info')->once();

        $result = $this->service->handleWebhook(['event' => 'match_found', 'match_id' => 'abc']);

        $this->assertTrue($result);
    }
}
