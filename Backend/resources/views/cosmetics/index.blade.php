@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>Cosmetics</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('cosmetics.create') }}" class="btn btn-success">+ Create Cosmetic</a>
        </div>
    </div>

    @if ($message = Session::get('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ $message }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    @if ($cosmetics->count() > 0)
        <div class="row">
            @forelse ($cosmetics as $cosmetic)
                <div class="col-md-4 mb-4">
                    <div class="card h-100 border">
                        <div class="card-body">
                            <h5 class="card-title">{{ $cosmetic->name }}</h5>
                            <dl class="row mb-3">
                                <dt class="col-sm-5 text-truncate">ID:</dt>
                                <dd class="col-sm-7">{{ $cosmetic->id }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Type:</dt>
                                <dd class="col-sm-7">{{ $cosmetic->cosmeticType->name ?? 'N/A' }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Exp Unlock:</dt>
                                <dd class="col-sm-7">{{ number_format($cosmetic->experience_unlock) }}</dd>
                                
                                <dt class="col-sm-5 text-truncate">Currency Unlock:</dt>
                                <dd class="col-sm-7">{{ number_format($cosmetic->currency_a_unlock) }}</dd>
                            </dl>
                        </div>
                        <div class="card-footer bg-white border-top">
                            <a href="{{ route('cosmetics.show', $cosmetic) }}" class="btn btn-sm btn-info">View</a>
                            <a href="{{ route('cosmetics.edit', $cosmetic) }}" class="btn btn-sm btn-warning">Edit</a>
                            <form action="{{ route('cosmetics.destroy', $cosmetic) }}" method="POST" style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
                        </div>
                    </div>
                </div>
            @empty
                <div class="col-12">
                    <div class="alert alert-info">No cosmetics found.</div>
                </div>
            @endforelse
        </div>

        <div class="d-flex justify-content-center mt-4">
            {{ $cosmetics->links() }}
        </div>
    @else
        <div class="alert alert-info">No cosmetics found. <a href="{{ route('cosmetics.create') }}">Create one</a></div>
    @endif
</div>
@endsection
