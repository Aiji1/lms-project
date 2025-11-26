<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void
    {
        $defaults = [
            'Kaos_Kaki_Pendek',
            'Terlambat',
            'Salah_Seragam',
            'Salah_Sepatu',
        ];
        foreach ($defaults as $label) {
            $exists = DB::table('jenis_pelanggaran')->where('label', $label)->exists();
            if (!$exists) {
                $kode = Str::upper(Str::of($label)->replace(' ', '_')->replaceMatches('/[^A-Z0-9_]/', ''));
                DB::table('jenis_pelanggaran')->insert([
                    'kode' => $kode,
                    'label' => $label,
                    'poin_default' => 0,
                    'status' => 'Aktif',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // keep seeded defaults
    }
};