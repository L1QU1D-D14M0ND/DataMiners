@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>Cards</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('cards.create') }}" class="btn btn-primary">Create Card</a>
        </div>
    </div>

    @if ($message = Session::get('success'))
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>{{ $message }}</strong>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    @endif

    <div class="table-responsive">
        <table class="table table-striped table-hover">
            <thead class="table-dark">
                <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Experience Unlock</th>
                    <th>Currency A Unlock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($cards as $card)
                    <tr>
                        <td>{{ $card->id }}</td>
                        <td>{{ $card->name }}</td>
                        <td>{{ number_format($card->experience_unlock) }}</td>
                        <td>{{ number_format($card->currency_a_unlock) }}</td>
                        <td>
                            <a href="{{ route('cards.show', $card) }}" class="btn btn-sm btn-info">View</a>
                            <a href="{{ route('cards.edit', $card) }}" class="btn btn-sm btn-warning">Edit</a>
                            <form action="{{ route('cards.destroy', $card) }}" method="POST" style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="5" class="text-center">No cards found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="d-flex justify-content-center">
        {{ $cards->links() }}
    </div>
</div>
@endsection
