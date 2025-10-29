<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Guru extends Model
{
    protected $table = 'guru';
    protected $primaryKey = 'nik_guru';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nik_guru',
        'nama_lengkap',
        'tanggal_lahir',
        'jenis_kelamin',
        'alamat',
        'no_telepon',
        'status_kepegawaian',
        'jabatan',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_lahir' => 'date',
        'jenis_kelamin' => 'string',
        'status_kepegawaian' => 'string',
        'jabatan' => 'string',
        'status' => 'string'
    ];

    /**
     * Get the jadwal pelajaran for the guru.
     */
    public function jadwalPelajaran(): HasMany
    {
        return $this->hasMany(JadwalPelajaran::class, 'nik_guru', 'nik_guru');
    }

    /**
     * Scope a query to only include active guru.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Scope a query to filter by jabatan.
     */
    public function scopeByJabatan($query, $jabatan)
    {
        return $query->where('jabatan', $jabatan);
    }

    /**
     * Scope a query to filter by status kepegawaian.
     */
    public function scopeByStatusKepegawaian($query, $status)
    {
        return $query->where('status_kepegawaian', $status);
    }
}