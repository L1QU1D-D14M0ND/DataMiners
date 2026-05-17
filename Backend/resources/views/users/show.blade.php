@extends('layouts.app')

@section('content')
<style>
    .btn-custom-warning { background-color: #f59e0b; border-color: #f59e0b; color: white; border-radius: 8px; padding: 10px 20px; font-size: 14px; height: 44px; display: inline-flex; align-items: center; }
    .btn-custom-warning:hover { background-color: #d97706; border-color: #d97706; }
    .btn-custom-danger { background-color: #ef4444; border-color: #ef4444; color: white; border-radius: 8px; padding: 10px 20px; font-size: 14px; height: 44px; display: inline-flex; align-items: center; }
    .btn-custom-danger:hover { background-color: #dc2626; border-color: #dc2626; }
    .btn-custom-secondary { background-color: #6b7280; border-color: #6b7280; color: white; border-radius: 8px; padding: 10px 20px; font-size: 14px; height: 44px; display: inline-flex; align-items: center; }
    .btn-custom-secondary:hover { background-color: #4b5563; border-color: #4b5563; }
    .card-custom { box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1.5rem; padding: 1.5rem; }
    .card-footer { display: flex; gap: 0.75rem; flex-wrap: wrap; }
</style>
<div class="container" style="margin-top: 2rem;">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>User: {{ $user->name }}</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('users.edit', $user) }}" class="btn btn-custom-warning">Edit</a>
            <a href="{{ route('users.index') }}" class="btn btn-custom-secondary">Back</a>
        </div>
    </div>

    <div class="card card-custom">
        <div class="card-body">
            <dl class="row">
                <dt class="col-sm-3">ID</dt>
                <dd class="col-sm-9">{{ $user->id }}</dd>

                <dt class="col-sm-3">Name</dt>
                <dd class="col-sm-9">{{ $user->name }}</dd>

                <dt class="col-sm-3">Email</dt>
                <dd class="col-sm-9">{{ $user->email }}</dd>

                <dt class="col-sm-3">Rank Score</dt>
                <dd class="col-sm-9">{{ $user->rank_score ?? 'N/A' }}</dd>

                <dt class="col-sm-3">Experience Points</dt>
                <dd class="col-sm-9">{{ number_format($user->experience_points) }}</dd>

                <dt class="col-sm-3">Credits</dt>
                <dd class="col-sm-9">{{ number_format($user->credits) }}</dd>

                <dt class="col-sm-3">Play Time</dt>
                <dd class="col-sm-9">{{ $user->play_time ?? 'N/A' }}</dd>

                <dt class="col-sm-3">Role</dt>
                <dd class="col-sm-9">{{ $user->role->name ?? 'N/A' }}</dd>

                <dt class="col-sm-3">Created At</dt>
                <dd class="col-sm-9">{{ $user->created_at->format('Y-m-d H:i:s') }}</dd>

                <dt class="col-sm-3">Updated At</dt>
                <dd class="col-sm-9">{{ $user->updated_at->format('Y-m-d H:i:s') }}</dd>
            </dl>
        </div>
    </div>

    <div class="mt-4">
        <form action="{{ route('users.destroy', $user) }}" method="POST" onsubmit="return confirm('Are you sure you want to delete this user?');">
            @csrf
            @method('DELETE')
            <button type="submit" class="btn btn-custom-danger">Delete User</button>
        </form>
    </div>
</div>
@endsection
