<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PermissionOverride;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class PermissionOverrideController extends Controller
{
    // Cache duration: 30 minutes
    private const CACHE_TTL = 1800;
    
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
     * 
     * WITH CACHING - 30 minutes
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
            
            // Generate cache key
            $cacheKey = $this->getCacheKey($role, $userId);
            
            // Try to get from cache
            $result = Cache::remember($cacheKey, self::CACHE_TTL, function () use ($role, $userId) {
                return $this->fetchMergedPermissions($role, $userId);
            });
            
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
     * Fetch merged permissions from database
     */
    private function fetchMergedPermissions(string $role, ?string $userId): array
    {
        // Get role-based overrides
        $overrides = PermissionOverride::where('target_type', 'role')
            ->where('target_id', $role)
            ->get();
        
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
        
        return $result;
    }
    
    /**
     * Generate cache key
     */
    private function getCacheKey(string $role, ?string $userId): string
    {
        return 'permissions_merged_' . $role . ($userId ? '_user_' . $userId : '');
    }
    
    /**
     * Clear cache for specific role
     */
    public function clearCache(Request $request)
    {
        try {
            $role = $request->input('role');
            
            if ($role) {
                // Clear specific role cache
                $pattern = 'permissions_merged_' . $role . '*';
                $this->clearCacheByPattern($pattern);
                
                return response()->json([
                    'success' => true,
                    'message' => "Cache cleared for role: {$role}"
                ]);
            } else {
                // Clear all permission cache
                Cache::flush();
                
                return response()->json([
                    'success' => true,
                    'message' => 'All cache cleared'
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Error clearing cache:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal clear cache: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Clear cache by pattern
     */
    private function clearCacheByPattern(string $pattern): void
    {
        // For file/array cache driver
        $keys = Cache::get('cache_keys', []);
        foreach ($keys as $key) {
            if (fnmatch($pattern, $key)) {
                Cache::forget($key);
            }
        }
    }
    
    /**
     * Store override and clear related cache
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'target_type' => 'required|in:role,user',
                'target_id' => 'required|string',
                'resource_key' => 'required|string',
                'view' => 'required|boolean',
                'create' => 'required|boolean',
                'edit' => 'required|boolean',
                'delete' => 'required|boolean',
            ]);
            
            $override = PermissionOverride::create($validated);
            
            // Clear cache for affected target
            $this->clearRelatedCache($validated['target_type'], $validated['target_id']);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override created',
                'data' => $override
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error storing permission override:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal menyimpan override: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update override and clear related cache
     */
    public function update(Request $request, $id)
    {
        try {
            $override = PermissionOverride::findOrFail($id);
            
            $validated = $request->validate([
                'view' => 'sometimes|boolean',
                'create' => 'sometimes|boolean',
                'edit' => 'sometimes|boolean',
                'delete' => 'sometimes|boolean',
            ]);
            
            $override->update($validated);
            
            // Clear cache for affected target
            $this->clearRelatedCache($override->target_type, $override->target_id);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override updated',
                'data' => $override
            ]);
        } catch (\Exception $e) {
            Log::error('Error updating permission override:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal update override: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Delete override and clear related cache
     */
    public function destroy($id)
    {
        try {
            $override = PermissionOverride::findOrFail($id);
            
            $targetType = $override->target_type;
            $targetId = $override->target_id;
            
            $override->delete();
            
            // Clear cache for affected target
            $this->clearRelatedCache($targetType, $targetId);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission override deleted'
            ]);
        } catch (\Exception $e) {
            Log::error('Error deleting permission override:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Gagal delete override: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Clear cache for specific target
     */
    private function clearRelatedCache(string $targetType, string $targetId): void
    {
        if ($targetType === 'role') {
            $cacheKey = 'permissions_merged_' . $targetId . '*';
            $this->clearCacheByPattern($cacheKey);
        } elseif ($targetType === 'user') {
            // Clear all user-specific caches (harder to target specific user)
            $cacheKey = 'permissions_merged_*_user_' . $targetId;
            $this->clearCacheByPattern($cacheKey);
        }
    }
}
