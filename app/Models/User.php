<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
        'avatar',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    public const ROLE_SUPER_ADMIN = 'super_admin';
    public const ROLE_PHARMACIST = 'pharmacist';
    public const ROLE_CASHIER = 'cashier';
    public const ROLE_INVENTORY_MANAGER = 'inventory_manager';

    public static function getRoles(): array
    {
        return [
            self::ROLE_SUPER_ADMIN => 'Super Admin',
            self::ROLE_PHARMACIST => 'Lead Pharmacist',
            self::ROLE_CASHIER => 'Cashier',
            self::ROLE_INVENTORY_MANAGER => 'Inventory Manager',
        ];
    }

    public function isSuperAdmin(): bool
    {
        return $this->role === self::ROLE_SUPER_ADMIN;
    }

    public function isPharmacist(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_PHARMACIST]);
    }

    public function isCashier(): bool
    {
        return $this->role === self::ROLE_CASHIER;
    }

    public function isInventoryManager(): bool
    {
        return in_array($this->role, [self::ROLE_SUPER_ADMIN, self::ROLE_INVENTORY_MANAGER]);
    }

    public function hasRole(string|array $roles): bool
    {
        if ($this->role === self::ROLE_SUPER_ADMIN) {
            return true;
        }

        $roles = is_array($roles) ? $roles : [$roles];
        return in_array($this->role, $roles);
    }

    public function canAccessModule(string $module): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        return match ($module) {
            'dashboard' => true,
            'pos' => in_array($this->role, [self::ROLE_PHARMACIST, self::ROLE_CASHIER]),
            'prescriptions', 'ai-insights' => in_array($this->role, [self::ROLE_PHARMACIST]),
            'inventory', 'suppliers' => in_array($this->role, [self::ROLE_INVENTORY_MANAGER, self::ROLE_PHARMACIST]),
            'audit-logs' => in_array($this->role, [self::ROLE_PHARMACIST, self::ROLE_INVENTORY_MANAGER]),
            'settings' => false,
            default => false,
        };
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class);
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    public function stockAdjustments(): HasMany
    {
        return $this->hasMany(StockAdjustment::class);
    }
}
