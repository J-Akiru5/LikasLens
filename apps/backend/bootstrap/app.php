<?php

use App\Http\Middleware\EnsureRole;
use App\Http\Middleware\ResolveTenant;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\HandleCors;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            HandleCors::class,
            ResolveTenant::class,
        ]);

        $middleware->alias([
            'role' => EnsureRole::class,
            'resolve-tenant' => ResolveTenant::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        $exceptions->report(function (Throwable $e) {
            Log::error('Unhandled exception', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
        });

        $exceptions->render(function (Throwable $e, $request) {
            if ($request->expectsJson() || $request->is('api/*')) {
                if ($e instanceof ValidationException) {
                    return null;
                }

                $status = 500;

                if ($e instanceof HttpExceptionInterface) {
                    $status = $e->getStatusCode();
                } elseif ($e instanceof AuthenticationException) {
                    $status = 401;
                }

                $response = [
                    'success' => false,
                    'message' => $status >= 500 ? 'Internal server error' : $e->getMessage(),
                ];

                if (config('app.debug')) {
                    $response['error'] = $e->getMessage();
                    $response['file'] = $e->getFile();
                    $response['line'] = $e->getLine();
                }

                return response()->json($response, $status);
            }
        });
    })->create();
