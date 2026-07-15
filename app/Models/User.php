<?php

namespace App\Models;

use App\Notifications\VerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Casts\Attribute;

#[Fillable(['agency_name', 'name', 'country', 'contact_number', 'email', 'password', 'account_type'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasRoles;

    public function sendEmailVerificationNotification(): void
    {
        $this->notify(new VerifyEmail);
    }

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_protected' => 'boolean',
            'is_active' => 'boolean',
        ];
    }

    // Appended both avatar_url and the new dynamic role attribute
    protected $appends = ['avatar_url', 'role'];

    protected static function booted(): void
    {
        static::creating(function (User $user) {
            if (empty($user->avatar)) {
                $user->avatar = static::generateRandomAvatar();
            }
        });
    }

    protected static function generateRandomAvatar(): string
    {
        $type = random_int(0, 1) ? 'Male' : 'Female';
        $number = random_int(1, 10);

        return "{$type}{$number}.jpg";
    }

    protected function avatarUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->avatar
                ? asset('assets/avatar/' . $this->avatar)
                : asset('assets/avatar/default.png'),
        );
    }

    /**
     * Dynamically retrieve and format the user's role.
     */
    protected function role(): Attribute
    {
        return Attribute::make(
            get: function () {
                $roleName = $this->getRoleNames()->first();
                if (!$roleName) {
                    return 'Agent';
                }
                
                // Format nicely (e.g., b2b-partner -> B2B Partner)
                $formatted = str_replace(['-', '_'], ' ', $roleName);
                $formatted = preg_replace_callback('/\bb2b\b/i', fn($m) => 'B2B', $formatted);
                return ucwords($formatted);
            }
        );
    }

    public function isProtected(): bool
    {
        return (bool) $this->is_protected;
    }

    public function deactivate(): void
    {
        if ($this->isProtected()) {
            throw new \App\Exceptions\ProtectedUserException();
        }

        $this->forceFill(['is_active' => false])->save();
    }

    public function activate(): void
    {
        $this->forceFill(['is_active' => true])->save();
    }

    public function isB2bPartner(): bool
    {
        return $this->account_type === 'b2b_partner';
    }

    public function markAsManuallyVerified(User $verifiedBy): void
    {
        $this->forceFill([
            'is_manually_verified' => true,
            'manually_verified_at' => now(),
            'manually_verified_by' => $verifiedBy->id,
        ])->save();

        if ($this->roles()->count() === 0) {
            $this->syncRoles(['b2b-partner']);
        }
    }

    public function scopeMainAgents($query)
    {
        return $query->role(['main-agent', 'main-agent-staff']);
    }
}