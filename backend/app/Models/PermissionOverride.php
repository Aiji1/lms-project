<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionOverride extends Model
{
    protected $table = 'permission_overrides';
    protected $primaryKey = 'id_override';
    public $timestamps = false;

    protected $fillable = [
        'target_type',
        'target_id',
        'resource_key',
        'view',
        'create',
        'edit',
        'delete'
    ];

    protected $casts = [
        'view' => 'boolean',
        'create' => 'boolean',
        'edit' => 'boolean',
        'delete' => 'boolean',
    ];
}