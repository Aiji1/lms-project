<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MataPelajaran extends Model
{
    protected $table = 'mata_pelajaran';
    protected $primaryKey = 'id_mata_pelajaran';
    public $timestamps = false;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_mata_pelajaran',
        'kode_mata_pelajaran',
        'kategori',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'nama_mata_pelajaran' => 'string',
        'kode_mata_pelajaran' => 'string',
        'kategori' => 'string',
        'status' => 'string'
    ];

    /**
     * Get the kurikulum for the mata pelajaran.
     */
    public function kurikulum(): HasMany
    {
        return $this->hasMany(Kurikulum::class, 'id_mata_pelajaran', 'id_mata_pelajaran');
    }

    /**
     * Scope a query to only include active mata pelajaran.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'Aktif');
    }

    /**
     * Scope a query to filter by kategori.
     */
    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }
}