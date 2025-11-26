<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id('id_setting');
            $table->string('setting_key', 100)->unique();
            $table->text('setting_value')->nullable();
            $table->string('setting_type', 50)->default('string'); // string, integer, float, boolean, json
            $table->string('category', 50)->default('general'); // general, presensi, keuangan, akademik
            $table->string('label', 200);
            $table->text('description')->nullable();
            $table->timestamps();
        });

        // Insert default presensi settings
        DB::table('settings')->insert([
            [
                'setting_key' => 'presensi.jam_masuk',
                'setting_value' => '07:00',
                'setting_type' => 'time',
                'category' => 'presensi',
                'label' => 'Jam Masuk',
                'description' => 'Waktu mulai presensi masuk',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.jam_pulang',
                'setting_value' => '15:00',
                'setting_type' => 'time',
                'category' => 'presensi',
                'label' => 'Jam Pulang',
                'description' => 'Waktu mulai presensi pulang',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.toleransi_terlambat',
                'setting_value' => '15',
                'setting_type' => 'integer',
                'category' => 'presensi',
                'label' => 'Toleransi Keterlambatan (Menit)',
                'description' => 'Batas waktu toleransi keterlambatan dalam menit',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.gps_enabled',
                'setting_value' => 'true',
                'setting_type' => 'boolean',
                'category' => 'presensi',
                'label' => 'GPS Validation Aktif',
                'description' => 'Aktifkan validasi lokasi GPS untuk presensi',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.school_latitude',
                'setting_value' => '-7.556410',
                'setting_type' => 'float',
                'category' => 'presensi',
                'label' => 'Latitude Sekolah',
                'description' => 'Koordinat latitude lokasi sekolah',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.school_longitude',
                'setting_value' => '110.828316',
                'setting_type' => 'float',
                'category' => 'presensi',
                'label' => 'Longitude Sekolah',
                'description' => 'Koordinat longitude lokasi sekolah',
                'created_at' => now(),
                'updated_at' => now()
            ],
            [
                'setting_key' => 'presensi.gps_radius',
                'setting_value' => '100',
                'setting_type' => 'integer',
                'category' => 'presensi',
                'label' => 'Radius Valid GPS (Meter)',
                'description' => 'Jarak maksimum dari sekolah untuk presensi valid',
                'created_at' => now(),
                'updated_at' => now()
            ]
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
