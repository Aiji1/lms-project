<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Pengumuman extends Model
{
    use SoftDeletes;

    protected $table = 'pengumuman';
    protected $primaryKey = 'id_pengumuman';
    
    protected $fillable = [
        'judul',
        'konten',
        'kategori',
        'prioritas',
        'file_lampiran',
        'file_original_name',
        'tanggal_mulai',
        'tanggal_selesai',
        'is_pinned',
        'pin_order',
        'status',
        'target_roles',
        'target_tingkat',
        'target_kelas',
        'target_siswa',
        'target_type',
        'dibuat_oleh',
        'dibuat_oleh_nama',
        'dibuat_oleh_role',
    ];

    protected $casts = [
        'target_roles' => 'array',
        'target_tingkat' => 'array',
        'target_kelas' => 'array',
        'target_siswa' => 'array',
        'is_pinned' => 'boolean',
        'pin_order' => 'integer',
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // Relasi ke tabel pengumuman_reads
    public function reads()
    {
        return $this->hasMany(PengumumanRead::class, 'id_pengumuman', 'id_pengumuman');
    }

    // Scope untuk pengumuman aktif (published & masih berlaku)
    public function scopeActive($query)
    {
        return $query->where('status', 'Published')
                    ->where('tanggal_mulai', '<=', now())
                    ->where(function($q) {
                        $q->whereNull('tanggal_selesai')
                          ->orWhere('tanggal_selesai', '>=', now());
                    });
    }

    // Scope untuk pengumuman yang di-pin
    public function scopePinned($query)
    {
        return $query->where('is_pinned', true)
                    ->orderBy('pin_order', 'asc');
    }

    // Scope berdasarkan kategori
    public function scopeByKategori($query, $kategori)
    {
        return $query->where('kategori', $kategori);
    }

    // Scope berdasarkan prioritas
    public function scopeByPrioritas($query, $prioritas)
    {
        return $query->where('prioritas', $prioritas);
    }

    // Helper: Cek apakah user sudah baca pengumuman ini
    public function isReadBy($userIdentifier)
    {
        return $this->reads()
                    ->where('user_identifier', $userIdentifier)
                    ->exists();
    }

    // Helper: Mark pengumuman sebagai dibaca
    public function markAsReadBy($userIdentifier, $userType)
    {
        $userIdValue = null;
        if (is_numeric($userIdentifier)) {
            $userIdValue = (int) $userIdentifier;
        } else {
            $userIdValue = (string) $userIdentifier;
        }

        return PengumumanRead::firstOrCreate(
            [
                'id_pengumuman' => $this->id_pengumuman,
                'user_identifier' => $userIdentifier,
            ],
            [
                'user_id' => $userIdValue,
                'user_type' => $userType,
                'dibaca_pada' => now(),
            ]
        );
    }

    // Helper: Get warna badge berdasarkan prioritas
    public function getPrioritasColorAttribute()
    {
        $colors = [
            'Normal' => 'gray',
            'Penting' => 'orange',
            'Sangat Penting' => 'red',
        ];
        
        return $colors[$this->prioritas] ?? 'gray';
    }

    // Helper: Get warna badge berdasarkan kategori
    public function getKategoriColorAttribute()
    {
        $colors = [
            'Umum' => 'blue',
            'Akademik' => 'green',
            'Kegiatan' => 'purple',
            'Keuangan' => 'yellow',
            'Keagamaan' => 'teal',
        ];
        
        return $colors[$this->kategori] ?? 'gray';
    }

    // Helper: Cek apakah pengumuman sudah expired
    public function getIsExpiredAttribute()
    {
        if (!$this->tanggal_selesai) {
            return false;
        }
        
        return now()->isAfter($this->tanggal_selesai);
    }

    // Helper: Cek apakah pengumuman belum dimulai
    public function getIsUpcomingAttribute()
    {
        return now()->isBefore($this->tanggal_mulai);
    }

    // Helper: Get status display
    public function getStatusDisplayAttribute()
    {
        if ($this->is_expired) {
            return 'Kadaluarsa';
        }
        
        if ($this->is_upcoming) {
            return 'Akan Datang';
        }
        
        return $this->status;
    }
}
