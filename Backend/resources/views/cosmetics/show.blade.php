@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card">
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
                            <p><strong>Currency A Unlock:</strong> {{ number_format($cosmetic->currency_a_unlock) }}</p>
                            <p><strong>Created At:</strong> {{ $cosmetic->created_at->format('M d, Y H:i') }}</p>
                            <p><strong>Updated At:</strong> {{ $cosmetic->updated_at->format('M d, Y H:i') }}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="{{ route('cosmetics.edit', $cosmetic) }}" class="btn btn-warning">Edit</a>
                    <form action="{{ route('cosmetics.destroy', $cosmetic) }}" method="POST" style="display: inline;">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                    </form>
                    <a href="{{ route('cosmetics.index') }}" class="btn btn-secondary">Back to Cosmetics</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
