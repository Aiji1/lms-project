<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TahunAjaran extends Model
{
    protected $table = 'tahun_ajaran';
    protected $primaryKey = 'id_tahun_ajaran';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tahun_ajaran',
        'semester',
        'tanggal_mulai',
        'tanggal_selesai',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tahun_ajaran' => 'string',
        'semester' => 'string',
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'status' => 'string'
    ];

    /**
     * Get the kurikulum for the tahun ajaran.
     */
    public function kurikulum(): HasMany
    {
        return $this->hasMany(Kurikulum::class, 'id_tahun_ajaran', 'id_tahun_ajaran');
    }

    /**
     * Scope a query to only include active tahun ajaran.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Scope a query to filter by semester.
     */
    public function scopeBySemester($query, $semester)
    {
        return $query->where('semester', $semester);
    }
}