<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketEvidence extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'ticket_evidence';

    protected $fillable = [
        'ticket_id',
        'uploaded_by_user_id',
        'storage_provider',
        'storage_bucket',
        'storage_path',
        'checksum_sha256',
        'mime_type',
        'file_size_bytes',
        'captured_at',
        'exif_removed_at',
        'yolo_status',
        'yolo_summary',
    ];

    protected $casts = [
        'captured_at' => 'datetime',
        'exif_removed_at' => 'datetime',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function uploadedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by_user_id');
    }
}
