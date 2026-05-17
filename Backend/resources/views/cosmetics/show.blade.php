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
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card card-custom">
                <div class="card-header">
                    <h1 class="mb-0">{{ $cosmetic->name }}</h1>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Cosmetic ID:</strong> {{ $cosmetic->id }}</p>
                            <p><strong>Type:</strong> {{ $cosmetic->cosmeticType->name ?? 'N/A' }}</p>
                            <p><strong>Experience Unlock:</strong> {{ number_format($cosmetic->experience_unlock) }}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Credits Unlock:</strong> {{ number_format($cosmetic->credits_unlock) }}</p>
                            <p><strong>Created At:</strong> {{ $cosmetic->created_at->format('M d, Y H:i') }}</p>
                            <p><strong>Updated At:</strong> {{ $cosmetic->updated_at->format('M d, Y H:i') }}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="{{ route('cosmetics.edit', $cosmetic) }}" class="btn btn-custom-warning">Edit</a>
                    <form action="{{ route('cosmetics.destroy', $cosmetic) }}" method="POST" style="display: inline;">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-custom-danger" onclick="return confirm('Are you sure?')">Delete</button>
                    </form>
                    <a href="{{ route('cosmetics.index') }}" class="btn btn-custom-secondary">Back to Cosmetics</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
