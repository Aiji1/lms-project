<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\PermissionOverride;

class PermissionOverrideController extends Controller
{
    public function index(Request $request)
    {
        $query = PermissionOverride::query();
        if ($request->has('target_type')) {
            $query->where('target_type', $request->input('target_type'));
        }
        if ($request->has('target_id')) {
            $query->where('target_id', $request->input('target_id'));
        }
        if ($request->has('resource_key')) {
            $query->where('resource_key', $request->input('resource_key'));
        }
        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $data = $request->all();
        $validator = Validator::make($data, [
            'target_type' => 'required|in:role,user',
            'target_id' => 'required|string',
            'resource_key' => 'required|string',
            'view' => 'boolean',
            'create' => 'boolean',
            'edit' => 'boolean',
            'delete' => 'boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $override = PermissionOverride::create([
            'target_type' => $data['target_type'],
            'target_id' => $data['target_id'],
            'resource_key' => $data['resource_key'],
            'view' => $data['view'] ?? false,
            'create' => $data['create'] ?? false,
            'edit' => $data['edit'] ?? false,
            'delete' => $data['delete'] ?? false,
        ]);
        return response()->json($override, 201);
    }

    public function update(Request $request, $id)
    {
        $override = PermissionOverride::findOrFail($id);
        $data = $request->all();
        $validator = Validator::make($data, [
            'view' => 'boolean',
            'create' => 'boolean',
            'edit' => 'boolean',
            'delete' => 'boolean',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }
        $override->update($data);
        return response()->json($override);
    }

    public function destroy($id)
    {
        $deleted = PermissionOverride::where('id_override', $id)->delete();
        return response()->json(['deleted' => (bool) $deleted]);
    }

    /**
     * Endpoint untuk mengambil merged permissions
     * Prioritas: user override > role override > default config
     */
    public function merged(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'nullable|string',
            'role' => 'required|string',
        ]);
        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $role = $request->input('role');
        $userId = $request->input('user_id');

        $overrides = PermissionOverride::query()
            ->where(function ($q) use ($role, $userId) {
                $q->where(function ($q1) use ($role) {
                    $q1->where('target_type', 'role')->where('target_id', $role);
                });
                if ($userId) {
                    $q->orWhere(function ($q2) use ($userId) {
                        $q2->where('target_type', 'user')->where('target_id', $userId);
                    });
                }
            })
            ->get();

        // Bentuk hasil: map resource_key => permission
        $result = [];
        foreach ($overrides as $o) {
            $perm = [
                'view' => (bool) $o->view,
                'create' => (bool) $o->create,
                'edit' => (bool) $o->edit,
                'delete' => (bool) $o->delete,
            ];
            if ($o->target_type === 'user') {
                // user override menang
                $result[$o->resource_key] = $perm;
            } else {
                // role override, hanya set jika belum ada user override
                if (!isset($result[$o->resource_key])) {
                    $result[$o->resource_key] = $perm;
                }
            }
        }

        return response()->json($result);
    }
}