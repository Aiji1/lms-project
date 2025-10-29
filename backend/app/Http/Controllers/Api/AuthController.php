<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find user by username
            $user = DB::table('users')
                ->where('username', $request->username)
                ->where('status', 'Aktif')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Username tidak ditemukan atau tidak aktif'
                ], 401);
            }

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah'
                ], 401);
            }

            // Generate session token
            $token = Str::random(60);

            // Update last login and remember token
            DB::table('users')
                ->where('user_id', $user->user_id)
                ->update([
                    'last_login' => now(),
                    'remember_token' => $token,
                    'updated_date' => now()
                ]);

            // Get user detail with nama_lengkap
            $userDetail = $this->getUserDetail($user);

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'user' => [
                        'user_id' => $user->user_id,
                        'username' => $user->username,
                        'user_type' => $user->user_type,
                        'reference_id' => $user->reference_id,
                        'nama_lengkap' => $userDetail['nama_lengkap'],
                        'last_login' => now()->toISOString()
                    ],
                    'token' => $token
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat login: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        try {
            $token = $request->bearerToken();
            
            if ($token) {
                // Clear remember token
                DB::table('users')
                    ->where('remember_token', $token)
                    ->update([
                        'remember_token' => null,
                        'updated_date' => now()
                    ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan saat logout: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current authenticated user
     */
    public function me(Request $request)
    {
        try {
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            $user = DB::table('users')
                ->where('remember_token', $token)
                ->where('status', 'Aktif')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token tidak valid atau user tidak aktif'
                ], 401);
            }

            // Get user detail with nama_lengkap
            $userDetail = $this->getUserDetail($user);

            return response()->json([
                'success' => true,
                'data' => [
                    'user_id' => $user->user_id,
                    'username' => $user->username,
                    'user_type' => $user->user_type,
                    'reference_id' => $user->reference_id,
                    'nama_lengkap' => $userDetail['nama_lengkap'],
                    'last_login' => $user->last_login
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change password
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token tidak ditemukan'
                ], 401);
            }

            $user = DB::table('users')
                ->where('remember_token', $token)
                ->where('status', 'Aktif')
                ->first();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User tidak ditemukan'
                ], 401);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password lama salah'
                ], 401);
            }

            // Update password
            DB::table('users')
                ->where('user_id', $user->user_id)
                ->update([
                    'password' => Hash::make($request->new_password),
                    'updated_date' => now()
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Password berhasil diubah'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user detail with nama_lengkap from related table
     */
    private function getUserDetail($user)
    {
        $nama_lengkap = 'Unknown';

        try {
            switch ($user->user_type) {
                case 'Siswa':
                    $detail = DB::table('siswa')->where('nis', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama_lengkap : 'Siswa tidak ditemukan';
                    break;
                    
                case 'Guru':
                    $detail = DB::table('guru')->where('nik_guru', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama_lengkap : 'Guru tidak ditemukan';
                    break;
                    
                case 'Admin':
                    $detail = DB::table('admin')->where('id_admin', $user->reference_id)->first();
                    // Fallback ke username jika detail admin tidak ditemukan
                    $nama_lengkap = $detail ? $detail->nama_admin : ($user->username ?? 'Admin');
                    break;
                    
                case 'Kepala_Sekolah':
                    $detail = DB::table('kepala_sekolah')->where('id_kepala_sekolah', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama : 'Kepala Sekolah tidak ditemukan';
                    break;
                    
                case 'Petugas_Keuangan':
                    $detail = DB::table('petugas_keuangan')->where('id_petugas_keuangan', $user->reference_id)->first();
                    $nama_lengkap = $detail ? $detail->nama : 'Petugas Keuangan tidak ditemukan';
                    break;
                    
                case 'Orang_Tua':
                    $detail = DB::table('orang_tua')->where('id_orang_tua', $user->reference_id)->first();
                    $nama_lengkap = $detail ? ($detail->nama_ayah . ' / ' . $detail->nama_ibu) : 'Orang Tua tidak ditemukan';
                    break;
            }
        } catch (\Exception $e) {
            // If error getting detail, use default
            $nama_lengkap = 'Error getting name';
        }

        return ['nama_lengkap' => $nama_lengkap];
    }
}