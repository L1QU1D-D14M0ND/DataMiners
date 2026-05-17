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
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <h1>Edit Cosmetic</h1>

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

            <form action="{{ route('cosmetics.update', $cosmetic) }}" method="POST">
                @csrf
                @method('PUT')
                <div class="mb-3">
                    <label for="name" class="form-label">Cosmetic Name</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $cosmetic->name) }}" required>
                    @error('name')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="mb-3">
                    <label for="cosmetic_type_id" class="form-label">Cosmetic Type</label>
                    <select class="form-select @error('cosmetic_type_id') is-invalid @enderror" id="cosmetic_type_id" name="cosmetic_type_id" required>
                        <option value="">Select a type</option>
                        @foreach ($types as $type)
                            <option value="{{ $type->id }}" {{ old('cosmetic_type_id', $cosmetic->cosmetic_type_id) == $type->id ? 'selected' : '' }}>{{ $type->name }}</option>
                        @endforeach
                    </select>
                    @error('cosmetic_type_id')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="experience_unlock" class="form-label">Experience Unlock</label>
                            <input type="number" class="form-control @error('experience_unlock') is-invalid @enderror" id="experience_unlock" name="experience_unlock" value="{{ old('experience_unlock', $cosmetic->experience_unlock) }}" min="0">
                            @error('experience_unlock')
                                <span class="invalid-feedback">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="credits_unlock" class="form-label">Credits Unlock</label>
                            <input type="number" class="form-control @error('credits_unlock') is-invalid @enderror" id="credits_unlock" name="credits_unlock" value="{{ old('credits_unlock', $cosmetic->credits_unlock) }}" min="0">
                            @error('credits_unlock')
                                <span class="invalid-feedback">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="submit" class="btn btn-custom-primary">Update Cosmetic</button>
                    <a href="{{ route('cosmetics.show', $cosmetic) }}" class="btn btn-custom-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
