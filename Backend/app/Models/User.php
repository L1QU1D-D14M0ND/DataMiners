<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Models\Role;
use App\Models\Card;
use App\Models\Cosmetic;
use App\Models\Deck;
use App\Models\Set;
use App\Models\GameLog;

#[Fillable(['name', 'email', 'password', 'rank_score', 'experience_points', 'credits', 'play_time', 'role_id'])]
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
        return $this->belongsToMany(Card::class, 'user_card', 'users_user_id', 'cards_card_id')
            ->withPivot('unlocked');
    }

    /**
     * Get the decks owned by the user.
     */
    public function decks()
    {
        return $this->hasMany(Deck::class, 'user_id');
    }

    /**
     * Get the sets owned by the user.
     */
    public function sets()
    {
        return $this->hasMany(Set::class, 'user_set_id');
    }

    /**
     * Get the game logs where this user participated as player A.
     */
    public function gameLogsAsUserA()
    {
        return $this->hasMany(GameLog::class, 'user_a');
    }

    /**
     * Get the game logs where this user participated as player B.
     */
    public function gameLogsAsUserB()
    {
        return $this->hasMany(GameLog::class, 'user_b');
    }

    /**
     * Get the cosmetics owned by the user.
     */
    public function cosmetics()
    {
        return $this->belongsToMany(Cosmetic::class, 'user_cosmetic', 'user_id', 'cosmetic_id')
            ->withPivot('unlocked')
            ->withTimestamps();
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
