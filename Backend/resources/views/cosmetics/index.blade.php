@extends('layouts.app')

@section('content')
<div class="container">
    <div class="row mb-4">
        <div class="col-md-6">
            <h1>Cosmetics</h1>
        </div>
        <div class="col-md-6 text-end">
            <a href="{{ route('cosmetics.create') }}" class="btn btn-primary">Create Cosmetic</a>
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
                    <th>Type</th>
                    <th>Experience Unlock</th>
                    <th>Currency A Unlock</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                @forelse ($cosmetics as $cosmetic)
                    <tr>
                        <td>{{ $cosmetic->id }}</td>
                        <td>{{ $cosmetic->name }}</td>
                        <td>{{ $cosmetic->cosmeticType->name ?? 'N/A' }}</td>
                        <td>{{ number_format($cosmetic->experience_unlock) }}</td>
                        <td>{{ number_format($cosmetic->currency_a_unlock) }}</td>
                        <td>
                            <a href="{{ route('cosmetics.show', $cosmetic) }}" class="btn btn-sm btn-info">View</a>
                            <a href="{{ route('cosmetics.edit', $cosmetic) }}" class="btn btn-sm btn-warning">Edit</a>
                            <form action="{{ route('cosmetics.destroy', $cosmetic) }}" method="POST" style="display: inline;">
                                @csrf
                                @method('DELETE')
                                <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Are you sure?')">Delete</button>
                            </form>
                        </td>
                    </tr>
                @empty
                    <tr>
                        <td colspan="6" class="text-center">No cosmetics found.</td>
                    </tr>
                @endforelse
            </tbody>
        </table>
    </div>

    <div class="d-flex justify-content-center">
        {{ $cosmetics->links() }}
    </div>
</div>
@endsection
