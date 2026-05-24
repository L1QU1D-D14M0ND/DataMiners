@extends('layouts.app')

@section('content')
<style>
    .btn-custom-success { background-color: #10b981; border-color: #10b981; color: white; border-radius: 8px; padding: 10px 16px; font-size: 14px; height: 40px; display: inline-flex; align-items: center; }
    .btn-custom-success:hover { background-color: #059669; border-color: #059669; }
    .btn-custom-info { background-color: #3b82f6; border-color: #3b82f6; color: white; border-radius: 8px; padding: 10px 16px; font-size: 14px; height: 40px; display: inline-flex; align-items: center; }
    .btn-custom-info:hover { background-color: #2563eb; border-color: #2563eb; }
    .btn-custom-warning { background-color: #f59e0b; border-color: #f59e0b; color: white; border-radius: 8px; padding: 10px 16px; font-size: 14px; height: 40px; display: inline-flex; align-items: center; }
    .btn-custom-warning:hover { background-color: #d97706; border-color: #d97706; }
    .btn-custom-danger { background-color: #ef4444; border-color: #ef4444; color: white; border-radius: 8px; padding: 10px 16px; font-size: 14px; height: 40px; display: inline-flex; align-items: center; }
    .btn-custom-danger:hover { background-color: #dc2626; border-color: #dc2626; }
    .card-custom { box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1.5rem; margin-right: 1rem; padding: 1.5rem;}
    .card-footer { gap: 0.5rem; }
</style>
<div class="container" style="margin-top: 2rem;">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1 class="text-center">Users</h1>
        </div>
    </div>

    @if ($message = Session::get('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ $message }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if ($users->count() > 0)
        <div class="row justify-content-center" style="margin: 0 2rem;">
            @forelse ($users as $user)
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border card-custom">
                        <div class="card-body">
                            <h5 class="card-title">{{ $user->name }}</h5>
                            <dl class="row mb-3">
                                <dt class="col-sm-5 text-truncate">ID:</dt>
                                <dd class="col-sm-7">{{ $user->id }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Email:</dt>
                                <dd class="col-sm-7 text-truncate" title="{{ $user->email }}">{{ $user->email }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Rank Score:</dt>
                                <dd class="col-sm-7">{{ $user->rank_score ?? 'N/A' }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Experience Points:</dt>
                                <dd class="col-sm-7">{{ number_format($user->experience_points) }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Role:</dt>
                                <dd class="col-sm-7">{{ $user->role->name ?? 'N/A' }}</dd>
                            </dl>
                        </div>
                        <div class="card-footer bg-white border-top" style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                            <a href="{{ route('users.show', $user) }}" class="btn btn-sm btn-custom-info">View</a>
                            <a href="{{ route('users.edit', $user) }}" class="btn btn-sm btn-custom-warning">Edit</a>
                        </div>
                    </div>
                </div>
            @empty
                <div class="col-12">
                    <div class="alert alert-info">No users found.</div>
                </div>
            @endforelse
        </div>

        <div class="d-flex justify-content-center mt-4">
            {{ $users->links() }}
        </div>
    @else
        <div class="alert alert-info">No users found. <a href="{{ route('users.create') }}">Create one</a></div>
    @endif
</div>
@endsection
