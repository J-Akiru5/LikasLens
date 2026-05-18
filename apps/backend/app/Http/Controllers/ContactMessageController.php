<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ContactMessage;

class ContactMessageController extends Controller
{
    /**
     * Store a newly created contact message in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'message' => 'required|string|max:2000',
        ]);

        $message = ContactMessage::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Contact message saved successfully.',
            'data' => $message
        ], 201);
    }

    /**
     * Display a listing of the contact messages.
     * Accessible by super_admin (or analyst if configured).
     */
    public function index(Request $request)
    {
        $messages = ContactMessage::orderBy('created_at', 'desc')->paginate(20);
        return response()->json([
            'success' => true,
            'data' => $messages->items(),
            'meta' => [
                'current_page' => $messages->currentPage(),
                'last_page' => $messages->lastPage(),
                'per_page' => $messages->perPage(),
                'total' => $messages->total(),
            ],
        ]);
    }

    /**
     * Mark a contact message as read.
     */
    public function markAsRead($id)
    {
        $message = ContactMessage::findOrFail($id);
        
        if ($message->status !== 'read') {
            $message->update([
                'status' => 'read',
                'read_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Contact message marked as read.',
            'data' => $message
        ]);
    }
}
