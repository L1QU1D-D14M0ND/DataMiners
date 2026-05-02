@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card">
                <div class="card-header">
                    <h1 class="mb-0">{{ $card->name }}</h1>
                </div>
                <div class="card-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <p><strong>Card ID:</strong> {{ $card->id }}</p>
                            <p><strong>Experience Unlock:</strong> {{ number_format($card->experience_unlock) }}</p>
                        </div>
                        <div class="col-md-6">
                            <p><strong>Currency A Unlock:</strong> {{ number_format($card->currency_a_unlock) }}</p>
                            <p><strong>Created At:</strong> {{ $card->created_at->format('M d, Y H:i') }}</p>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <a href="{{ route('cards.edit', $card) }}" class="btn btn-warning">Edit</a>
                    <form action="{{ route('cards.destroy', $card) }}" method="POST" style="display: inline;">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="btn btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                    </form>
                    <a href="{{ route('cards.index') }}" class="btn btn-secondary">Back to Cards</a>
                </div>
            </div>
        </div>
    </div>
</div>
@endsection
