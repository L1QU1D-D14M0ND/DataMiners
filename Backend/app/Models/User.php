<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

#[Fillable(['name', 'email', 'password', 'rank_number', 'experience', 'currency_a', 'play_time', 'role_id'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'play_time' => 'date',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the role that the user belongs to.
     */
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    /**
     * Get the cards owned by the user.
     */
    public function cards()
    {
        return $this->belongsToMany(Card::class, 'user_card', 'users_id', 'cards_id')
            ->withPivot('unlocked')
            ->withTimestamps();
    }

    /**
     * Get the cosmetics owned by the user.
     */
    public function cosmetics()
    {
        return $this->belongsToMany(Cosmetic::class, 'user_cosmetic', 'users_id', 'cosmetics_id')
            ->withPivot('unlocked')
            ->withTimestamps();
    }

    /**
     * Get the decks owned by the user.
     */
    public function decks()
    {
        return $this->hasMany(Deck::class, 'id', 'id');
    }

    /**
     * Get the sets owned by the user.
     */
    public function sets()
    {
        return $this->hasMany(Set::class, 'id', 'id');
    }

    /**
     * Get the games where this user was player A.
     */
    public function gamesAsPlayerA()
    {
        return $this->hasMany(GameLog::class, 'user_a', 'id');
    }

    /**
     * Get the games where this user was player B.
     */
    public function gamesAsPlayerB()
    {
        return $this->hasMany(GameLog::class, 'user_b', 'id');
    }
}
