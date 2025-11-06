<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed a default Admin user for testing
        // Pastikan akun admin selalu tersedia dan password direset ke admin123
        DB::table('users')->updateOrInsert(
            ['username' => 'admin'],
            [
                'user_id' => 'ADM001',
                'username' => 'admin',
                'password' => Hash::make('admin123'),
                'user_type' => 'Admin',
                'reference_id' => 'ADM001',
                'status' => 'Aktif',
                'created_date' => now(),
                'updated_date' => now(),
            ]
        );

        // Seed a default Guru record and user for testing
        DB::table('guru')->updateOrInsert(
            ['nik_guru' => 'NIK0001'],
            [
                'nik_guru' => 'NIK0001',
                'nama_lengkap' => 'Guru Satu',
                'tanggal_lahir' => '1985-01-01',
                'jenis_kelamin' => 'L',
                'alamat' => 'Jl. Contoh No. 1',
                'no_telepon' => '08123456789',
                'status_kepegawaian' => 'PTY',
                'jabatan' => 'Guru',
                'status' => 'Aktif',
            ]
        );

        DB::table('users')->updateOrInsert(
            ['username' => 'guru'],
            [
                'user_id' => 'GR001',
                'username' => 'guru',
                'password' => Hash::make('password'),
                'user_type' => 'Guru',
                'reference_id' => 'NIK0001',
                'status' => 'Aktif',
                'created_date' => now(),
                'updated_date' => now(),
            ]
        );

        // Seed default komponen & pertanyaan kuesioner adab
        $this->call(AdabQuestionnaireSeeder::class);
    }
}
