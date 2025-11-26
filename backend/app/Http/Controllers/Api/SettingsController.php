<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class SettingsController extends Controller
{
    /**
     * Get all settings or by category
     * GET /api/v1/settings
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = DB::table('settings');

            // Filter by category
            if ($request->has('category')) {
                $query->where('category', $request->category);
            }

            $settings = $query->orderBy('category')->orderBy('setting_key')->get();

            // Transform to key-value format
            $formattedSettings = $settings->map(function ($setting) {
                return [
                    'id' => $setting->id_setting,
                    'key' => $setting->setting_key,
                    'value' => $this->castValue($setting->setting_value, $setting->setting_type),
                    'type' => $setting->setting_type,
                    'category' => $setting->category,
                    'label' => $setting->label,
                    'description' => $setting->description
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formattedSettings
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single setting by key
     * GET /api/v1/settings/{key}
     */
    public function show(string $key): JsonResponse
    {
        try {
            $setting = DB::table('settings')
                ->where('setting_key', $key)
                ->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $setting->id_setting,
                    'key' => $setting->setting_key,
                    'value' => $this->castValue($setting->setting_value, $setting->setting_type),
                    'type' => $setting->setting_type,
                    'category' => $setting->category,
                    'label' => $setting->label,
                    'description' => $setting->description
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update setting
     * PUT /api/v1/settings/{key}
     */
    public function update(Request $request, string $key): JsonResponse
    {
        try {
            $setting = DB::table('settings')
                ->where('setting_key', $key)
                ->first();

            if (!$setting) {
                return response()->json([
                    'success' => false,
                    'message' => 'Setting not found'
                ], 404);
            }

            // Validate value based on type
            $validator = $this->validateByType($request->value, $setting->setting_type);
            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Update setting
            DB::table('settings')
                ->where('setting_key', $key)
                ->update([
                    'setting_value' => $request->value,
                    'updated_at' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Setting berhasil diupdate'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk update settings
     * POST /api/v1/settings/bulk-update
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        try {
            $settings = $request->settings; // Array of [key => value]

            if (!is_array($settings)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Settings must be an array'
                ], 422);
            }

            $updated = 0;
            $errors = [];

            foreach ($settings as $key => $value) {
                $setting = DB::table('settings')
                    ->where('setting_key', $key)
                    ->first();

                if (!$setting) {
                    $errors[] = "Setting not found: $key";
                    continue;
                }

                // Validate
                $validator = $this->validateByType($value, $setting->setting_type);
                if ($validator->fails()) {
                    $errors[] = "Invalid value for $key: " . $validator->errors()->first();
                    continue;
                }

                // Update
                DB::table('settings')
                    ->where('setting_key', $key)
                    ->update([
                        'setting_value' => $value,
                        'updated_at' => now()
                    ]);

                $updated++;
            }

            return response()->json([
                'success' => true,
                'message' => "Berhasil update $updated settings",
                'errors' => $errors
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get presensi settings (helper endpoint)
     * GET /api/v1/settings/presensi
     */
    public function getPresensiSettings(): JsonResponse
    {
        try {
            $settings = DB::table('settings')
                ->where('category', 'presensi')
                ->get();

            $result = [];
            foreach ($settings as $setting) {
                // Remove 'presensi.' prefix from key for cleaner response
                $cleanKey = str_replace('presensi.', '', $setting->setting_key);
                $result[$cleanKey] = $this->castValue($setting->setting_value, $setting->setting_type);
            }

            return response()->json([
                'success' => true,
                'data' => $result
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cast value to proper type
     */
    private function castValue($value, $type)
    {
        switch ($type) {
            case 'integer':
                return (int) $value;
            case 'float':
                return (float) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }

    /**
     * Validate value by type
     */
    private function validateByType($value, $type)
    {
        $rules = [];

        switch ($type) {
            case 'integer':
                $rules = ['value' => 'required|integer'];
                break;
            case 'float':
                $rules = ['value' => 'required|numeric'];
                break;
            case 'boolean':
                $rules = ['value' => 'required|boolean'];
                break;
            case 'time':
                $rules = ['value' => 'required|date_format:H:i'];
                break;
            case 'json':
                $rules = ['value' => 'required|json'];
                break;
            default:
                $rules = ['value' => 'required|string'];
        }

        return Validator::make(['value' => $value], $rules);
    }
}
