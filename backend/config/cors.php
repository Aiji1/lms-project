<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Jika credentials digunakan, Laravel mewajibkan origin eksplisit.
    // Ambil dari env `CORS_ALLOWED_ORIGINS` (comma-separated). Jika tidak diset,
    // gunakan default yang mencakup frontend umum di port 3000 dan 3003.
    'allowed_origins' => array_filter(array_map('trim', explode(',', env(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003'
    )))),

    // Gunakan delimiter regex yang benar agar preg_match tidak error
    // Hilangkan pola regex untuk mencegah error preg_match tanpa delimiter.
    // Dengan supports_credentials=true, gunakan daftar explicit di 'allowed_origins'.
    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [
        'Content-Disposition',
        'Content-Type',
        'Content-Length'
    ],

    'max_age' => 0,

    'supports_credentials' => true,

];