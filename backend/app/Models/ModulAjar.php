<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ModulAjar extends Model
{
    use HasFactory;

    protected $table = 'modul_ajar';
    protected $primaryKey = 'id_modul';

    protected $fillable = [
        'judul_modul',
        'id_mata_pelajaran',
        'id_kelas',
        'nik_guru',
        'tipe_file',
        'ukuran_bytes',
        'file_path',
        'status',
        'downloads_count',
        'tanggal_upload',
    ];
}