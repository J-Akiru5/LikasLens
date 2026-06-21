<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BiasRiskRegister extends Model
{
    protected $table = 'bias_risk_register';

    protected $fillable = [
        'risk',
        'category',
        'likelihood',
        'impact',
        'mitigation',
        'status',
        'evidence_url',
    ];
}
