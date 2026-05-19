@extends('layouts.app')

@section('content')
<style>
    .btn-custom-primary { background-color: #6366f1; border-color: #6366f1; color: white; border-radius: 8px; padding: 10px 20px; font-size: 14px; height: 44px; display: inline-flex; align-items: center; }
    .btn-custom-primary:hover { background-color: #4f46e5; border-color: #4f46e5; }
    .btn-custom-secondary { background-color: #6b7280; border-color: #6b7280; color: white; border-radius: 8px; padding: 10px 20px; font-size: 14px; height: 44px; display: inline-flex; align-items: center; }
    .btn-custom-secondary:hover { background-color: #4b5563; border-color: #4b5563; }
    .card-custom { box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-top: 1rem; margin-bottom: 1.5rem; padding: 1.5rem; }
    .form-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }
</style>
<div class="container" style="margin-top: 2rem;">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>Edit User: {{ $user->name }}</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('users.index') }}" class="btn btn-custom-secondary">Back</a>
        </div>
    </div>

    @if ($errors->any())
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>Validation Error!</strong>
            <ul class="mb-0">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="card card-custom">
        <div class="card-body">
            <form action="{{ route('users.update', $user) }}" method="POST">
                @csrf
                @method('PATCH')

                <div class="mb-3">
                    <label for="name" class="form-label">Name</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $user->name) }}" required>
                    @error('name')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="email" class="form-label">Email</label>
                    <input type="email" class="form-control @error('email') is-invalid @enderror" id="email" name="email" value="{{ old('email', $user->email) }}" required>
                    @error('email')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="rank_score" class="form-label">Rank Score</label>
                    <input type="number" class="form-control @error('rank_score') is-invalid @enderror" id="rank_score" name="rank_score" value="{{ old('rank_score', $user->rank_score) }}" min="0">
                    @error('rank_score')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="role_id" class="form-label">Role</label>
                    <select class="form-select @error('role_id') is-invalid @enderror" id="role_id" name="role_id">
                        <option value="">-- Select Role --</option>
                        @foreach ($roles as $role)
                            <option value="{{ $role->id }}" {{ old('role_id', $user->role_id) == $role->id ? 'selected' : '' }}>{{ $role->name }}</option>
                        @endforeach
                    </select>
                    @error('role_id')
                        <div class="invalid-feedback">{{ $message }}</div>
                    @enderror
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-custom-primary">Update User</button>
                    <a href="{{ route('users.index') }}" class="btn btn-custom-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
