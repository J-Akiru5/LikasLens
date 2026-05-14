<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class GeminiMessage extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'conversation_id',
        'sender_role',
        'message_text',
        'token_count_input',
        'token_count_output',
        'model_name',
    ];

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(GeminiConversation::class, 'conversation_id');
    }
}
