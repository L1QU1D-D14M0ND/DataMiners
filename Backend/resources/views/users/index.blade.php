@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>Users</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('users.create') }}" class="btn btn-success">+ Create User</a>
        </div>
    </div>

    @if ($message = Session::get('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ $message }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if ($users->count() > 0)
        <div class="row">
            @forelse ($users as $user)
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border">
                        <div class="card-body">
                            <h5 class="card-title">{{ $user->name }}</h5>
                            <dl class="row mb-3">
                                <dt class="col-sm-5 text-truncate">ID:</dt>
                                <dd class="col-sm-7">{{ $user->id }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Email:</dt>
                                <dd class="col-sm-7 text-truncate" title="{{ $user->email }}">{{ $user->email }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Rank:</dt>
                                <dd class="col-sm-7">{{ $user->rank_number ?? 'N/A' }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Experience:</dt>
                                <dd class="col-sm-7">{{ number_format($user->experience) }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Role:</dt>
                                <dd class="col-sm-7">{{ $user->role->name ?? 'N/A' }}</dd>
                            </dl>
                        </div>
                        <div class="card-footer bg-white border-top">
                            <a href="{{ route('users.show', $user) }}" class="btn btn-sm btn-info">View</a>
                            <a href="{{ route('users.edit', $user) }}" class="btn btn-sm btn-warning">Edit</a>
                            <form action="{{ route('users.destroy', $user) }}" method="POST" style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
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
