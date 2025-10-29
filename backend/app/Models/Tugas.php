<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Tugas extends Model
{
    protected $table = 'tugas';
    protected $primaryKey = 'id_tugas';
    public $timestamps = false;

    protected $fillable = [
        'id_mata_pelajaran',
        'nik_guru',
        'id_kelas',
        'id_tahun_ajaran',
        'judul_tugas',
        'deskripsi_tugas',
        'tanggal_pemberian',
        'tanggal_deadline',
        'tipe_tugas',
        'status',
        'file_tugas',
        'bobot_nilai',
        'keterangan'
    ];

    protected $casts = [
        'id_tugas' => 'integer',
        'id_mata_pelajaran' => 'integer',
        'id_kelas' => 'integer',
        'id_tahun_ajaran' => 'integer',
        'tanggal_pemberian' => 'date',
        'tanggal_deadline' => 'datetime',
        'bobot_nilai' => 'decimal:2'
    ];

    // Relationships
    public function mataPelajaran()
    {
        return $this->belongsTo(MataPelajaran::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    public function guru()
    {
        return $this->belongsTo(Guru::class, 'nik_guru', 'nik_guru');
    }

    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'id_kelas', 'id_kelas');
    }

    public function tahunAjaran()
    {
        return $this->belongsTo(TahunAjaran::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    public function tugasSiswa()
    {
        return $this->hasMany(TugasSiswa::class, 'id_tugas', 'id_tugas');
    }

    public function pengumpulanTugas()
    {
        return $this->hasMany(PengumpulanTugas::class, 'id_tugas', 'id_tugas');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    public function scopeByGuru($query, $nikGuru)
    {
        return $query->where('nik_guru', $nikGuru);
    }

    public function scopeByKelas($query, $idKelas)
    {
        return $query->where('id_kelas', $idKelas);
    }

    public function scopeByTahunAjaran($query, $idTahunAjaran)
    {
        return $query->where('id_tahun_ajaran', $idTahunAjaran);
    }

    public function scopeSearch($query, $search)
    {
        return $query->where(function ($q) use ($search) {
            $q->where('judul_tugas', 'LIKE', "%{$search}%")
              ->orWhere('deskripsi_tugas', 'LIKE', "%{$search}%");
        });
    }
}