<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action',
        'entity_type',
        'entity_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Helper static method to create audit logs cleanly.
     */
    public static function log(string $action, string $description, array $newValues = [], ?string $entityType = null, ?int $entityId = null, array $oldValues = []): self
    {
        return self::create([
            'user_id' => auth()->id() ?? 1,
            'action' => $action,
            'entity_type' => $entityType ?? 'ClinicalReference',
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => array_merge(['description' => $description], $newValues),
            'ip_address' => request()->ip() ?? '127.0.0.1',
            'user_agent' => request()->userAgent() ?? 'System / API Importer',
            'created_at' => now(),
        ]);
    }
}
