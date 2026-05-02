@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <h1>Edit Card</h1>

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

            <form action="{{ route('cards.update', $card) }}" method="POST">
                @csrf
                @method('PUT')
                <div class="mb-3">
                    <label for="name" class="form-label">Card Name</label>
                    <input type="text" class="form-control @error('name') is-invalid @enderror" id="name" name="name" value="{{ old('name', $card->name) }}" required>
                    @error('name')
                        <span class="invalid-feedback">{{ $message }}</span>
                    @enderror
                </div>

                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="experience_unlock" class="form-label">Experience Unlock</label>
                            <input type="number" class="form-control @error('experience_unlock') is-invalid @enderror" id="experience_unlock" name="experience_unlock" value="{{ old('experience_unlock', $card->experience_unlock) }}" min="0">
                            @error('experience_unlock')
                                <span class="invalid-feedback">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="currency_a_unlock" class="form-label">Currency A Unlock</label>
                            <input type="number" class="form-control @error('currency_a_unlock') is-invalid @enderror" id="currency_a_unlock" name="currency_a_unlock" value="{{ old('currency_a_unlock', $card->currency_a_unlock) }}" min="0">
                            @error('currency_a_unlock')
                                <span class="invalid-feedback">{{ $message }}</span>
                            @enderror
                        </div>
                    </div>
                </div>

                <div class="mb-3">
                    <button type="submit" class="btn btn-primary">Update Card</button>
                    <a href="{{ route('cards.show', $card) }}" class="btn btn-secondary">Cancel</a>
                </div>
            </form>
        </div>
    </div>
</div>
@endsection
