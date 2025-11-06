<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AdabQuestionnaireSeeder extends Seeder
{
    public function run(): void
    {
        // If already seeded, skip
        $existing = DB::table('adab_components')->count();
        if ($existing > 0) {
            return;
        }

        $components = [
            [
                'nama_component' => 'Adab Kepada Allah SWT',
                'questions' => [
                    'Apakah Anda melaksanakan sholat 5 waktu hari ini?',
                    'Apakah Anda membaca Al-Quran hari ini?',
                    'Apakah Anda berdzikir mengingat Allah hari ini?',
                    'Apakah Anda berdoa dengan khusyuk hari ini?',
                ],
            ],
            [
                'nama_component' => 'Adab Kepada Rasulullah SAW',
                'questions' => [
                    'Apakah Anda membaca sholawat kepada Nabi hari ini?',
                    'Apakah Anda mengikuti sunnah Rasul dalam aktivitas hari ini?',
                    'Apakah Anda mempelajari hadits atau sirah Nabi hari ini?',
                    'Apakah Anda meneladani akhlak Rasulullah dalam berinteraksi hari ini?',
                ],
            ],
            [
                'nama_component' => 'Adab Kepada Orang Tua',
                'questions' => [
                    'Apakah Anda berbicara dengan sopan kepada orang tua hari ini?',
                    'Apakah Anda membantu pekerjaan orang tua hari ini?',
                    'Apakah Anda mendoakan orang tua hari ini?',
                    'Apakah Anda mematuhi nasihat orang tua hari ini?',
                ],
            ],
        ];

        foreach ($components as $i => $comp) {
            $id = DB::table('adab_components')->insertGetId([
                'nama_component' => $comp['nama_component'],
                'urutan' => $i + 1,
                'status' => 'Aktif',
            ]);

            foreach ($comp['questions'] as $j => $q) {
                DB::table('adab_questions')->insert([
                    'id_component' => $id,
                    'teks_pertanyaan' => $q,
                    'urutan' => $j + 1,
                    'status' => 'Aktif',
                ]);
            }
        }
    }
}