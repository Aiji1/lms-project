<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermissionOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PermissionOverrideController extends Controller
{
    /**
     * Get all permission overrides (filtered by params)
     */
    public function index(Request $request)
    {
        try {
            $query = PermissionOverride::query();
            
            if ($request->has('target_type')) {
                $query->where('target_type', $request->target_type);
            }
            
            if ($request->has('target_id')) {
                $query->where('target_id', $request->target_id);
            }
            
            if ($request->has('resource_key')) {
                $query->where('resource_key', $request->resource_key);
            }
            
            $overrides = $query->get();
            
            return response()->json($overrides);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride index:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat permission overrides: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get merged overrides for a role (and optionally user_id)
     * Returns: { resource_key: { view, create, edit, delete } }
     */
    public function merged(Request $request)
    {
        try {
            $role = $request->input('role');
            $userId = $request->input('user_id');
            
            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter role wajib diisi'
                ], 400);
            }
            
            $query = PermissionOverride::where('target_type', 'role')
                ->where('target_id', $role);
            
            $overrides = $query->get();
            
            // Transform to map: resource_key => permission object
            $result = [];
            foreach ($overrides as $override) {
                $result[$override->resource_key] = [
                    'view' => (bool) $override->view,
                    'create' => (bool) $override->create,
                    'edit' => (bool) $override->edit,
                    'delete' => (bool) $override->delete,
                ];
            }
            
            // If user_id provided, merge user-specific overrides (priority higher)
            if ($userId) {
                $userOverrides = PermissionOverride::where('target_type', 'user')
                    ->where('target_id', $userId)
                    ->get();
                
                foreach ($userOverrides as $override) {
                    $result[$override->resource_key] = [
                        'view' => (bool) $override->view,
                        'create' => (bool) $override->create,
                        'edit' => (bool) $override->edit,
                        'delete' => (bool) $override->delete,
                    ];
                }
            }
            
            return response()->json($result);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride merged:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal memuat merged overrides: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new permission override
     */
    public function store(Request $request)
    {
        try {
            Log::info('PermissionOverride store called', ['data' => $request->all()]);
            
            $validated = $request->validate([
                'target_type' => 'required|in:role,user',
                'target_id' => 'required|string',
                'resource_key' => 'required|string',
                'view' => 'required|boolean',
                'create' => 'required|boolean',
                'edit' => 'required|boolean',
                'delete' => 'required|boolean',
            ]);
            
            // Check if already exists
            $existing = PermissionOverride::where('target_type', $validated['target_type'])
                ->where('target_id', $validated['target_id'])
                ->where('resource_key', $validated['resource_key'])
                ->first();
            
            if ($existing) {
                Log::info('Override exists, updating', ['id' => $existing->id_override]);
                
                // Update instead
                $existing->update([
                    'view' => $validated['view'],
                    'create' => $validated['create'],
                    'edit' => $validated['edit'],
                    'delete' => $validated['delete'],
                ]);
                
                // Refresh from database
                $existing->refresh();
                
                return response()->json([
                    'success' => true,
                    'message' => 'Permission override berhasil diupdate',
                    'data' => $existing
                ]);
            }
            
            Log::info('Creating new override', ['data' => $validated]);
            
            $override = PermissionOverride::create($validated);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override berhasil dibuat',
                'data' => $override
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in store:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride store:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat permission override: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update permission override
     */
    public function update(Request $request, $id)
    {
        try {
            Log::info('PermissionOverride update called', ['id' => $id, 'data' => $request->all()]);
            
            $override = PermissionOverride::findOrFail($id);
            
            $validated = $request->validate([
                'target_type' => 'sometimes|in:role,user',
                'target_id' => 'sometimes|string',
                'resource_key' => 'sometimes|string',
                'view' => 'sometimes|boolean',
                'create' => 'sometimes|boolean',
                'edit' => 'sometimes|boolean',
                'delete' => 'sometimes|boolean',
            ]);
            
            $override->update($validated);
            
            // Refresh from database
            $override->refresh();
            
            Log::info('Override updated successfully', ['id' => $id, 'data' => $override]);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override berhasil diupdate',
                'data' => $override
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Override not found:', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Permission override tidak ditemukan'
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error in update:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride update:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal update permission override: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete permission override
     */
    public function destroy($id)
    {
        try {
            Log::info('PermissionOverride destroy called', ['id' => $id]);
            
            $override = PermissionOverride::findOrFail($id);
            $override->delete();
            
            Log::info('Override deleted successfully', ['id' => $id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override berhasil dihapus'
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Override not found for delete:', ['id' => $id]);
            return response()->json([
                'success' => false,
                'message' => 'Permission override tidak ditemukan'
            ], 404);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride destroy:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal hapus permission override: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check permission for specific user
     */
    public function check(Request $request)
    {
        try {
            $role = $request->input('role');
            $resourceKey = $request->input('resource_key');
            $userId = $request->input('user_id');
            
            if (!$role || !$resourceKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'Parameter role dan resource_key wajib diisi'
                ], 400);
            }
            
            // Check user-specific override first
            if ($userId) {
                $userOverride = PermissionOverride::where('target_type', 'user')
                    ->where('target_id', $userId)
                    ->where('resource_key', $resourceKey)
                    ->first();
                
                if ($userOverride) {
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'view' => (bool) $userOverride->view,
                            'create' => (bool) $userOverride->create,
                            'edit' => (bool) $userOverride->edit,
                            'delete' => (bool) $userOverride->delete,
                        ],
                        'source' => 'user_override'
                    ]);
                }
            }
            
            // Check role-based override
            $roleOverride = PermissionOverride::where('target_type', 'role')
                ->where('target_id', $role)
                ->where('resource_key', $resourceKey)
                ->first();
            
            if ($roleOverride) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'view' => (bool) $roleOverride->view,
                        'create' => (bool) $roleOverride->create,
                        'edit' => (bool) $roleOverride->edit,
                        'delete' => (bool) $roleOverride->delete,
                    ],
                    'source' => 'role_override'
                ]);
            }
            
            // No override found - return null (use default permissions)
            return response()->json([
                'success' => true,
                'data' => null,
                'source' => 'default'
            ]);
        } catch (\Exception $e) {
            Log::error('Error in PermissionOverride check:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal cek permission: ' . $e->getMessage()
            ], 500);
        }
    }
}