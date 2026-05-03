@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>User: {{ $user->name }}</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('users.edit', $user) }}" class="btn btn-warning">Edit</a>
            <a href="{{ route('users.index') }}" class="btn btn-secondary">Back</a>
        </div>
    </div>

    <div class="card">
        <div class="card-body">
            <dl class="row">
                <dt class="col-sm-3">ID</dt>
                <dd class="col-sm-9">{{ $user->id }}</dd>

                <dt class="col-sm-3">Name</dt>
                <dd class="col-sm-9">{{ $user->name }}</dd>

                <dt class="col-sm-3">Email</dt>
                <dd class="col-sm-9">{{ $user->email }}</dd>

                <dt class="col-sm-3">Rank Number</dt>
                <dd class="col-sm-9">{{ $user->rank_number ?? 'N/A' }}</dd>

                <dt class="col-sm-3">Experience</dt>
                <dd class="col-sm-9">{{ number_format($user->experience) }}</dd>

                <dt class="col-sm-3">Currency A</dt>
                <dd class="col-sm-9">{{ number_format($user->currency_a) }}</dd>

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
            <button type="submit" class="btn btn-danger">Delete User</button>
        </form>
    </div>
</div>
@endsection
