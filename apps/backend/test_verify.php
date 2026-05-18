<?php

use App\Models\Report;
use App\Models\User;
use Illuminate\Support\Facades\Route;

echo "=== User Model ===\n";
echo 'tickets(): '.(method_exists(new User, 'tickets') ? 'OK' : 'MISSING')."\n";
echo 'SoftDeletes: '.(in_array('Illuminate\Database\Eloquent\SoftDeletes', class_uses(new User)) ? 'OK' : 'MISSING')."\n";

echo "\n=== Report Model ===\n";
echo 'user(): '.(method_exists(new Report, 'user') ? 'OK' : 'MISSING')."\n";

echo "\n=== Controllers ===\n";
echo 'AuthController: '.(class_exists('App\Http\Controllers\AuthController') ? 'OK' : 'MISSING')."\n";
echo 'TicketAssignmentController: '.(class_exists('App\Http\Controllers\TicketAssignmentController') ? 'OK' : 'MISSING')."\n";

echo "\n=== Middleware ===\n";
echo 'EnsureRole: '.(class_exists('App\Http\Middleware\EnsureRole') ? 'OK' : 'MISSING')."\n";

echo "\n=== Routes ===\n";
foreach (Route::getRoutes() as $r) {
    echo $r->methods()[0].' '.$r->uri()."\n";
}
